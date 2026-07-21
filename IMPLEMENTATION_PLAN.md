# IMPLEMENTATION_PLAN — Checkpoint 0 (spec "Ferramentas Úteis")

Ordem recomendada, adaptada ao que **já existe** no hub. Segue a lógica da spec: valor primeiro,
custo e risco depois. **Um checkpoint por vez, com sua autorização entre eles.**

Ver a comparação completa em [TOOL_INVENTORY.md](TOOL_INVENTORY.md).

---

## ✅ Fase 0 — Auditoria (este documento)
Sem código. Entregues: `AUDIT.md`, `TOOL_INVENTORY.md`, `IMPLEMENTATION_PLAN.md`. **Parar para revisão.**

## ✅ Fase 1 — Fundação (JÁ FEITO)
Registry tipado, rotas por ferramenta, busca, filtros por categoria, breadcrumbs, metadata,
canonical, sitemap, estados de erro, exportação. Links antigos preservados. **Já entregue** na
reconstrução Next.js. Falta só adicionar ao registry os campos `prioridade` e `data de revisão`
(cosmético) e favoritos/recentes locais.

---

## 🟢 Fase 2 — Kit P0 local-first (sem servidor, sem custo)
As que dão mais valor por menos risco. Tudo roda no navegador.

**Novas:**
- 05 Organizador de palavras-chave e negativas
- 04 Gerador/validador de anúncios do Google Ads
- 11 Gerador de nomenclatura de campanhas
- 09 Gerador de propostas comerciais (WhatsApp + PDF)

**Completar parciais:**
- 10 UTM em massa (modo lote no `construtor-utm`)
- 08 Planejador de mídia (distribuição por canal + PDF, sobre o `simulador-roi`)
- 16 Simulador de funil (etapas configuráveis + gargalo)
- 15 Calculadora de ROAS/margem (impostos, taxas, frete, presets)

> Precisa antes: **motor de fórmulas testado** (separado da interface) + **motor de PDF/exportação**.

## 🟢 Fase 3 — Importação de CSV + diagnósticos (local, sem custo)
Cria a **camada canônica de CSV** e, sobre ela:
- 02 Analisador de termos do Google Ads
- 07 Gerador de relatório para clientes
- 13 Diagnóstico Google Ads por CSV
- 14 Diagnóstico Meta Ads por CSV

## 🟢 Fase 4 — Kit de perfil local + Schema
- 12 Kit Google Business Profile (QR/link, respostas, posts, descrição, checklist) — entrada manual
- 19 Validador de Schema (somar validação ao `dados-estruturados`)

---

## 🟡 Fase 5 — Coletor de URL seguro (⚠️ decisão)
Serviço compartilhado anti-SSRF. **Exige runtime de servidor** (trocar `output: export` por
`standalone` — mesma VPS, muda o Dockerfile). Sem isso, as 5 ferramentas abaixo não saem com
segurança. Inclui testes de SSRF antes de qualquer lançamento.

## 🟡 Fase 6 — Analisadores de site (dependem da Fase 5)
- 03 Verificador de tags e pixels
- 06 Avaliador de landing page
- 01 Auditoria 360 do site
- 17 Scanner de SEO técnico
- 18 Verificador de links e redirects

## 🟡 Fase 7 — Conteúdo com IA (⚠️ decisão: custo por uso)
Depende de provider de IA (chave no servidor, limites, custo). 
- 20 Gerador de campanha completa
- 21 Planejador de conteúdo/carrossel/Reels

## 🟡 Fase 8 — P2 (por último)
- 22 Kit de vídeo/transcrição (pesado)
- 23 Diretório de IAs (banco + curadoria contínua)
- 24 Biblioteca de prompts

---

## 🔑 As 2 decisões que destravam tudo (iguais às de antes)
| Decisão | Destrava | Custo |
|---|---|---|
| **Runtime de servidor** (Dockerfile) | Fase 5 → Fase 6 (5 analisadores de site) | mesma VPS, sem custo novo |
| **Chave de IA** | Fase 7 (campanha + conteúdo) + banco p/ diretório | custo por uso |

**Fases 2, 3 e 4 não dependem de nenhuma decisão** — são local-first, sem custo, e já entregam a
maior parte do valor de agência. É por onde recomendo começar.

## 🛑 Regra de trabalho (da spec, PROMPT 13)
Antes de cada fase: plano curto + arquivos afetados + riscos. Depois: implementar, testar, resumir,
**parar**. Qualquer custo recorrente / mudança de stack, banco, hospedagem ou API → **parar e pedir
autorização.**
