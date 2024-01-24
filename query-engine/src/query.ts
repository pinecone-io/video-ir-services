import { Index, QueryOptions, RecordMetadata, ScoredPineconeRecord } from "@pinecone-database/pinecone";
import redis from "./redis";
import {
  BoxResult,
  Match,
  Metadata,
  Vector,
} from "./types";
import { PINECONE_INDEX, PINECONE_NAMESPACE } from "./utils/environment";
import { embedder, isEmbedderError } from "./embeddings";
import { calculateAverageVector } from "./utils/calculateAverageVector";
import { pineconeClient } from "./utils/pinecone";

const modelName = "Xenova/clip-vit-large-patch14";
const namespace = PINECONE_NAMESPACE;

await embedder.init(modelName);

// TODO: Pass confidence factor from UI
const confidence = 0.90;

const queryBox: (boxId: string, focused?: boolean) => Promise<BoxResult[] | Error> = async (
  boxId: string,
  focused: boolean = true
) => {

  try {
    const indexName = PINECONE_INDEX;
    const index = pineconeClient.index(indexName);
    // TODO get namespace dynamically
    const ns: Index<RecordMetadata> = index.namespace(namespace);

    const imageUrl = JSON.parse((await redis.hGet("bbox", boxId)) || "{}")!.src;

    if (!imageUrl) {
      return new Error("Image URL is null");
    }

    const embeddingResult = await embedder.embed(imageUrl);

    if (typeof embeddingResult == "undefined" || isEmbedderError(embeddingResult)) {
      return new Error("Embedding result is null");
    }

    console.log("EMBEDDING RESULT", embeddingResult.values.length)

    const query: QueryOptions = {
      vector: embeddingResult.values,
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

    const result: BoxResult[] = queryResult.matches
      ?.filter((match: ScoredPineconeRecord) => match)
      ?.filter((match: ScoredPineconeRecord) => match.score && match.score > confidence)
      .map((match: ScoredPineconeRecord) => {
        return {
          boxId: (match.metadata as Metadata).boxId,
          label: (match.metadata as Metadata).label,
          path: (match.metadata as Metadata).imagePath,
          frameIndex: (match.metadata as Metadata).frameIndex,
          score: match.score,
          category: 'similar',
        }
      }) as BoxResult[];


    const vectors: Vector[] = queryResult.matches?.map(
      (match: ScoredPineconeRecord) => match.values,
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
          topK: 500,
          includeMetadata: true,
        });
        labeledBoxed = labelQueryResult.matches
          ?.filter((match: ScoredPineconeRecord) => match)
          .map((match: ScoredPineconeRecord) => ({
            boxId: (match.metadata as Metadata).boxId,
            label: (match.metadata as Metadata).label,
            path: (match.metadata as Metadata).imagePath,
            frameIndex: (match.metadata as Metadata).frameIndex,
            score: match.score,
            category: 'sameLabel',
          })) as BoxResult[];
      }

      let additionalBoxes: BoxResult[] | undefined;

      const additionalQuery = await ns.query({
        vector: averageVector,
        topK: 100,
        includeMetadata: true,
        filter: {
          negativeLabel: {
            $ne: boxId,
          },
        },
      });

      additionalBoxes = additionalQuery.matches
        ?.filter((match: ScoredPineconeRecord) => match && match.metadata?.boxId)
        ?.filter((match: ScoredPineconeRecord) => match.score && match.score > confidence)
        .map((match: ScoredPineconeRecord) => ({
          boxId: (match.metadata as Metadata).boxId,
          label: (match.metadata as Metadata).label,
          path: (match.metadata as Metadata).imagePath,
          frameIndex: (match.metadata as Metadata).frameIndex,
          score: match.score,
          category: 'similarToAverage',
        })) as BoxResult[];


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
    }

    const getUniqueByBoxId = (array: BoxResult[]): BoxResult[] => {
      const priority = { "sameLabel": 3, "similar": 2, "similarToAverage": 1 };
      const uniqueArray = Array.from(
        array.reduce((map, item) => {
          if (item) {
            const existingItem = map.get(item.boxId);
            if (item.category && (!existingItem || priority[item.category as keyof typeof priority] > priority[existingItem.category as keyof typeof priority])) {
              map.set(item.boxId, item);
            }
          }
          return map;
        }, new Map<string, BoxResult>())
          .values());
      uniqueArray.sort((a, b) => b.score - a.score);
      return uniqueArray;
    };

    return getUniqueByBoxId(finalResult);
  } catch (e) {
    console.log("error querying box", e);
    throw e;
  }
};

export { queryBox };
