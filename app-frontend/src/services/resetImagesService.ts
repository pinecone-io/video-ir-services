import axios, { AxiosResponse } from "axios"

const RESET_IMAGES_SERVER = `http://${import.meta.env.VITE_QUERY_ENGINE}/resetImages`
export const resetImages = (): Promise<AxiosResponse<string>> =>
    axios.post(`${RESET_IMAGES_SERVER}`)
