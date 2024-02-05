import { Index, PineconeRecord } from "@pinecone-database/pinecone"
import { PINECONE_INDEX, PINECONE_NAMESPACE } from "./utils/environment"

import redis from "./redis"
import { generateS3Url } from "./utils/awsS3"
import { pineconeClient } from "./utils/pinecone"
import { calculateAverageVector } from "./utils/calculateAverageVector"

const namespace = PINECONE_NAMESPACE
const indexName = PINECONE_INDEX
const index = pineconeClient.index<Metadata>(indexName)
const ns = index.namespace(namespace)

const getAllKeys = async (): Promise<string[]> => {
  const keys = await redis.hGetAll("frame")
  return Object.keys(keys)
}

const sortKeys = (keys: string[]): string[] => {
  const sortedKeys = keys.sort((a, b) => {
    const aIndices = a.split("_").map(Number)
    const bIndices = b.split("_").map(Number)
    if (!aIndices || !bIndices) {
      return 0
    }
    const aIndex1 = aIndices[0] || 0
    const bIndex1 = bIndices[0] || 0
    if (aIndex1 !== bIndex1) {
      return aIndex1 - bIndex1
    }
    const aIndex2 = aIndices[1] || 0
    const bIndex2 = bIndices[1] || 0
    return aIndex2 - bIndex2
  })
  return sortedKeys
}

const getKeys = (keys: string[], offset: number, limit: number): string[] => {
  const slicedKeys = keys.slice(offset, offset + limit)
  return slicedKeys
}

const fetchFromRedis = async (keys: string[]): Promise<ObjectDetectionData> => {
  const objectDetectionData: ObjectDetectionData = {}
  for (const key of keys) {
    try {
      const value = await redis.hGet("frame", key)
      if (value) {
        const parsedValue = JSON.parse(value as string) as ImageWithBoundingBoxes
        if (parsedValue && typeof parsedValue.frameIndex === "string") {
          objectDetectionData[key] = {
            ...parsedValue,
            src: generateS3Url(parsedValue.src),
          }
        }
      }
    } catch (error) {
      console.log(`Error processing raw data for key ${key}:`, error)
    }
  }
  return objectDetectionData
}

// eslint-disable-next-line no-shadow
const fetchVectors = async (uniqueBoxIds: string[], ns: Index<Metadata>, fetchLimit: number): Promise<PineconeRecord<Metadata>[]> => {
  const numRequests = Math.ceil(uniqueBoxIds.length / fetchLimit)
  const allVectors: PineconeRecord<Metadata>[] = []
  for (let i = 0; i < numRequests; i += 1) {
    try {
      const start = i * fetchLimit
      const end = start + fetchLimit
      const idsToFetch = uniqueBoxIds.slice(start, end)
      const vectors = await ns.fetch(idsToFetch)
      allVectors.push(...Object.values(vectors.records))
    } catch (error) {
      console.log(`Error fetching vectors for request ${i + 1}:`, error)
    }
  }
  return allVectors
}

const processVectors = (allVectors: any[]): Set<{ boxId: string; label: string }> => {
  const labeledBoxes: Set<{ boxId: string; label: string }> = new Set()
  allVectors.forEach((record) => {
    if (record) {
      const { metadata } = record
      if (metadata) {
        const { boxId, label } = metadata
        if (boxId && label) {
          labeledBoxes.add({ boxId, label })
        }
      }
    }
  })
  return labeledBoxes
}

const updateLabeledBoundingBoxes = (updateData: ObjectDetectionData, labeledBoxesMap: Map<string, string>, reason: string): ObjectDetectionData => {
  // eslint-disable-next-line consistent-return
  Object.keys(updateData).forEach((frameKey) => {
    const frameData = updateData[frameKey]
    if (frameData) {
      const newLabeledBoundingBoxes = frameData.labeledBoundingBoxes.map((boundingBox) => {
        const label = labeledBoxesMap.get(boundingBox.boxId)
        return label ? { ...boundingBox, label, reason } : boundingBox
      })
      const updatedFrameData = {
        ...frameData,
        labeledBoundingBoxes: newLabeledBoundingBoxes,
      }
      return { ...updateData, [frameKey]: updatedFrameData }
    }
  })
  return updateData
}

function deepMerge(target: any, source: any) {
  const output = { ...target }
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (isObject(source[key])) {
        if (!(key in target)) Object.assign(output, { [key]: source[key] })
        else {
          // Check if the reason is explicit in the source
          output[key] = source[key].reason === "explicit" ? source[key] : deepMerge(target[key], source[key])
        }
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    }
  }
  return output
}

function isObject(item: any) {
  return (item && typeof item === "object" && !Array.isArray(item))
}

let imageDataKeys: string[] | null
let sortedKeys: string[] | null

const getNumberOfEntries = async (): Promise<number> => {
  if (!imageDataKeys || !sortedKeys) {
    imageDataKeys = await getAllKeys()
    sortedKeys = sortKeys(imageDataKeys)
  }
  return sortedKeys.length
}

const getSortedKeys = async (): Promise<string[]> => {
  if (!imageDataKeys || !sortedKeys) {
    imageDataKeys = await getAllKeys()
    sortedKeys = sortKeys(imageDataKeys)
  }
  return sortedKeys
}

const loadImagesWithOffset = async (offset: number, limit: number): Promise<[ObjectDetectionData, number]> => {
  console.log(`Loading images with offset ${offset} and limit ${limit}, ${process.env.POD_NAME}`)
  if (!imageDataKeys || !sortedKeys) {
    imageDataKeys = await getAllKeys()
    sortedKeys = sortKeys(imageDataKeys)
  }
  const keys = getKeys(sortedKeys, offset, limit)
  const objectDetectionData = await fetchFromRedis(keys)
  const boxIds = Object.values(objectDetectionData).map((frame) => frame.labeledBoundingBoxes.map((box) => box.boxId)).flat()
  const uniqueBoxIds = [...new Set(boxIds)]

  // Get vectors from pinecone
  const fetchLimit = 1000
  const allVectors = await fetchVectors(uniqueBoxIds, ns, fetchLimit)

  if (!allVectors) {
    console.log("No vectors found")
    throw new Error("No vectors found")
  }

  // Get labeled boxes from pinecone
  const labeledBoxes = processVectors(allVectors)
  const labeledBoxesMap = new Map(Array.from(labeledBoxes).map((item: LabeledBoxSetItem) => [item.boxId, item.label]))

  const probableLabeledBoxes: Set<{ boxId: string; label: string }> = new Set()
  // For each vector, query for the top 5 most similar vectors, and check if they have a label
  const vectorPromises = allVectors.map(async (record) => {
    const possibleLabelsForRecord: { [key: string]: number } = {}
    const query = {
      vector: record.values,
      topK: 100,
      includeValues: true,
      includeMetadata: true,
    }

    const res = await ns.query(query)
    const { matches } = res

    // get all vectors
    const av = matches.map((match) => match.values)
    const averageVector = calculateAverageVector(av, true)

    const averageQuery = {
      vector: averageVector,
      topK: 100,
      includeMetadata: true,
    }

    const averageRes = await ns.query(averageQuery)
    const averageMatches = averageRes.matches

    if (matches && averageMatches) {
      [...matches, ...averageMatches].forEach((match) => {
        if (match && match.score && match.score > 0.90) {
          const { metadata } = match
          if (metadata && metadata.label) {
            if (!possibleLabelsForRecord[metadata.label]) {
              possibleLabelsForRecord[metadata.label] = 0
            } else {
              possibleLabelsForRecord[metadata.label] += 1
            }
          }
        }
      })
    }

    const sortedLabels = Object.entries(possibleLabelsForRecord).sort(([, a], [, b]) => b - a)
    const topLabel = sortedLabels[0]

    if (record.metadata && topLabel) {
      if (!labeledBoxesMap.has(record.id)) {
        probableLabeledBoxes.add({ boxId: record.id, label: topLabel[0] })
      }
    }
  })
  await Promise.allSettled(vectorPromises)
  const updateData: ObjectDetectionData = {
    ...objectDetectionData,
  }

  const probableLabeledBoxesMap = new Map(Array.from(probableLabeledBoxes).map((item: LabeledBoxSetItem) => [item.boxId, item.label]))
  const updatedData: ObjectDetectionData = updateLabeledBoundingBoxes(updateData, labeledBoxesMap, "explicit")
  const updatedDataWithProbablyData: ObjectDetectionData = updateLabeledBoundingBoxes(updateData, probableLabeledBoxesMap, "probable")

  let combined = { ...updatedData }
  if (updatedDataWithProbablyData) {
    combined = deepMerge(updatedData, updatedDataWithProbablyData)
  }

  return [combined, sortedKeys.length]
}

export {
  loadImagesWithOffset,
  getNumberOfEntries,
  getSortedKeys,
}
