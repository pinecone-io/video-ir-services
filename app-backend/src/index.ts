import express, { Express, Router } from "express"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { createServer } from "http"
import { Server } from "socket.io"
import { createAdapter } from "socket.io-redis"
import Redis from "ioredis"
import cors from "cors"

import dotenvFlow from "dotenv-flow"
import {
  downloaderInstancesTrackerListener, logTrackerListener, numberOfEmbeddingsTrackerListener, numberOfObjectsTrackerListener, objectDetectionDataEmitterListener, resolvers,
  indexerInstancesTrackerListener, progressTrackerListener,
} from "./routes"
import {
  IS_PROD,
  PINECONE_DATA_DIR_PATH,
  PINECONE_OUTPUT_DIR_PATH,
} from "./utils/environment"
import { initIndex } from "./utils/pinecone"

dotenvFlow.config()

const pubClient = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379"),
})
const subClient = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379"),
})
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app: Express = express()
const server = createServer(app)

// Ensure that Pinecone index exist
await initIndex()

const router = Router()

resolvers.forEach((resolver) => {
  router[resolver.method](resolver.route, resolver.handler)
})
app.use(express.json())

app.use(cors({
  credentials: true,
  origin: "*",
}))

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header(
    "Access-Control-Allow-Headers",
  )
  next()
})

app.use("/api", router)

app.use("/data", express.static(join(__dirname, PINECONE_DATA_DIR_PATH)))
app.use("/output", express.static(join(__dirname, PINECONE_OUTPUT_DIR_PATH)))

const io = new Server(server, {
  path: "/app-sockets/socket",
  cors: {
    origin: "*",
    methods: ["GET", "POST"], // Allow GET and POST methods
    credentials: true,
  },
  transports: ["polling", "websocket"],
})

io.adapter(createAdapter({ pubClient, subClient }))

io.on("connection", (socket) => {
  console.log("A client has connect:", socket.id)
  indexerInstancesTrackerListener.on("instancesUpdated", (data) => {
    socket.emit("instancesUpdated", data)
  })

  progressTrackerListener.on("filesToProcessChanged", (data) => {
    socket.emit("filesToProcessChanged", data)
  })
  progressTrackerListener.on("processedFilesChanged", (data) => {
    socket.emit("processedFilesChanged", data)
  })

  progressTrackerListener.on("complete", (data) => {
    socket.emit("complete", data)
  })

  logTrackerListener.on("logUpdated", (data) => {
    socket.emit("logUpdated", data)
  })

  numberOfObjectsTrackerListener.on("numberOfObjectsUpdated", (data) => {
    socket.emit("numberOfObjectsUpdated", data)
  })

  numberOfEmbeddingsTrackerListener.on("numberOfEmbeddingsUpdated", (data) => {
    socket.emit("numberOfEmbeddingsUpdated", data)
  })

  objectDetectionDataEmitterListener.on("odDataAdded", (data: ObjectDetectionData) => {
    io.emit("odDataAdded", data)
  })

  objectDetectionDataEmitterListener.on("odDataDone", (data: ObjectDetectionData) => {
    socket.emit("odDataDone", data)
  })

  downloaderInstancesTrackerListener.on("downloaderInstancesUpdated", (data) => {
    socket.emit("downloaderInstancesUpdated", data)
  })
})

io.on("connect_error", (err) => {
  console.log(`Connect error: ${err.message}`)
})

if (IS_PROD) {
  const port = process.env.PORT || 3000
  server.listen(port, () => {
    console.log(`Server started on ${port} port`)
  })
}

export const viteNodeApp = app
