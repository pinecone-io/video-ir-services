module.exports = {
  apps: [
    {
      name: "app-frontend",
      cwd: "./app-frontend/",
      script: "pnpm run dev",
    }, 
    {
      name: "app-backend",
      cwd: "./app-backend/",
      script: "pnpm run dev",
    },
    {
      name: "frame-extractor",
      cwd: "./frame-extractor/",
      script: "pnpm run dev",
    },
    {
      name: "video-splitter",
      cwd: "./video-splitter/",
      script: "pnpm run dev",
    },
    {
      name: "query-engine",
      cwd: "./query-engine/",
      script: "pnpm run dev",
    },
    {
      name: "indexer",
      cwd: "./indexer/",
      script: "pnpm run dev",
    }
  ], 
}
