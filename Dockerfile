FROM node:22-alpine AS frontend-builder
WORKDIR /frontend
COPY package.json ./
RUN npm install
COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM node:22-alpine AS backend-builder
WORKDIR /backend
COPY backend/package.json backend/tsconfig.json ./
RUN apk add --no-cache python3 make g++ && npm install && apk del python3 make g++
COPY backend/src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=backend-builder /backend/node_modules ./node_modules
COPY --from=backend-builder /backend/dist ./dist
COPY --from=frontend-builder /frontend/dist ./dist/public

EXPOSE 3000
CMD ["node", "dist/server.js"]
