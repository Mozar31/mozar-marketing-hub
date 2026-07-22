/**
 * Links compartilháveis das ferramentas: guardam o estado nos parâmetros da URL.
 * Usado nas calculadoras (ROI, mídia, break-even) para o profissional mandar um
 * cálculo já preenchido para o cliente. Tudo no navegador — nenhum dado sai daqui.
 */

/** Lê os parâmetros da URL atual como um objeto simples. */
export function readShareParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  const o: Record<string, string> = {};
  sp.forEach((v, k) => {
    o[k] = v;
  });
  return o;
}

/** Monta o link com os parâmetros e copia para a área de transferência. */
export async function copyShareLink(params: Record<string, string>): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const sp = new URLSearchParams(params);
  const url = `${window.location.origin}${window.location.pathname}?${sp.toString()}`;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
