import { NextResponse } from "next/server";
import { resolverAlvo, buscarHtml, checarStatus, emLotes } from "@/lib/server/http";
import { extrairLinks } from "@/lib/server/links";

/**
 * Verificador de links quebrados (#18) — roda no SERVIDOR (motor, Fase B).
 * Lê a página pública informada, extrai os links e checa o status de cada um.
 * Reporta os que dão erro (404/5xx) e os que não respondem. Nada é gravado.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMITE_CHECAR = 60; // teto de links checados por análise (desempenho)
const CONCORRENCIA = 8;

export async function POST(req: Request) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "requisicao_invalida" }, { status: 400 });
  }

  let alvo;
  try {
    alvo = resolverAlvo(body.url || "");
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  let pagina;
  try {
    pagina = await buscarHtml(alvo);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 200 });
  }
  if (pagina.status >= 400) {
    return NextResponse.json({ error: "site_inacessivel", status: pagina.status }, { status: 200 });
  }

  const todos = extrairLinks(pagina.html, pagina.finalUrl);
  const aChecar = todos.slice(0, LIMITE_CHECAR);

  const status = await emLotes(aChecar, CONCORRENCIA, (l) => checarStatus(l.url));

  const quebrados: { url: string; texto: string; status: number; interno: boolean }[] = [];
  const semResposta: { url: string; texto: string; interno: boolean }[] = [];

  aChecar.forEach((l, i) => {
    const s = status[i]!;
    if (s.status >= 400) {
      quebrados.push({ url: l.url, texto: l.texto, status: s.status, interno: l.interno });
    } else if (s.status === 0 && s.erro !== "bloqueado") {
      semResposta.push({ url: l.url, texto: l.texto, interno: l.interno });
    }
  });

  // Ordena: quebrados internos primeiro (mais sob controle do dono do site).
  quebrados.sort((a, b) => Number(b.interno) - Number(a.interno) || a.status - b.status);

  return NextResponse.json({
    ok: true,
    url: pagina.finalUrl,
    total: todos.length,
    verificados: aChecar.length,
    truncado: todos.length > aChecar.length,
    quebrados,
    semResposta,
  });
}
