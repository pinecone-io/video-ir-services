import axios, { AxiosRequestConfig, AxiosResponse } from "axios"

const TRACK_PROGRESS_API = "/api/trackProgress"

export const trackProgress = (onDownloadProgress: AxiosRequestConfig["onDownloadProgress"] ): Promise<AxiosResponse<string[]>> => 
  axios.request({ method: "post", url: TRACK_PROGRESS_API, responseType: "stream", onDownloadProgress })
