# Consig Invest | Marketing Hub

Portal de ferramentas gratuitas de marketing digital para captação de leads da
**Consig Invest Marketing Digital**. No ar em **https://hub.consiginvest.com**.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS 4** (sintaxe `@theme` / `@utility`)
- `output: "export"` — o build gera HTML estático em `out/`, sem runtime de servidor
- **nginx:alpine** serve o `out/` (Dockerfile multi-estágio)
- Bibliotecas pesadas (pdf.js, pdf-lib, SheetJS, JSZip, mammoth, heic2any…) entram
  por CDN, carregadas sob demanda pela ferramenta que precisa delas

## Como rodar

```bash
npm install
npm run dev        # http://localhost:3300
npm run typecheck  # tsc --noEmit
npm run build      # gera out/
```

## Estrutura

```
app/                    rotas (App Router)
  ferramentas/[slug]/   página de cada ferramenta (gerada do registry)
  ferramentas/categoria/[slug]/
  sobre/ privacidade/
  sitemap.ts robots.ts
components/
  Header  Footer  SearchDialog  LegacyHashRedirect  ui
  tools/                implementações das ferramentas
    ToolRunner.tsx      despachante slug → componente
    FileTool.tsx        casca genérica dos conversores de arquivo
lib/
  registry.ts           ⭐ fonte da verdade: catálogo de ferramentas
  config.ts             WhatsApp, chaves públicas, URLs de CDN
  tools/converters.ts   lógica dos conversores de arquivo
  tools/runtime.ts      utilitários compartilhados (pdf.js, canvas, formatação)
legacy/                 v1 do site (HTML/JS puro) — histórico, não é servida
```

## Adicionar uma ferramenta

1. Descrever a ferramenta em `lib/registry.ts` (slug, título, descrição, categoria,
   palavras-chave, selos).
2. Implementar:
   - **conversor de arquivo** → adicionar a entrada em `lib/tools/converters.ts`
     (o `FileTool` monta a interface sozinho); ou
   - **interface própria** → criar o componente e registrá-lo no `CUSTOM` do
     `components/tools/ToolRunner.tsx`.
3. Pronto: rota, metadata, breadcrumb, JSON-LD, busca, menu e sitemap saem do registry.

> **Regra**: só entra no registry o que está implementado e testado.
> Nada de botão que não faz nada — o que ainda não existe fica no `BACKLOG.md`.

## Deploy

EasyPanel, projeto `mozar`, serviço `marketing-hub` (build via Dockerfile a partir da
branch `main` do GitHub). **Não há auto-deploy**: depois do push, dispare o gatilho HTTP
da aba *Implantações* do serviço, ou clique em **Implantar** no painel.

O build leva cerca de 1 minuto; até terminar, a URL ainda responde com a versão anterior
(conferir pelo header `Last-Modified`, não pelo título da página).

## Documentação

- `AUDIT.md` — auditoria da v1 e decisões de arquitetura
- `ARCHITECTURE.md` — como as peças se encaixam e por quê
- `SECURITY.md` — chaves, superfície de ataque e o que nunca versionar
- `BACKLOG.md` — o que ficou de fora e por quê
- `/privacidade` (no site) — política de privacidade pública
