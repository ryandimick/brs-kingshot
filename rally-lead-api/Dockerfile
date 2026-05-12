# ---- Build stage ----
FROM node:22-slim AS build

# Prisma needs openssl present at generate time on Debian slim images
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install all deps (postinstall runs prisma generate against schema.prisma)
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Compile TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Drop devDeps — keeps the generated Prisma client + CLI for migrate deploy
RUN npm prune --omit=dev

# ---- Runtime stage ----
FROM node:22-slim AS runtime

# Prisma engine binaries link against libssl at runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package*.json ./

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Apply pending migrations, then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
