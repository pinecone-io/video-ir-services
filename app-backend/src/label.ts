import { Pinecone } from "@pinecone-database/pinecone";
import { PINECONE_INDEX, getEnv, PINECONE_NAMESPACE } from "./utils/environment";
import { Metadata } from "./types";

const namespace = PINECONE_NAMESPACE;
const indexName = PINECONE_INDEX;
const pineconeClient = await new Pinecone({
    environment: getEnv("VITE_PINECONE_ENVIRONMENT"),
    apiKey: getEnv("VITE_PINECONE_API_KEY"),
    projectId: getEnv("VITE_PINECONE_PROJECT_ID"),
});

const index = pineconeClient.index<Metadata>(indexName);
const ns = index.namespace(namespace);

const labelBoxes = async (label: string, boxIds: string[]) => {
    await Promise.all(
        boxIds.map(async (boxId) => {
            await ns.update({
                id: boxId,
                metadata: {
                    label,
                },
            });
        }),
    );
};

const negativeLabel = async (originalBoxId: string, targetBoxId: string) => {
    try {
        console.log("original", originalBoxId, "target", targetBoxId);
        const entries = await ns.fetch([targetBoxId]);
        if (entries.records) {
            const record = entries.records[0];

            if (record) {
                const { metadata } = record;
                await ns.update({
                    id: targetBoxId,
                    metadata: {
                        negativeLabel: [originalBoxId, ...(metadata?.negativeLabel || [])],
                    },
                });
                // Find similar records to the targetBoxId
                const result = await ns.query({
                    vector: record.values,
                    topK: 50,
                    filter: {
                        negativeLabel: {
                            $ne: targetBoxId,
                        },
                    },
                    includeMetadata: true,
                    includeValues: true,
                });

                // Go over result.matches and filter anything with score < 0.99
                const matches = result.matches?.filter(
                    (match) => match.score && match.score > 0.99,
                );

                // For each match, add the negativeLabel to the metadata

                if (matches && matches.length > 0) {
                    console.log("Found matches");
                    await Promise.all(
                        matches.map(async (match) => {
                            const { metadata } = match;
                            await ns.update({
                                id: match.id,
                                metadata: {
                                    negativeLabel: [
                                        targetBoxId,
                                        ...(metadata?.negativeLabel || []),
                                    ],
                                },
                            });
                        }),
                    );
                }
            }
        }
    } catch (e) {
        console.log(e);
    }
};

export { labelBoxes, negativeLabel };
