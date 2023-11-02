import axios, { AxiosResponse } from "axios";

const DOWNLOAD_API = "http://167.172.8.153/api/download";

export const download = (target: string, name: string, fps: number): Promise<AxiosResponse<string>> =>
  axios.post(`${DOWNLOAD_API}`, { target, fps, name })
