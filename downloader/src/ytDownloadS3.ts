import { PutObjectCommand } from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import fs, { createWriteStream, mkdirSync, existsSync } from "fs";

import ytdl from "ytdl-core";
import { promisify } from "util";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { getAwsS3Client, saveToS3Bucket } from "./utils/awsS3";
import { AWS_S3_BUCKET } from "./utils/environment";
import { KafkaProducer } from "./utils/kafka-producer";
import { log } from "./utils/logger";
const unlinkAsync = promisify(fs.unlink);

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = await getAwsS3Client();
const producer = new KafkaProducer();

const extractFrames = async (videoPath: string, name: string, fps: number): Promise<string[]> =>
    new Promise((resolve, reject) => {
        console.log("Extracting frames...");
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
                for (let i = 1; i <= frameCount; i += 1) {
                    const outputFilePath = join(outputFolder, `${i}.png`);
                    const fileBuffer = fs.readFileSync(outputFilePath);
                    const filePath = `${name}/frame/${i}.png`;
                    await saveToS3Bucket(
                        filePath,
                        fileBuffer,
                    );
                    files.push(filePath);
                    // Delete the local file
                    await unlinkAsync(outputFilePath);
                    // Send for indexing
                    await producer.sendMessage(filePath);

                }
                console.log("Frames extraction completed.");
                await log(`Extracted ${frameCount} frames.`);
                resolve(files);
            })
            .on("progress", (progressData) => {
                frameCount = progressData.frames;
                console.log('Frame count: ', frameCount)
            })
            .on("error", (error: Error) => {
                const err = `Error occurred: ${error.message}`;
                reject(err)
            })
            .run();
    });

const downloadS3 = async (target = "", name = "video", fps = 1) => {

    return new Promise<void>(async (resolve, reject) => {

        console.time(`Attempting to download ${target}`);
        console.log("First, attempting to connect to Kafka")
        await producer.connect();
        const videoPath = `${name}.mp4`;
        const writable = createWriteStream(videoPath);
        const videoStream = ytdl(
            target || "https://www.youtube.com/watch?v=PIScf2rif5Q",
            {
                filter: 'videoonly',
                quality: 'highestvideo'

            }
        );



        videoStream.pipe(writable);

        writable.on("finish", async () => {
            try {
                const files = await extractFrames(videoPath, name, fps);
                resolve();
            } catch (error) {
                console.log(error);
                reject(new Error(`Error extracting frames: ${error}`));
            }
            console.timeEnd("Download");

            // Delete the local video
            await unlinkAsync(videoPath);
        });

        writable.on("error", (error) => {
            reject(new Error(`Error writing video: ${error}`));
        });
    });
};

export { downloadS3 };
