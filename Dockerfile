FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server.js ./
COPY src ./src
COPY public ./public
ENV PORT=3000 DATA_DIR=/data
# Runs as root: hosting platforms (e.g. Render) mount persistent disks owned by root.
RUN mkdir -p /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:${PORT}/healthz || exit 1
CMD ["node", "server.js"]
