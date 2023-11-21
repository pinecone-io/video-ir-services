import axios, { AxiosResponse } from "axios";


const GET_IMAGES_API_PATH = "http://167.172.8.153/api/getNumberOfEntries";

export const getNumberOfEntries = async (): Promise<AxiosResponse<{ numberOfEntries: number }>> =>
    axios.get(GET_IMAGES_API_PATH);
