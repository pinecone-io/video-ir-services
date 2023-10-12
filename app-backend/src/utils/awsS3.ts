import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ClientConfig,
} from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { Agent } from "node:https";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "node:stream";

import {
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AWS_S3_BUCKET,
  AWS_SECRET_ACCESS_KEY,
} from "./environment";

let awsS3Client: S3Client | null = null;

export const getAwsS3Client: () => Promise<S3Client> = async () => {
  if (awsS3Client) {
    return awsS3Client;
  }

  const agent = new Agent({
    keepAlive: true,
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 60000,
  });

  const requestHandler = new NodeHttpHandler({
    httpsAgent: agent,
    connectionTimeout: 6000,
    socketTimeout: 6000,
  });

  const config: S3ClientConfig = {
    requestHandler,
    maxAttempts: 5,
    useDualstackEndpoint: true,
    retryMode: "adaptive",
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  };

  awsS3Client = new S3Client(config);

  return awsS3Client;
};

export const generateS3Url = (path: string) =>
  `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${path}`;

export const getS3SignedUrl = async (path: string) => {
  const client = await getAwsS3Client();

  const command = new GetObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: path,
  });

  return getSignedUrl(client, command, { expiresIn: 15 * 60 }); // expires in 15 mins
};

async function getObject(
  client: S3Client,
  getObjectCommand: GetObjectCommand,
): Promise<Buffer> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<Buffer>(async (resolve, reject) => {
    try {
      const response = await client.send(getObjectCommand);

      if (!response.Body) {
        reject(new Error("No response body"));
      }

      // Handle an error while streaming the response body
      const readableBody = response.Body as Readable;
      const responseDataChunks: Buffer[] = [];

      readableBody.once("error", (err: Error) => reject(err));
      readableBody.on("data", (chunk: Buffer) =>
        responseDataChunks.push(chunk),
      );
      readableBody.once("end", () =>
        resolve(Buffer.concat(responseDataChunks)),
      );
    } catch (err) {
      // Handle the error or throw
      reject(err);
    }
  });
}

export const getS3Object = async (path: string) => {
  const client = await getAwsS3Client();

  const command = new GetObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: path,
  });

  return getObject(client, command);
};

export const getKeyFromS3Url = (url: string): string | null => {
  const decodedUrl = decodeURIComponent(url);
  const regex = new RegExp(
    `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/([^?]+)`,
  );
  const match = decodedUrl.match(regex);

  return match && match[1]
    ? match[1].replace(
      `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/`,
      "",
    )
    : null;
};

export const saveToS3Bucket = async (name: string, fileBuffer: Buffer) => {
  const client = await getAwsS3Client();
  const uploadParams = {
    Bucket: AWS_S3_BUCKET,
    Key: name,
    Body: fileBuffer,
    ACL: "public-read",
  };

  return client.send(new PutObjectCommand(uploadParams));
};
