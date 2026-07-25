import { NextResponse } from "next/server";
import { resolverAlvo, buscarHtml, checarStatus } from "@/lib/server/http";
import { analisarAeo } from "@/lib/server/aeo";

/**
 * Verificador de prontidão para IA (AEO/GEO) — roda no SERVIDOR (motor).
 * Lê a página pública e checa o llms.txt do domínio; avalia sinais que ajudam
 * a página a ser citada por assistentes de IA.
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

  // Checa llms.txt na raiz do domínio (não bloqueia se falhar).
  let temLlmsTxt = false;
  try {
    const st = await checarStatus(new URL("/llms.txt", pagina.finalUrl).toString(), 6000);
    temLlmsTxt = st.status >= 200 && st.status < 300;
  } catch {
    temLlmsTxt = false;
  }

  const aeo = analisarAeo(pagina.html, pagina.finalUrl, temLlmsTxt);

  return NextResponse.json({ ok: true, url: pagina.finalUrl, ...aeo });
}
