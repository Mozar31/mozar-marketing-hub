# Motor no servidor (runtime Node) — branch `feat/server-runtime`

Esta branch troca o hub de **estático (nginx)** para **servidor Node (standalone)**,
o que destrava as ferramentas que precisam ler o site de um cliente pelo servidor:
auditoria 360, análise de landing page, SEO técnico, verificador de tags/pixels e
verificador de links.

**O site que está no ar (`main`) NÃO é afetado** — continua estático até virarmos.
Custo: R$ 0 (mesma VPS/EasyPanel; muda só o tipo de build e a porta).

## O que mudou no código
- `next.config.ts`: `output: "export"` → `output: "standalone"`.
- `Dockerfile`: build estático + nginx (porta 80) → build Node standalone (porta 3000).

Validado localmente: `npm run build` gera `.next/standalone/server.js`; o servidor
sobe e responde 200 na home e nas páginas de ferramenta.

## Passos para virar (quando decidirmos, juntos)
1. Fazer merge de `feat/server-runtime` na `main` (ou apontar o serviço para a branch).
2. No **EasyPanel**, no serviço `marketing-hub`:
   - Build: continua por **Dockerfile** (o novo já está na raiz).
   - **Trocar a porta do serviço de `80` para `3000`.**
   - (Domínio/SSL de `hub.consiginvest.com` permanecem iguais.)
3. Rebuild/deploy. Conferir `hub.consiginvest.com` no ar.
4. Se algo der errado: reverter o merge (ou apontar de volta para o commit estático)
   e voltar a porta para 80 — 100% reversível.

## Depois de virar
Com o motor no ar, dá para construir as ferramentas de análise de site (que hoje
não existem porque exigem servidor). Elas entram como novas ferramentas no registry.
