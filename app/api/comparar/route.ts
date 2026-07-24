import { NextResponse } from "next/server";
import { resolverAlvo, buscarHtml } from "@/lib/server/http";
import { detectarTags } from "@/lib/server/tags";
import { analisarSeo } from "@/lib/server/seo";

/**
 * Comparador de concorrentes — roda no SERVIDOR (motor, Fase B).
 * Lê DOIS sites públicos e compara lado a lado: nota de SEO técnico e tags/pixels
 * instalados. Reaproveita os mesmos analisadores das outras ferramentas.
 * Só leitura das páginas públicas; nada é gravado.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LadoOk {
  ok: true;
  url: string;
  seo: { nota: number; resumo: { ok: number; aviso: number; erro: number } };
  tags: { total: number; encontrados: { nome: string; categoria: string }[]; faltandoEssenciais: string[] };
}
interface LadoErro {
  ok: false;
  erro: string;
}

async function analisarLado(bruto: string): Promise<LadoOk | LadoErro> {
  let alvo: URL;
  try {
    alvo = resolverAlvo(bruto);
  } catch (e) {
    return { ok: false, erro: (e as Error).message };
  }
  let pagina;
  try {
    pagina = await buscarHtml(alvo);
  } catch (e) {
    return { ok: false, erro: (e as Error).message };
  }
  if (pagina.status >= 400) return { ok: false, erro: "site_inacessivel" };

  const seo = analisarSeo(pagina.html, pagina.finalUrl);
  const tags = detectarTags(pagina.html);
  return {
    ok: true,
    url: pagina.finalUrl,
    seo: { nota: seo.nota, resumo: seo.resumo },
    tags: { total: tags.total, encontrados: tags.encontrados.map((t) => ({ nome: t.nome, categoria: t.categoria })), faltandoEssenciais: tags.faltandoEssenciais },
  };
}

export async function POST(req: Request) {
  let body: { a?: string; b?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "requisicao_invalida" }, { status: 400 });
  }

  if (!(body.a || "").trim() || !(body.b || "").trim()) {
    return NextResponse.json({ error: "faltam_sites" }, { status: 400 });
  }

  const [a, b] = await Promise.all([analisarLado(body.a!), analisarLado(body.b!)]);

  return NextResponse.json({ ok: true, a, b });
}
