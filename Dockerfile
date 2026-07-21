# Dockerfile do Marketing Hub — modo "standalone" (runtime de servidor Node).
# Branch feat/server-runtime: substitui o Dockerfile antigo (estático + nginx na
# porta 80). Agora o Next roda como servidor Node na porta 3000.
#
# >>> No EasyPanel, ao virar esta branch, trocar a porta do serviço de 80 para 3000. <<<

# ─── Etapa 1: dependências (cache) ─────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ─── Etapa 2: build standalone ─────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── Etapa 3: runner mínimo ────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuário sem privilégios.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# public/ + saída standalone (server.js + node_modules mínimos) + estáticos do build.
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
