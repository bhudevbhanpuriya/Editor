# Yjs WebSocket collaboration server.
#
# Rooms live in process memory, so this image must run as exactly one replica.
# See README.md — scaling out silently splits a room across processes.

FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY index.js rooms.js ./

# The base image ships a `node` user; running as root is unnecessary here.
USER node

ENV PORT=1234
ENV HOST=0.0.0.0

EXPOSE 1234

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -q --spider http://localhost:1234/health || exit 1

CMD ["node", "index.js"]
