import { NextResponse } from "next/server";
import { resolverAlvo, buscarHtml } from "@/lib/server/http";
import { analisarLanding } from "@/lib/server/landing";

/**
 * Analisador de Landing Page (#06) — roda no SERVIDOR (motor, Fase B).
 * Lê a página pública e avalia se ela está preparada para converter visitante
 * em contato/venda (proposta, CTA, contato, formulário, prova social, mobile,
 * HTTPS, medição e peso).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const landing = analisarLanding(pagina.html, pagina.finalUrl);

  return NextResponse.json({ ok: true, url: pagina.finalUrl, ...landing });
}
