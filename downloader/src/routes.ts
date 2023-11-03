import { Request, Response } from "express";
import { downloadS3 } from "./ytDownloadS3";

interface Route {
    route: string;
    method: "get" | "post" | "put" | "delete";
    handler: (req: Request, res: Response) => void;
}

const routes: Route[] = [
    {
        route: "/download",
        method: "post",
        handler: async (req, res) => {
            res.setTimeout(360000, () => {
                res.status(500).json({ error: "Request timed out" })
            })
            try {
                const target = req.body.target as string;
                const fps = req.body.fps as number;
                const name = req.body.name as string;
                console.log(`Downloading ${target}`)
                await downloadS3(target, name, fps);
                res.json({ message: "Downloaded" });
            } catch (error) {
                res.status(500).json({ error: "Error downloading", message: error });
            }
        },
    },
    {
        route: "/health",
        method: "get",
        handler: (_, res) => {
            res.status(200).json({ message: "Downloader server is healthy :)" });
        },
    },
];

export { routes as resolvers };
