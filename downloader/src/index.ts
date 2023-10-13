import express, { Express, Router } from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { resolvers } from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Express = express();

const router = Router();

resolvers.forEach((resolver) => {
  router[resolver.method](resolver.route, resolver.handler);
});
app.use(express.json());

app.use("/api", router);


export const viteNodeApp = app;

