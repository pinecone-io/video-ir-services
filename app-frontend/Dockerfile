# STAGE 1

# Use an official Node.js runtime as a parent image
FROM node:18.17.1 as builder

# Set the working directory to /app-frontend
WORKDIR /app-frontend

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

############################################################

# STAGE 2
FROM nginx:1.19.0

# Set working dir
WORKDIR /usr/share/nginx/html

# Remove existing public files
RUN rm -rf ./*

# Copy React build files
COPY --from=builder /app-frontend/dist .

# Copy nginx configuration
COPY --from=builder /app-frontend/nginx.conf /etc/nginx

# Expose 80 port
EXPOSE 80

# Start nginx 
ENTRYPOINT ["nginx", "-g", "daemon off;"]
