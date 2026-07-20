# Arquitetura

## Princípio central: um registry, tudo derivado dele

`lib/registry.ts` é a única fonte da verdade sobre quais ferramentas existem. A partir
dele são gerados, sem duplicação:

| Derivado | Onde |
|---|---|
| Rotas estáticas de cada ferramenta | `app/ferramentas/[slug]/page.tsx` → `generateStaticParams` |
| `<title>`, meta description, canonical | mesma rota → `generateMetadata` |
| JSON-LD (SoftwareApplication + BreadcrumbList) | mesma rota |
| Páginas de categoria | `app/ferramentas/categoria/[slug]/page.tsx` |
| Mega menu e menu mobile | `components/Header.tsx` |
| Busca | `searchTools()` no registry |
| `sitemap.xml` | `app/sitemap.ts` |
| Redirecionamento dos links antigos | `legacyHash` de cada ferramenta |

Consequência prática: adicionar uma ferramenta é **uma entrada no registry + uma
implementação**. Nenhum menu, sitemap ou lista precisa ser editado à mão — e nenhum
deles pode ficar dessincronizado.

## Execução das ferramentas

`components/tools/ToolRunner.tsx` recebe o slug e resolve o componente:

1. **`CUSTOM`** — ferramentas com interface própria (velocidade, ficha do Google, ROI,
   calculadoras, UTM, WhatsApp, prévia SERP, schema, cores, JSON/Base64/URL, limpador
   de listas, presets de criativos). Cada uma entra por `next/dynamic` com
   `ssr: false`, então o código só é baixado quando a ferramenta é aberta.
2. **`FILE_TOOLS`** (`lib/tools/converters.ts`) — conversores de arquivo. Todos
   compartilham a mesma casca (`FileTool`): dropzone, campos de opção declarativos,
   estados de carregando/erro/resultado e o `ResultPanel` de download.
3. Se o slug não existe em nenhum dos dois, aparece um aviso honesto — nunca um botão
   que não faz nada.

## Por que exportação estática

Todas as ferramentas atuais são *local-first* (rodam no navegador) ou chamam serviços
externos já existentes (PageSpeed direto do navegador; Places via webhook n8n). Nenhuma
precisa de servidor próprio.

`output: "export"` preserva a hospedagem que já existia (nginx no EasyPanel), mantém o
deploy reversível, elimina superfície de ataque de servidor e deixa o site rápido por
construção.

**Quando isso muda:** o Checkpoint 4 (login, banco, histórico por cliente) exige
`output: "standalone"` e um Supabase. É uma decisão com custo recorrente — depende de
autorização explícita do cliente, e está registrada no `BACKLOG.md`.

## Processamento local (privacidade por arquitetura)

Os conversores usam `FileReader`, `canvas`, `Web Crypto` e bibliotecas client-side. O
arquivo do usuário nunca sai do dispositivo. O selo "no navegador" só aparece quando
isso é verdade — o registry marca cada ferramenta com `local-only` ou `usa-api`, e a
página de resultado cita a fonte e o horário quando há API envolvida.

### Gotchas que já custaram caro

- **pdf.js em aba oculta**: `page.render()` nunca resolve porque o `requestAnimationFrame`
  fica pausado. Solução: `render({ intent: "print" })`.
- **CSV no Excel brasileiro**: exportar com `;` e BOM (`﻿`), senão abre tudo em uma
  coluna e quebra acentuação.
- **`heic2any`** não vem do cdnjs (usar jsDelivr); o `canvas` não consegue *gerar* HEIC,
  só converter a partir dele.

## Dados externos

| Ferramenta | Serviço | Chave |
|---|---|---|
| Velocidade e SEO | Google PageSpeed Insights v5 | chave pública no cliente, restrita por referrer |
| Ficha do Google | Google Places API (New) via webhook n8n | chave **só no servidor n8n** |

O webhook do n8n aplica CORS restrito a `hub.consiginvest.com`, cache de 7 dias e cota
diária — a chave paga nunca chega ao navegador. Detalhes em `SECURITY.md`.
