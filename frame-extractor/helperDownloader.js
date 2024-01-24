import ytdl from "@distube/ytdl-core";
import fs, { createWriteStream, mkdirSync, existsSync } from "fs";
import ffmpeg from "fluent-ffmpeg";

const videoPath = `car-race.mp4`;
const writable = createWriteStream(videoPath);

const url = "https://www.youtube.com/watch?v=ADs8tvU2xDc";

const videoStream = ytdl(url, {
  filter: "videoonly",
  quality: "highestvideo",
});

videoStream.pipe(writable);

writable.on("finish", async () => {
  await cutVideo(videoPath, `split_${videoPath}`, 0, 10, 10);
});

writable.on("error", (error) => {
  reject(new Error(`Error writing video: ${error}`));
});

const cutVideo = (
  videoPath,
  videoOutput,
  startTime,
  duration,
  fps
)=>
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
