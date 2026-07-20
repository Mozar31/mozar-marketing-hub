# Backlog — Marketing Hub

Regra do PROMPT 17: **nenhum botão vazio em produção.** Só entra no `lib/registry.ts`
o que está implementado e testado. Tudo que ainda não existe fica aqui.

Status em 20/07/2026 — 42 ferramentas no ar, Checkpoints 0 a 3 concluídos.

---

## P1 — próximos candidatos (local-first, sem custo novo)

| Módulo | O que faz | Por que ainda não entrou |
|---|---|---|
| Comparador de textos (diff) | Mostra o que mudou entre duas versões de um texto/copy | Precisa de algoritmo de diff e UI de duas colunas |
| Gerador de robots.txt | Monta o arquivo com regras comuns explicadas | Baixa demanda comparada aos itens acima |
| Extrator de texto de imagem (OCR) | Lê texto de print e nota fiscal | Tesseract.js pesa ~10 MB; precisa medir impacto no LCP |
| Compressor de PDF | Reduz o peso do PDF | pdf-lib não recomprime imagens embutidas; resultado seria enganoso |
| Assinatura de PDF | Insere imagem de assinatura em posição escolhida | Precisa de canvas com arrastar/soltar sobre a página |
| Conversor de moedas | USD/EUR/BRL com cotação do dia | Depende de API externa de câmbio — avaliar fonte oficial (BCB) |
| Calendário editorial | Gera grade de postagens do mês em CSV | Definir se é útil sem integração com rede social |

## P2 — exigem servidor ou chave paga

| Módulo | Bloqueio |
|---|---|
| Verificador de backlinks | Toda API séria (Ahrefs, Majestic) é paga |
| Análise de concorrentes de anúncio | Biblioteca de anúncios da Meta não tem API pública estável |
| Rank tracker de palavra-chave | Scraping do Google viola os termos de uso |
| Encurtador de link próprio | Precisa de banco e domínio dedicado — cai no Checkpoint 4 |

## P3 — Checkpoint 4 (**requer autorização explícita do cliente**)

Envolve custo recorrente e troca de `output: "export"` para `output: "standalone"`.
Não iniciar sem aprovação:

- Painel administrativo com login (Supabase Auth)
- Salvar histórico de auditorias por cliente
- Área de notícias / conteúdo editorial
- Captura de lead com armazenamento em banco
- Relatórios em PDF com marca do cliente

> Restrição registrada: conteúdo de caráter noticioso ou de recomendação financeira
> depende de aprovação prévia de compliance.

## Removido de propósito

- **Pix (QR e copia-e-cola)** — retirado a pedido do cliente. Não reintroduzir.
- **QR Code genérico** — retirado do ar em versão anterior a pedido do cliente.
  O QR do WhatsApp permanece porque é parte da ferramenta de link.
- **Gerador de títulos de SEO** — removido na v1.5; entregava sugestão genérica
  sem base em dado real.

## Dívida técnica conhecida

1. **Ficha do Google — desambiguação de filiais.** Quando várias unidades têm o mesmo
   nome, o Text Search devolve a mais proeminente, não a que o usuário escolheu.
   Direção da correção: extrair coordenadas/FTID da URL em vez de buscar pelo nome.
2. **Links `share.google`** resolvem para `share.google/error` quando seguidos pelo servidor.
3. **HEIC → JPG** ainda não foi testado com foto real de iPhone.
4. **Testes de regressão dos conversores** (PROMPT 15) — fixtures pendentes.
