# Workflows do n8n

Os fluxos que o Hub depende ficam versionados aqui. O n8n em si não guarda histórico
legível — se alguém editar um nó no painel e quebrar, este arquivo é a referência do que
era para estar lá.

Instância: **https://n8n.vpsmozar.plusnetworks.com.br**

## `noticias-rss.json` — coleta de notícias

Roda todo dia às 07h (horário de Brasília):

```
Schedule → busca fontes ativas no Supabase → lê cada RSS
        → normaliza e filtra → grava no Supabase
```

**Decisões embutidas no fluxo:**

- **Nada é publicado automaticamente.** Todo item entra com `status = 'pending'`.
  O que aparece no site é só o que alguém aprovar. Isso atende ao cap. 12 da
  especificação (revisão humana) e mantém a responsabilidade editorial com a Consig.
- **Resumo curto, nunca o artigo inteiro** (máx. 400 caracteres), com autor, data e link
  para a fonte original — a spec proíbe republicar matéria completa.
- **Deduplicação por URL normalizada**: `url_hash` remove `utm_*`, `fbclid`, `gclid`,
  âncora, `www.` e barra final. A mesma notícia vinda de dois caminhos entra uma vez só.
  No banco, `on_conflict=url_hash` + `Prefer: resolution=ignore-duplicates` descarta a
  repetida em silêncio, sem gerar erro.
- **Fonte oficial do fornecedor → `tipo = 'anuncio'`; as demais → `'analise'`.** A spec
  exige separar anúncio oficial de análise e de rumor.
- **Só notícia dos últimos 45 dias.** Feed grande (a OpenAI tem mais de mil itens) não
  entope o banco com arquivo histórico na primeira execução.
- **`onError: continueRegularOutput`** no RSS e na gravação: um feed fora do ar não
  derruba a coleta dos outros.

## Credencial

Todos os nós usam a credencial **`Supabase Marketing Hub`** (tipo *Supabase API*).

⚠️ **Gotcha conhecido**: ao importar um workflow, o n8n mostra o nome da credencial mas
às vezes perde o vínculo interno, e o nó falha com *"Credentials not found"*. Se acontecer,
abra o nó, **re-selecione a credencial na lista** (mesmo já aparecendo escrita), salve e
publique.

## Como importar

1. Abra a instância → **Create Workflow**
2. No canvas, `Ctrl+A` → `Delete` (limpa o nó inicial)
3. Cole o conteúdo do JSON com `Ctrl+V`
4. Confira a credencial em cada nó HTTP
5. **Save** e depois **Publish** (sem publicar, o agendamento não roda)

## Fluxos relacionados (já no ar)

- **Análise da ficha do Google** — webhook `gmb-analyze`, com cache de 7 dias e cota de
  30 consultas/dia. A chave do Google Places vive só ali, nunca no site.
