import type { Request, Response } from "express"
import { indexImages } from "./indexImages"

interface Route {
  route: string;
  method: "get" | "post" | "put" | "delete";
  handler: (req: Request, res: Response) => void;
}

const routes: Route[] = [
  {
    route: "/indexImages",
    method: "get",
    handler: async (req, res) => {
      try {
        const name = req.query.name as string
        const limit = req.query.limit as number | undefined
        await indexImages({ name, limit })
        res.status(200).json({ message: "Indexing complete" })
      } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Error indexing images" })
      }
    },
  },
  {
    route: "/health",
    method: "get",
    handler: (_, res) => {
      res.status(200).json({ message: "Indexer server is healthy :)" })
    },
  },
]

export { routes as resolvers }
