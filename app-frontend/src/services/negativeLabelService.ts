import axios, { AxiosResponse } from "axios";

const NEGATIVE_LABEL_BOXES_API = "http://167.172.8.153/query/negativeLabel";

export const negativeLabel = (originalBoxId: string, targetBoxIds: string[]): Promise<AxiosResponse<string>> =>
  axios.post(`${NEGATIVE_LABEL_BOXES_API}`, { originalBoxId, targetBoxIds })
