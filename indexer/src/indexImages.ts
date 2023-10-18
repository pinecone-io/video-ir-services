import path from "path";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

import sharp from "sharp";
import { pipeline, RawImage } from "@xenova/transformers";
import crypto from "crypto";

import { Pinecone } from "@pinecone-database/pinecone";
import { embedder } from "./embeddings";

import {
  AWS_S3_BUCKET,
  getEnv,
  PINECONE_INDEX,
  PINECONE_NAMESPACE,
} from "./utils/environment";
import redis from './redis';
import {
  BoundingBox,
  DetectedBoundingBox,
  FileWithReference,
  LabeledDetectedBoundingBox,
} from "./types";
import { chunkArray } from "./utils/util";
import {
  generateS3Url,
  getAwsS3Client,
  getS3Object,
  getS3SignedUrl,
  saveToS3Bucket,
} from "./utils/awsS3";

const modelName = "Xenova/clip-vit-large-patch14";
const namespace = PINECONE_NAMESPACE;

const pineconeClient = await new Pinecone({
  environment: getEnv("VITE_PINECONE_ENVIRONMENT"),
  apiKey: getEnv("VITE_PINECONE_API_KEY"),
  projectId: getEnv("VITE_PINECONE_PROJECT_ID"),
});

const detectObjects = async (image: RawImage) => {
  try {
    const detector = await pipeline(
      "object-detection",
      "Xenova/detr-resnet-50",
    );
    // const image = await RawImage.read(url);
    const output = await detector(image, { threshold: 0.9 });
    return output;
  } catch (e) {
    console.log(`Failed detecting object ${e}`);
    return false;
  }
};

const convertBoundingBox = (box: DetectedBoundingBox): BoundingBox => {
  const { xmin, ymin, xmax, ymax } = box;
  return {
    left: xmin,
    top: ymin,
    width: xmax - xmin,
    height: ymax - ymin,
  };
};

const getVideoNameAndFrameIndex = (imagePath: string) => {
  try {
    const videoName = imagePath.replace(/\/.+/, "");
    const frameIndex = path.basename(imagePath).split(".")[0]!;
    return { videoName, frameIndex };
  } catch (error) {
    console.log(`Error in getVideoNameAndFrameIndex: ${error}`);
    return undefined;
  }
};

const fetchImageAndBoundingBoxes = async (imagePath: string) => {
  try {
    const url = generateS3Url(imagePath);
    const image = await RawImage.fromURL(url);
    const boundingBoxes = await detectObjects(image);
    return { image, boundingBoxes };
  } catch (error) {
    console.log(`Error in fetchImageAndBoundingBoxes: ${error}`);
    return undefined;
  }
};

const generateBoxId = (box: DetectedBoundingBox) =>
  crypto.createHash("md5").update(JSON.stringify(box)).digest("hex");

const createLabeledBox = (labeledBox: LabeledDetectedBoundingBox) => ({
  box: convertBoundingBox(labeledBox.box),
  boxId: generateBoxId(labeledBox.box),
  label: labeledBox.label,
  score: labeledBox.score,
});

const createFrameObject = (
  frameIndex: string,
  imagePath: string,
  boundingBoxes: LabeledDetectedBoundingBox[],
) => ({
  frameIndex,
  src: imagePath,
  labeledBoundingBoxes: boundingBoxes.map(createLabeledBox),
});

const writeFrameToRedis = async (
  frameIndex: string,
  imagePath: string,
  boundingBoxes: LabeledDetectedBoundingBox[],
) => {
  const frameExistsInRedis = await redis.hGet("frame", frameIndex);
  if (!frameExistsInRedis) {
    const obj = createFrameObject(frameIndex, imagePath, boundingBoxes);
    await redis.hSet("frame", frameIndex, JSON.stringify(obj));
  }
};

const processBoundingBoxes = async (
  boundingBoxes: LabeledDetectedBoundingBox[],
  videoName: string,
  frameIndex: string,
  obj: Buffer,
) => {
  const files: FileWithReference[] = [];
  for (const element of boundingBoxes) {
    const { box, label } = element;
    const boxHash = crypto
      .createHash("md5")
      .update(JSON.stringify(box))
      .digest("hex");

    const boundingBox = convertBoundingBox(box);
    const metadata = await sharp(obj).metadata();

    if (
      boundingBox.left >= 0 &&
      boundingBox.top >= 0 &&
      boundingBox.left + boundingBox.width <= metadata.width! &&
      boundingBox.top + boundingBox.height <= metadata.height!
    ) {
      const bBoxBuffer = await sharp(obj).png().extract(boundingBox).toBuffer();

      const bboxPath = `${videoName}/bbox/${label}_${boxHash}.png`;
      await saveToS3Bucket(bboxPath, bBoxBuffer);

      const bboxUrl = generateS3Url(bboxPath);

      if (!(await redis.hGet("bbox", boxHash))) {
        const bbox = {
          boxId: boxHash,
          frameIndex,
          src: bboxUrl,
          boundingBox,
        };
        await redis.hSet("bbox", boxHash, JSON.stringify(bbox));
      }

      files.push({
        boxId: boxHash,
        path: bboxUrl,
        frameIndex: frameIndex.toString(),
      });
    }
  }
  return files;
};

const addToDeadLetterQueue = async (imagePath: string, errorMessage: string) => {
  // Implement the logic to add the error message and image path to the dead letter queue
  // ...
  console.log("___")
};

const segmentImage = async (imagePath: string) => {
  const { videoName, frameIndex } = getVideoNameAndFrameIndex(imagePath) || {};

  const { boundingBoxes } = await fetchImageAndBoundingBoxes(imagePath) || {};


  if (!videoName || !frameIndex || !boundingBoxes) {
    // Add the error to the dead letter queue
    await addToDeadLetterQueue(imagePath, "Undefined results");
    return [];
  }

  const obj = await getS3Object(imagePath);
  console.log("downloaded", imagePath);

  try {
    if (boundingBoxes) {
      await writeFrameToRedis(frameIndex, imagePath, boundingBoxes);
      const files = await processBoundingBoxes(
        boundingBoxes,
        videoName,
        frameIndex,
        obj,
      );
      return files;
    }
  } catch (error: any) {
    console.log(`Error in segmentImage: ${error}`);
    // Add the error to the dead letter queue
    await addToDeadLetterQueue(imagePath, error.message);
    return undefined;
  }
  return [];
};



async function embedAndUpsert({
  imagePaths,
  chunkSize,
}: {
  imagePaths: FileWithReference[];
  chunkSize: number;
}) {
  // Chunk the image paths into batches of size chunkSize
  const chunkGenerator = chunkArray(imagePaths, chunkSize);

  // Get the index
  const index = pineconeClient.index(PINECONE_INDEX);
  const ns = index.namespace(namespace);

  const embedders = [];
  // Embed each batch and upsert the embeddings into the index
  for (const imagePaths of chunkGenerator) {
    embedders.push(
      embedder.embedBatch(imagePaths, chunkSize, async (embeddings) => {
        try {
          const filteredEmbeddings = embeddings.filter(
            (x) => x.values.length > 0,
          );
          await ns.upsert(filteredEmbeddings);
        } catch (e) {
          console.error(
            "error chunked upsert",
            embeddings.map((x) => x.id),
          );
        }
      }),
    );
  }
  // Run embedders in parallel and wait for them to finish
  await Promise.allSettled(embedders).then(console.log);
}

await embedder.init(modelName);

const indexImages = async ({ name, limit, filesList }: { name?: string; limit?: number; filesList?: string[]; }) => {
  const client = await getAwsS3Client();
  let list: string[] = []
  if (!filesList && name) {
    const files = await client.send(
      new ListObjectsV2Command({
        Bucket: AWS_S3_BUCKET,
        Prefix: `${name}/frame`,
      }),
    );
    if (files && files.Contents) {
      list = limit ? files.Contents.slice(0, limit).map((x) => x.Key!) : files.Contents.map((x) => x.Key!);
    }
  } else {
    if (!filesList) {
      throw new Error("No files list provided");
    }
    list = filesList;
  }

  console.log("Processing files: ", list.length)

  for (const fileName of list) {
    try {
      console.log("LIST", list.length);
      const segmentedFiles = (await segmentImage(fileName || ""))?.filter(x => x) || [];
      console.log("Segmented files: ", segmentedFiles)
      await embedAndUpsert({ imagePaths: segmentedFiles, chunkSize: 100 });
    } catch (error) {
      console.error(`Error processing file ${fileName}: ${error}`);
    }
  }
  console.log("done")
};

export { indexImages };
