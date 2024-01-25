export const getEnv = (key: string): string => {
  const value = import.meta.env[key]
  if (!value) {
    throw new Error(`${key} environment variable not set`)
  }
  return value
}

export const PINECONE_API_KEY = getEnv("VITE_PINECONE_API_KEY")
export const PINECONE_ENVIRONMENT = getEnv("VITE_PINECONE_ENVIRONMENT")
export const PINECONE_INDEX = getEnv("VITE_PINECONE_INDEX")
export const PINECONE_DATA_DIR_PATH = getEnv("VITE_PINECONE_DATA_DIR_PATH")
export const PINECONE_OUTPUT_DIR_PATH = getEnv("VITE_PINECONE_OUTPUT_DIR_PATH")
export const PINECONE_PROJECT_ID = getEnv("VITE_PINECONE_PROJECT_ID")
export const PINECONE_NAMESPACE = getEnv("VITE_PINECONE_NAMESPACE")

export const AWS_REGION = getEnv("VITE_AWS_REGION")
export const AWS_ACCESS_KEY_ID = getEnv("VITE_AWS_ACCESS_KEY_ID")
export const AWS_SECRET_ACCESS_KEY = getEnv("VITE_AWS_SECRET_ACCESS_KEY")
export const AWS_S3_BUCKET = getEnv("VITE_AWS_S3_BUCKET")
export const IS_PROD = import.meta.env.PROD

// export const KAFKA_BROKER = getEnv("KAFKA_BROKER");
