/**
 * Detecção de tags e pixels de marketing no HTML de uma página pública.
 * Função pura (recebe HTML, devolve o que encontrou) para ser reaproveitada
 * tanto pela rota /api/tags quanto pela Auditoria 360.
 */

export interface Tag {
  nome: string;
  categoria: string;
  id: string | null;
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
export const TAGS_ESSENCIAIS = [
  "Google Analytics 4 (GA4)",
  "Google Tag Manager",
  "Meta Pixel (Facebook/Instagram)",
  "Google Ads (conversão/remarketing)",
];

export interface ResultadoTags {
  encontrados: Tag[];
  faltandoEssenciais: string[];
  total: number;
}

export function detectarTags(html: string): ResultadoTags {
  const encontrados: Tag[] = [];
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
  const nomes = new Set(encontrados.map((x) => x.nome));
  const faltandoEssenciais = TAGS_ESSENCIAIS.filter((n) => !nomes.has(n));
  return { encontrados, faltandoEssenciais, total: encontrados.length };
}
