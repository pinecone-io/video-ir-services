import axios, { AxiosResponse } from "axios"
import { GetImagesDTO } from "../types/Box"


const GET_IMAGES_API_PATH = "http://167.172.8.153/query/getImagesWithOffset"

export const getImages = async ({ offset, limit }: { offset: number, limit: number }): Promise<AxiosResponse<{ message: string, numberOfEntries: number, data: GetImagesDTO }>> => {
  try {
    return await axios.post(GET_IMAGES_API_PATH, { offset, limit })
  } catch (error) {
    console.error(error)
    throw error
  }
}
