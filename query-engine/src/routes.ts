import { labelBoxes, negativeLabel } from "./label"
import { queryBox } from "./query"
import { getNumberOfEntries, getSortedKeys, loadImagesWithOffset } from "./loadImagesWithOffset"
import { ObjectDetectionDataEmitter } from "./utils/objectDetectionDataEmitter"
import { Route } from "./types"

const objectDetectionDataEmitter = new ObjectDetectionDataEmitter()
const objectDetectionDataEmitterListener = objectDetectionDataEmitter.getOdDataEventEmitter()

const routes: Route[] = [
  {
    route: "/getImagesWithOffset",
    method: "post",
    handler: async (req, res) => {
      const { offset } = req.body
      const { limit } = req.body
      try {
        const [data, numberOfEntries] = await loadImagesWithOffset(offset, limit)
        res.status(200).json({ message: "Images fetched", numberOfEntries, data })
      } catch (error) {
        res.status(500).json({ error: "Error fetching images", message: error })
      }
    },
  },
  {
    route: "/getNumberOfEntries",
    method: "get",
    handler: async (req, res) => {
      try {
        const numberOfEntries = await getNumberOfEntries()
        res.status(200).json({ numberOfEntries })
      } catch (error) {
        res.status(500).json({ error: "Error fetching images", message: error })
      }
    },
  },

  {
    route: "/getSortedKeys",
    method: "get",
    handler: async (req, res) => {
      try {
        const sortedKeys = await getSortedKeys()
        res.status(200).json({ sortedKeys })
      } catch (error) {
        res.status(500).json({ error: "Error fetching images", message: error })
      }
    },
  },

  {
    route: "/queryBox",
    method: "post",
    handler: async (req, res) => {
      const boxId = req.body.boxId as string
      const focused = req.body.focused as boolean ?? false
      try {
        const matches = await queryBox(boxId, focused)
        if (matches instanceof Error) {
          res.status(500).json({ error: "Error querying box", message: matches.message })
        } else {
          res.json(matches)
        }
      } catch (error) {
        res.status(500).json({ error: "Error fetching images" })
      }
    },
  },
  {
    route: "/labelBoxes",
    method: "post",
    handler: async (req, res) => {
      const boxIds = req.body.boxIds as string[]
      const label = req.body.label as string

      try {
        await labelBoxes(label, boxIds)
        res.json({ message: "Labelled" })
      } catch (error) {
        res.status(500).json({ error: "Error labeling", message: error })
      }
    },
  },
  {
    route: "/negativeLabel",
    method: "post",
    handler: async (req, res) => {
      const originalBoxId = req.body.originalBoxId as string
      const targetBoxIds = req.body.targetBoxIds as string[]
      try {
        await negativeLabel(originalBoxId, targetBoxIds)
        res.json({ message: "Labelled" })
      } catch (error) {
        res.status(500).json({ error: "Error labeling", message: error })
      }
    },
  },
  {
    route: "/health",
    method: "get",
    handler: async (req, res) => {
      res.status(200).json({ status: "ok" })
    },
  },
]

export {
  routes as resolvers,
  objectDetectionDataEmitterListener,
}
