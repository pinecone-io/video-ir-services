import { mean, norm, divide } from "mathjs"
import { Vector } from "../types"

const calculateAverageVector = (
  vectors: Vector[],
  normalize: boolean = false,
): Vector => {
  if (vectors.length === 0) {
    throw new Error("The vectors array must not be empty.")
  }

  const firstVector = vectors[0]
  if (!firstVector) {
    throw new Error("The vectors array must not be empty.")
  }

  // Check if all vectors have the same dimensionality
  const dimension = firstVector.length
  if (!vectors.every((vec) => vec.length === dimension)) {
    throw new Error("All vectors must have the same dimension.")
  }

  // Calculate the average vector
  const averageVector: Vector = mean(vectors, 0) as unknown as number[]

  if (normalize) {
    // Normalize the average vector
    const averageVectorNorm: number = norm(averageVector) as number
    const normalizedAverageVector: Vector = divide(
      averageVector,
      averageVectorNorm,
    ) as unknown as number[]
    return normalizedAverageVector
  }

  return averageVector
}

export { calculateAverageVector }
