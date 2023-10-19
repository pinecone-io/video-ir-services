import { Request, Response } from "express";
import { labelBoxes, negativeLabel } from "./label";
import { getImages, queryBox } from "./query";
import { resetDB } from "./reset";

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

      // console.log(req.body);
      // console.log("LABELING", boxIds, "WITH", label);

      try {
        await negativeLabel(originalBoxId, targetBoxId);

        res.json({ message: "Labelled" });
      } catch (error) {
        res.status(500).json({ error: "Error labeling", message: error });
      }
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
        .json([{ message: "App Backend server is healthy :) 01" }, downloaderApi, indexerApi]);
    },
  },
];

export { routes as resolvers };
