import axios, { AxiosResponse } from "axios";


const GET_IMAGES_API_PATH = "http://167.172.8.153/api/getImagesWithOffset";

export const getImages = async ({ offset, limit }: { offset: number, limit: number }): Promise<AxiosResponse<{ message: string, numberOfEntries: number }>> =>
  axios.post(GET_IMAGES_API_PATH, { offset, limit });
