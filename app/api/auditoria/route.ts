import { NextResponse } from "next/server";
import { resolverAlvo, buscarHtml, checarStatus, emLotes } from "@/lib/server/http";
import { detectarTags } from "@/lib/server/tags";
import { analisarSeo } from "@/lib/server/seo";
import { extrairLinks } from "@/lib/server/links";

/**
 * Auditoria 360 (#01) — roda no SERVIDOR (motor, Fase B).
 * Faz UMA leitura do HTML e roda os três analisadores (tags/pixels, SEO técnico
 * e links quebrados) num relatório único por site. Reaproveita exatamente os
 * mesmos módulos das ferramentas individuais.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMITE_CHECAR = 40; // teto de links checados na auditoria combinada
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

  // 1 e 2: análises baseadas só no HTML já baixado (instantâneas).
  const tags = detectarTags(pagina.html);
  const seo = analisarSeo(pagina.html, pagina.finalUrl);

  // 3: links exigem checagem de rede — limitada e em paralelo.
  const todosLinks = extrairLinks(pagina.html, pagina.finalUrl);
  const aChecar = todosLinks.slice(0, LIMITE_CHECAR);
  const status = await emLotes(aChecar, CONCORRENCIA, (l) => checarStatus(l.url));
  const quebrados: { url: string; texto: string; status: number; interno: boolean }[] = [];
  aChecar.forEach((l, i) => {
    const s = status[i]!;
    if (s.status >= 400) quebrados.push({ url: l.url, texto: l.texto, status: s.status, interno: l.interno });
  });
  quebrados.sort((a, b) => Number(b.interno) - Number(a.interno) || a.status - b.status);

  return NextResponse.json({
    ok: true,
    url: pagina.finalUrl,
    tags,
    seo,
    links: {
      total: todosLinks.length,
      verificados: aChecar.length,
      truncado: todosLinks.length > aChecar.length,
      quebrados,
    },
  });
}
