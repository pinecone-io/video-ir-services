import axios, { AxiosResponse } from "axios";

const NEGATIVE_LABEL_BOXES_API = "/api/negativeLabel";

export const negativeLabel = (originalBoxId: string, targetBoxId: string): Promise<AxiosResponse<string>> =>
  axios.post(`${NEGATIVE_LABEL_BOXES_API}`, { originalBoxId, targetBoxId })
