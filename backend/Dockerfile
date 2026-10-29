# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

# Prisma's engine binaries need OpenSSL present at generate-time too
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies first (better layer caching)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source and build
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:22-slim AS production

WORKDIR /app

# Required at runtime for Prisma's query engine to link against libssl
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Only production dependencies + prisma (needed for migrate deploy)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev

# Generate Prisma client in the production image
RUN npx prisma generate

# Copy compiled app from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Run DB migrations then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
