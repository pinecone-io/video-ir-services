import ffmpeg from "fluent-ffmpeg"
import fs, { existsSync, mkdirSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { promisify } from "util"
import { generateS3Url, saveToS3Bucket } from "./utils/awsS3"
import { KafkaProducer } from "./utils/kafka-producer"
import { log, trackFile } from "./utils/logger"

const unlinkAsync = promisify(fs.unlink)
const __dirname = dirname(fileURLToPath(import.meta.url))
const producer = new KafkaProducer()

const extractFrames = async (
  videoPath: string,
  name: string,
  index: string,
  fps: number,
  // eslint-disable-next-line no-async-promise-executor
): Promise<string[]> => new Promise(async (resolve, reject) => {
  let frameCount = 0
  const files: string[] = []
  const outputFolder = join(__dirname, `temp_files/${name}`)

  // Create the folder if it doesn't exist
  if (!existsSync(outputFolder)) {
    mkdirSync(outputFolder, { recursive: true })
  }
  // Use fluent-ffmpeg to extract frames
  ffmpeg(videoPath)
    .outputOptions([`-vf fps=${fps}`])
    .output(join(outputFolder, `${index}_%d.png`))
    .on("end", async () => {
      await log(`Total frames: ${frameCount}, ${index}`)
      for (let i = 1; i <= frameCount; i += 1) {
        try {
          const outputFilePath = join(outputFolder, `${index}_${i}.png`)
          const fileBuffer = fs.readFileSync(outputFilePath)
          const filePath = `${name}/frame/${index}_${i}.png`
          await saveToS3Bucket(filePath, fileBuffer)
          files.push(filePath)
          // Delete the local file
          await unlinkAsync(outputFilePath)
          // Send for indexing
          await log(`Sending message: ${filePath}}`)
          await trackFile(filePath)
          await producer.sendMessage(filePath)
        } catch (e) {
          await log(`Error ${e}`)
          console.log(`ERROR ${e}`)
        }
      }
      await log("Frames extraction completed.")
      await log(`Extracted ${frameCount} frames.`)
      resolve(files)
    })
    .on("progress", async (progressData) => {
      frameCount = progressData.frames
      console.log(".")
      await log(`Frames extracted: ${frameCount}`)
    })
    .on("error", (error: Error) => {
      const err = `Error occurred: ${error.message}`
      reject(err)
    })
    .run()
})

const processVideo = async ({
  videoPath = "",
  index,
  name = "video",
  fps = 1,
}: {
  videoPath?: string,
  index: string,
  name?: string,
  fps?: number,
  videoLimit?: number,
}) => {
  await producer.connect()

  const videoPathDownload = `${name}.mp4`
  await log(`Downloading video part ${videoPathDownload}... ${index}`)

  const url = generateS3Url(videoPath)
  await log(`URL: ${url}`)

  const response = await fetch(url)

  const s3Video = await response.arrayBuffer()

  await new Promise((resolve, reject) => {
    // eslint-disable-next-line consistent-return
    fs.writeFile(videoPathDownload, Buffer.from(s3Video), async (err) => {
      if (err) return reject(err)
      await log("Download completed.")
      await extractFrames(videoPathDownload, `${name}`, index, fps)

      await unlinkAsync(videoPathDownload)

      resolve(true)
    })
  })
}

export { processVideo }
