# ─── Etapa 1: build do Next.js (exportação estática) ───────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Etapa 2: nginx servindo o out/ ────────────────────────────────
FROM nginx:alpine
COPY --from=build /app/out /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
