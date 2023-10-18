import express, { Express, Router } from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { resolvers } from "./routes";
import {
  PINECONE_DATA_DIR_PATH,
  PINECONE_OUTPUT_DIR_PATH,
} from "./utils/environment";
import { initIndex } from "./utils/pinecone";
import { KafkaMessage } from "kafkajs";
import { createKafkaConsumer } from "./utils/kafka-consumer";
import { indexImages } from "./indexImages";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Express = express();

// Ensure that Pinecone index exist
await initIndex();

const consumer = await createKafkaConsumer(
  "unprocessed-files-3",
  async (message: KafkaMessage) => {
    const file = message.value?.toString();
    
    if (file) {
      console.log("Start Procesing:", file);
      console.time(file)
      await indexImages({ filesList: [file] });
      console.timeEnd(file)
      console.log("Finished Processing:", file)
      console.log("------------------------")
    }
  }
);

const router = Router();

resolvers.forEach((resolver) => {
  router[resolver.method](resolver.route, resolver.handler);
});
app.use(express.json());

app.use("/api", router);

app.use("/data", express.static(join(__dirname, PINECONE_DATA_DIR_PATH)));
app.use("/output", express.static(join(__dirname, PINECONE_OUTPUT_DIR_PATH)));
app.get("/ping", (req, res) => res.send("pong2"));

export const viteNodeApp = app;
