import ffmpeg from "fluent-ffmpeg";
import fs, { createWriteStream, mkdirSync, existsSync } from "fs";

import ytdl from "ytdl-core";
import { promisify } from "util";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { getS3Object, saveToS3Bucket } from "./utils/awsS3";
import { KafkaProducer } from "./utils/kafka-producer";
import { log } from "./utils/logger";
const unlinkAsync = promisify(fs.unlink);

const __dirname = dirname(fileURLToPath(import.meta.url));

const producer = new KafkaProducer();

const extractFrames = async (
  videoPath: string,
  name: string,
  fps: number
): Promise<string[]> =>
  new Promise((resolve, reject) => {
    let frameCount = 0;
    const files: string[] = [];
    const outputFolder = join(__dirname, `temp_files/${name}`);

    // Create the folder if it doesn't exist
    if (!existsSync(outputFolder)) {
      mkdirSync(outputFolder, { recursive: true });
    }

    // Use fluent-ffmpeg to extract frames
    ffmpeg(videoPath)
      .outputOptions([`-vf fps=${fps}`])
      .output(join(outputFolder, "%d.png"))
      .on("end", async () => {
        await log(`Total frames: ${frameCount}`)
        for (let i = 1; i <= frameCount; i += 1) {
          const outputFilePath = join(outputFolder, `${i}.png`);
          const fileBuffer = fs.readFileSync(outputFilePath);
          const filePath = `${name}/frame/${i}.png`;
          await saveToS3Bucket(filePath, fileBuffer);
          files.push(filePath);
          // Delete the local file
          await unlinkAsync(outputFilePath);
          // Send for indexing
          await log(`Sending message: ${filePath}}`)
          await producer.sendMessage(filePath);

        }
        await log("Frames extraction completed.");
        await await log(`Extracted ${frameCount} frames.`);
        resolve(files);
      })
      .on("progress", async (progressData) => {
        frameCount = progressData.frames;
        console.log(".")
        await log(`Frames extracted: ${frameCount}`)
      })
      .on("error", (error: Error) => {
        const err = `Error occurred: ${error.message}`;
        reject(err);
      })
      .run();
  });

const downloadFromYoutube = async (target = "", name = "video", fps = 1, chunkDuration = 5, videoLimit = Number.MAX_SAFE_INTEGER) => {
  return new Promise<void>(async (resolve, reject) => {

    await log(`Attempting to download ${target}. \nFirst, attempting to connect to Kafka`);
    await producer.connect();
    const videoPath = `${name}.mp4`;
    const writable = createWriteStream(videoPath);

    await log("Downloading video...");
    const videoStream = ytdl(
      target || "https://www.youtube.com/watch?v=PIScf2rif5Q",
      {
        filter: "videoonly",
        quality: "highestvideo",
      }
    );

    videoStream.pipe(writable);

    writable.on("finish", async () => {
      await log("Download completed.");
      try {
        await log("Extracting frames...");
        const videos = await split(videoPath, name, fps, chunkDuration, videoLimit);

        // Extract frames for each video cut
        await Promise.all(
          videos.map((videoPath, i) =>
            extractFrames(videoPath, `${name}_${i}`, fps)
          )
        );

        // Remove processed videos
        await Promise.all(videos.map((videoPath) => unlinkAsync(videoPath)));

        resolve();
      } catch (error) {
        console.log(error);
        await log(`Error ${error}`);
        reject(new Error(`Error extracting frames: ${error}`));
      }
    });

    writable.on("error", (error) => {
      reject(new Error(`Error writing video: ${error}`));
    });
  });
};

const downloadFromS3 = async ({ videoPath = "", target = "", name = "video", fps = 1, chunkDuration = 5, videoLimit = Number.MAX_SAFE_INTEGER }) => {
  return new Promise<void>(async (resolve, reject) => {

    await log(`Attempting to download ${target}. \nFirst, attempting to connect to Kafka`);
    await producer.connect();
    const videoPath = `${name}.mp4`;
    const writable = createWriteStream(videoPath);

    await log("Downloading video...");
    const s3Video = await getS3Object(videoPath);

    writable.write(s3Video);

    writable.on("finish", async () => {
      await log("Download completed.");
      try {
        await log("Extracting frames...");
        await extractFrames(videoPath, `${name}`, fps)
        // const videos = await split(videoPath, name, fps, chunkDuration, videoLimit);

        // // Extract frames for each video cut
        // await Promise.all(
        //   videos.map((videoPath, i) =>
        //     extractFrames(videoPath, `${name}_${i}`, fps)
        //   )
        // );

        // // Remove processed videos
        // await Promise.all(videos.map((videoPath) => unlinkAsync(videoPath)));

        resolve();
      } catch (error) {
        console.log(error);
        await log(`Error ${error}`);
        reject(new Error(`Error extracting frames: ${error}`));
      }
    });

    writable.on("error", (error) => {
      reject(new Error(`Error writing video: ${error}`));
    });
  });
};

const videoDuration = (videoPath: string): Promise<number> =>
  new Promise((resolve, reject) =>
    ffmpeg.ffprobe(videoPath, function (err, metadata) {
      if (!err) {
        resolve(metadata.format.duration as number);
      } else {
        reject(err);
      }
    })
  );

const split = async (
  videoPath: string,
  name: string,
  fps: number,
  chunkDuration: number,
  videoLimit: number
): Promise<string[]> => {
  const outputFolder = join(__dirname, `temp_files/${name}`);

  // Create the folder if it doesn't exist
  if (!existsSync(outputFolder)) {
    mkdirSync(outputFolder, { recursive: true });
  }

  let videoDurationsInSeconds = Math.min(
    await videoDuration(videoPath),
    videoLimit
  );

  // Reduce video to desierd length and fps before chunking
  await cutVideo(
    videoPath,
    `cuted_${videoPath}`,
    0,
    videoDurationsInSeconds,
    fps
  );

  const cutPromises = [];
  for (
    let i = 0, len = Math.ceil(videoDurationsInSeconds / chunkDuration);
    i < len;
    i++
  ) {
    cutPromises.push(
      cutVideo(
        `cuted_${videoPath}`,
        join(outputFolder, `part_${i}.mp4`),
        i * chunkDuration,
        chunkDuration,
        fps
      )
    );
  }

  const videos = await Promise.all(cutPromises);

  // Delete local videos
  await unlinkAsync(`cuted_${videoPath}`);
  await unlinkAsync(videoPath);

  return videos;
};

const cutVideo = (
  videoPath: string,
  videoOutput: string,
  startTime: number,
  duration: number,
  fps: number
): Promise<string> =>
  new Promise(async (resolve, reject) => {
    ffmpeg(videoPath)
      .fpsOutput(fps)
      .setStartTime(startTime)
      .setDuration(duration)
      .output(videoOutput)
      .on("end", function (err) {
        if (!err) {
          resolve(videoOutput);
        } else {
          reject(err);
        }
      })
      .on("error", (err) => {
        console.log("error: ", err);
        reject(err);
      })
      .run();
  });

export { downloadFromYoutube, downloadFromS3 };
