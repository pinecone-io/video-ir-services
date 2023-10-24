import { Request, Response } from "express";
import { labelBoxes, negativeLabel } from "./label";
import { getImages, queryBox } from "./query";
import { resetDB } from "./reset";
import { ProgressTracker } from './utils/progressTracker'

const progressTracker = new ProgressTracker();

interface Route {
  route: string;
  method: "get" | "post" | "put" | "delete";
  handler: (req: Request, res: Response) => void;
}

const routes: Route[] = [
  {
    route: "/resetDB",
    method: "get",
    handler: async (req, res) => {
      try {
        await resetDB();
        res.status(200).json({ message: "DB Reset" });
      } catch (error) {
        res.status(500).json({ error: "Error resetting DB" });
      }
    },
  },
  {
    route: "/getImages",
    method: "get",
    handler: async (req, res) => {
      try {
        const data = await getImages();
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: "Error fetching images" });
      }
    },
  },

  {
    route: "/queryBox",
    method: "get",
    handler: async (req, res) => {
      const boxId = req.query.boxId as string;
      try {
        const matches = await queryBox(boxId);

        res.json(matches);
      } catch (error) {
        res.status(500).json({ error: "Error fetching images" });
      }
    },
  },
  {
    route: "/labelBoxes",
    method: "post",
    handler: async (req, res) => {
      const boxIds = req.body.boxIds as string[];
      const label = req.body.label as string;

      // console.log(req.body);
      // console.log("LABELING", boxIds, "WITH", label);

      try {
        await labelBoxes(label, boxIds);

        res.json({ message: "Labelled" });
      } catch (error) {
        res.status(500).json({ error: "Error labeling", message: error });
      }
    },
  },
  {
    route: "/negativeLabel",
    method: "post",
    handler: async (req, res) => {
      const originalBoxId = req.body.originalBoxId as string;
      const targetBoxId = req.body.targetBoxId as string;
      try {
        await negativeLabel(originalBoxId, targetBoxId);

        res.json({ message: "Labelled" });
      } catch (error) {
        res.status(500).json({ error: "Error labeling", message: error });
      }
    },
  },
  {
    route: "/download",
    method: "post",
    handler: async (req, res) => {
      try {
        const response = await fetch("http://video-ir-dev-downloader:3001/api/download", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body),
        });
        const data = await response.json();
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: "Error proxying download request", message: error });
      }
    },
  },
  {
    route: "/log",
    method: "post",
    handler: async (req, res) => {
      const message = req.body.message;
      console.log(message);
      // process.stdout.write(".");
      res.status(200).json({ message: "Message logged successfully" });
    },
  },
  {
    route: "/trackFile",
    method: "post",
    handler: async (req, res) => {
      const file = req.body.file;
      progressTracker.addFile(file);
      res.status(200).json({ message: "added file" });
    },
  },
  {
    route: "/completeFile",
    method: "post",
    handler: async (req, res) => {
      const file = req.body.file;
      progressTracker.completeFile(file);
      res.status(200).json({ message: "completed file" });
    },
  },
  {
    route: "/trackProgress",
    method: "post",
    handler: (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Function to send data every second
      const sendUpdates = progressTracker.startProgressPolling((data) => {
        console.log("SUPPOSED TO SEND UPDATE")
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      })

      // When the client closes the connection, stop sending updates
      req.on('close', () => {
        clearInterval(sendUpdates);
      });
    },
  },

  {
    route: "/health",
    method: "get",
    handler: async (req, res) => {
      const downloaderApi = await fetch(
        "http://video-ir-dev-downloader:3001/api/health"
      )
        .then((response) => response.json())
        .catch((error) => error);

      const indexerApi = await fetch(
        "http://video-ir-dev-indexer:3002/api/health"
      )
        .then((response) => response.json())
        .catch((error) => error);

      res
        .status(200)
        .json([{ message: "App Backend server is healthy :)" }, downloaderApi, indexerApi]);
    },
  },
];

export { routes as resolvers };
