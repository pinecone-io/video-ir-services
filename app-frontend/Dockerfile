# Use an official Node.js runtime as a parent image
FROM node:18.17.1 as builder

# Set the working directory to /app-frontend
WORKDIR /app-frontend

# Install pnpm
RUN npm install -g pnpm@8.14.3

# Copy local shared repo
COPY tmp-shared /shared

# Copy package.json and pnpm-lock.yaml to the working directory
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install app dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the app's source code to the working directory
COPY . .

# Build everything
RUN pnpm build

# Expose port 3005 for the app to listen on
EXPOSE 3005

# Start the app
CMD [ "pnpm", "start" ]
