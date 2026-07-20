# Backlog — Marketing Hub

Regra do PROMPT 17: **nenhum botão vazio em produção.** Só entra no `lib/registry.ts`
o que está implementado e testado. Tudo que ainda não existe fica aqui.

Conferido contra a especificação completa (102 páginas) em **20/07/2026**.
A spec define **60 módulos**: 21 P0, 30 P1, 7 P2 e 2 P3 (matriz da pág. 19).

---

## Situação dos 21 módulos P0

### ✅ Entregues (9)

| # | Módulo | Onde está |
|---|---|---|
| 01 | Central de comando do Marketing Hub | `/` |
| 02 | Busca universal orientada a tarefa | `SearchDialog` + `searchTools()` |
| 13 | Prévia de resultado de busca e compartilhamento | `/ferramentas/previa-google-e-redes` |
| 28 | Calculadora universal de métricas de mídia | `/ferramentas/calculadora-de-midia` |
| 31 | Construtor de URLs UTM | `/ferramentas/construtor-utm` |
| 42 | Presets de criativos | `/ferramentas/presets-de-criativos` |
| 50 | Link WhatsApp, QR e mensagem | `/ferramentas/link-whatsapp` |
| 51 | Limpador de CSV, contatos e listas | `/ferramentas/limpar-lista-de-contatos` |
| 52 | Central de conversores preservada | 27 rotas em `conversores.ts` |

### 🟡 Parciais — dá para completar sem autorização (6)

| # | Módulo | O que falta |
|---|---|---|
| 11 | Velocidade e Core Web Vitals 2.0 | Dados de campo (CrUX API) separados do Lighthouse; hoje só laboratório. Comparar antes/depois. |
| 18 | Dados estruturados | Faltam os tipos Organization, BreadcrumbList, Event e SoftwareApplication |
| 24 | Google Business Profile 2.0 | Score por dimensão (completude, reputação, atividade, conversão) e **desambiguação de filiais** |
| 27 | Simulador de ROI 2.0 | TikTok e LinkedIn; cenários conservador/base/agressivo; análise de sensibilidade; link compartilhável |
| 40 | Estúdio de cores | Passes AA/AAA por tamanho de texto; export de tokens CSS/JSON; extração de paleta de imagem; harmonias |
| 41 | Estúdio de imagem | Processamento em lote com ZIP; comparação antes/depois; Web Worker para não travar a interface |

### ⛔ Não iniciados (6) — todos dependem de uma decisão

**Dependem de banco de dados e painel administrativo** (Checkpoint 4 — custo mensal recorrente):

- **04** Diretório curado de IAs
- **05** Página completa de cada ferramenta de IA
- **08** Feed de novidades de IA

**Dependem de runtime de servidor** (trocar `output: "export"` por `"standalone"` — muda a
hospedagem; a spec exige proteção SSRF no PROMPT 03 e cap. 14, que só existe no servidor):

- **12** Auditoria técnica de SEO on-page
- **38** Analisador de landing page e CRO

**Sem bloqueio nenhum — só falta fazer:**

- **36** Central de bibliotecas e transparência de anúncios (Meta Ad Library, Google Ads
  Transparency Center, TikTok Creative Center). É catálogo de links oficiais verificados +
  checklist de análise + template de swipe file. Não precisa de API nem servidor.

---

## Decisões que exigem autorização do cliente (PROMPT 16)

| Decisão | Desbloqueia | Custo / impacto |
|---|---|---|
| **Supabase (Checkpoint 4)** | Módulos 04, 05, 08 + favoritos, coleções, workspaces, alertas, admin editorial | Mensalidade recorrente; exige dono editorial e SLA de atualização (gate da pág. 32) |
| **Runtime de servidor** | Módulos 12 e 38 + extrair tags de URL na prévia SERP | Muda hospedagem de estático para Node; mais superfície de segurança |

Enquanto não houver decisão, o hub segue 100% estático — o que mantém o site rápido,
barato e sem superfície de servidor.

---

## P1 / P2 / P3 (39 módulos)

Documentados na spec e **não implementados de propósito** — a spec manda entregar por
checkpoint, não tudo de uma vez. Os mais próximos de virem, por não precisarem de
integração paga:

- **19** Geradores de robots.txt, sitemap e hreflang (P1) — 100% local
- **30** Break-even, CAC e LTV (P1) — já implementado à frente do previsto ✅
- **43** Gerador de favicon e Open Graph (P1) — local, usa canvas
- **48** Analisador de assunto e preheader de e-mail (P1) — local, heurísticas
- **55** Calculadora de preço e capacidade da agência (P1) — local, motor financeiro
- **32** Governança de nomes de campanha (P1) — local, templates

Precisam de integração cara ou aprovação de API: 14 (Keyword Planner), 22/23 (AEO/GEO),
26 (grid local), 49 (DNS/SPF), 57 (relatórios), 60 (marketplace).

---

## Removido de propósito

- **Pix (QR e copia-e-cola)** — retirado a pedido do cliente. Não reintroduzir.
- **QR Code genérico** — retirado do ar a pedido do cliente. O QR do WhatsApp permanece
  porque é parte da ferramenta de link (módulo 50 da spec).
- **Gerador de títulos de SEO** — removido na v1.5; entregava sugestão genérica sem base.
- **Contagem de ferramentas na interface** — removida a pedido do cliente (20/07/2026).

---

## Dívida técnica conhecida

1. **Ficha do Google — desambiguação de filiais.** Quando várias unidades têm o mesmo nome,
   o Text Search devolve a mais proeminente, não a que o usuário escolheu. Direção da
   correção: extrair coordenadas/FTID da URL em vez de buscar pelo nome.
2. **Links `share.google`** resolvem para `share.google/error` quando seguidos pelo servidor.
3. **HEIC → JPG** ainda não foi testado com foto real de iPhone.
4. **Testes** cobrem registry, busca e parsers (32 casos). Faltam, conforme PROMPT 15:
   fixtures de arquivo por conversor, E2E dos fluxos P0, axe/acessibilidade automatizada e
   o teste que prova que nenhum arquivo aparece em request de rede.
5. **Sem Lighthouse CI / performance budgets** (PROMPT 14).
