import axios, { AxiosResponse } from "axios";

const POST_LABEL_BOXES_API = "/api/labelBoxes";

export const labelBoxes = (label: string, boxIds: string[]): Promise<AxiosResponse<string[]>> =>
    axios.post(`${POST_LABEL_BOXES_API}`, { label, boxIds })
