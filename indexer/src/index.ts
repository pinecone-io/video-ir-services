import express, { Express, Router } from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createServer } from 'vite'

import { resolvers } from "./routes";
import {
  PINECONE_DATA_DIR_PATH,
  PINECONE_OUTPUT_DIR_PATH,
} from "./utils/environment";
import { initIndex } from "./utils/pinecone";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Express = express();

// Ensure that Pinecone index exist
await initIndex();

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

