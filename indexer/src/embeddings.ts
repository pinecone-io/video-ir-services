import {
  AutoTokenizer,
  AutoProcessor,
  AutoModel,
  RawImage,
  Processor,
  PreTrainedModel,
  PreTrainedTokenizer,
} from "@xenova/transformers";
import { PineconeRecord } from "@pinecone-database/pinecone";
import { createHash } from "crypto";

import { sliceIntoChunks } from "./utils/util";
import type { Metadata, FileWithReference } from "./types";
import { getKeyFromS3Url, getS3Object, getS3SignedUrl } from "./utils/awsS3";
import { log } from "./utils/logger";

function bufferToBlob(buffer: Buffer, mimeType: string): Blob {
  const arrayBuffer = new Uint8Array(buffer).buffer;
  return new Blob([arrayBuffer], { type: mimeType });
}

class Embedder {
  private processor!: Processor;

  private model!: PreTrainedModel;

  private tokenizer!: PreTrainedTokenizer;

  async init(modelName: string) {
    console.log(modelName);
    // Load the model, tokenizer and processor
    this.model = await AutoModel.from_pretrained(modelName);
    this.tokenizer = await AutoTokenizer.from_pretrained(modelName);
    this.processor = await AutoProcessor.from_pretrained(modelName);
  }

  // Embeds an image and returns the embedding
  async embed(
    imagePath: string,
    metadata?: Metadata,
  ): Promise<PineconeRecord<Metadata>> {
    try {
      // Read imagePath into buffer
      // const obj = await fetchData(imagePath, "embedding.ts");

      const url = await getS3SignedUrl(imagePath);
      const cleanUrl = getKeyFromS3Url(url);
      const obj = await getS3Object(cleanUrl!);

      // convert Buffer to blob
      const blob = bufferToBlob(obj, "image/png");

      const image = await RawImage.fromBlob(blob);
      // Prepare the image and text inputs
      const image_inputs = await this.processor(image);
      const text_inputs = this.tokenizer([""], {
        padding: true,
        truncation: true,
      });
      // Embed the image
      const output = await this.model({ ...text_inputs, ...image_inputs });
      const { image_embeds } = output;
      const { data: embeddings } = image_embeds;
      // Create an id for the image
      const id =
        metadata?.boxId ?? imagePath;

      console.log(`Embedding image ${id}`)
      // Return the embedding in a format ready for Pinecone
      return {
        id,
        metadata,
        values: Array.from(embeddings) as number[],
      };
    } catch (e) {
      console.log(`Error embedding image, ${e}`);
      // Hack to return a dummy embedding
      log(`Embedder failed to embed image ${imagePath}`)
      return {
        id: "dummy",
        metadata,
        values: Array.from({ length: 768 }, () => 0) as number[],
      };
    }
  }

  async embedBatch(
    imagePaths: FileWithReference[],
    batchSize: number,
    onDoneBatch: (embeddings: PineconeRecord<Metadata>[]) => Promise<void>,
  ) {
    const batches = sliceIntoChunks<FileWithReference>(imagePaths, batchSize);
    for (const batch of batches) {
      const embeddings: PineconeRecord<Metadata>[] = [];
      for (const fileWithReference of batch) {
        const metadata = {
          frameIndex: fileWithReference.frameIndex,
          boxId: fileWithReference.boxId,
          imagePath: fileWithReference.path,
        };
        const embedding = await this.embed(fileWithReference.path, metadata);
        embeddings.push(embedding);
      }
      try {
        await onDoneBatch(
          embeddings
            .filter((x) => x.id !== "dummy")
            .filter((x) => x.values.length > 0),
        );
      } catch (e) {
        console.error("Error running onDoneBatch", embeddings);
        log(`Error embedding batch: ${e} ${JSON.stringify(imagePaths)}`);
      }
    }
  }
}

const embedder = new Embedder();
export { embedder };
