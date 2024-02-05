import { Route } from "../types"

const routes: Route[] = [
  {
    route: "/health",
    method: "get",
    handler: (_, res) => {
      res.status(200).json({ message: "Frame splitter server is healthy :)" })
    },
  },
]

export { routes as resolvers }
