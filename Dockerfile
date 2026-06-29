# Cài đặt dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Build dự án
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Khai báo các ARG nhận từ docker-compose để nhúng vào build 
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_R2_PUBLIC_URL
ENV NEXT_PUBLIC_R2_PUBLIC_URL=$NEXT_PUBLIC_R2_PUBLIC_URL

ARG NEXT_PUBLIC_PRESIGNER_WORKER_URL
ENV NEXT_PUBLIC_PRESIGNER_WORKER_URL=$NEXT_PUBLIC_PRESIGNER_WORKER_URL

ARG NEXT_PUBLIC_QUEUE_WORKER_URL
ENV NEXT_PUBLIC_QUEUE_WORKER_URL=$NEXT_PUBLIC_QUEUE_WORKER_URL

ARG NEXT_PUBLIC_IMAGE_UPLOAD_WORKER
ENV NEXT_PUBLIC_IMAGE_UPLOAD_WORKER=$NEXT_PUBLIC_IMAGE_UPLOAD_WORKER

# Tiến hành build 
RUN npx next build --webpack

# Chạy ứng dụng
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 2999
ENV PORT=2999
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
