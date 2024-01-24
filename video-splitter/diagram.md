graph LR
    A[Client] --> B[Express Server]
    B --> C[downloadAndSplit Function]
    C -->|Download Video| D[ytdl-core]
    C -->|Split Video| E[fluent-ffmpeg]
    C -->|Upload Video Chunks| F[awsS3.ts]
    F -->|Interact| G[AWS S3 Bucket]
    C -->|Send Messages| H[KafkaProducer]
    H -->|Interact| I[Kafka Topic]


    The frame-extractor is a Node.js application that processes video frames and uploads them to an AWS S3 bucket. It uses the fluent-ffmpeg library to extract frames from a video and the @aws-sdk/client-s3 library to interact with AWS S3.

Here's a high-level overview of its main functionalities:

1. Extract Frames: The extractFrames function in download.ts uses fluent-ffmpeg to extract frames from a video file. The frames are saved locally as PNG files.

2. Upload to S3: Each frame is then uploaded to an AWS S3 bucket. The saveToS3Bucket function in awsS3.ts is used for this purpose.

3. Kafka Messaging: After each frame is uploaded to S3, a message is sent to a Kafka topic with details about the frame. This is done in the sendMessage function of the KafkaProducer class in kafka-producer.ts.'


The indexer application is responsible for processing images, detecting objects within them, and indexing these objects into a Pinecone database. Here's a detailed breakdown of its main functionalities:

1. Object Detection: The detectObjects function uses the @xenova/transformers library to detect objects within an image. It returns a list of bounding boxes for the detected objects.

2. Bounding Box Conversion: The convertBoundingBox function converts the bounding box coordinates from the format returned by the object detector to a more usable format.

3. Image Fetching and Object Detection: The fetchImageAndBoundingBoxes function fetches an image from an S3 bucket and detects objects within it.

4. Image Segmentation: The segmentImage function segments an image based on the detected objects and uploads these segments to an S3 bucket.

5. Embedding Generation and Indexing: The embedAndUpsert function generates embeddings for the image segments using the @xenova/transformers library and indexes these embeddings into a Pinecone database.

6. Image Indexing: The indexImages function is the main function that orchestrates the entire process. It fetches a list of images from an S3 bucket, processes each image, and indexes the processed images into a Pinecone database.


1. Querying: The queryBox function in query.ts is responsible for querying the Pinecone database. It takes a bounding box as input and returns a list of matches from the Pinecone database.

2. Embedding Generation: The embedder in embeddings.ts is used to generate embeddings for the images.

3. Express Server: The application also includes an Express server defined in index.ts, which exposes API endpoints for the querying functionality. The routes for these endpoints are defined in routes.ts.

4. Redis Integration: The application uses Redis for caching, as indicated by the redis.ts file and the ioredis dependency in package.json.

5. Dockerization: The application is dockerized, as indicated by the Dockerfile and .dockerignore files. This allows it to be easily deployed in a containerized environment.


The query-engine application is primarily responsible for handling requests from the client and interacting with the Pinecone database to fetch and return relevant data. The main entry point for client requests is through the Express server, which is set up with various routes to handle different types of requests.

Here's a detailed breakdown of the routes and their corresponding functionalities:

1. /getImagesWithOffset: This POST route is used to fetch a set of images with an offset and limit. The loadImagesWithOffset function is called with the provided offset and limit to fetch the images.

2. /getNumberOfEntries: This GET route is used to fetch the total number of entries. The getNumberOfEntries function is called to fetch the number of entries.

3. /getSortedKeys: This GET route is used to fetch the sorted keys. The getSortedKeys function is called to fetch the sorted keys.

4. /queryBox: This POST route is used to query a box. The queryBox function is called with the provided box ID and focus flag to fetch the query results.

5. /labelBoxes: This POST route is used to label boxes. The labelBoxes function is called with the provided label and box IDs to label the boxes.

6. /negativeLabel: This POST route is used to negatively label boxes. The negativeLabel function is called with the provided original box ID and target box IDs to negatively label the boxes.

7. /health: This GET route is used to check the health of the server. It simply returns a status of "ok".

Here's a flowchart using Mermaid.js that represents the flow of data in the query-engine application: