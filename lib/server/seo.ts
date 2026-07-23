/**
 * Auditor de SEO on-page. Recebe o HTML da página (e a URL final, após
 * redirecionamentos) e devolve uma lista de pontos verificados com nível
 * (ok / aviso / erro), o valor encontrado e uma explicação em português.
 *
 * Extração por regex de propósito: o objetivo é sinalizar presença/ausência e
 * tamanho de elementos-chave, não montar uma árvore DOM. O HTML nunca é gravado.
 */

export type SeoNivel = "ok" | "aviso" | "erro";

export interface SeoAchado {
  chave: string;
  titulo: string;
  nivel: SeoNivel;
  valor?: string;
  detalhe: string;
}

export interface ResultadoSeo {
  pontos: SeoAchado[];
  nota: number; // 0–100
  resumo: { ok: number; aviso: number; erro: number };
}

/** Lê os atributos de UMA tag (ex.: um `<meta ...>`) num mapa nome→valor. */
function lerAtributos(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag))) {
    const nome = m[1];
    if (!nome) continue;
    attrs[nome.toLowerCase()] = (m[3] ?? m[4] ?? m[5] ?? "").trim();
  }
  return attrs;
}

function todasTags(html: string, nome: string): Record<string, string>[] {
  const re = new RegExp(`<${nome}\\b[^>]*>`, "gi");
  return (html.match(re) || []).map(lerAtributos);
}

/** Conteúdo de um <meta> por name/property (ex.: 'description', 'og:title'). */
function metaConteudo(metas: Record<string, string>[], chave: string): string | null {
  const alvo = chave.toLowerCase();
  for (const a of metas) {
    if ((a.name?.toLowerCase() === alvo || a.property?.toLowerCase() === alvo) && a.content != null) {
      return a.content;
    }
  }
  return null;
}

function txt(html: string, re: RegExp): string | null {
  const v = html.match(re)?.[1];
  return v != null ? v.replace(/\s+/g, " ").trim() : null;
}

export function analisarSeo(html: string, finalUrl: string): ResultadoSeo {
  const pontos: SeoAchado[] = [];
  const metas = todasTags(html, "meta");
  const add = (a: SeoAchado) => pontos.push(a);

  // 1. Título
  const title = txt(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!title) {
    add({ chave: "title", titulo: "Título da página (title)", nivel: "erro", detalhe: "Não há tag <title>. É o texto azul do resultado no Google — sem ele, a página perde o principal fator de clique." });
  } else {
    const n = title.length;
    const nivel: SeoNivel = n < 10 || n > 65 ? "aviso" : "ok";
    add({ chave: "title", titulo: "Título da página (title)", nivel, valor: `${n} caracteres`, detalhe: n > 65 ? "Título longo demais — o Google corta por volta de 60 caracteres. Encurte para não perder o final." : n < 10 ? "Título muito curto — aproveite para incluir o que a página oferece e a palavra-chave principal." : "Bom tamanho para aparecer inteiro no Google." });
  }

  // 2. Meta description
  const desc = metaConteudo(metas, "description");
  if (!desc) {
    add({ chave: "description", titulo: "Descrição (meta description)", nivel: "aviso", detalhe: "Sem meta description. O Google inventa um trecho da página — escrever a sua aumenta a taxa de clique." });
  } else {
    const n = desc.length;
    const nivel: SeoNivel = n < 50 || n > 165 ? "aviso" : "ok";
    add({ chave: "description", titulo: "Descrição (meta description)", nivel, valor: `${n} caracteres`, detalhe: n > 165 ? "Descrição longa — o Google corta por volta de 155–160 caracteres." : n < 50 ? "Descrição curta — use o espaço para convencer a pessoa a clicar." : "Bom tamanho de descrição." });
  }

  // 3. H1
  const h1 = (html.match(/<h1\b[^>]*>/gi) || []).length;
  if (h1 === 0) add({ chave: "h1", titulo: "Título principal (H1)", nivel: "erro", valor: "0", detalhe: "A página não tem H1. É o título visível principal e ajuda o Google a entender o assunto." });
  else if (h1 > 1) add({ chave: "h1", titulo: "Título principal (H1)", nivel: "aviso", valor: `${h1}`, detalhe: "Há mais de um H1. O recomendado é um único H1 por página, deixando os demais como H2/H3." });
  else add({ chave: "h1", titulo: "Título principal (H1)", nivel: "ok", valor: "1", detalhe: "Um único H1, como recomendado." });

  // 4. Viewport (mobile)
  const viewport = metaConteudo(metas, "viewport");
  add(viewport
    ? { chave: "viewport", titulo: "Responsivo no celular (viewport)", nivel: "ok", detalhe: "Tag viewport presente — a página se adapta ao celular, que é como o Google indexa." }
    : { chave: "viewport", titulo: "Responsivo no celular (viewport)", nivel: "erro", detalhe: "Sem a tag viewport, o site não se ajusta ao celular. O Google usa a versão mobile para ranquear." });

  // 5. Idioma
  const htmlTag = (html.match(/<html\b[^>]*>/i) || [])[0];
  const lang = htmlTag ? lerAtributos(htmlTag).lang : "";
  add(lang
    ? { chave: "lang", titulo: "Idioma declarado (lang)", nivel: "ok", valor: lang, detalhe: "Idioma declarado no <html> — ajuda buscadores e leitores de tela." }
    : { chave: "lang", titulo: "Idioma declarado (lang)", nivel: "aviso", detalhe: "Sem atributo lang no <html>. Declare (ex.: lang=\"pt-BR\") para acessibilidade e SEO." });

  // 6. Canonical
  const canonical = todasTags(html, "link").find((a) => a.rel?.toLowerCase() === "canonical")?.href;
  add(canonical
    ? { chave: "canonical", titulo: "URL canônica (canonical)", nivel: "ok", detalhe: "Canonical presente — evita conteúdo duplicado indicando a URL oficial da página." }
    : { chave: "canonical", titulo: "URL canônica (canonical)", nivel: "aviso", detalhe: "Sem link canonical. Ajuda a evitar que variações da mesma URL virem conteúdo duplicado." });

  // 7. Open Graph (compartilhamento em redes)
  const ogTitle = metaConteudo(metas, "og:title");
  const ogImage = metaConteudo(metas, "og:image");
  if (ogTitle && ogImage) add({ chave: "og", titulo: "Prévia em redes sociais (Open Graph)", nivel: "ok", detalhe: "og:title e og:image presentes — o link vira um card bonito ao ser compartilhado." });
  else add({ chave: "og", titulo: "Prévia em redes sociais (Open Graph)", nivel: "aviso", valor: !ogTitle && !ogImage ? "faltam título e imagem" : !ogImage ? "falta imagem" : "falta título", detalhe: "Sem Open Graph completo, o link compartilhado no WhatsApp/Facebook fica sem imagem ou título atraente." });

  // 8. Charset
  const temCharset = metas.some((a) => "charset" in a) || /<meta[^>]+http-equiv=["']?content-type/i.test(html);
  add(temCharset
    ? { chave: "charset", titulo: "Codificação (charset)", nivel: "ok", detalhe: "Charset declarado — evita acentos quebrados." }
    : { chave: "charset", titulo: "Codificação (charset)", nivel: "aviso", detalhe: "Sem charset declarado (ex.: <meta charset=\"utf-8\">). Pode causar acentuação quebrada." });

  // 9. Imagens sem alt.
  // Só conta como problema a imagem SEM o atributo alt. Um alt="" (vazio de
  // propósito) marca a imagem como decorativa — ex.: logo ao lado do nome da
  // marca — e é o comportamento correto de acessibilidade, então não acusamos.
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const semAlt = imgs.filter((t) => !("alt" in lerAtributos(t))).length;
  if (imgs.length === 0) add({ chave: "alt", titulo: "Texto alternativo das imagens (alt)", nivel: "ok", detalhe: "Nenhuma imagem <img> na página inicial para avaliar." });
  else if (semAlt === 0) add({ chave: "alt", titulo: "Texto alternativo das imagens (alt)", nivel: "ok", valor: `${imgs.length} imagens`, detalhe: "Todas as imagens declaram alt (mesmo que vazio, para as decorativas) — bom para acessibilidade e para o Google Imagens." });
  else add({ chave: "alt", titulo: "Texto alternativo das imagens (alt)", nivel: "aviso", valor: `${semAlt} de ${imgs.length} sem alt`, detalhe: "Imagens sem o atributo alt não são entendidas pelo Google nem por leitores de tela. Descreva o que a imagem mostra (ou use alt=\"\" se for puramente decorativa)." });

  // 10. Bloqueio de indexação (robots noindex)
  const robots = (metaConteudo(metas, "robots") || "").toLowerCase();
  if (robots.includes("noindex")) add({ chave: "robots", titulo: "Permissão de indexação (robots)", nivel: "erro", valor: robots, detalhe: "A página tem 'noindex' — você está pedindo ao Google para NÃO mostrá-la nas buscas. Se não é de propósito, remova." });
  else add({ chave: "robots", titulo: "Permissão de indexação (robots)", nivel: "ok", detalhe: "A página está liberada para indexação (sem noindex)." });

  // 11. HTTPS
  const https = /^https:/i.test(finalUrl);
  add(https
    ? { chave: "https", titulo: "Conexão segura (HTTPS)", nivel: "ok", detalhe: "Servida por HTTPS — fator de ranqueamento e de confiança do usuário." }
    : { chave: "https", titulo: "Conexão segura (HTTPS)", nivel: "erro", detalhe: "A página não usa HTTPS. Navegadores marcam como 'não seguro' e o Google penaliza." });

  const resumo = { ok: 0, aviso: 0, erro: 0 };
  for (const p of pontos) resumo[p.nivel]++;
  const nota = pontos.length
    ? Math.round(((resumo.ok + resumo.aviso * 0.5) / pontos.length) * 100)
    : 0;

  return { pontos, nota, resumo };
}
