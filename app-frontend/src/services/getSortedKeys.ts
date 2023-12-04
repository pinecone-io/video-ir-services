import axios, { AxiosResponse } from "axios";


const GET_IMAGES_API_PATH = "http://167.172.8.153/query/getSortedKeys";

export const getSortedKeys = async (): Promise<AxiosResponse<{ sortedKeys: string[] }>> =>
    axios.get(GET_IMAGES_API_PATH);
