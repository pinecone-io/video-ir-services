import axios, { AxiosResponse } from "axios";

const RESET_IMAGES_SERVER = "http://167.172.8.153/query/resetImages";

export const resetImages = (): Promise<AxiosResponse<string>> =>
    axios.post(`${RESET_IMAGES_SERVER}`)
