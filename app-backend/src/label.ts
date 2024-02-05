import { Pinecone } from "@pinecone-database/pinecone"
import { PINECONE_INDEX, getEnv, PINECONE_NAMESPACE } from "./utils/environment"

const namespace = PINECONE_NAMESPACE
const indexName = PINECONE_INDEX
const pineconeClient = await new Pinecone({
  environment: getEnv("VITE_PINECONE_ENVIRONMENT"),
  apiKey: getEnv("VITE_PINECONE_API_KEY"),
  projectId: getEnv("VITE_PINECONE_PROJECT_ID"),
})

const index = pineconeClient.index<Metadata>(indexName)
const ns = index.namespace(namespace)

const labelBoxes = async (label: string, boxIds: string[]) => {
  for (const boxId of boxIds) {
    console.log("BOXID", boxId, label)
    await ns.update({
      id: boxId,
      metadata: {
        label,
      },
    })
  }
}

const negativeLabel = async (originalBoxId: string, targetBoxIds: string[]) => {
  try {
    console.log("original", originalBoxId, "target", targetBoxIds)
    const entries = await ns.fetch(targetBoxIds)
    if (entries.records) {
      for (const record of Object.values(entries.records)) {
        const { metadata } = record
        await ns.update({
          id: record.id,
          metadata: {
            negativeLabel: [originalBoxId, ...(metadata?.negativeLabel || [])],
          },
        })
        // Find similar records to the targetBoxId
        const result = await ns.query({
          vector: record.values,
          topK: 50,
          filter: {
            negativeLabel: {
              $ne: record.id,
            },
          },
          includeMetadata: true,
          includeValues: true,
        })

        // Go over result.matches and filter anything with score < 0.99
        const matches = result.matches?.filter(
          (match) => match.score && match.score > 0.99,
        )

        // For each match, add the negativeLabel to the metadata
        if (matches && matches.length > 0) {
          await Promise.all(
            matches.map(async (match) => {
              // eslint-disable-next-line no-shadow
              const { metadata } = match
              await ns.update({
                id: match.id,
                metadata: {
                  negativeLabel: [
                    record.id,
                    ...(metadata?.negativeLabel || []),
                  ],
                },
              })
            }),
          )
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
}

export { labelBoxes, negativeLabel }
