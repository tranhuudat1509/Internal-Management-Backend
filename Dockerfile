FROM node:22-bookworm-slim

WORKDIR /app

# Prisma needs OpenSSL
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies first so Docker can cache them
COPY package.json package-lock.json ./

RUN npm ci

# Prisma schema + migrations
COPY prisma ./prisma

RUN npx prisma generate

# Application source/config
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

# Build NestJS
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]