FROM node:20-alpine AS builder

# 1. Build Client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# 2. Setup Server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ ./

# Expose port
EXPOSE 5000

ENV NODE_ENV=production
CMD ["node", "index.js"]
