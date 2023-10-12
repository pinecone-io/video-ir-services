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

const namespace = PINECONE_NAMESPACE;
const pineconeClient = await new Pinecone({
  environment: getEnv("VITE_PINECONE_ENVIRONMENT"),
  apiKey: getEnv("VITE_PINECONE_API_KEY"),
  projectId: getEnv("VITE_PINECONE_PROJECT_ID"),
});

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

const queryBox: (boxId: string) => Promise<BoxResult[] | Error> = async (
  boxId: string,
) => {
  try {
    const indexName = PINECONE_INDEX;
    const index = pineconeClient.index(indexName);
    // TODO get namespace dynamicly
    const ns = index.namespace(namespace);

    const imageUrl = JSON.parse((await redis.hGet("bbox", boxId)) || "{}")!.src;

    const vector = await embedder.embed(imageUrl);

    if (!vector) {
      console.error("No vector found for ", boxId, " ", imageUrl);
      return [];
    }

    const query: QueryOptions = {
      vector: vector.values,
      topK: 50,
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
      })) as BoxResult[];

    const vectors = queryResult.matches?.map(
      (match) => match.values,
    ) as Vector[];

    const averageVector = calculateAverageVector(vectors, true);

    // detect whether one of the "label" values on queryResult is not undefined
    let possibleLabel: string | undefined;
    if (result) {
      const labels = result.map((x) => x?.label).filter((x) => x);
      if (labels.length > 0) {
        [possibleLabel] = labels;
      }
    }

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
            })) as BoxResult[];
          return resultBatch;
        }),
      );
    }

    let finalResult: BoxResult[] = [];

    if (result) {
      finalResult.push(...result);
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

    if (labeledBoxed && result && labeledBoxed.length / result.length > 0.5) {
      return finalResult.map((x) => ({ ...x, label: possibleLabel }));
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
    console.log(uniqueResults);
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

  // console.log(allBoxIds);
  const labeledBoxes: Set<{ k: string; v: string }> = new Set();

  if (allBoxIds.length > 0) {
    const uniqueBoxIds = [...new Set(allBoxIds)];
    console.log(uniqueBoxIds.length);
    const random768dimensionalVector = Array.from({ length: 768 }, () =>
      Math.random(),
    );

    console.log(uniqueBoxIds[0]);
    const embeddedBoxes = await ns.query({
      topK: 999,
      vector: random768dimensionalVector,
      includeMetadata: true,
      filter: {
        boxId: {
          $in: uniqueBoxIds,
        },
      },
    });

    // console.log(embeddedBoxes?.matches);
    if (embeddedBoxes?.matches && embeddedBoxes?.matches.length > 0) {
      if (embeddedBoxes.matches) {
        embeddedBoxes.matches.forEach((match) => {
          const meta = match.metadata;
          if (meta) {
            const { label, boxId } = meta;

            if (label && boxId) {
              labeledBoxes.add({ k: boxId, v: label });
            }
          }
        });
      }
    }
  }

  const updateData: ObjectDetectionData = {
    ...data,
  };

  // Loop through each frame in updatedExampleData
  for (const frameKey in updateData) {
    if (Object.prototype.hasOwnProperty.call(updateData, frameKey)) {
      const frameData = updateData[frameKey]!;
      const newLabeledBoundingBoxes = frameData.labeledBoundingBoxes.map(
        (boundingBox) => {
          const updatedBox = { ...boundingBox };
          // Find matching boxId in labeledBoxes
          for (const labeledBox of labeledBoxes) {
            if (updatedBox.boxId === labeledBox.k) {
              updatedBox.label = labeledBox.v;
              break;
            }
          }
          return updatedBox;
        },
      );

      // Update the labeledBoundingBoxes for the current frame
      updateData[frameKey] = {
        ...frameData,
        labeledBoundingBoxes: newLabeledBoundingBoxes,
      };
    }
  }

  // Sort the keys based on frameIndex
  const sortedKeys = Object.keys(data).sort((a, b) => {
    const aIndex = data[a]?.frameIndex ? parseInt(data[a]!.frameIndex, 10) : -1;
    const bIndex = data[b]?.frameIndex ? parseInt(data[b]!.frameIndex, 10) : -1;
    return aIndex - bIndex;
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
