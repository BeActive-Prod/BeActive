# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev deps for building)
RUN npm ci

# Copy source code
COPY . .

# Build Next.js
RUN npm run build

# Remove development dependencies to reduce image size
RUN npm prune --production

# Expose port 8080 (frontend) and 3001 (backend)
EXPOSE 8080
EXPOSE 3001

# Run both services concurrently: frontend on 8080, backend on 3001
CMD /bin/sh -c "PORT=8080 npm run start & PORT=3001 npx tsx server/index.ts"