import { Pinecone } from "@pinecone-database/pinecone";
import {
  PINECONE_API_KEY,
  PINECONE_ENVIRONMENT,
  PINECONE_INDEX,
  PINECONE_PROJECT_ID,
} from "./environment";

const pineconeClient = new Pinecone({
  environment: PINECONE_ENVIRONMENT,
  apiKey: PINECONE_API_KEY,
  projectId: PINECONE_PROJECT_ID,
});

export const initIndex = async () => {
  const indexes = (await pineconeClient.listIndexes()).map(
    (index: { name: string }) => index.name,
  );

  if (!indexes.includes(PINECONE_INDEX)) {
    console.log("Creating index:", PINECONE_INDEX);
    await pineconeClient.createIndex({
      name: PINECONE_INDEX,
      dimension: 768,
      waitUntilReady: true,
    });
    console.log("Index is ready:", PINECONE_INDEX);
  }
};

export {
  pineconeClient
}