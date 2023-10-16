import { Pinecone } from "@pinecone-database/pinecone";
import redis from "./redis";
import { PINECONE_INDEX, PINECONE_NAMESPACE, getEnv } from "./utils/environment";

const namespace = PINECONE_NAMESPACE;
const pineconeClient = await new Pinecone({
  environment: getEnv("VITE_PINECONE_ENVIRONMENT"),
  apiKey: getEnv("VITE_PINECONE_API_KEY"),
  projectId: getEnv("VITE_PINECONE_PROJECT_ID"),
});

const indexName = PINECONE_INDEX;
const index = pineconeClient.index(indexName);
const ns = index.namespace(namespace);

const resetDB: () => Promise<void> = async () => {
  try {
    await redis.del("frame");
    await redis.del("bbox");
    console.log("reset Redis");
  } catch (e) {
    console.log("error deleting redis", e);
  }
  try {
    await ns.deleteAll();
    console.log("reset Pinecone");
  } catch (e) {
    console.log("error deleting pinecone", e);
  }
};

export { resetDB };
