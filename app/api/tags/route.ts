import { NextResponse } from "next/server";

/**
 * Verificador de tags e pixels (#03) — roda no SERVIDOR (motor ligado na Fase B).
 * Lê o HTML público do site informado e detecta ferramentas de marketing/medição
 * instaladas. Nenhum dado do usuário é gravado; só lemos a página pública.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMITE_HTML = 3_000_000; // ~3MB de HTML é mais que suficiente
const TIMEOUT_MS = 15_000;

/** Proteção anti-SSRF: bloqueia alvos internos/privados. */
function alvoSeguro(u: URL): boolean {
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".localhost")) return false;
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd")) return false;
  if (h === "169.254.169.254") return false; // metadata de cloud
  if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.)/.test(h)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
  return true;
}

interface Detector {
  nome: string;
  categoria: string;
  presente: RegExp;
  id?: RegExp;
}

const DETECTORES: Detector[] = [
  { nome: "Google Tag Manager", categoria: "Gerenciador de tags", presente: /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]+/i, id: /GTM-[A-Z0-9]+/i },
  { nome: "Google Analytics 4 (GA4)", categoria: "Analytics", presente: /gtag\/js\?id=G-[A-Z0-9]{6,}|["']G-[A-Z0-9]{8,}["']/, id: /G-[A-Z0-9]{8,}/ },
  { nome: "Universal Analytics (antigo)", categoria: "Analytics", presente: /UA-\d{4,}-\d+/i, id: /UA-\d{4,}-\d+/i },
  { nome: "Google Ads (conversão/remarketing)", categoria: "Anúncios", presente: /AW-\d+|googleadservices\.com|google_conversion_id/i, id: /AW-\d+/i },
  { nome: "Meta Pixel (Facebook/Instagram)", categoria: "Anúncios", presente: /connect\.facebook\.net\/[^"']*\/fbevents\.js|fbq\(|facebook\.com\/tr\?id=/i, id: /fbq\(\s*["']init["']\s*,\s*["'](\d{6,})["']/i },
  { nome: "TikTok Pixel", categoria: "Anúncios", presente: /analytics\.tiktok\.com|ttq\.(load|page)/i, id: /ttq\.load\(\s*["']([A-Z0-9]+)["']/i },
  { nome: "LinkedIn Insight Tag", categoria: "Anúncios", presente: /snap\.licdn\.com|_linkedin_partner_id/i, id: /_linkedin_partner_id\s*=\s*["']?(\d+)/i },
  { nome: "Pinterest Tag", categoria: "Anúncios", presente: /pintrk\(|s\.pinimg\.com\/ct/i, id: /pintrk\(\s*["']load["']\s*,\s*["'](\d+)["']/i },
  { nome: "Hotjar", categoria: "Comportamento", presente: /static\.hotjar\.com|hjSiteSettings|_hjSettings/i, id: /hjid\s*:\s*(\d+)/i },
  { nome: "Microsoft Clarity", categoria: "Comportamento", presente: /clarity\.ms\/tag|clarity\(["']/i },
  { nome: "RD Station", categoria: "Marketing / CRM", presente: /d335luupugsy2\.cloudfront\.net|rdstation/i },
  { nome: "HubSpot", categoria: "Marketing / CRM", presente: /js\.hs-scripts\.com|hs-analytics\.net/i, id: /hs-scripts\.com\/(\d+)\.js/i },
];

// Ferramentas essenciais — se faltarem, viram alerta (gancho comercial).
const ESSENCIAIS = ["Google Analytics 4 (GA4)", "Google Tag Manager", "Meta Pixel (Facebook/Instagram)", "Google Ads (conversão/remarketing)"];

export async function POST(req: Request) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "requisicao_invalida" }, { status: 400 });
  }

  const bruto = (body.url || "").trim();
  if (!bruto) return NextResponse.json({ error: "url_vazia" }, { status: 400 });

  let alvo: URL;
  try {
    alvo = new URL(/^https?:\/\//i.test(bruto) ? bruto : `https://${bruto}`);
  } catch {
    return NextResponse.json({ error: "url_invalida" }, { status: 400 });
  }
  if (!alvoSeguro(alvo)) return NextResponse.json({ error: "url_bloqueada" }, { status: 400 });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let html = "";
  try {
    const resp = await fetch(alvo.toString(), {
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ConsigInvestHub/1.0; +https://hub.consiginvest.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!resp.ok) {
      return NextResponse.json({ error: "site_inacessivel", status: resp.status }, { status: 200 });
    }
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
  } catch (e) {
    const nome = (e as Error)?.name;
    return NextResponse.json({ error: nome === "AbortError" ? "timeout" : "site_inacessivel" }, { status: 200 });
  } finally {
    clearTimeout(timer);
  }

  const encontrados: { nome: string; categoria: string; id: string | null }[] = [];
  for (const d of DETECTORES) {
    if (d.presente.test(html)) {
      let id: string | null = null;
      if (d.id) {
        const m = html.match(d.id);
        if (m) id = m[1] ?? m[0];
      }
      encontrados.push({ nome: d.nome, categoria: d.categoria, id });
    }
  }

  const nomesEncontrados = new Set(encontrados.map((x) => x.nome));
  const faltando = ESSENCIAIS.filter((n) => !nomesEncontrados.has(n));

  return NextResponse.json({
    ok: true,
    url: alvo.toString(),
    encontrados,
    faltandoEssenciais: faltando,
    total: encontrados.length,
  });
}
