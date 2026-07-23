/**
 * Analisador de Landing Page (#06). Recebe o HTML da página (e a URL final) e
 * avalia se ela está preparada para CONVERTER visitante em contato/venda:
 * proposta clara, chamada para ação, formulário, contato direto, prova social,
 * mobile, HTTPS, medição e peso da página.
 *
 * Extração por regex de propósito (sem DOM): sinalizamos presença/ausência dos
 * elementos que importam para conversão. O HTML nunca é gravado.
 */

import { detectarTags } from "./tags";

export type LandingNivel = "ok" | "aviso" | "erro";

export interface LandingAchado {
  chave: string;
  titulo: string;
  nivel: LandingNivel;
  valor?: string;
  detalhe: string;
}

export interface ResultadoLanding {
  pontos: LandingAchado[];
  nota: number; // 0–100
  resumo: { ok: number; aviso: number; erro: number };
}

function semTags(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// Verbos/expressões típicos de chamada para ação (CTA) em português.
const RE_CTA = /\b(compre|comprar|assine|assinar|contrate|contratar|fale|falar|or[çc]amento|cota[çc][ãa]o|cadastre|cadastrar|quero|agende|agendar|baixe|baixar|download|solicite|solicitar|come[çc]e|come[çc]ar|teste|testar|experimente|saiba mais|saber mais|ligue|ligar|chame|chamar|inscreva|inscrever|garanta|garantir|reserve|reservar|pe[çc]a|adquira|adquirir|matricule|participe|come[çc]ar agora|entre em contato|come[çc]ar gr[áa]tis)\b/i;

// Sinais de prova social.
const RE_PROVA = /\b(depoimento|depoimentos|testemunho|avalia[çc][õo]es|avaliado|\d[.,]?\d?\s*estrelas|5\s*estrelas|cases?\s+de\s+sucesso|quem\s+confia|clientes?\s+atendidos|mais\s+de\s+[\d.]+\s+clientes|nota\s+\d|google\s+reviews?|⭐|★)\b/i;

/** Pega o texto dos elementos clicáveis (links e botões) da página. */
function textosClicaveis(html: string): string[] {
  const out: string[] = [];
  const re = /<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const t = (m[2] || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (t) out.push(t);
  }
  return out;
}

export function analisarLanding(html: string, finalUrl: string): ResultadoLanding {
  const pontos: LandingAchado[] = [];
  const add = (a: LandingAchado) => pontos.push(a);
  const texto = semTags(html);
  const cliques = textosClicaveis(html);

  // 1. Proposta de valor (H1)
  const h1Raw = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const h1Texto = h1Raw ? h1Raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";
  if (!h1Texto) add({ chave: "proposta", titulo: "Proposta de valor (título principal)", nivel: "erro", detalhe: "A página não tem um título principal (H1). É a primeira frase que diz o que você oferece — sem ela, o visitante não entende a oferta e sai." });
  else if (h1Texto.length < 15) add({ chave: "proposta", titulo: "Proposta de valor (título principal)", nivel: "aviso", valor: `"${h1Texto}"`, detalhe: "O título principal é muito curto. Deixe claro o que a pessoa ganha ao continuar na página." });
  else add({ chave: "proposta", titulo: "Proposta de valor (título principal)", nivel: "ok", valor: `"${h1Texto.slice(0, 70)}${h1Texto.length > 70 ? "…" : ""}"`, detalhe: "Tem um título principal claro logo no topo — bom para o visitante entender a oferta na hora." });

  // 2. Chamada para ação (CTA)
  const ctasBotao = cliques.filter((t) => RE_CTA.test(t));
  const temCtaLink = /wa\.me|api\.whatsapp\.com|href=["']https?:\/\/wa|href=["']tel:/i.test(html);
  const totalCta = ctasBotao.length + (temCtaLink ? 1 : 0);
  if (totalCta === 0) add({ chave: "cta", titulo: "Chamada para ação (botão)", nivel: "erro", detalhe: "Não encontramos um botão de ação (ex.: “Fale conosco”, “Peça um orçamento”, “Quero começar”). Sem um caminho claro, o visitante não sabe o que fazer." });
  else add({ chave: "cta", titulo: "Chamada para ação (botão)", nivel: "ok", valor: `${totalCta} identificada(s)`, detalhe: `Tem botão(ões) de ação${ctasBotao[0] ? ` — ex.: “${ctasBotao[0].slice(0, 40)}”` : ""}. É por aí que o visitante vira contato.` });

  // 3. Contato direto (WhatsApp / telefone / e-mail)
  const temWpp = /wa\.me|api\.whatsapp\.com|whatsapp/i.test(html);
  const temTel = /href=["']tel:/i.test(html);
  const temMail = /href=["']mailto:/i.test(html);
  const canais = [temWpp && "WhatsApp", temTel && "telefone", temMail && "e-mail"].filter(Boolean) as string[];
  if (canais.length) add({ chave: "contato", titulo: "Contato direto", nivel: "ok", valor: canais.join(", "), detalhe: "A pessoa consegue falar com você na hora. Contato fácil (principalmente WhatsApp) é o que mais converte." });
  else add({ chave: "contato", titulo: "Contato direto", nivel: "aviso", detalhe: "Não achamos um contato clicável (WhatsApp, telefone ou e-mail). Deixe pelo menos o WhatsApp bem visível." });

  // 4. Formulário de captura
  const temForm = /<form\b[\s\S]*?<\/form>/i.test(html);
  const temCampo = /<textarea\b|<input\b[^>]*type=["']?(email|tel|text)["']?|name=["'][^"']*(nome|name|email|e-mail|telefone|phone|whats)/i.test(html);
  if (temForm && temCampo) add({ chave: "formulario", titulo: "Formulário de captura", nivel: "ok", detalhe: "Tem um formulário para captar o contato do visitante — bom para gerar lista de leads." });
  else if (canais.length) add({ chave: "formulario", titulo: "Formulário de captura", nivel: "aviso", detalhe: "Não há formulário, mas há contato direto. Um formulário curto (nome + WhatsApp) costuma aumentar os leads." });
  else add({ chave: "formulario", titulo: "Formulário de captura", nivel: "aviso", detalhe: "Sem formulário e sem contato direto, não há como captar o visitante. Adicione um formulário curto ou o WhatsApp." });

  // 5. Prova social
  if (RE_PROVA.test(texto)) add({ chave: "prova", titulo: "Prova social (depoimentos)", nivel: "ok", detalhe: "Tem sinais de prova social (depoimentos, avaliações, cases). Isso gera confiança e ajuda a decidir." });
  else add({ chave: "prova", titulo: "Prova social (depoimentos)", nivel: "aviso", detalhe: "Não achamos depoimentos, avaliações ou cases. Mostrar que outros confiam em você aumenta muito a conversão." });

  // 6. Responsivo (mobile)
  const temViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  add(temViewport
    ? { chave: "mobile", titulo: "Adaptado ao celular", nivel: "ok", detalhe: "A página se adapta ao celular — onde está a maior parte do tráfego de anúncios." }
    : { chave: "mobile", titulo: "Adaptado ao celular", nivel: "erro", detalhe: "A página não declara adaptação ao celular. A maioria dos cliques vem de celular; sem isso, você perde vendas." });

  // 7. HTTPS (confiança/cadeado)
  add(/^https:/i.test(finalUrl)
    ? { chave: "https", titulo: "Conexão segura (cadeado)", nivel: "ok", detalhe: "A página tem o cadeado de segurança — passa confiança e é exigido para anunciar." }
    : { chave: "https", titulo: "Conexão segura (cadeado)", nivel: "erro", detalhe: "A página não é segura (sem HTTPS). O navegador marca como “não seguro” e espanta o visitante." });

  // 8. Medição (rastreamento) — reaproveita o detector de tags/pixels.
  const tags = detectarTags(html);
  add(tags.total > 0
    ? { chave: "medicao", titulo: "Medição instalada", nivel: "ok", valor: `${tags.total} ferramenta(s)`, detalhe: "Tem rastreamento instalado (Analytics/Pixel) — dá para saber se a página converte e otimizar anúncios." }
    : { chave: "medicao", titulo: "Medição instalada", nivel: "aviso", detalhe: "Sem rastreamento (Analytics/Pixel), você não mede quantos visitantes viram contato — fica no escuro para otimizar." });

  // 9. Peso da página (velocidade aproximada)
  const scripts = (html.match(/<script\b/gi) || []).length;
  const kb = Math.round(html.length / 1024);
  if (kb > 1500 || scripts > 40) add({ chave: "peso", titulo: "Peso da página (velocidade)", nivel: "aviso", valor: `${kb} KB, ${scripts} scripts`, detalhe: "A página está pesada e pode carregar devagar. No celular, cada segundo a mais derruba conversão." });
  else add({ chave: "peso", titulo: "Peso da página (velocidade)", nivel: "ok", valor: `${kb} KB, ${scripts} scripts`, detalhe: "O peso da página está razoável — bom para carregar rápido e não perder o visitante impaciente." });

  const resumo = { ok: 0, aviso: 0, erro: 0 };
  for (const p of pontos) resumo[p.nivel]++;
  const nota = pontos.length ? Math.round(((resumo.ok + resumo.aviso * 0.5) / pontos.length) * 100) : 0;

  return { pontos, nota, resumo };
}
