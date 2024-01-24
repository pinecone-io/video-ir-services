cd app-backend &&
pnpm docker:local &&
cd ../app-frontend &&
pnpm docker:local &&
cd ../frame-extractor &&
pnpm docker:local &&
cd ../video-splitter &&
pnpm docker:local &&
cd ../indexer
pnpm docker:local &&
cd ..