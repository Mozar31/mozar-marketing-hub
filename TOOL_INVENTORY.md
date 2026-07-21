# TOOL_INVENTORY — Checkpoint 0 (spec "Ferramentas Úteis", jul/2026)

Inventário do que existe hoje e comparação com as **24 fichas** da nova especificação.
Marcação: **✅ existe** · **🟡 parcial** · **🆕 novo**.

> Regra da spec: o hub tem conversores demais; o crescimento está em **fluxos completos de
> agência**. Nada do que funciona é removido — mas o foco de construção muda.

---

## A) Ferramentas que já existem no hub (42)

| Slug | Categoria | Processamento |
|---|---|---|
| velocidade-e-seo | SEO | API (PageSpeed) |
| ficha-google | SEO | API (Places, via n8n) |
| previa-google-e-redes | SEO | local |
| dados-estruturados | SEO | local |
| simulador-roi | Tráfego | local |
| calculadora-de-midia | Tráfego | local |
| break-even-cac-ltv | Tráfego | local |
| construtor-utm | Tráfego | local |
| link-whatsapp | Social | local |
| presets-de-criativos | Social | local |
| estudio-de-cores | Design | local |
| excel-csv, json-csv, separador-csv, limpar-lista-de-contatos | Dados | local |
| formatar-json, texto-base64, url-encode, hash-de-arquivo, imagem-para-base64 | Web | local |
| **~22 conversores** (PDF, imagem, ZIP) | Conversores | local |

**Leitura:** ~28 dos 42 são conversores/utilitários genéricos. A spec pede para **preservá-los**,
mas não são o foco. As 14 restantes (SEO, tráfego, social, design) são as que se aproximam das 24.

---

## B) As 24 fichas × o que temos

| # | Ferramenta (spec) | Prio | Situação | O que já cobre / o que falta |
|---|---|---|---|---|
| 01 | Auditoria 360 do site | P0 | 🟡 parcial | `velocidade-e-seo` é um pedaço. Falta juntar SEO on-page + tags + conversão + acessibilidade num relatório único com evidências. **Precisa de servidor.** |
| 02 | Analisador de termos do Google Ads (CSV) | P0 | 🆕 novo | Não existe. Local (analisa CSV). Sugere palavras negativas. |
| 03 | Verificador de tags e pixels | P0 | 🆕 novo | Não existe. **Precisa de servidor** (lê o site). |
| 04 | Gerador/validador de anúncios Google Ads | P0 | 🆕 novo | Não existe. Local (+ IA opcional). |
| 05 | Organizador de palavras-chave e negativas | P0 | 🆕 novo | Não existe (o `limpar-lista` é para contatos, não keywords). Local. |
| 06 | Avaliador de landing page | P0 | 🆕 novo | Não existe. **Precisa de servidor.** |
| 07 | Gerador de relatório para clientes (CSV) | P0 | 🆕 novo | Não existe. Local (importa CSV, gera PDF). |
| 08 | Planejador de mídia e cenários | P0 | 🟡 parcial | `simulador-roi` + `calculadora-de-midia` cobrem parte. Falta distribuir orçamento entre canais + PDF. |
| 09 | Gerador de propostas comerciais | P0 | 🆕 novo | Não existe. Local (WhatsApp + PDF). |
| 10 | Construtor de UTM **em massa** | P0 | 🟡 parcial | `construtor-utm` faz 1 por vez. Falta o modo **lote** (dezenas de URLs de uma vez). |
| 11 | Gerador de nomenclatura de campanhas | P0 | 🆕 novo | Não existe. Local. |
| 12 | Kit Google Business Profile | P0 | 🟡 parcial | `ficha-google` faz o diagnóstico. Falta o **kit**: QR/link de avaliação, respostas, posts, descrição, checklist. |
| 13 | Diagnóstico Google Ads por CSV | P1 | 🆕 novo | Não existe. Local. |
| 14 | Diagnóstico Meta Ads por CSV | P1 | 🆕 novo | Não existe. Local. |
| 15 | Calculadora de ROAS/margem/break-even | P1 | 🟡 parcial | `break-even-cac-ltv` existe. Falta impostos, taxas, frete, devoluções e presets (e-commerce/serviço/recorrência). |
| 16 | Simulador de funil | P1 | 🟡 parcial | `simulador-roi` cobre boa parte. Falta etapas configuráveis (reuniões, comparecimento) e apontar o gargalo. |
| 17 | Scanner de SEO técnico | P1 | 🆕 novo | Não existe. **Precisa de servidor.** |
| 18 | Verificador de links e redirects | P1 | 🆕 novo | Não existe. **Precisa de servidor.** |
| 19 | Gerador **e validador** de Schema | P1 | 🟡 parcial | `dados-estruturados` **gera** 8 tipos. Falta **validar** (checar campos obrigatórios) + tipo Service. |
| 20 | Gerador de campanha completa com IA | P1 | 🆕 novo | Não existe. **Precisa de IA.** |
| 21 | Planejador de conteúdo/carrossel/Reels | P1 | 🆕 novo | Não existe. **Precisa de IA.** |
| 22 | Kit de vídeo, áudio, transcrição, legendas | P2 | 🆕 novo | Não existe. Pesado (ffmpeg/WASM + transcrição). |
| 23 | Diretório curado de IAs | P2 | 🆕 novo | Não existe. Precisa de banco + curadoria. |
| 24 | Biblioteca e construtor de prompts | P2 | 🆕 novo | Não existe. Local (+ banco depois). |

### Placar
- **🆕 Novas: 15** · **🟡 Parciais: 6** (08, 10, 12, 15, 16, 19) · **✅ prontas: 0**

---

## C) O que a spec exige de "base" antes de várias ferramentas

Três "motores" compartilhados que hoje **não existem** e destravam vários módulos:

1. **Camada de importação de CSV/XLSX** (detecta separador, moeda, data, mapeia colunas) →
   necessária para **02, 07, 13, 14**. Puramente local, sem custo.
2. **Coletor de URL seguro (anti-SSRF)** → necessário para **01, 03, 06, 17, 18**.
   **Exige runtime de servidor** (a mesma mudança de hospedagem já discutida).
3. **Provider de IA abstrato** (chave só no servidor, limites, custo) → necessário para **20, 21**.
   Exige servidor + chave de IA (custo por uso).

---

## D) Conclusão do inventário

- A **fundação já existe** (registry, rotas, busca, SEO, exportação, testes) — a spec pede isso no
  Checkpoint 1 e nós já temos. **Paridade ok.**
- O grosso do trabalho novo é **local-first e sem custo**: 8 das ferramentas P0/P1 novas rodam no
  navegador (02, 04, 05, 07, 09, 11, 13, 14) + completar as 6 parciais.
- O bloco que **depende de servidor** (coletor seguro de URL) é o mesmo pré-requisito das 5
  ferramentas de análise de site (01, 03, 06, 17, 18).
- O bloco de **IA** (20, 21) e os **P2** (22, 23, 24) ficam por último, como a própria spec recomenda.
