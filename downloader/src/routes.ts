import { Request, Response } from "express";
import { downloadFromS3, downloadFromYoutube } from "./download";

interface Route {
  route: string;
  method: "get" | "post" | "put" | "delete";
  handler: (req: Request, res: Response) => void;
}

const routes: Route[] = [
  {
    route: "/download",
    method: "post",
    handler: async (req, res) => {
      res.setTimeout(360000, () => {
        res.status(500).json({ error: "Request timed out" });
      });
      try {
        const target = req.body.target as string;
        const fps = req.body.fps as number;
        const name = req.body.name as string;
        const cunkDuration = req.body.chunkDuration as number;
        const videoLimit = req.body.videoLimit as number;
        const a = {
          videoPath: "car-race/video/part_0.mp4",
          name: "car-race",
          fps: 1,
          chunkDuration: 1,
          videoLimit: 1,
        };

        console.log(`Downloading ${target}`);
        // await downloadFromS3({videoPath: a.videoPath, target: "", name: a.name, fps: a.fps, chunkDuration: a.chunkDuration, videoLimit: a.videoLimit});
        res.json({ message: "Downloaded" });
      } catch (error) {
        res.status(500).json({ error: "Error downloading", message: error });
      }
    },
  },
  {
    route: "/test",
    method: "get",
    handler: async (_, res) => {
      console.log("squanch");
      // await downloadFromS3({ videoPath: "car-race/video/part_0.mp4" });
    },
  },
  {
    route: "/health",
    method: "get",
    handler: (_, res) => {
      res.status(200).json({ message: "Downloader server is healthy :)" });
    },
  },
];

export { routes as resolvers };
