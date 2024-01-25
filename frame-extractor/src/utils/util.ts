import fs from "fs/promises"
import path from "path"

const sliceIntoChunks = <T>(arr: T[], chunkSize: number) => Array.from({ length: Math.ceil(arr.length / chunkSize) }, (_, i) => arr.slice(i * chunkSize, (i + 1) * chunkSize))

async function listFiles(dir: string): Promise<string[]> {
  const files = await fs.readdir(dir)

  const filePaths: string[] = []
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stats = await fs.stat(filePath)
    if (stats.isFile()) {
      filePaths.push(filePath)
    }
  }
  return filePaths
}

function* chunkArray<T>(array: T[], chunkSize: number): Generator<T[]> {
  for (let i = 0; i < array.length; i += chunkSize) {
    yield array.slice(i, i + chunkSize)
  }
}

async function isDirectory(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath, {})
    return stats.isDirectory()
  } catch (error) {
    return false
  }
}

export {
  listFiles, sliceIntoChunks, chunkArray, isDirectory,
}
