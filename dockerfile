FROM node:20.9.0 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ENV MONGODB_URL="mock"
ENV STRIPE_SECRET_KEY="mock"

RUN npm run build 

FROM node:20.9.0-alpine AS runner
WORKDIR /app

# Security: Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]