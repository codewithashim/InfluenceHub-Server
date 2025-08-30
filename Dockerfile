# Development Dockerfile for NestJS with hot reloading
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for development)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Default command for development with hot reloading
CMD ["npm", "run", "start:dev"]
