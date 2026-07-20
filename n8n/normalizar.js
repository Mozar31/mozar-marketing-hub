// Código do node "Normalizar e filtrar" do fluxo n8n/noticias-rss.json.
// Fica em arquivo próprio para ser legível e testável; `node n8n/build.js`
// injeta este conteúdo dentro do JSON do workflow.
//
// Regras da especificação (cap. 12):
//  - deduplicar por URL canônica
//  - guardar fonte, autor e data
//  - resumo curto, NUNCA o artigo inteiro
//  - nada entra publicado: status 'pending' aguarda revisão humana

const LIMITE_RESUMO = 400;

// ATENÇÃO: o sandbox do Code node do n8n NÃO expõe o construtor `URL`.
// A versão anterior usava `new URL(...)` dentro de try/catch e o catch engolia
// "URL is not defined" em silêncio — nenhum domínio era reconhecido e as 1.154
// notícias eram descartadas (execução 1669). Tudo aqui é feito com regex.

const RE_URL = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]+)([^?#]*)(?:\?([^#]*))?/i;

/** Hostname em minúsculas, sem credenciais, porta nem "www.". */
function hostDe(u) {
  const m = String(u || '').trim().match(RE_URL);
  if (!m) return '';
  return m[2]
    .toLowerCase()
    .replace(/^[^@]*@/, '')
    .replace(/:\d+$/, '')
    .replace(/^www\./, '');
}

const RE_PARAM_CAMPANHA = /^(utm_|fbclid|gclid|mc_cid|mc_eid|ref$|source$)/i;

/** Remove parâmetros de campanha e normaliza para comparar URLs. */
function normalizarUrl(bruta) {
  const s = String(bruta || '').trim();
  if (!s) return '';
  const m = s.match(RE_URL);
  if (!m) return s;

  const host = hostDe(s);
  // A barra final fica no PATH, antes da query.
  const caminho = (m[3] || '').replace(/\/+$/, '');
  const params = (m[4] || '')
    .split('&')
    .filter(Boolean)
    .filter((p) => !RE_PARAM_CAMPANHA.test(p.split('=')[0]));
  // Ordem dos parâmetros não pode mudar a identidade da URL.
  params.sort();

  return 'https://' + host + caminho + (params.length ? '?' + params.join('&') : '');
}

function limparTexto(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Índice das fontes por domínio.
//
// NÃO usar pairedItem aqui: o node de RSS transforma 8 entradas em ~1.150 saídas
// e o pareamento automático não sobrevive a isso. Bug real observado na execução
// 1667 — 115 de 123 itens chegaram com source_id nulo e o banco recusou todos.
const fontes = $('Buscar fontes ativas').all().map((i) => i.json);
const porHost = new Map();
for (const f of fontes) {
  for (const cand of [f.site_url, f.feed_url]) {
    const h = hostDe(cand);
    if (h && !porHost.has(h)) porHost.set(h, f);
  }
}

function acharFonte(link) {
  const h = hostDe(link);
  if (!h) return null;
  if (porHost.has(h)) return porHost.get(h);
  // fallback: subdomínio ou domínio pai (ex.: news.openai.com ↔ openai.com)
  for (const [host, f] of porHost) {
    if (h.endsWith('.' + host) || host.endsWith('.' + h)) return f;
  }
  return null;
}

const saida = [];
let semFonte = 0;

for (const item of $input.all()) {
  const rss = item.json;

  const link = rss.link || rss.guid || '';
  if (!link) continue;

  const titulo = limparTexto(rss.title);
  if (!titulo) continue;

  const dataBruta = rss.isoDate || rss.pubDate || rss.published || null;
  const publicado = dataBruta ? new Date(dataBruta) : null;
  if (!publicado || isNaN(publicado.getTime())) continue;

  // Só interessa notícia recente: nada com mais de 45 dias.
  const dias = (Date.now() - publicado.getTime()) / 86400000;
  if (dias > 45) continue;

  // Sem fonte identificada não grava: source_id é NOT NULL no banco.
  const fonte = acharFonte(link);
  if (!fonte) {
    semFonte++;
    continue;
  }

  const resumoBruto = limparTexto(rss.contentSnippet || rss.summary || rss.content || '');
  const resumo =
    resumoBruto.length > LIMITE_RESUMO
      ? resumoBruto.slice(0, LIMITE_RESUMO).replace(/\s+\S*$/, '') + '...'
      : resumoBruto;

  saida.push({
    json: {
      source_id: fonte.id,
      titulo: titulo.slice(0, 300),
      resumo: resumo || null,
      canonical_url: link,
      url_hash: normalizarUrl(link),
      autor: limparTexto(rss.creator || rss.author || '') || null,
      publicado_em: publicado.toISOString(),
      categoria: fonte.categoria || 'ia',
      // Fonte oficial do fornecedor = anúncio. Qualquer outra = análise.
      tipo: fonte.confianca === 'oficial' ? 'anuncio' : 'analise',
      // NADA entra publicado automaticamente. Revisão humana decide.
      status: 'pending',
    },
  });
}

if (semFonte) console.log('Itens descartados por domínio desconhecido:', semFonte);

return saida;
