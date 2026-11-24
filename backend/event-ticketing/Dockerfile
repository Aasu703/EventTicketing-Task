# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and prisma schema
COPY . .

# Generate Prisma client (required before build)
RUN npx prisma generate

# Build
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]