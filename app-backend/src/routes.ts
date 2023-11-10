import { Request, Response } from "express";
import { labelBoxes, negativeLabel } from "./label";
import { createImageDataGenerator, loadImages, queryBox } from "./query";
import { resetDB } from "./reset";
import { ProgressTracker } from './utils/progressTracker'
import { IndexerInstanceTracker } from "./utils/indexerInstanceTracker";
import { LogTracker } from "./utils/logTracker";
import { NumberOfObjectsTracker } from "./utils/objectDetectionTracker";
import { EmbeddingsCountTracker } from "./utils/embeddingsCountTracker";
import { ObjectDetectionData } from "./types";
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

let imageDataGenerator = createImageDataGenerator()

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
    route: "/resetImages",
    method: "post",
    handler: async (req, res) => {
      imageDataGenerator = createImageDataGenerator()
      res.status(200).json({ message: "Images reset" });
    }
  },
  {
    route: "/getImages",
    method: "post",
    handler: async (req, res) => {
      await loadImages()
      const limit = req.body.limit;
      try {

        const generator = imageDataGenerator(limit);
        let result = generator.next();
        console.log(result.value, result.done)
        while (!result.done) {
          Object.entries(result.value).forEach(([key, value]) => {
            objectDetectionDataEmitter.addEntry({ [key]: value });
          });
          result = generator.next();
        }

        if (result.done) {
          objectDetectionDataEmitter.markAsComplete();
        }
        // console.log(`emittedEntires`, emittedEntires)

        // if (emittedEntires < Object.keys(imageData).length) {
        //   Object.entries(data).forEach(([key, value]) => {
        //     console.log(`adding entry ${key}`)
        //     objectDetectionDataEmitter.addEntry({ [key]: value });
        //     emittedEntires += 1;
        //   });
        // }
        // else {
        //   if (Object.keys(imageData).length > 0 && (emittedEntires === Object.keys(imageData).length)) {
        //     console.log("all done")
        //     objectDetectionDataEmitter.markAsComplete();
        //   }
        // }
        res.status(200).json({ message: "Images fetched" });
        // res.json(data);
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

export {
  routes as resolvers,
  indexerInstancesTrackerListener,
  progressTrackerListener,
  logTrackerListener,
  numberOfObjectsTrackerListener,
  numberOfEmbeddingsTrackerListener,
  objectDetectionDataEmitterListener
};
