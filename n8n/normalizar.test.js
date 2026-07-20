/**
 * Testa n8n/normalizar.js fora do n8n, simulando $input e $().
 *
 *   node n8n/normalizar.test.js
 *
 * Existe por causa de um bug real: na execução 1667 o pareamento automático do
 * n8n falhou e 115 de 123 notícias foram gravadas sem fonte, quebrando no banco.
 * Este arquivo garante que o casamento por domínio resolve isso.
 */
const fs = require("fs");
const path = require("path");

const codigo = fs.readFileSync(path.join(__dirname, "normalizar.js"), "utf8");

/**
 * Roda o código como o n8n roda.
 *
 * CRÍTICO: o sandbox do Code node NÃO tem `URL`, `fetch`, `require` nem `process`.
 * Passamos esses nomes como parâmetros undefined para que fiquem indisponíveis
 * dentro do código, exatamente como lá. Sem isso, o teste passa aqui e quebra em
 * produção — foi o que aconteceu na execução 1669: `new URL()` lançava
 * "URL is not defined", o catch engolia, e as 1.154 notícias sumiam em silêncio.
 */
const rodar = (itens, fontes) => {
  const $input = { all: () => itens.map((json) => ({ json })) };
  const $ = () => ({ all: () => fontes.map((json) => ({ json })) });
  const fn = new Function(
    "$input", "$", "console",
    "URL", "fetch", "require", "process", "globalThis", "window",
    codigo
  );
  return fn($input, $, { log: () => {} }, undefined, undefined, undefined, undefined, undefined, undefined);
};

const FONTES = [
  { id: "f-ads", nome: "Google Ads Developer Blog", feed_url: "https://ads-developers.googleblog.com/feeds/posts/default", site_url: "https://ads-developers.googleblog.com/", categoria: "google", confianca: "oficial" },
  { id: "f-search", nome: "Google Search Central", feed_url: "https://developers.google.com/search/blog/feed.xml", site_url: "https://developers.google.com/search/blog", categoria: "seo", confianca: "oficial" },
  { id: "f-openai", nome: "OpenAI News", feed_url: "https://openai.com/news/rss.xml", site_url: "https://openai.com/news/", categoria: "ia", confianca: "oficial" },
  { id: "f-meta", nome: "Meta Newsroom", feed_url: "https://about.fb.com/news/feed/", site_url: "https://about.fb.com/news/", categoria: "meta", confianca: "oficial" },
  { id: "f-sej", nome: "Search Engine Journal", feed_url: "https://www.searchenginejournal.com/feed/", site_url: "https://www.searchenginejournal.com/", categoria: "seo", confianca: "editorial" },
];

const agora = new Date().toISOString();
let falhas = 0;
const ok = (nome, cond, extra = "") => {
  console.log((cond ? "  OK   " : "  FALHA") + "  " + nome + (extra ? "  -> " + extra : ""));
  if (!cond) falhas++;
};

console.log("\n1. Toda notícia recebe a fonte certa (o bug da execução 1667)");
{
  const itens = [
    { title: "Ads muda algo", link: "https://ads-developers.googleblog.com/2026/07/x.html", isoDate: agora },
    { title: "Search muda algo", link: "https://developers.google.com/search/blog/2026/07/y", isoDate: agora },
    { title: "OpenAI lanca algo", link: "https://openai.com/index/z/", isoDate: agora },
    { title: "Meta anuncia algo", link: "https://about.fb.com/news/2026/07/w/", isoDate: agora },
    { title: "SEJ analisa algo", link: "https://www.searchenginejournal.com/artigo/", isoDate: agora },
  ];
  const r = rodar(itens, FONTES);
  ok("nenhum item sem fonte", r.every((x) => x.json.source_id), `${r.filter((x) => !x.json.source_id).length} sem fonte`);
  ok("cada um na sua fonte", r.map((x) => x.json.source_id).join(",") === "f-ads,f-search,f-openai,f-meta,f-sej", r.map((x) => x.json.source_id).join(","));
  ok("categoria vem da fonte", r[1].json.categoria === "seo", r[1].json.categoria);
  ok("fonte oficial vira 'anuncio'", r[0].json.tipo === "anuncio", r[0].json.tipo);
  ok("fonte editorial vira 'analise'", r[4].json.tipo === "analise", r[4].json.tipo);
  ok("notícia de marketing entra publicada (decisão do Mozar)", r.every((x) => x.json.status === "published"));
}

console.log("\n2. Domínio desconhecido é descartado, não gravado sem fonte");
{
  const r = rodar([{ title: "Site aleatorio", link: "https://exemplo-qualquer.com/post", isoDate: agora }], FONTES);
  ok("descartou item sem fonte conhecida", r.length === 0, `${r.length} itens`);
}

console.log("\n3. Deduplicação por URL");
{
  const itens = [
    { title: "A", link: "https://WWW.OpenAI.com/index/algo/?utm_source=rss&b=2&a=1#topo", isoDate: agora },
    { title: "A de novo", link: "http://openai.com/index/algo?a=1&b=2", isoDate: agora },
    { title: "Outra", link: "https://openai.com/index/outra", isoDate: agora },
  ];
  const r = rodar(itens, FONTES);
  ok("variações da mesma URL geram a mesma chave", r[0].json.url_hash === r[1].json.url_hash, r[0].json.url_hash + " vs " + r[1].json.url_hash);
  ok("notícia diferente continua separada", r[2].json.url_hash !== r[0].json.url_hash);
}

console.log("\n4. Filtros de qualidade");
{
  const velha = new Date(Date.now() - 90 * 86400000).toISOString();
  const itens = [
    { title: "Velha", link: "https://openai.com/index/velha", isoDate: velha },
    { title: "", link: "https://openai.com/index/sem-titulo", isoDate: agora },
    { title: "Sem data", link: "https://openai.com/index/sem-data" },
    { title: "Sem link", link: "", isoDate: agora },
    { title: "Boa", link: "https://openai.com/index/boa", isoDate: agora },
  ];
  const r = rodar(itens, FONTES);
  ok("só a notícia válida passa", r.length === 1 && r[0].json.titulo === "Boa", `${r.length} itens`);
}

console.log("\n5. Limpeza de conteúdo");
{
  const r = rodar([{ title: "T&iacute;tulo <b>com</b> &amp; tags", link: "https://openai.com/index/t", isoDate: agora, contentSnippet: "<p>" + "palavra ".repeat(200) + "</p>" }], FONTES);
  ok("tags HTML removidas do título", !/[<>]/.test(r[0].json.titulo), r[0].json.titulo);
  ok("entidade &amp; virou &", r[0].json.titulo.includes("&"), r[0].json.titulo);
  ok("resumo cortado em ~400 chars", r[0].json.resumo.length <= 404, r[0].json.resumo.length + " chars");
  ok("resumo não corta palavra no meio", r[0].json.resumo.endsWith("..."), r[0].json.resumo.slice(-20));
}

console.log("\n" + (falhas === 0 ? "TODOS OS TESTES PASSARAM" : falhas + " TESTE(S) FALHARAM"));
process.exit(falhas === 0 ? 0 : 1);
