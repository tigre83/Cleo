# Backend
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm install
COPY backend/ .
RUN npm run build

# Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Widget
FROM node:20-alpine AS widget-build
WORKDIR /app/widget
COPY widget/package.json widget/package-lock.json* ./
RUN npm install
COPY widget/ .
RUN npm run build

# Production
FROM node:20-alpine
WORKDIR /app

COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/package.json ./
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=frontend-build /app/frontend/dist ./public
COPY --from=widget-build /app/widget/dist/widget.js ./public/widget.js

EXPOSE 3001
CMD ["node", "dist/index.js"]
