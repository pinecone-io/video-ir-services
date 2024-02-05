import ffmpeg from "fluent-ffmpeg"
import fs, { createWriteStream, promises as fsPromises } from "fs"

import ytdl from "@distube/ytdl-core"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { promisify } from "util"
import { generateS3Url, saveToS3Bucket } from "./utils/awsS3"
import { KafkaProducer } from "./utils/kafka-producer"
import { log } from "./utils/logger"

const unlinkAsync = promisify(fs.unlink)

const __dirname = dirname(fileURLToPath(import.meta.url))

const producer = new KafkaProducer()

type VideoOutput = {
  videoPath: string;
  index: number;
}
const videoDuration = (videoPath: string): Promise<number> => new Promise((resolve, reject) => {
  ffmpeg.ffprobe(videoPath, (err, metadata) => {
    if (!err) {
      resolve(metadata.format.duration as number)
    } else {
      reject(err)
    }
  })
})

const split = async (
  videoPath: string,
  name: string,
  fps: number,
  chunkDuration: number,
  videoLimit: number,
): Promise<VideoOutput[]> => {
  const outputFolder = join(__dirname, `temp_files/${name}`)

  // Create the folder if it doesn't exist
  await fsPromises.mkdir(outputFolder, { recursive: true })
  const duration = await videoDuration(videoPath)

  const videoDurationsInSeconds = Math.min(
    duration, // Implement this function to get the video duration
    videoLimit,
  )

  const numberOfChunks = Math.ceil(videoDurationsInSeconds / chunkDuration)
  await log(`Splitting video into ${numberOfChunks} parts, ${videoDurationsInSeconds}, ${videoLimit}, ${duration}.`)
  const videoOutputs: VideoOutput[] = []

  // Start splitting the video using the segment option
  await new Promise<void>((resolve, reject) => {
    let count = 0
    ffmpeg(videoPath)
      .outputOptions([
        "-c copy", // Use stream copy mode to avoid re-encoding
        "-map 0", // Map all streams to the output
        `-segment_time ${chunkDuration}`, // Duration of each segment
        "-f segment", // Use the segment muxer
        "-reset_timestamps 1", // Reset timestamps at the beginning of each segment
        "-segment_start_number 0", // Start numbering segments from 0
        "-copyinkf", // Copy initial non-keyframes
      ])
      .output(join(outputFolder, "part_%d.mp4"))
      .on("progress", async () => {
        count += 1
        if (count % 10 === 0) {
          await log(`: ${count}`)
        }
        console.log(count)
      })
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run()
  })

  // Create video output information
  for (let i = 0; i < numberOfChunks; i += 1) {
    videoOutputs.push({
      videoPath: join(outputFolder, `part_${i}.mp4`),
      index: i,
    })
  }

  return videoOutputs
}

const downloadAndSplit = async (target = "", name = "video", fps = 1, chunkDuration = 5, videoLimit = Number.MAX_SAFE_INTEGER) => new Promise<void>(async (resolve, reject) => {
  console.log("hello")
  await log(`Attempting to download and split ${target}. \nFirst, attempting to connect to Kafka`)
  await producer.connect()
  const videoPath = `${name}.mp4`
  const writable = createWriteStream(videoPath)

  await log("Downloading video...")

  const videoStream = ytdl(
    target || "https://www.youtube.com/watch?v=PIScf2rif5Q",
    {
      filter: "videoonly",
      quality: "highestvideo",
    },
  )

  videoStream.pipe(writable)

  writable.on("finish", async () => {
    await log("Download completed.")
    const fullTargetPath = `${name}/video/${name}.mp4`
    const videoBuffer = await fs.promises.readFile(videoPath)
    await log(`Saving to S3: ${fullTargetPath}`)
    await saveToS3Bucket(fullTargetPath, videoBuffer)

    try {
      await log("Splitting video...")
      const videos = await split(videoPath, name, fps, chunkDuration, videoLimit)
      await log(`Split video into ${videos.length} parts.`)

      videos.forEach(async (videoOutput) => {
        const parts = videoOutput.videoPath.split("/")
        const endOfPath = parts[parts.length - 1]
        const targetPath = `${name}/video/${endOfPath}`
        const videoChunkBuffer = await fs.promises.readFile(videoOutput.videoPath)
        await log(`Saving to S3: ${targetPath}`)
        await saveToS3Bucket(targetPath, videoChunkBuffer)
        await log(`Video url: ${generateS3Url(targetPath)}`)
        await unlinkAsync(videoOutput.videoPath)
        const message = JSON.stringify({
          videoPath: targetPath,
          index: videoOutput.index,
          name,
          fps,
          chunkDuration,
          videoLimit,
        })
        await log(`Sending message: ${message}`)
        await producer.sendMessage(message)
      })

      resolve()
    } catch (error) {
      console.log(`Writable on finish error: ${error}`)
      await log(`Error ${error}`)
      reject(new Error(`Error extracting frames: ${error}`))
    }
  })

  writable.on("error", (error) => {
    console.log(`Writable error: ${error}`)
    reject(new Error(`Error writing video: ${error}`))
  })
})

export { downloadAndSplit }
