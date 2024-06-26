import { Request, Response } from "express"
import { downloadAndSplit } from "./downloadAndSplit"

interface Route {
    route: string;
    method: "get" | "post" | "put" | "delete";
    handler: (req: Request, res: Response) => void;
}

const routes: Route[] = [
  {
    route: "/downloadAndSplit",
    method: "post",
    handler: async (req, res) => {
      res.setTimeout(360000, () => {
        res.status(500).json({ error: "Request timed out" })
      })
      try {
        const target = req.body.target as string
        const fps = req.body.fps as number
        const name = req.body.name as string
        const chunkDuration = req.body.chunkDuration as number
        const videoLimit = req.body.videoLimit as number
        await downloadAndSplit(target, name, fps, chunkDuration, videoLimit)
        res.json({ message: "Downloaded" })
      } catch (error) {
        res.status(500).json({ error: "Error downloading", message: error })
      }
    },
  },
  {
    route: "/health",
    method: "get",
    handler: (_, res) => {
      res.status(200).json({ message: "Video splitter server is healthy :)" })
    },
  },
]

export { routes as resolvers }
