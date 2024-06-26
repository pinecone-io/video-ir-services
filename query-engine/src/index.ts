import express, { Express, Router } from "express"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { createServer } from "http"
import dotenv from "dotenv-flow"
import { resolvers } from "./routes"
import {
  IS_PROD,
  PINECONE_DATA_DIR_PATH,
  PINECONE_OUTPUT_DIR_PATH,
} from "./utils/environment"
import { initIndex } from "./utils/pinecone"

dotenv.config()

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

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  )
  next()
})

app.use("/query", router)

app.use("/data", express.static(join(__dirname, PINECONE_DATA_DIR_PATH)))
app.use("/output", express.static(join(__dirname, PINECONE_OUTPUT_DIR_PATH)))
app.get("/ping", (req, res) => res.send("pong2"))

if (IS_PROD) {
  const port = process.env.PORT || 3004
  server.listen(port, () => {
    console.log(`Server started on ${port} port`)
  })
}

export const viteNodeApp = app
