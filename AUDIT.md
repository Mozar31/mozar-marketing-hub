# AUDIT.md — Auditoria do repositório (Checkpoint 0)

> Executado em 19/07/2026 sobre o repositório real `Mozar31/mozar-marketing-hub`, branch `main`, commit base `ba06a68`.
> Conforme PROMPT 02 da especificação: inspeção antes de qualquer alteração. **Nenhum arquivo de produção foi alterado nesta etapa.**

## 1. Stack atual (confirmada por leitura do código)

| Camada | Situação real |
|---|---|
| Frontend | HTML + CSS + JavaScript puro (ES2020), sem framework, sem build step |
| Arquivos | `index.html` (244 linhas), `app.js` (1887 linhas), `style.css` (536 linhas) |
| Fontes | Sora, Inter, JetBrains Mono via Google Fonts (CDN, não self-hosted) |
| Bibliotecas | Carregadas sob demanda via CDN: pdf.js 3.11.174, pdf-lib 1.17.1, mammoth 1.4.2, SheetJS 0.18.5, html2pdf 0.10.1, JSZip 3.10.1, heic2any 0.0.4 |
| Build/test | **Inexistentes** — não há `package.json`, lockfile, lint, testes ou CI |
| Deploy | Dockerfile `nginx:alpine`, copia a raiz para `/usr/share/nginx/html`, porta 80 |
| Hospedagem | EasyPanel (VPS 45.179.83.237), serviço `marketing-hub` no projeto `mozar` |
| Domínio | `hub.consiginvest.com` (DNS Cloudflare conta Mozarb31, registro A → VPS, DNS-only, SSL Let's Encrypt do EasyPanel) |
| Deploy trigger | Manual pelo painel ou URL de gatilho; **sem auto-deploy** por push |

## 2. Rotas e navegação

**Não existem rotas reais.** A aplicação é uma SPA de arquivo único com roteamento por hash:

- `#velocidade`, `#google-meu-negocio`, `#roi`, `#conversores`, `#conversores/[slug]`
- Uma única URL indexável (`/`) para ~35 ferramentas → **cauda longa de SEO inexistente**
- Sem breadcrumbs, sem metadata por ferramenta, sem sitemap, sem `robots.txt`

## 3. Inventário funcional (paridade obrigatória)

### 3.1 Módulos principais (4)
| Módulo | Implementação | Dependência externa |
|---|---|---|
| Velocidade & SEO | PageSpeed Insights API v5, mobile+desktop em paralelo, 4 categorias, LCP/CLS/TBT, top-4 oportunidades, resumo em linguagem simples | Chave `PAGESPEED_KEY` **no cliente** (restrita por referrer ao domínio) |
| Google Meu Negócio | POST para webhook n8n `n8n.vpsmozar.plusnetworks.com.br/webhook/gmb-analyze`, timeout 15 s | n8n VPS + Google Places API (chave server-side no n8n) |
| ROI Tráfego Pago | Sub-abas Google (CPC) e Meta (CPM/CTR); cálculo puro no cliente | Nenhuma |
| Conversores | 31 ferramentas, hub com busca + filtros + Conversor Universal | Libs via CDN |

### 3.2 Conversores e utilitários (31)
- **PDF (9):** → Word, → JPG, → Texto, juntar, dividir, extrair páginas, remover páginas, girar, inverter ordem
- **Imagens (10):** → PDF, converter formato, comprimir, redimensionar, girar, espelhar, P&B, juntar, HEIC→JPG, remover EXIF, → Base64
- **Documentos (1):** Word → PDF
- **Planilhas/Dados (3):** Excel ↔ CSV, JSON ↔ CSV, trocar separador CSV
- **Compactados (2):** criar ZIP, extrair ZIP
- **Texto e utilitários (5):** conversor de cores, Texto ↔ Base64, URL encode/decode, formatar/validar JSON, hash de arquivo

> Ferramentas de QR Code (incluindo Pix) foram **removidas** a pedido do cliente em 16/07/2026. O código está preservado no histórico (commit `7b53ee1`). **A especificação P0 pede "Gerador de link WhatsApp, QR e mensagem" — será reimplementado SEM qualquer função de Pix.**

## 4. Endpoints e integrações

| Endpoint | Uso | Risco |
|---|---|---|
| `googleapis.com/pagespeedonline/v5` | client-side, chave pública restrita por referrer | Baixo (chave sem billing, restrita) |
| `n8n.vpsmozar.../webhook/gmb-analyze` | POST `{link}`, CORS restrito a `hub.consiginvest.com` | Médio — depende de disponibilidade do n8n |
| CDNs (cdnjs, jsdelivr) | libs de conversão | Médio — sem SRI, sem fallback offline |

## 5. Baseline de performance (medido em produção)

- PageSpeed mobile da própria home: **Performance ~92–96, Acessibilidade 93, Práticas 96, SEO 100**
- LCP ~2,3–2,6 s · CLS ~0,03 · TBT ~40 ms
- `app.js` monolítico de **90 KB** carregado em toda visita, mesmo para quem só abre uma aba
- Libs pesadas já são lazy (bom) — a home **não** baixa pdf.js/JSZip

## 6. Riscos e débitos técnicos identificados

| # | Item | Severidade |
|---|---|---|
| 1 | Zero testes automatizados — qualquer refatoração é cega | **Alta** |
| 2 | SPA de hash → sem SEO de cauda longa (perda do principal ativo de aquisição) | **Alta** |
| 3 | `app.js` monolítico, sem módulos, difícil de escalar para 60 módulos | **Alta** |
| 4 | Claims sem fonte no texto do GMN ("até 7x mais ligações") | Média (compliance) |
| 5 | Sem `robots.txt`, `sitemap.xml`, canonical ou structured data | Média |
| 6 | Libs de CDN sem SRI nem verificação de integridade | Média |
| 7 | Sem estados honestos de cache/fonte/data nos resultados | Média |
| 8 | Sem consentimento de cookies (hoje não há analytics — risco latente) | Baixa |
| 9 | Sem `.env.example`, sem documentação de arquitetura | Baixa |

## 7. Pontos fortes a preservar

- Ferramentas resolvem tarefas reais e funcionam de fato (verificadas por teste manual e automatizado nesta sessão)
- **Local-first verdadeiro** nos conversores — nenhum arquivo sai do navegador (promessa honesta, diferencial real)
- Identidade visual coerente e CTAs contextuais funcionando
- Registry central de conversores já existe em `app.js` (`CONVERTERS`/`CONV_CATS`) — **base pronta para virar o registry de módulos**

## 8. Decisão de migração recomendada

**Adotar Next.js 16 App Router + TypeScript strict + Tailwind 4 + CSS variables**, conforme PROMPT 04 — a base atual é a página estática auditada e não há arquitetura equivalente.

### Decisão de runtime (justificada)
Nos Checkpoints 1–3 o build usará **`output: 'export'` (exportação estática)**:

- **Motivo:** todas as ferramentas dos Checkpoints 1–3 são local-first (client-side) ou chamam serviços externos já existentes (PageSpeed via cliente, GMN via n8n). Nenhuma exige runtime de servidor.
- **Benefício:** entrega rotas reais indexáveis, metadata por página, sitemap e breadcrumbs **sem alterar hospedagem** — o mesmo `Dockerfile` nginx continua válido (passa a copiar `out/`).
- **Segurança:** sem fetch server-side, a superfície de SSRF descrita no PROMPT 03 **não é criada** nesta fase.
- **Reversibilidade:** o deploy continua sendo "arquivos estáticos no nginx"; rollback = deploy do commit anterior.

Quando o **Checkpoint 4** (Supabase, painel admin, ingestão de notícias) for autorizado — pois implica **custo recorrente e mudança de runtime**, o que o PROMPT 16 exige aprovação explícita — o projeto migra para `output: 'standalone'` com runtime Node no mesmo EasyPanel.

### Ordem de execução acordada com a especificação
1. **Checkpoint 1** — Shell do portal: tokens, layout, header duas linhas, busca global, mega menus, faixa de atualizações, footer, breadcrumbs, registry.
2. **Checkpoint 2** — Migração com paridade: 4 módulos + 31 conversores em rotas individuais, aliases dos hashes antigos, testes de regressão.
3. **Checkpoint 3** — Novos P0 local-first: UTM builder, calculadora universal de mídia, break-even/CAC/LTV, WhatsApp link+QR (sem Pix), CSV cleaner, cores/contraste, image studio, presets sociais, SERP/OG preview, schema generator.
4. **Checkpoint 4** — *Requer autorização do cliente* (custo recorrente/runtime): Supabase, admin, catálogo de IA, notícias.

## 9. Restrições respeitadas nesta auditoria

- Nenhuma alteração em DNS, hospedagem, produção, credenciais ou dados reais
- Nenhum comando destrutivo executado
- Implementação atual preservada integralmente até haver paridade testada
- Segredos: a única chave no cliente é a do PageSpeed (pública por design, restrita por referrer, projeto sem billing). A chave do Places permanece **exclusivamente** no n8n.
