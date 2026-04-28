FROM node:20-alpine AS builder
WORKDIR /app
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install
COPY client ./client
RUN cd client && npm run build

FROM node:20-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --production
COPY server ./server
COPY --from=builder /app/client/dist ./client/dist
EXPOSE 3000
CMD ["node", "server/index.js"]
