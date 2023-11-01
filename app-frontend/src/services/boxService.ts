import axios, { AxiosResponse } from "axios";

const GET_BOX_API_PATH = "http://167.172.8.153/api/queryBox?boxId=";

export const queryBox = (boxId: string): Promise<AxiosResponse<Array<{ boxId: string, label: string, path: string }>>> =>
  axios.get(`${GET_BOX_API_PATH}${boxId}`)
