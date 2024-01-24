import ffmpeg, { FfprobeData } from "fluent-ffmpeg";

const getVideoFps = (videoPath: string): Promise<number> =>
  new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, function (err: Error, metadata: FfprobeData) {
      if (err) {
        reject(err);
      } else {
        const stream = metadata.streams[0];
        if (stream && stream.r_frame_rate) {
          // r_frame_rate is the rate at which frames are emitted from the decoder
          const frameRate = stream.r_frame_rate;
          // frameRate is a string in the format "num/den", so we need to calculate the actual fps
          const [num, den] = frameRate.split('/').map(Number);
          if (num !== undefined && den !== undefined && !isNaN(num) && !isNaN(den)) {
            resolve(num / den);
          } else {
            reject(new Error('Invalid frame rate format'));
          }
        } else {
          reject(new Error('No stream data or frame rate found'));
        }
      }
    });
  });

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

export { getVideoFps, videoDuration };
