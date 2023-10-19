# Use an official Node.js runtime as a parent image
FROM node:18.17.1

# Set the working directory to /downloader
WORKDIR /indexer

# Install pnpm
RUN npm install -g pnpm@8.6.12

# Copy package.json and pnpm-lock.yaml to the working directory
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install app dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the app's source code to the working directory
COPY . .

# Build everything
RUN pnpm build

# Expose port 3001 for the app to listen on
EXPOSE 3002

# Start the app
CMD [ "pnpm", "start" ]
