import { Request, Response } from "express"

interface Route {
  route: string;
  method: "get" | "post" | "put" | "delete";
  handler: (req: Request, res: Response) => void;
}

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
