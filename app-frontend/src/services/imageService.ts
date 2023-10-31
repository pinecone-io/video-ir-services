import axios, { AxiosResponse } from "axios";
import { GetImagesDTO } from "../types/Box";

const GET_IMAGES_API_PATH = "/api/getImages";

export const getImages = async (): Promise<AxiosResponse<GetImagesDTO>> =>
  axios.get(GET_IMAGES_API_PATH);
