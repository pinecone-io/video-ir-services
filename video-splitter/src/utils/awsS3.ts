import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ClientConfig,
  ObjectCannedACL,
} from "@aws-sdk/client-s3"
// import { NodeHttpHandler } from "@smithy/node-http-handler"
// import { Agent } from "node:https"

import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
// import { Readable } from "node:stream"

import {
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AWS_S3_BUCKET,
  AWS_SECRET_ACCESS_KEY,
} from "./environment"

let awsS3Client: S3Client | null = null // Initializing AWS S3 client

const getAwsS3Client: () => Promise<S3Client> = async () => {
  if (awsS3Client) {
    return awsS3Client // Return existing client if already initialized
  }

  // const agent = new Agent({ // Creating new agent
  //   keepAlive: true,
  //   maxSockets: 50,
  //   maxFreeSockets: 10,
  //   timeout: 60000,
  //   noDelay: false,
  // })

  // const requestHandler = new NodeHttpHandler({ // Creating request handler
  //   httpsAgent: agent,
  //   connectionTimeout: 6000,
  //   socketTimeout: 6000,
  // })

  const config: S3ClientConfig = { // Configuring S3 client
    // requestHandler,
    maxAttempts: 5,
    useDualstackEndpoint: true,
    retryMode: "adaptive",
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  }

  awsS3Client = new S3Client(config) // Initializing S3 client with the config

  return awsS3Client // Returning the S3 client
}

// function sleep(ms: number) {
//   return new Promise((resolve) => { setTimeout(resolve, ms) }) // Function to pause execution for a given time
// }

export const generateS3Url = (path: string) => `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${path}` // Function to generate S3 URL

export const getS3SignedUrl = async (path: string) => {
  const client = await getAwsS3Client() // Get S3 client

  const command = new GetObjectCommand({ // Create command to get object
    Bucket: AWS_S3_BUCKET,
    Key: path,
  })

  return getSignedUrl(client, command, { expiresIn: 15 * 60 }) // Return signed URL, expires in 15 mins
}

// async function getObject(
//   client: S3Client,
//   getObjectCommand: GetObjectCommand,
// ): Promise<Buffer> {
//   // eslint-disable-next-line no-async-promise-executor
//   return new Promise<Buffer>(async (resolve, reject) => { // Promise to get object from S3
//     try {
//       const response = await client.send(getObjectCommand) // Send command to get object
//       await sleep(1000) // Pause for 1 second
//       if (!response.Body) {
//         reject(new Error("No response body")) // Reject if no response body
//       }

//       // Handle an error while streaming the response body
//       const readableBody = response.Body as Readable // Get readable body
//       const responseDataChunks: Buffer[] = [] // Initialize buffer array

//       readableBody.once("error", (err: Error) => reject(err)) // Reject on error
//       readableBody.on("data", (chunk: Buffer) => responseDataChunks.push(chunk)) // Push data chunks to array
//       readableBody.once("end", () => resolve(Buffer.concat(responseDataChunks))) // Resolve with concatenated buffer on end
//     } catch (err) {
//       // Handle the error or throw
//       reject(err) // Reject on error
//     }
//   })
// }

// export const getS3Object = async (path: string) => {
//   const client = await getAwsS3Client() // Get S3 client

//   const command = new GetObjectCommand({ // Create command to get object
//     Bucket: AWS_S3_BUCKET,
//     Key: path,
//   })

//   return getObject(client, command) // Return the object from S3
// }

export const saveToS3Bucket = async (name: string, fileBuffer: Buffer) => {
  const client = await getAwsS3Client() // Get S3 client
  const uploadParams = { // Define upload parameters
    Bucket: AWS_S3_BUCKET,
    Key: name,
    Body: fileBuffer,
    ACL: "public-read" as ObjectCannedACL,
  }

  return client.send(new PutObjectCommand(uploadParams)) // Upload the file to S3
}

export const getKeyFromS3Url = (url: string): string | null => {
  const decodedUrl = decodeURIComponent(url) // Decode the URL
  const regex = new RegExp(
    `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/([^?]+)`,
  )
  const match = decodedUrl.match(regex) // Match the URL with the regex

  return match && match[1]
    ? match[1].replace(
      `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/`,
      "",
    )
    : null // Return the key from the URL or null
}
