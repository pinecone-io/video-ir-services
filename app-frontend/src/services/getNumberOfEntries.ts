import axios, { AxiosResponse } from "axios"


const GET_IMAGES_API_PATH = `http://${import.meta.env.VITE_QUERY_ENGINE}/getNumberOfEntries`

export const getNumberOfEntries = async (): Promise<AxiosResponse<{ numberOfEntries: number }>> =>
    axios.get(GET_IMAGES_API_PATH)
