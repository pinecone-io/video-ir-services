cd app-backend &&
pnpm docker:build &&
cd app-frontend &&
pnpm docker:build &&
cd ../downloader &&
pnpm docker:build &&
cd ../indexer
pnpm docker:build &&
cd ..