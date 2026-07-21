/** Configuração pública do Hub. Nenhum segredo aqui — ver AUDIT.md §9. */

export const WHATSAPP = "5551983493659";

/**
 * Chave da API PageSpeed Insights.
 * Pública por design (chave de navegador), restrita por referrer ao domínio
 * hub.consiginvest.com no Google Cloud e limitada à PageSpeed API.
 * O projeto não possui billing, portanto não há risco financeiro.
 */
export const PAGESPEED_KEY = "AIzaSyCE2W5SN58BNxlE_q7FOqpqz89wKCRmAkY";

/**
 * Webhook n8n que analisa a ficha do Google.
 * A chave do Google Places fica EXCLUSIVAMENTE no n8n (server-side), nunca aqui.
 */
export const GMB_ANALYZE = "https://n8n.vpsmozar.plusnetworks.com.br/webhook/gmb-analyze";

/**
 * Webhook n8n que gera o texto do anúncio do Google Ads com IA (OpenAI).
 * A chave da OpenAI fica EXCLUSIVAMENTE no n8n (credencial server-side), nunca aqui.
 */
export const IA_ANUNCIO = "https://n8n.vpsmozar.plusnetworks.com.br/webhook/ia-anuncio";

/**
 * Supabase — conteúdo editorial (notícias).
 *
 * A publishable key é pública POR DESIGN: ela só consegue fazer o que as políticas
 * de RLS permitem, e no nosso schema isso é exatamente uma coisa — ler `news_items`
 * com status 'published' e `news_sources` ativas. Nenhuma escrita, nenhum rascunho.
 *
 * A secret key (sb_secret_…) dá acesso total e vive SOMENTE na credencial do n8n,
 * no servidor. Ela nunca entra neste repositório. Ver SECURITY.md.
 */
export const SUPABASE_URL = "https://bcpkwmzglbeguywsmdxm.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_tdWjgITgLJBulrYNwU7X1Q_r27pLZmV";

export const waLink = (msg: string): string =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

/** Bibliotecas carregadas sob demanda (§8: heavy modules lazy por rota). */
export const LIB = {
  pdfjs: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  pdfjsWorker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  pdflib: "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
  mammoth: "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.2/mammoth.browser.min.js",
  xlsx: "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
  html2pdf: "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js",
  jszip: "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
  heic2any: "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js",
  qrcode: "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js",
} as const;
