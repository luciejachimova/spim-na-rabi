# syntax=docker/dockerfile:1
# check=error=true

# Production image for the Next.js app.
# docker build -t spim-na-rabi-app .
# docker run -d -p 3000:3000 -v spim-na-rabi-storage:/app/storage --env-file .env --name spim-na-rabi-app spim-na-rabi-app

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=build --chown=nextjs:nodejs /app ./

USER nextjs

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
