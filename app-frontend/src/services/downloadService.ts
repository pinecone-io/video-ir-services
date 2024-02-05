import axios, { AxiosResponse } from "axios"

const DOWNLOAD_API = `http://${import.meta.env.VITE_APP_BACKEND_API}/download`

export const download = (
  target: string,
  name: string,
  fps: number,
  chunkDuration: number,
  videoLimit: number
): Promise<AxiosResponse<string>> =>
  axios.post(`${DOWNLOAD_API}`, {
    target,
    fps,
    name,
    chunkDuration,
    videoLimit,
  })
