import express, { Express, Router } from "express"
import dotenv from "dotenv-flow"
import { initializeMessageQueue } from "./processMessages"
import { resolvers } from "./routes"
import { IS_PROD } from "./utils/environment"

dotenv.config()

const app: Express = express()
const router = Router()

initializeMessageQueue()

resolvers.forEach((resolver) => {
  router[resolver.method](resolver.route, resolver.handler)
})
app.use(express.json())

app.use("/api", router)

if (IS_PROD) {
  const port = process.env.PORT || 3002
  app.listen(port, () => {
    console.log(`Server started on ${port} port`)
  })
}

export const viteNodeApp = app
