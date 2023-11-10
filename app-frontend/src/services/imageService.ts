import axios, { AxiosResponse } from "axios";
import { GetImagesDTO } from "../types/Box";

const GET_IMAGES_API_PATH = "http://167.172.8.153/api/getImages";

export const getImages = async ({ limit }: { limit: number }): Promise<AxiosResponse<GetImagesDTO>> =>
  axios.post(GET_IMAGES_API_PATH, { limit });
