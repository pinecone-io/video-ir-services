import express, { Express, Router } from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

import { resolvers } from "./routes";
import {
  IS_PROD,
  PINECONE_DATA_DIR_PATH,
  PINECONE_OUTPUT_DIR_PATH,
} from "./utils/environment";
import { initIndex } from "./utils/pinecone";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Express = express();
const server = createServer(app);
const io = new Server(server, {
  path: "/app-sockets/sockets",
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"], // Allow GET and POST methods    
  },
  transports: ["websocket"]
});
// Ensure that Pinecone index exist
await initIndex();

const router = Router();

resolvers.forEach((resolver) => {
  router[resolver.method](resolver.route, resolver.handler);
});
app.use(express.json());


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use("/api", router);

app.use("/data", express.static(join(__dirname, PINECONE_DATA_DIR_PATH)));
app.use("/output", express.static(join(__dirname, PINECONE_OUTPUT_DIR_PATH)));
app.get("/ping", (req, res) => res.send("pong2"));

io.on("connection", (socket) => {
  console.log("a user connected");
  // handle socket events here
});

if (IS_PROD) {
  const port = 3000;
  app.listen(port, () => {
    console.log(`Server started on ${port} port`);
  });
}

export const viteNodeApp = app;
