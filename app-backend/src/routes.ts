import { Request, Response } from "express";
import { labelBoxes, negativeLabel } from "./label";
import { getImages, queryBox } from "./query";
import { resetDB } from "./reset";
import { ProgressTracker } from './utils/progressTracker'
import { IndexerInstanceTracker } from "./utils/indexerInstanceTracker";
import { LogTracker } from "./utils/logTracker";

const progressTracker = new ProgressTracker();
const progressTrackerListener = progressTracker.getEmitter();
const indexerInstancesTracker = new IndexerInstanceTracker()
const indexerInstancesTrackerListener = indexerInstancesTracker.getAllInstancesReadyEmitter()
const logTracker = new LogTracker()
const logTrackerListener = logTracker.getLogsEventEmitter()

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
    method: "post",
    handler: async (req, res) => {
      const boxId = req.body.boxId as string;
      const focused = req.body.focused as boolean ?? false;
      try {
        const matches = await queryBox(boxId, focused);

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
      const targetBoxIds = req.body.targetBoxIds as string[];
      try {
        await negativeLabel(originalBoxId, targetBoxIds);
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
      res.setTimeout(360000, () => {
        res.status(500).json({ error: "Request timed out" })
      })
      try {
        progressTracker.startTimer()
        const response = await fetch("http://video-ir-dev-splitter:3007/api/downloadAndSplit", {
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
      logTracker.log(message);
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
  // {
  //   route: "/trackProgress",
  //   method: "post",
  //   handler: (req, res) => {
  //     res.setHeader('Content-Type', 'text/event-stream');
  //     res.setHeader('Cache-Control', 'no-cache');
  //     res.setHeader('Connection', 'keep-alive');

  //     // Function to send data every second
  //     progressTracker.startProgressPolling((data: { val: number, ratio: string }) => {
  //       console.log(`Before writing ${data.val}`)
  //       res.write(`progress: ${data.ratio} (${data.val}%)\n\n`);
  //     }, () => {
  //       console.log("Processing complete.")
  //       // setTimeout(() => {
  //       //   res.end();
  //       // }, 3000)
  //     })
  //   },
  // },
  {
    route: "/registerIndexer",
    method: "post",
    handler: (req, res) => {

      const { id, status } = req.body
      console.log("registering instance", id, status)
      indexerInstancesTracker.updateInstance(id, status)
      res.status(200).send('success')
    }
  },

];

export { routes as resolvers, indexerInstancesTrackerListener, progressTrackerListener, logTrackerListener };
