FROM node:20-alpine

WORKDIR /app

RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

COPY package*.json ./

RUN npm ci --only=production

COPY tsconfig.json ./

COPY src ./src

RUN npm install -D typescript

RUN npm run build

RUN npm prune --production && \
    rm -rf src tsconfig.json

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app

USER nodejs

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.error('Health check OK')" || exit 1

CMD ["node", "dist/index.js"]
