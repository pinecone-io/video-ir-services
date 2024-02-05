import axios, { AxiosResponse } from "axios"

const GET_IMAGES_API_PATH = `http://${import.meta.env.VITE_QUERY_ENGINE}/getSortedKeys`
export const getSortedKeys = async (): Promise<AxiosResponse<{ sortedKeys: string[] }>> =>
    axios.get(GET_IMAGES_API_PATH)
