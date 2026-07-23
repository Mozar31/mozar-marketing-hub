/**
 * Helpers de servidor compartilhados pelas ferramentas que leem sites públicos
 * (verificador de tags, auditor de SEO, links quebrados e Auditoria 360).
 * Todas rodam no runtime "motor" (Fase B). Nada é gravado: só lemos a página
 * pública que o usuário informar.
 */

const LIMITE_HTML = 3_000_000; // ~3MB de HTML é mais que suficiente
const TIMEOUT_MS = 15_000;

export const UA =
  "Mozilla/5.0 (compatible; ConsigInvestHub/1.0; +https://hub.consiginvest.com)";

/** Proteção anti-SSRF: bloqueia alvos internos/privados. */
export function alvoSeguro(u: URL): boolean {
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".localhost")) return false;
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd")) return false;
  if (h === "169.254.169.254") return false; // metadata de cloud
  if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.)/.test(h)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
  return true;
}

/**
 * Normaliza a entrada do usuário em URL (adiciona https:// se faltar) e valida.
 * Lança Error com um código estável ('url_vazia' | 'url_invalida' | 'url_bloqueada').
 */
export function resolverAlvo(bruto: string): URL {
  const s = (bruto || "").trim();
  if (!s) throw new Error("url_vazia");
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    throw new Error("url_invalida");
  }
  if (!alvoSeguro(u)) throw new Error("url_bloqueada");
  return u;
}

export interface RespostaHtml {
  html: string;
  status: number;
  finalUrl: string;
}

/**
 * Busca o HTML de uma página pública, com timeout e limite de tamanho.
 * Lança Error('timeout') no estouro de tempo e Error('site_inacessivel') em
 * falha de rede.
 */
export async function buscarHtml(alvo: URL): Promise<RespostaHtml> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(alvo.toString(), {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    });

    let html = "";
    if (resp.ok) {
      const reader = resp.body?.getReader();
      if (reader) {
        const dec = new TextDecoder();
        let total = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          total += value.length;
          html += dec.decode(value, { stream: true });
          if (total >= LIMITE_HTML) { await reader.cancel(); break; }
        }
      } else {
        html = (await resp.text()).slice(0, LIMITE_HTML);
      }
    }
    return { html, status: resp.status, finalUrl: resp.url || alvo.toString() };
  } catch (e) {
    throw new Error((e as Error)?.name === "AbortError" ? "timeout" : "site_inacessivel");
  } finally {
    clearTimeout(timer);
  }
}

export interface StatusLink {
  status: number; // HTTP status; 0 em erro de rede/timeout
  erro?: "timeout" | "rede" | "bloqueado";
}

/**
 * Checa o status de UMA URL. Tenta HEAD (barato); se o servidor não suportar
 * (405/501) ou falhar, tenta GET. Retorna status 0 + código em erro de rede.
 * Aplica a mesma guarda anti-SSRF: um link para IP interno não é seguido.
 */
export async function checarStatus(bruta: string, timeoutMs = 8_000): Promise<StatusLink> {
  let alvo: URL;
  try {
    alvo = new URL(bruta);
  } catch {
    return { status: 0, erro: "rede" };
  }
  if (!alvoSeguro(alvo)) return { status: 0, erro: "bloqueado" };

  const tentar = async (metodo: "HEAD" | "GET"): Promise<number> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const resp = await fetch(alvo.toString(), {
        method: metodo,
        redirect: "follow",
        signal: ctrl.signal,
        headers: { "User-Agent": UA, Accept: "*/*" },
      });
      // Não lemos o corpo no GET de fallback: só o status interessa.
      if (metodo === "GET") { try { await resp.body?.cancel(); } catch { /* ignore */ } }
      return resp.status;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    const st = await tentar("HEAD");
    if (st === 405 || st === 501 || st === 403) {
      // Alguns servidores recusam HEAD; confirma com GET antes de acusar erro.
      try { return { status: await tentar("GET") }; } catch { return { status: st }; }
    }
    return { status: st };
  } catch (e) {
    if ((e as Error)?.name === "AbortError") return { status: 0, erro: "timeout" };
    // HEAD falhou (rede/CORS/protocolo) — tenta GET antes de desistir.
    try {
      return { status: await tentar("GET") };
    } catch (e2) {
      return { status: 0, erro: (e2 as Error)?.name === "AbortError" ? "timeout" : "rede" };
    }
  }
}

/** Executa `tarefas` com no máximo `limite` em paralelo, preservando a ordem. */
export async function emLotes<T, R>(itens: T[], limite: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const resultado: R[] = new Array(itens.length);
  let proximo = 0;
  const trabalhadores = Array.from({ length: Math.min(limite, itens.length) }, async () => {
    for (;;) {
      const i = proximo++;
      if (i >= itens.length) break;
      resultado[i] = await fn(itens[i]!, i);
    }
  });
  await Promise.all(trabalhadores);
  return resultado;
}
