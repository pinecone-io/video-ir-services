import { Pinecone, QueryOptions } from "@pinecone-database/pinecone";
import { mean, norm, divide, Matrix } from "mathjs";

import {
  BoxResult,
  ImageWithBoundingBoxes,
  Metadata,
  ObjectDetectionData,
} from "./types";
import { getEnv, PINECONE_INDEX, PINECONE_NAMESPACE } from "./utils/environment";
import { embedder } from "./embeddings";
import redis from "./redis";
import { generateS3Url } from "./utils/awsS3";

type Vector = number[];

const modelName = "Xenova/clip-vit-large-patch14";
const namespace = PINECONE_NAMESPACE;
const pineconeClient = await new Pinecone({
  environment: getEnv("VITE_PINECONE_ENVIRONMENT"),
  apiKey: getEnv("VITE_PINECONE_API_KEY"),
  projectId: getEnv("VITE_PINECONE_PROJECT_ID"),
});

type LabeledBoxSetItem = { k: string; v: string };


await embedder.init(modelName);

const calculateAverageVector = (
  vectors: Vector[],
  normalize: boolean = false,
): Vector => {
  if (vectors.length === 0) {
    throw new Error("The vectors array must not be empty.");
  }

  const firstVector = vectors[0];
  if (!firstVector) {
    throw new Error("The vectors array must not be empty.");
  }

  // Check if all vectors have the same dimensionality
  const dimension = firstVector.length;
  if (!vectors.every((vec) => vec.length === dimension)) {
    throw new Error("All vectors must have the same dimension.");
  }

  // Calculate the average vector
  const averageVector: Vector = mean(vectors, 0) as unknown as number[];

  if (normalize) {
    // Normalize the average vector
    const averageVectorNorm: number = norm(averageVector) as number;
    const normalizedAverageVector: Vector = divide(
      averageVector,
      averageVectorNorm,
    ) as unknown as number[];
    return normalizedAverageVector;
  }

  return averageVector;
};

const confidence = 0.95;

const queryBox: (boxId: string, focused?: boolean) => Promise<BoxResult[] | Error> = async (
  boxId: string,
  focused: boolean = false
) => {
  try {
    const indexName = PINECONE_INDEX;
    const index = pineconeClient.index(indexName);
    // TODO get namespace dynamically
    const ns = index.namespace(namespace);

    const imageUrl = JSON.parse((await redis.hGet("bbox", boxId)) || "{}")!.src;

    console.log(`imageUrl`, imageUrl)

    const vector = await embedder.embed(imageUrl);

    if (!vector) {
      console.error("No vector found for ", boxId, " ", imageUrl);
      return [];
    }

    const query: QueryOptions = {
      vector: vector.values,
      topK: 100,
      filter: {
        negativeLabel: {
          $ne: boxId,
        },
      },
      includeMetadata: true,
      includeValues: true,
    };

    const queryResult = await ns.query(query);

    const result = queryResult.matches
      ?.filter((match) => match)
      ?.filter((match) => match.score && match.score > confidence)
      .map((match) => ({
        boxId: (match.metadata as Metadata).boxId,
        label: (match.metadata as Metadata).label,
        path: (match.metadata as Metadata).imagePath,
        frameIndex: (match.metadata as Metadata).frameIndex,
        score: match.score,
        category: 'similar',
      })) as BoxResult[];

    const vectors = queryResult.matches?.map(
      (match) => match.values,
    ) as Vector[];

    // detect whether one of the "label" values on queryResult is not undefined
    let possibleLabel: string | undefined;
    if (result) {
      const labels = result.map((x) => x?.label).filter((x) => x);
      if (labels.length > 0) {
        [possibleLabel] = labels;
      }
    }

    let finalResult: BoxResult[] = [];

    if (result) {
      finalResult.push(...result);
    }

    if (!focused) {
      const averageVector = calculateAverageVector(vectors, true);
      let labeledBoxed: BoxResult[] = [];
      if (possibleLabel) {
        const vector = Array.from({ length: 768 }, () => 0) as number[];

        const labelQueryResult = await ns.query({
          vector,
          filter: {
            label: possibleLabel,
            negativeLabel: {
              $ne: boxId,
            },
          },
          topK: 1000,
          includeMetadata: true,
        });
        labeledBoxed = labelQueryResult.matches
          ?.filter((match) => match)
          .map((match) => ({
            boxId: (match.metadata as Metadata).boxId,
            label: (match.metadata as Metadata).label,
            path: (match.metadata as Metadata).imagePath,
            frameIndex: (match.metadata as Metadata).frameIndex,
            score: match.score,
            category: 'sameLabel',
          })) as BoxResult[];
      }

      let additionalBoxes: BoxResult[][] | undefined;

      if (queryResult && queryResult.matches) {
        additionalBoxes = await Promise.all(
          queryResult.matches.map(async (match) => {
            const res = await ns.query({
              vector: averageVector,
              topK: 10,
              includeMetadata: true,
              filter: {
                negativeLabel: {
                  $ne: boxId,
                },
              },
            });
            const resultBatch = res.matches
              ?.filter((match) => match)
              ?.filter((match) => match.score && match.score > confidence)
              .map((match) => ({
                boxId: (match.metadata as Metadata).boxId,
                label: (match.metadata as Metadata).label,
                path: (match.metadata as Metadata).imagePath,
                frameIndex: (match.metadata as Metadata).frameIndex,
                score: match.score,
                category: 'similarToAverage',
              })) as BoxResult[];
            return resultBatch;
          }),
        );
      }

      if (additionalBoxes) {
        const flattenedBoxIds = additionalBoxes
          .flat()
          .filter((x) => x) as BoxResult[];
        finalResult.push(...flattenedBoxIds);
      }

      if (labeledBoxed) {
        finalResult.push(...labeledBoxed);
      }

      if (!result && !additionalBoxes && !labeledBoxed) {
        finalResult = [];
      }

      // if (labeledBoxed && result && labeledBoxed.length / result.length > 0.5) {
      //   return finalResult.map((x) => ({ ...x, label: possibleLabel }));
      // }
    }

    const getUniqueByBoxId = (array: BoxResult[]): BoxResult[] => {
      const map = new Map<string, BoxResult>();
      array.forEach((item) => {
        if (item) {
          map.set(item.boxId, item);
        }
      });
      return Array.from(map.values());
    };

    const uniqueResults = getUniqueByBoxId(finalResult) as BoxResult[];
    console.log("uniqueResults", uniqueResults.length);
    return uniqueResults;
  } catch (e) {
    console.log("error querying box", e);
    throw e;
  }
};

const getImages: () => Promise<ObjectDetectionData> = async () => {
  const rawData = await redis.hGetAll("frame");
  const indexName = PINECONE_INDEX;
  const index = pineconeClient.index<Metadata>(indexName);
  const ns = index.namespace(namespace);
  const data: ObjectDetectionData = {};
  let allBoxIds: string[] = [];

  // This section processes the raw data, extracts box IDs from labeled bounding boxes,
  // and updates the allBoxIds array. It also checks if the frameIndex is a string,
  // and if so, it updates the data object with the parsed value and an S3 URL.
  if (rawData) {
    Object.entries(rawData).forEach(async ([key, value]) => {
      if (value) {
        const parsedValue = JSON.parse(value) as ImageWithBoundingBoxes;
        const boxIds = parsedValue.labeledBoundingBoxes.map((box) => box.boxId);
        allBoxIds = [...allBoxIds, ...boxIds];
        if (parsedValue && typeof parsedValue.frameIndex === "string") {

          data[key] = {
            ...parsedValue,
            src: generateS3Url(parsedValue.src),
          };
        }
      }
    });
  }

  // Initialize a set to store labeled boxes
  const labeledBoxes: Set<{ k: string; v: string }> = new Set();

  // If there are any box IDs, process them
  if (allBoxIds.length > 0) {
    // Remove duplicates from the box IDs
    const uniqueBoxIds = [...new Set(allBoxIds)];
    // Set a limit for fetching data
    const fetchLimit = 1000;
    // Calculate the number of requests needed based on the fetch limit
    const numRequests = Math.ceil(uniqueBoxIds.length / fetchLimit);
    // Initialize an array to store all vectors
    const allVectors = [];

    // Fetch vectors in batches based on the fetch limit
    for (let i = 0; i < numRequests; i++) {
      const start = i * fetchLimit;
      const end = start + fetchLimit;
      const idsToFetch = uniqueBoxIds.slice(start, end);
      const vectors = await ns.fetch(idsToFetch);
      allVectors.push(...Object.values(vectors.records));
    }

    // If no vectors are found, throw an error
    if (!allVectors) {
      console.log("No vectors found");
      throw new Error("No vectors found");
    }

    // For each vector, if it has metadata, add the box ID and label to the labeled boxes set
    allVectors.forEach((record) => {
      if (record) {
        const { metadata } = record;
        if (metadata) {
          const { boxId, label } = metadata;
          if (boxId && label) {
            labeledBoxes.add({ k: boxId, v: label });
          }
        }
      }
    });
  }

  const updateData: ObjectDetectionData = {
    ...data,
  };

  // Create a map from the labeledBoxes set for easy lookup
  const labeledBoxesMap = new Map(Array.from(labeledBoxes).map((item: LabeledBoxSetItem) => [item.k, item.v]));

  // Iterate over each frame in the updateData
  Object.keys(updateData).forEach((frameKey) => {
    const frameData = updateData[frameKey];
    if (frameData) {
      // For each bounding box in the frame, add the label from the labeledBoxesMap if it exists
      const newLabeledBoundingBoxes = frameData.labeledBoundingBoxes.map((boundingBox) => {
        const label = labeledBoxesMap.get(boundingBox.boxId);
        return label ? { ...boundingBox, label } : boundingBox;
      });

      // Update the labeledBoundingBoxes for the current frame with the new labels
      updateData[frameKey] = {
        ...frameData,
        labeledBoundingBoxes: newLabeledBoundingBoxes,
      };
    }
  });


  const sortedKeys = Object.keys(data).sort((a, b) => {
    const aIndices = data[a]?.frameIndex?.split('_').map(Number);
    const bIndices = data[b]?.frameIndex?.split('_').map(Number);

    if (!aIndices || !bIndices) {
      return 0;
    }
    const aIndex1 = aIndices[0] || 0;
    const bIndex1 = bIndices[0] || 0;

    // Compare the first part
    if (aIndex1 !== bIndex1) {
      return aIndex1 - bIndex1;
    }

    const aIndex2 = aIndices[1] || 0;
    const bIndex2 = bIndices[1] || 0;

    // If the first parts are equal, compare the second part
    return aIndex2 - bIndex2;
  });

  // Create a new sorted object
  const sortedData: ObjectDetectionData = {};
  for (const key of sortedKeys) {
    const value = updateData[key];
    if (value) {
      sortedData[key] = value;
    }
  }

  return sortedData;
};

export { queryBox, getImages };
