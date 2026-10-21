# Build the web app, then run the API server, which also serves web/dist.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY core/package.json core/
COPY web/package.json web/
COPY server/package.json server/
RUN npm ci
COPY core core
COPY web web
RUN npm run build -w web

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=6001 DATA_DIR=/data
COPY package.json package-lock.json ./
COPY core/package.json core/
COPY web/package.json web/
COPY server/package.json server/
RUN npm ci --omit=dev -w server -w core && npm cache clean --force && mkdir /data && chown node /data
COPY core/src core/src
COPY server/src server/src
COPY --from=build /app/web/dist web/dist
USER node
EXPOSE 6001
# Inside the container the server must listen on all interfaces, so STUDIO_BIND is set here on purpose.
# The compose file publishes the port on 127.0.0.1 only; do not publish it more widely.
ENV STUDIO_BIND=0.0.0.0
CMD ["node", "server/src/index.js"]
