import axios, { AxiosResponse } from "axios";

const NEGATIVE_LABEL_BOXES_API = "http://167.172.8.153/api/resetImages";

export const resetImages = (): Promise<AxiosResponse<string>> =>
    axios.post(`${NEGATIVE_LABEL_BOXES_API}`)
