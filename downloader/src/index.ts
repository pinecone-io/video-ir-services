import express, { Express, Router } from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { resolvers } from "./routes";
import { IS_PROD } from "./utils/environment";
import { KafkaMessage } from "kafkajs";
import EventEmitter from "node:events";
import { createKafkaConsumer } from "./utils/kafka-consumer";
import { downloadFromS3 } from "./download";
import { log } from "./utils/logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let isProcessing = false;
const messageQueue: KafkaMessage[] = [];

const messageEvent = new EventEmitter();

const consumer = await createKafkaConsumer(async (message: KafkaMessage) => {
  messageQueue.push(message);
  messageEvent.emit("newMessage");
});

consumer.on("consumer.connect", async () => {
  await log("Connected and subscribed to Kafka");
});

const processMessages = async () => {
  await log("downloader received a message");
  if (isProcessing) {
    console.log("still processing");
    return;
  }

  while (messageQueue.length > 0) {
    const message = messageQueue.shift();
    const messageString = message?.value?.toString();
    const messageObject = JSON.parse(messageString!);

    console.log("MESSAGE", messageObject)

    const { videoPath, index, name, fps, chunkDuration, videoLimit } = messageObject;

    if (!isProcessing) {
      isProcessing = true;
      await downloadFromS3({ videoPath, index: index.toString(), name, fps, chunkDuration, videoLimit });
      isProcessing = false;
    } else {
      process.stdout.write(".");
    }
  }
  if (messageQueue.length === 0) {
    console.log("done processing");
  }
};

messageEvent.on("newMessage", processMessages);

const app: Express = express();

const router = Router();

resolvers.forEach((resolver) => {
  router[resolver.method](resolver.route, resolver.handler);
});
app.use(express.json());

app.use("/api", router);

if (IS_PROD) {
  const port = 3001;
  app.listen(port, () => {
    console.log(`Server started on ${port} port`);
  });
}

export const viteNodeApp = app;
