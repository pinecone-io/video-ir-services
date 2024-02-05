import axios, { AxiosResponse } from "axios"

const GET_BOX_IMAGES_API_PATH = `http://${import.meta.env.VITE_QUERY_ENGINE}/queryBoxImages?boxId=`

export const queryBoxImages = (boxId: string): Promise<AxiosResponse<Array<{ id: string, path: string }>>> =>
    axios.get(`${GET_BOX_IMAGES_API_PATH}${boxId}`)
