import {
  AutoTokenizer,
  AutoProcessor,
  AutoModel,
  RawImage,
  Processor,
  PreTrainedModel,
  PreTrainedTokenizer,
} from "@xenova/transformers"
import { PineconeRecord } from "@pinecone-database/pinecone"
import { createHash } from "crypto"

import { sliceIntoChunks } from "./utils/util"
import { getKeyFromS3Url, getS3Object, getS3SignedUrl } from "./utils/awsS3"

function bufferToBlob(buffer: Buffer, mimeType: string): Blob {
  const arrayBuffer = new Uint8Array(buffer).buffer
  return new Blob([arrayBuffer], { type: mimeType })
}

function isEmbedderError(result: PineconeRecord<Metadata> | EmbeddingError): result is EmbeddingError {
  return (result as EmbeddingError).imagePath !== undefined
}
class Embedder {
  private processor!: Processor

  private model!: PreTrainedModel

  private tokenizer!: PreTrainedTokenizer

  async init(modelName: string) {
    console.log(modelName)
    // Load the model, tokenizer and processor
    this.model = await AutoModel.from_pretrained(modelName)
    this.tokenizer = await AutoTokenizer.from_pretrained(modelName)
    this.processor = await AutoProcessor.from_pretrained(modelName)
  }

  // Embeds an image and returns the embedding
  async embed(
    imagePath: string,
    metadata?: Metadata,
  ): Promise<PineconeRecord<Metadata> | EmbeddingError> {
    try {
      const url = await getS3SignedUrl(imagePath)
      const cleanUrl = getKeyFromS3Url(url)
      const obj = await getS3Object(cleanUrl!)

      // convert Buffer to blob
      const blob = bufferToBlob(obj, "image/png")

      const image = await RawImage.fromBlob(blob)
      // Prepare the image and text inputs
      const image_inputs = await this.processor(image)
      const text_inputs = this.tokenizer([""], {
        padding: true,
        truncation: true,
      })
      // Embed the image
      const output = await this.model({ ...text_inputs, ...image_inputs })
      const { image_embeds } = output
      const { data: embeddings } = image_embeds
      // Create an id for the image
      const id = metadata?.boxId ?? createHash("md5").update(imagePath).digest("hex")

      // Return the embedding in a format ready for Pinecone
      return {
        id,
        metadata,
        values: Array.from(embeddings) as number[],
      }
    } catch (e) {
      console.log(`Error embedding image, ${e}`)
      // Return the error
      return { imagePath, metadata }
    }
  }

  // This function is used to embed a batch of images
  async embedBatch(
    // An array of image paths along with their references
    imagePaths: FileWithReference[],
    // The size of the batch to be processed
    batchSize: number,
    // A callback function to be executed once a batch is done processing
    onDoneBatch: (embeddings: PineconeRecord<Metadata>[]) => Promise<void>,
  ) {
    // Split the image paths into chunks of size batchSize
    const batches = sliceIntoChunks<FileWithReference>(imagePaths, batchSize)
    // Loop over each batch
    for (const batch of batches) {
      // Array to store the embeddings of the current batch
      const embeddings: PineconeRecord<Metadata>[] = []
      // Loop over each image in the batch
      for (const fileWithReference of batch) {
        // Create metadata for the current image
        const metadata = {
          frameIndex: fileWithReference.frameIndex,
          boxId: fileWithReference.boxId,
          imagePath: fileWithReference.path,
        }
        // Embed the current image
        const result = await this.embed(fileWithReference.path, metadata)
        // If there is no error and the embedding is successful, add it to the embeddings array
        if (!isEmbedderError(result) && result.values.length > 0) {
          embeddings.push(result)
        } else {
          // Log the error if there is one
          console.log(`Error embedding image, ${result}`)
        }
      }
      // Once a batch is done processing, execute the callback function
      try {
        await onDoneBatch(embeddings)
      } catch (e) {
        // Log any errors that occur while executing the callback function
        console.error("Error running onDoneBatch", e)
      }
    }
  }
}

const embedder = new Embedder()
export { embedder, isEmbedderError }
