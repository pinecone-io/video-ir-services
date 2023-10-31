cd app-backend &&
pnpm docker:local &&
cd ../app-frontend &&
pnpm docker:local &&
cd ../downloader &&
pnpm docker:local &&
cd ../indexer
pnpm docker:local &&
cd ..