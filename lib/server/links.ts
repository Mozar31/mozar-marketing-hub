/**
 * Extração de links de uma página. Função pura: recebe HTML + URL base e devolve
 * a lista de links http/https únicos (resolvendo relativos para absolutos).
 * A checagem de status de cada link fica na rota, que usa `checarStatus`.
 */

export interface LinkExtraido {
  url: string; // absoluto, sem hash
  texto: string; // texto âncora (para o usuário reconhecer o link)
  interno: boolean; // mesmo host da página
}

function limparTexto(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function extrairLinks(html: string, baseUrl: string): LinkExtraido[] {
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return [];
  }

  const vistos = new Set<string>();
  const links: LinkExtraido[] = [];
  const re = /<a\b([^>]*?)\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))([^>]*)>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;

  while ((m = re.exec(html))) {
    const bruto = (m[3] ?? m[4] ?? m[5] ?? "").trim();
    if (!bruto) continue;
    const baixo = bruto.toLowerCase();
    // Ignora âncoras internas e esquemas que não são páginas web.
    if (baixo.startsWith("#") || baixo.startsWith("mailto:") || baixo.startsWith("tel:") || baixo.startsWith("javascript:") || baixo.startsWith("data:") || baixo.startsWith("sms:") || baixo.startsWith("whatsapp:")) continue;

    let abs: URL;
    try {
      abs = new URL(bruto, base);
    } catch {
      continue;
    }
    if (abs.protocol !== "http:" && abs.protocol !== "https:") continue;

    abs.hash = "";
    const chave = abs.toString();
    if (vistos.has(chave)) continue;
    vistos.add(chave);

    links.push({
      url: chave,
      texto: limparTexto(m[7] || "").slice(0, 80),
      interno: abs.hostname === base.hostname,
    });
  }

  return links;
}
