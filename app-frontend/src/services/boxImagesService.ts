import axios, { AxiosResponse } from "axios";

const GET_BOX_IMAGES_API_PATH = "http://167.172.8.153/query/queryBoxImages?boxId=";

export const queryBoxImages = (boxId: string): Promise<AxiosResponse<Array<{ id: string, path: string }>>> =>
    axios.get(`${GET_BOX_IMAGES_API_PATH}${boxId}`)
