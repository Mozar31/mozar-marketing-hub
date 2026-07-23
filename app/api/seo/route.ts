import { NextResponse } from "next/server";
import { resolverAlvo, buscarHtml } from "@/lib/server/http";
import { analisarSeo } from "@/lib/server/seo";

/**
 * Auditor de SEO técnico (#17) — roda no SERVIDOR (motor, Fase B).
 * Lê a página pública e avalia os pontos de SEO on-page (title, description,
 * H1, viewport, canonical, Open Graph, alt de imagens, indexação, HTTPS).
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

  const seo = analisarSeo(pagina.html, pagina.finalUrl);

  return NextResponse.json({ ok: true, url: pagina.finalUrl, ...seo });
}
