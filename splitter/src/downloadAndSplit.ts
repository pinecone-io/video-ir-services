import ffmpeg from "fluent-ffmpeg";
import fs, { createWriteStream, mkdirSync, existsSync } from "fs";
import { promises as fsPromises } from 'fs';

import ytdl from "@distube/ytdl-core";
import { promisify } from "util";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { generateS3Url, saveToS3Bucket } from "./utils/awsS3";
import { KafkaProducer } from "./utils/kafka-producer";
import { log } from "./utils/logger";
const unlinkAsync = promisify(fs.unlink);

const __dirname = dirname(fileURLToPath(import.meta.url));

const producer = new KafkaProducer();

type VideoOutput = {
  videoPath: string;
  index: number;
}


const downloadAndSplit = async (target = "", name = "video", fps = 1, chunkDuration = 5, videoLimit = Number.MAX_SAFE_INTEGER) => {
  return new Promise<void>(async (resolve, reject) => {

    await log(`Attempting to download and split ${target}. \nFirst, attempting to connect to Kafka`);
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
      const fullTargetPath = `${name}/video/${name}.mp4`
      const videoBuffer = await fs.promises.readFile(videoPath);
      await log(`Saving to S3: ${fullTargetPath}`)
      await saveToS3Bucket(fullTargetPath, videoBuffer);

      try {
        await log("Splitting video...");
        const videos = await split(videoPath, name, fps, chunkDuration, videoLimit);
        await log(`Split video into ${videos.length} parts.`);

        videos.forEach(async (videoOutput) => {
          const parts = videoOutput.videoPath.split('/');
          const endOfPath = parts[parts.length - 1];
          const targetPath = `${name}/video/${endOfPath}`;
          const videoBuffer = await fs.promises.readFile(videoOutput.videoPath);
          await log(`Saving to S3: ${targetPath}`)
          await saveToS3Bucket(targetPath, videoBuffer);
          await log(`Video url: ${generateS3Url(targetPath)}`);
          await unlinkAsync(videoOutput.videoPath);
          const message = JSON.stringify({
            videoPath: targetPath,
            index: videoOutput.index,
            name,
            fps,
            chunkDuration,
            videoLimit
          })
          await log(`Sending message: ${message}`)
          await producer.sendMessage(message);
        });


        // Remove processed videos
        // await Promise.all(videos.map((videoOutput) => unlinkAsync(videoOutput.videoPath)));

        resolve();
      } catch (error) {
        console.log(`Writable on finish error: ${error}`);
        await log(`Error ${error}`);
        reject(new Error(`Error extracting frames: ${error}`));
      }
    });

    writable.on("error", (error) => {
      console.log(`Writable error: ${error}`)
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
): Promise<VideoOutput[]> => {
  const outputFolder = join(__dirname, `temp_files/${name}`);

  // Create the folder if it doesn't exist
  await fsPromises.mkdir(outputFolder, { recursive: true });
  const videoDurationS = await videoDuration(videoPath);

  let videoDurationsInSeconds = Math.min(
    videoDurationS, // Implement this function to get the video duration
    videoLimit
  );

  const numberOfChunks = Math.ceil(videoDurationsInSeconds / chunkDuration);
  await log(`Splitting video into ${numberOfChunks} parts, ${videoDurationsInSeconds}, ${videoLimit}, ${videoDurationS}.`)
  const videoOutputs: VideoOutput[] = [];

  // Start splitting the video using the segment option
  await new Promise<void>((resolve, reject) => {
    let count = 0;
    ffmpeg(videoPath)
      .outputOptions([
        // `-r ${fps}`, // Set the output frame rate
        '-c copy', // Use stream copy mode to avoid re-encoding
        '-map 0', // Map all streams to the output
        `-segment_time ${chunkDuration}`, // Duration of each segment
        '-f segment', // Use the segment muxer
        '-reset_timestamps 1', // Reset timestamps at the beginning of each segment
        `-segment_start_number 0`, // Start numbering segments from 0
        '-copyinkf', // Copy initial non-keyframes
      ])
      .output(join(outputFolder, `part_%d.mp4`))
      .on("progress", async (progressData) => {
        count++
        if (count % 10 === 0) {
          await log(`: ${count}`);
        }
        console.log(count)
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });

  // Create video output information
  for (let i = 0; i < numberOfChunks; i++) {
    videoOutputs.push({
      videoPath: join(outputFolder, `part_${i}.mp4`),
      index: i
    });
  }

  return videoOutputs;
};



// const split = async (
//   videoPath: string,
//   name: string,
//   fps: number,
//   chunkDuration: number,
//   videoLimit: number
// ): Promise<VideoOutput[]> => {
//   const outputFolder = join(__dirname, `temp_files/${name}`);

//   // Create the folder if it doesn't exist
//   if (!existsSync(outputFolder)) {
//     mkdirSync(outputFolder, { recursive: true });
//   }

//   let videoDurationsInSeconds = Math.min(
//     await videoDuration(videoPath),
//     videoLimit
//   );

//   // Reduce video to desierd length and fps before chunking
//   await cutVideo(
//     videoPath,
//     {
//       videoPath: `split_${videoPath}`,
//       index: 0
//     },
//     0,
//     videoDurationsInSeconds,
//     fps
//   );

//   const cutPromises = [];
//   for (
//     let i = 0, len = Math.ceil(videoDurationsInSeconds / chunkDuration);
//     i < len;
//     i++
//   ) {
//     cutPromises.push(
//       cutVideo(
//         `split_${videoPath}`,
//         {
//           videoPath: join(outputFolder, `part_${i}.mp4`),
//           index: i
//         },
//         i * chunkDuration,
//         chunkDuration,
//         fps
//       )
//     );
//   }

//   const videos = await Promise.all(cutPromises);

//   // Delete local videos
//   await unlinkAsync(`split_${videoPath}`);
//   await unlinkAsync(videoPath);

//   return videos;
// };

// const cutVideo = (
//   videoPath: string,
//   videoOutput: VideoOutput,
//   startTime: number,
//   duration: number,
//   fps: number
// ): Promise<VideoOutput> =>
//   new Promise(async (resolve, reject) => {
//     let count = 0
//     ffmpeg(videoPath)
//       .fpsOutput(fps)
//       .setStartTime(startTime)
//       .setDuration(duration)
//       .output(videoOutput.videoPath)
//       .on("end", async function (err) {
//         await log(`Progress splitting video`);
//         if (!err) {
//           resolve(videoOutput);
//         } else {
//           reject(err);
//         }
//       })
//       .on("progress", async (progressData) => {
//         count++
//         if (count % 10 === 0) {
//           await log(`: ${count}`);
//         }
//         console.log(count)
//       })
//       .on("error", (err) => {
//         console.log("error: ", err);
//         reject(err);
//       })
//       .run();
//   });

export { downloadAndSplit };
