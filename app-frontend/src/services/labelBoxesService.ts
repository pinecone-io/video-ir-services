import axios, { AxiosResponse } from "axios"

const LABEL_BOXES_API = `http://${import.meta.env.VITE_QUERY_ENGINE}/labelBoxes`

export const labelBoxes = (label: string, boxIds: string[]): Promise<AxiosResponse<string[]>> =>
    axios.post(`${LABEL_BOXES_API}`, { label, boxIds })
