import type { Request, Response } from "express"

interface Route {
  route: string;
  method: "get" | "post" | "put" | "delete";
  handler: (req: Request, res: Response) => void;
}
