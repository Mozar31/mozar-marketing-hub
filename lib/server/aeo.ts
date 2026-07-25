/**
 * Verificador de prontidão para IA (AEO/GEO). Avalia sinais on-page que ajudam
 * uma página a ser ENTENDIDA e CITADA por assistentes (ChatGPT, Perplexity,
 * Google AI Overviews): conteúdo textual, dados estruturados, formato de
 * perguntas, hierarquia, autoria, data, HTTPS e llms.txt.
 *
 * Sinais on-page, não uma garantia de citação — a interface deixa isso claro.
 */

export type AeoNivel = "ok" | "aviso" | "erro";
export interface AeoAchado { chave: string; titulo: string; nivel: AeoNivel; valor?: string; detalhe: string; }
export interface ResultadoAeo { pontos: AeoAchado[]; nota: number; resumo: { ok: number; aviso: number; erro: number }; }

function textoVisivel(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function analisarAeo(html: string, finalUrl: string, temLlmsTxt: boolean): ResultadoAeo {
  const pontos: AeoAchado[] = [];
  const add = (a: AeoAchado) => pontos.push(a);
  const texto = textoVisivel(html);
  const palavras = texto ? texto.split(" ").filter(Boolean).length : 0;

  // 1. Conteúdo textual — IA precisa de texto para citar.
  if (palavras < 300) add({ chave: "texto", titulo: "Conteúdo em texto", nivel: "erro", valor: `${palavras} palavras`, detalhe: "Pouco texto na página. Assistentes de IA citam o que está escrito — páginas quase só com imagem/vídeo raramente são citadas." });
  else if (palavras < 600) add({ chave: "texto", titulo: "Conteúdo em texto", nivel: "aviso", valor: `${palavras} palavras`, detalhe: "Texto curto. Mais conteúdo claro e objetivo aumenta a chance de a IA usar sua página como fonte." });
  else add({ chave: "texto", titulo: "Conteúdo em texto", nivel: "ok", valor: `${palavras} palavras`, detalhe: "Boa quantidade de texto para a IA entender e citar." });

  // 2. Dados estruturados (JSON-LD).
  const jsonld = (html.match(/<script[^>]+type=["']application\/ld\+json["']/gi) || []).length;
  add(jsonld > 0
    ? { chave: "schema", titulo: "Dados estruturados (Schema)", nivel: "ok", detalhe: "Tem dados estruturados — ajudam a IA a entender do que a página trata (produto, artigo, FAQ, empresa)." }
    : { chave: "schema", titulo: "Dados estruturados (Schema)", nivel: "aviso", detalhe: "Sem dados estruturados (JSON-LD). Adicionar Schema (ex.: Article, FAQ, Organization) ajuda a IA a interpretar a página." });

  // 3. Formato de perguntas e respostas (FAQ).
  const temFaqSchema = /"@type"\s*:\s*"FAQPage"|"@type"\s*:\s*"Question"/i.test(html);
  const perguntasH = (html.match(/<h[2-4][^>]*>[^<]*\?[^<]*<\/h[2-4]>/gi) || []).length;
  if (temFaqSchema || perguntasH >= 2) add({ chave: "faq", titulo: "Formato de perguntas e respostas", nivel: "ok", detalhe: "A página responde perguntas diretamente — é o formato que a IA mais reaproveita nas respostas." });
  else add({ chave: "faq", titulo: "Formato de perguntas e respostas", nivel: "aviso", detalhe: "Poucas perguntas respondidas. Estruture o conteúdo como pergunta → resposta curta (e/ou use FAQ Schema); é o que a IA cita." });

  // 4. Hierarquia de títulos.
  const h1 = (html.match(/<h1\b/gi) || []).length;
  const h2 = (html.match(/<h2\b/gi) || []).length;
  if (h1 >= 1 && h2 >= 2) add({ chave: "estrutura", titulo: "Estrutura de títulos", nivel: "ok", valor: `1 H1 · ${h2} H2`, detalhe: "Boa estrutura de títulos — a IA usa os subtítulos para localizar a resposta certa." });
  else add({ chave: "estrutura", titulo: "Estrutura de títulos", nivel: "aviso", valor: `${h1} H1 · ${h2} H2`, detalhe: "Estrutura fraca. Use um H1 e vários H2 descritivos (de preferência em forma de pergunta) para a IA achar o trecho certo." });

  // 5. Autoria / entidade.
  const temAutor = /"@type"\s*:\s*"(Person|Organization)"/i.test(html) || /<meta[^>]+name=["']author["']/i.test(html) || /rel=["']author["']/i.test(html);
  add(temAutor
    ? { chave: "autoria", titulo: "Autoria / marca identificada", nivel: "ok", detalhe: "Autor ou empresa identificados — a IA confia mais (e cita mais) fontes com autoria clara." }
    : { chave: "autoria", titulo: "Autoria / marca identificada", nivel: "aviso", detalhe: "Sem autor/entidade clara. Declare quem escreveu (autor) e a empresa (Organization) — aumenta a confiança para a IA." });

  // 6. Data visível.
  const temData = /"datePublished"|"dateModified"|article:published_time|datetime=/i.test(html);
  add(temData
    ? { chave: "data", titulo: "Data de publicação/atualização", nivel: "ok", detalhe: "Data presente — a IA tende a preferir conteúdo com data (mais confiável e atual)." }
    : { chave: "data", titulo: "Data de publicação/atualização", nivel: "aviso", detalhe: "Sem data visível. Mostrar quando foi publicado/atualizado ajuda a IA a considerar o conteúdo confiável." });

  // 7. HTTPS.
  add(/^https:/i.test(finalUrl)
    ? { chave: "https", titulo: "Conexão segura (HTTPS)", nivel: "ok", detalhe: "Servida por HTTPS — requisito básico de confiança." }
    : { chave: "https", titulo: "Conexão segura (HTTPS)", nivel: "erro", detalhe: "Sem HTTPS. Além de afastar visitantes, prejudica a confiança para buscadores e IA." });

  // 8. llms.txt — padrão emergente que diz à IA o que ela pode usar.
  add(temLlmsTxt
    ? { chave: "llms", titulo: "Arquivo llms.txt", nivel: "ok", detalhe: "Tem llms.txt — o novo padrão que orienta assistentes de IA sobre o conteúdo do site. Sai na frente." }
    : { chave: "llms", titulo: "Arquivo llms.txt", nivel: "aviso", detalhe: "Sem llms.txt. É um padrão novo (opcional) que resume o site para assistentes de IA. Fácil de criar e ainda pouco usado — bom diferencial." });

  const resumo = { ok: 0, aviso: 0, erro: 0 };
  for (const p of pontos) resumo[p.nivel]++;
  const nota = pontos.length ? Math.round(((resumo.ok + resumo.aviso * 0.5) / pontos.length) * 100) : 0;
  return { pontos, nota, resumo };
}
