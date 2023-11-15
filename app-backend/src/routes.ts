import { Request, Response } from "express";
import { labelBoxes, negativeLabel } from "./label";
import { queryBox } from "./query";
import { loadImagesWithOffset } from './loadImagesWithOffset'
import { resetDB } from "./reset";
import { ProgressTracker } from './utils/progressTracker'
import { IndexerInstanceTracker } from "./utils/indexerInstanceTracker";
import { LogTracker } from "./utils/logTracker";
import { NumberOfObjectsTracker } from "./utils/objectDetectionTracker";
import { EmbeddingsCountTracker } from "./utils/embeddingsCountTracker";
import { ObjectDetectionDataEmitter } from "./utils/objectDetectionDataEmitter";

const progressTracker = new ProgressTracker();
const progressTrackerListener = progressTracker.getEmitter();
const indexerInstancesTracker = new IndexerInstanceTracker()
const indexerInstancesTrackerListener = indexerInstancesTracker.getAllInstancesReadyEmitter()
const logTracker = new LogTracker()
const logTrackerListener = logTracker.getLogsEventEmitter()
const numberOfObjectsTracker = new NumberOfObjectsTracker()
const numberOfObjectsTrackerListener = numberOfObjectsTracker.getNumberOfObjectsEventEmitter()
const numberOfEmbeddingsTracker = new EmbeddingsCountTracker()
const numberOfEmbeddingsTrackerListener = numberOfEmbeddingsTracker.getNumberOfEmbeddingsEventEmitter()
const objectDetectionDataEmitter = new ObjectDetectionDataEmitter();
const objectDetectionDataEmitterListener = objectDetectionDataEmitter.getOdDataEventEmitter();


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
    route: "/getImagesWithOffset",
    method: "post",
    handler: async (req, res) => {
      const offset = req.body.offset;
      const limit = req.body.limit;
      try {
        const [data, numberOfEntries] = await loadImagesWithOffset(offset, limit);
        Object.entries(data).forEach(([key, value]) => {
          objectDetectionDataEmitter.addEntry({ [key]: value });
        });
        res.status(200).json({ message: "Images fetched", numberOfEntries });
      } catch (error) {
        res.status(500).json({ error: "Error fetching images", message: error });
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
        progressTracker.startTimer();
        progressTracker.resetFiles();
        numberOfObjectsTracker.clearNumberOfObjects();
        numberOfEmbeddingsTracker.clearNumberOfEmbeddings();
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
      const payload = req.body.payload;
      console.log("PAYLOAD", payload)
      logTracker.log(message);
      if (payload && Object.keys(payload).length !== 0) {
        try {
          const eventType = payload.eventType
          switch (eventType) {
            case 'boxCount': {
              numberOfObjectsTracker.addToObjectCount(payload.boxesCount)
              break;
            }
            case 'embeddingCount': {
              numberOfEmbeddingsTracker.addToEmbeddingsCount(payload.embeddingCount)
              break;
            }
          }
        } catch (e) {
          console.log(`Error trying to parse ${payload}`)
        }
      }

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

export {
  routes as resolvers,
  indexerInstancesTrackerListener,
  progressTrackerListener,
  logTrackerListener,
  numberOfObjectsTrackerListener,
  numberOfEmbeddingsTrackerListener,
  objectDetectionDataEmitterListener
};
