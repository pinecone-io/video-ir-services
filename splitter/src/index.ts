import express, { Express, Router } from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { resolvers } from "./routes"
import { IS_PROD } from "./utils/environment";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Express = express();

const router = Router();

resolvers.forEach((resolver) => {
  router[resolver.method](resolver.route, resolver.handler);
});
app.use(express.json());

app.use("/api", router);

if (IS_PROD) {
  const port = 3007;
  app.listen(port, () => {
    console.log(`Server started on ${port} port`);
  });
}


export const viteNodeApp = app;

