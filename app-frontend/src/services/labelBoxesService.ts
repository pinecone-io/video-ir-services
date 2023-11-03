import axios, { AxiosResponse } from "axios";

const POST_LABEL_BOXES_API = "http://167.172.8.153/api/labelBoxes";

export const labelBoxes = (label: string, boxIds: string[]): Promise<AxiosResponse<string[]>> =>
    axios.post(`${POST_LABEL_BOXES_API}`, { label, boxIds })
