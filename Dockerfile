# Dockerfile do Marketing Hub — servidor Node (Next standalone) na PORTA 80.
# Substitui o antigo (estático + nginx). Escuta na 80 (mesma porta do nginx),
# então a config do serviço no EasyPanel NÃO muda. Roda como root só para poder
# usar a porta 80 (privilegiada) — igual o nginx fazia.

# ─── deps: dependências com cache ──────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ─── build: gera a saída standalone ────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── runner: imagem final mínima ───────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# public/ + saída standalone (server.js + node_modules mínimos) + estáticos.
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 80
ENV PORT=80
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
