import path from "path"
import { ListObjectsV2Command } from "@aws-sdk/client-s3"

import sharp from "sharp"
import { pipeline, RawImage } from "@xenova/transformers"
import crypto from "crypto"

import { Pinecone } from "@pinecone-database/pinecone"
import { embedder } from "./embeddings"

import {
  AWS_S3_BUCKET,
  getEnv,
  PINECONE_INDEX,
  PINECONE_NAMESPACE,
} from "./utils/environment"
import redis from "./redis"
import {
  BoundingBox,
  DetectedBoundingBox,
  FileWithReference,
  LabeledDetectedBoundingBox,
} from "./types"
import { chunkArray } from "./utils/util"
import {
  generateS3Url,
  getAwsS3Client,
  getS3Object,
  saveToS3Bucket,
} from "./utils/awsS3"
import { completeFile, log } from "./utils/logger"

const modelName = "Xenova/clip-vit-large-patch14"
const namespace = PINECONE_NAMESPACE

const pineconeClient = await new Pinecone({
  environment: getEnv("VITE_PINECONE_ENVIRONMENT"),
  apiKey: getEnv("VITE_PINECONE_API_KEY"),
  projectId: getEnv("VITE_PINECONE_PROJECT_ID"),
})

const detectObjects = async (image: RawImage) => {
  try {
    const detector = await pipeline(
      "object-detection",
      "Xenova/detr-resnet-50",
    )
    // const image = await RawImage.read(url);
    const output = await detector(image, { threshold: 0.9 })
    return output
  } catch (e) {
    console.log(`Failed detecting object ${e}`)
    return false
  }
}

const convertBoundingBox = (box: DetectedBoundingBox): BoundingBox => {
  const {
    xmin, ymin, xmax, ymax,
  } = box
  return {
    left: xmin,
    top: ymin,
    width: xmax - xmin,
    height: ymax - ymin,
  }
}

const getVideoNameAndFrameIndex = (imagePath: string) => {
  try {
    const videoName = imagePath.replace(/\/.+/, "")
    const frameIndex = path.basename(imagePath).split(".")[0]!
    return { videoName, frameIndex }
  } catch (error) {
    console.log(`Error in getVideoNameAndFrameIndex: ${error}`)
    return undefined
  }
}

const fetchImageAndBoundingBoxes = async (imagePath: string) => {
  try {
    const url = generateS3Url(imagePath)
    const image = await RawImage.fromURL(url)
    const boundingBoxes = await detectObjects(image)
    return { image, boundingBoxes }
  } catch (error) {
    console.log(`Error in fetchImageAndBoundingBoxes: ${error}`)
    return undefined
  }
}

const generateBoxId = (box: DetectedBoundingBox, frameIndex: string) => crypto.createHash("md5").update(`${frameIndex}_${JSON.stringify(box)}`).digest("hex")

const createLabeledBox = (labeledBox: LabeledDetectedBoundingBox, frameIndex: string) => ({
  box: convertBoundingBox(labeledBox.box),
  boxId: generateBoxId(labeledBox.box, frameIndex),
  label: labeledBox.label,
  score: labeledBox.score,
})

const createFrameObject = (
  frameIndex: string,
  imagePath: string,
  boundingBoxes: LabeledDetectedBoundingBox[],
) => ({
  frameIndex,
  src: imagePath,
  labeledBoundingBoxes: boundingBoxes.map((labeledBox) => createLabeledBox(labeledBox, frameIndex)),
})

const writeFrameToRedis = async (
  frameIndex: string,
  imagePath: string,
  boundingBoxes: LabeledDetectedBoundingBox[],
) => {
  const frameExistsInRedis = await redis.hGet("frame", frameIndex)
  if (!frameExistsInRedis) {
    const obj = createFrameObject(frameIndex, imagePath, boundingBoxes)
    await redis.hSet("frame", frameIndex, JSON.stringify(obj))
  }
}

const processBoundingBoxes = async (
  boundingBoxes: LabeledDetectedBoundingBox[],
  videoName: string,
  frameIndex: string,
  obj: Buffer,
) => {
  const files: FileWithReference[] = []
  await log(`Processing ${boundingBoxes.length} bounding boxes`, { boxesCount: boundingBoxes.length, eventType: "boxCount" })

  for (const element of boundingBoxes) {
    const { box, label } = element
    const boxId = generateBoxId(box, frameIndex)

    const boundingBox = convertBoundingBox(box)
    const metadata = await sharp(obj).metadata()

    if (
      boundingBox.left >= 0
      && boundingBox.top >= 0
      && boundingBox.left + boundingBox.width <= metadata.width!
      && boundingBox.top + boundingBox.height <= metadata.height!
    ) {
      const bBoxBuffer = await sharp(obj).png().extract(boundingBox).toBuffer()

      const bboxPath = `${videoName}/bbox/${label}_${boxId}.png`
      await saveToS3Bucket(bboxPath, bBoxBuffer)

      const bboxUrl = generateS3Url(bboxPath)

      if (!(await redis.hGet("bbox", boxId))) {
        const bbox = {
          boxId,
          frameIndex,
          src: bboxUrl,
          boundingBox,
        }
        await redis.hSet("bbox", boxId, JSON.stringify(bbox))
      }

      files.push({
        boxId,
        path: bboxUrl,
        frameIndex: frameIndex.toString(),
      })
    }
  }
  return files
}

const addToDeadLetterQueue = async (imagePath: string, errorMessage: string) => {
  // Implement the logic to add the error message and image path to the dead letter queue
  // ...
  console.log("___")
}

const segmentImage = async (imagePath: string) => {
  const { videoName, frameIndex } = getVideoNameAndFrameIndex(imagePath) || {}

  const { boundingBoxes } = await fetchImageAndBoundingBoxes(imagePath) || {}

  if (!videoName || !frameIndex || !boundingBoxes) {
    // Add the error to the dead letter queue
    await addToDeadLetterQueue(imagePath, "Undefined results")
    return []
  }

  const obj = await getS3Object(imagePath)
  console.log("downloaded", imagePath)

  try {
    if (boundingBoxes) {
      await writeFrameToRedis(frameIndex, imagePath, boundingBoxes)
      const files = await processBoundingBoxes(
        boundingBoxes,
        videoName,
        frameIndex,
        obj,
      )
      return files
    }
  } catch (error: any) {
    console.log(`Error in segmentImage: ${error}`)
    // Add the error to the dead letter queue
    await addToDeadLetterQueue(imagePath, error.message)
    return undefined
  }
  return []
}

async function embedAndUpsert({
  imagePaths,
  chunkSize,
}: {
  imagePaths: FileWithReference[];
  chunkSize: number;
}) {
  // Chunk the image paths into batches of size chunkSize
  const chunkGenerator = chunkArray(imagePaths, chunkSize)

  // Get the index
  const index = pineconeClient.index(PINECONE_INDEX)
  const ns = index.namespace(namespace)

  const embedders = []
  // Embed each batch and upsert the embeddings into the index
  for (const paths of chunkGenerator) {
    embedders.push(
      embedder.embedBatch(paths, chunkSize, async (embeddings) => {
        try {
          // TODO: Get rid of this it's a hack to get around the fact that the embedder is returning undefined
          const filteredEmbeddings = embeddings.filter(
            (x) => x.values.length > 0,
          )
          await ns.upsert(filteredEmbeddings)
          log(`Done saving batch with ${filteredEmbeddings.length} embeddings}`, {
            eventType: "embeddingCount",
            embeddingCount: filteredEmbeddings.length,
          })
        } catch (e) {
          console.error(
            "error chunked upsert",
            e,
            embeddings.map((x) => x.id),
          )
        }
      }),
    )
  }
  // Run embedders in parallel and wait for them to finish
  await Promise.allSettled(embedders).then(console.log)
}

await embedder.init(modelName)

const indexImages = async ({ name, limit, filesList }: { name?: string; limit?: number; filesList?: string[]; }) => {
  // Get the S3 client
  const client = await getAwsS3Client()
  let list: string[] = []
  // If no filesList is provided and name is provided, get the list of files from S3
  if (!filesList && name) {
    const files = await client.send(
      new ListObjectsV2Command({
        Bucket: AWS_S3_BUCKET,
        Prefix: `${name}/frame`,
      }),
    )
    // If files are found, map them to a list
    if (files && files.Contents) {
      list = limit ? files.Contents.slice(0, limit).map((x) => x.Key!) : files.Contents.map((x) => x.Key!)
    }
  } else {
    // If filesList is not provided, throw an error
    if (!filesList) {
      throw new Error("No files list provided")
    }
    list = filesList
  }

  // Map each file in the list to a task
  const tasks = list.map(async (fileName) => {
    try {
      // Segment the image and filter out any undefined segments
      const segmentedFiles = (await segmentImage(fileName || ""))?.filter((x) => x) || []
      // Embed and upsert the segmented files
      await embedAndUpsert({ imagePaths: segmentedFiles, chunkSize: 100 })
      // Log the completion of indexing for the file
      await log(`Done indexing ${fileName}`)
      // Mark the file as complete
      await completeFile(fileName)
    } catch (error) {
      // Log any errors encountered during processing
      console.error(`Error processing file ${fileName}: ${error}`)
    }
  })
  // Wait for all tasks to complete
  await Promise.all(tasks)
}

export { indexImages }
