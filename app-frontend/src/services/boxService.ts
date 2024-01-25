// const GET_BOX_API_PATH = "http://167.172.8.153/query/queryBox?boxId=";
const GET_BOX_API_PATH = "http://localhost:3004/query/queryBox?boxId="

export const queryBox = async (boxId: string, focused: boolean = false): Promise<Response> => {
  return await fetch(GET_BOX_API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ boxId, focused })
  })
}
