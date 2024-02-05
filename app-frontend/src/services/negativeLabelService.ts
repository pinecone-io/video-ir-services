import axios, { AxiosResponse } from "axios"

const NEGATIVE_LABEL_BOXES_API = `http://${import.meta.env.VITE_QUERY_ENGINE}/negativeLabel`


export const negativeLabel = (originalBoxId: string, targetBoxIds: string[]): Promise<AxiosResponse<string>> =>
  axios.post(`${NEGATIVE_LABEL_BOXES_API}`, { originalBoxId, targetBoxIds })
