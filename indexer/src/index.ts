import express, { Express, Router } from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { resolvers } from "./routes";
import {
  PINECONE_DATA_DIR_PATH,
  PINECONE_OUTPUT_DIR_PATH,
  IS_PROD,
} from "./utils/environment";
import { initIndex } from "./utils/pinecone";
import { KafkaMessage } from "kafkajs";
import { createKafkaConsumer } from "./utils/kafka-consumer";
import { indexImages } from "./indexImages";
import EventEmitter from "events";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Express = express();

// Ensure that Pinecone index exist
await initIndex();


let isProcessing = false;
const messageQueue: KafkaMessage[] = [];

const messageEvent = new EventEmitter();

const consumer = await createKafkaConsumer(async (message: KafkaMessage) => {
  messageQueue.push(message);
  messageEvent.emit('newMessage');
});


const processMessages = async () => {
  if (isProcessing) {
    console.log("still processing");
    return;
  }

  while (messageQueue.length > 0) {
    const message = messageQueue.shift();
    const file = message?.value?.toString();

    if (!isProcessing) {
      isProcessing = true;
      await indexImages({ filesList: [file!] });
      isProcessing = false;
    } else {
      process.stdout.write(".");
    }
  }
  if (messageQueue.length === 0) {
    console.log("done processing");
  }
};

messageEvent.on('newMessage', processMessages);


const router = Router();

resolvers.forEach((resolver) => {
  router[resolver.method](resolver.route, resolver.handler);
});
app.use(express.json());

app.use("/api", router);

app.use("/data", express.static(join(__dirname, PINECONE_DATA_DIR_PATH)));
app.use("/output", express.static(join(__dirname, PINECONE_OUTPUT_DIR_PATH)));
app.get("/ping", (req, res) => res.send("pong2"));

if (IS_PROD) {
  const port = 3002;
  app.listen(port, () => {
    console.log(`Server started on ${port} port`);
  });
}

export const viteNodeApp = app;
