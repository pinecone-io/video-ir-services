cd app-backend &&
pnpm docker:build &&
cd ../downloader &&
pnpm docker:build &&
cd ../indexer
pnpm docker:build &&
cd ..