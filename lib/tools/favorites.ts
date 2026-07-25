/**
 * Favoritos locais (sem login). Guardados no localStorage do navegador —
 * privado por padrão, sem enviar nada ao servidor (cap. 15/módulo 10 da spec).
 */

const CHAVE = "hub_favoritos_v1";

export function lerFavoritos(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CHAVE);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function gravar(slugs: string[]) {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify([...new Set(slugs)]));
    window.dispatchEvent(new CustomEvent("favoritos:mudou"));
  } catch {
    /* localStorage indisponível — ignora */
  }
}

export function ehFavorito(slug: string): boolean {
  return lerFavoritos().includes(slug);
}

/** Alterna o favorito e devolve o novo estado (true = agora é favorito). */
export function alternarFavorito(slug: string): boolean {
  const atuais = lerFavoritos();
  const tem = atuais.includes(slug);
  gravar(tem ? atuais.filter((s) => s !== slug) : [...atuais, slug]);
  return !tem;
}
