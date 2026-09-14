/**
 * Gerador de proposta comercial — lógica pura (§23).
 *
 * Tudo aqui roda no navegador: nenhum dado do cliente, valor ou logo sai do
 * dispositivo. Nada de API, nada de IA — a proposta é determinística, então o
 * mesmo preenchimento gera sempre o mesmo documento.
 *
 * Regra de negócio que não pode ser quebrada (ver __tests__/proposta.test.ts):
 * a VERBA DE MÍDIA nunca entra em nenhum subtotal de honorários. Ela é paga
 * direto à plataforma (Google, Meta) e aparece sempre em linha própria.
 */

/* ── Tipos ───────────────────────────────────────────────── */

export type TipoCobranca = "mensal" | "unico";

export interface Servico {
  id: string;
  nome: string;
  descricao: string;
  tipo: TipoCobranca;
  /** Texto cru digitado pela pessoa ("1.590,00", "1590"). Convertido por parseBRL. */
  valor: string;
  entregas: string[];
}

export interface CaseProva {
  id: string;
  nicho: string;
  resultado: string;
  contexto: string;
}

export type Objetivo =
  | "leads"
  | "vender-online"
  | "autoridade"
  | "reduzir-cpl"
  | "reestruturar";

export type Situacao =
  | "anuncia"
  | "site"
  | "google"
  | "rastreamento"
  | "crm";

export interface PropostaEstado {
  /* Etapa 1 — quem recebe */
  clienteEmpresa: string;
  clienteSegmento: string;
  clienteCidade: string;
  clienteContato: string;
  clienteCargo: string;

  /* Etapa 2 — quem envia */
  agenciaNome: string;
  agenciaSite: string;
  agenciaWhatsapp: string;
  agenciaEmail: string;
  /** data URL da logo. Fica só em memória e no localStorage — nunca vai para a URL. */
  agenciaLogo: string;
  cor: string;

  /* Etapa 3 — diagnóstico */
  problema: string;
  objetivo: Objetivo;
  situacao: Situacao[];

  /* Etapa 4 — escopo e investimento */
  servicos: Servico[];
  verbaMidia: string;
  meses: number;
  pagamento: string;

  /* Etapa 5 — provas e fechamento */
  cases: CaseProva[];
  validadeDias: number;
  observacoes: string;
}

export const COR_PADRAO = "#0b5ed7";

export const ESTADO_INICIAL: PropostaEstado = {
  clienteEmpresa: "",
  clienteSegmento: "",
  clienteCidade: "",
  clienteContato: "",
  clienteCargo: "",

  agenciaNome: "",
  agenciaSite: "",
  agenciaWhatsapp: "",
  agenciaEmail: "",
  agenciaLogo: "",
  cor: COR_PADRAO,

  problema: "",
  objetivo: "leads",
  situacao: [],

  servicos: [],
  verbaMidia: "",
  meses: 6,
  pagamento: "",

  cases: [],
  validadeDias: 15,
  observacoes: "",
};

/* ── Listas de apoio ─────────────────────────────────────── */

export const SEGMENTOS = [
  "Odontologia e clínicas",
  "Advocacia",
  "Serviços de emergência",
  "Saúde mental",
  "E-commerce",
  "B2B e indústria",
  "Imobiliária",
  "Financeira",
  "Pet",
  "Educação",
] as const;

export const OBJETIVOS: { key: Objetivo; label: string }[] = [
  { key: "leads", label: "Gerar leads" },
  { key: "vender-online", label: "Vender online" },
  { key: "autoridade", label: "Aumentar autoridade" },
  { key: "reduzir-cpl", label: "Reduzir custo por lead" },
  { key: "reestruturar", label: "Reestruturar conta existente" },
];

export const SITUACOES: { key: Situacao; label: string }[] = [
  { key: "anuncia", label: "Já anuncia" },
  { key: "site", label: "Tem site" },
  { key: "google", label: "Tem perfil no Google" },
  { key: "rastreamento", label: "Tem rastreamento configurado" },
  { key: "crm", label: "Tem CRM" },
];

export const PRAZOS = [3, 6, 12] as const;

/** Modelos em branco: estrutura pronta, nenhum valor sugerido. */
export const MODELOS_SERVICO: Omit<Servico, "id">[] = [
  {
    nome: "Gestão de Google Ads",
    descricao:
      "Campanhas na rede de pesquisa para quem já está procurando o serviço, com foco em custo por lead qualificado.",
    tipo: "mensal",
    valor: "",
    entregas: [
      "Estrutura de campanhas por intenção de busca",
      "Pesquisa de palavras-chave e lista de negativas",
      "Textos de anúncio e extensões",
      "Acompanhamento de lances e ajuste semanal",
      "Relatório mensal com custo por lead",
    ],
  },
  {
    nome: "Gestão de Meta Ads",
    descricao:
      "Campanhas no Facebook e Instagram para alcançar quem ainda não procura pelo serviço, com medição de conversa iniciada e lead.",
    tipo: "mensal",
    valor: "",
    entregas: [
      "Públicos frios, de remarketing e semelhantes",
      "Testes de criativo e de oferta",
      "Formulário instantâneo ou destino no site",
      "Acompanhamento de custo por lead",
      "Relatório mensal",
    ],
  },
  {
    nome: "SEO",
    descricao:
      "Trabalho de posicionamento orgânico: correções técnicas, conteúdo e autoridade para capturar busca de alta intenção sem pagar por clique.",
    tipo: "mensal",
    valor: "",
    entregas: [
      "Auditoria técnica e correções",
      "Pesquisa de palavras-chave por intenção",
      "Produção ou revisão de páginas",
      "Ficha do Google otimizada",
      "Relatório de posições e tráfego",
    ],
  },
  {
    nome: "Site",
    descricao:
      "Site institucional pensado para converter visita em contato, e não apenas para apresentar a empresa.",
    tipo: "unico",
    valor: "",
    entregas: [
      "Arquitetura de páginas e textos",
      "Layout responsivo",
      "Formulário e botão de WhatsApp",
      "Rastreamento instalado",
      "Publicação e treinamento de uso",
    ],
  },
  {
    nome: "Landing Page",
    descricao:
      "Página única de destino para campanha, com uma oferta e um caminho de conversão.",
    tipo: "unico",
    valor: "",
    entregas: [
      "Estrutura de argumento e prova",
      "Layout responsivo",
      "Formulário e WhatsApp com rastreamento",
      "Teste em celular e computador",
    ],
  },
  {
    nome: "Social Media",
    descricao:
      "Conteúdo de perfil para sustentar a decisão de quem chega pelos anúncios e pela busca.",
    tipo: "mensal",
    valor: "",
    entregas: [
      "Planejamento de pauta mensal",
      "Peças e legendas",
      "Publicação programada",
      "Relatório mensal",
    ],
  },
  {
    nome: "Automação",
    descricao:
      "Resposta e distribuição automática dos contatos que chegam, para que nenhum lead fique sem atendimento.",
    tipo: "mensal",
    valor: "",
    entregas: [
      "Fluxo de primeira resposta no WhatsApp",
      "Distribuição dos contatos para o time",
      "Integração com o CRM",
      "Acompanhamento e ajuste dos fluxos",
    ],
  },
];

export const METODO = [
  {
    n: 1,
    titulo: "Onboarding",
    texto:
      "Acessos, definição do que conta como lead qualificado, instalação do rastreamento e alinhamento de quem atende o contato que chega.",
  },
  {
    n: 2,
    titulo: "Estratégia",
    texto:
      "Mapa de ofertas e palavras por intenção, definição das campanhas e páginas de destino, e o painel que vamos olhar toda semana.",
  },
  {
    n: 3,
    titulo: "Start",
    texto:
      "Campanhas no ar, leitura semanal dos números e ajuste do que estiver caro ou fora do perfil. Relatório mensal com custo por lead e conversão em cliente.",
  },
];

/* ── Dinheiro ────────────────────────────────────────────── */

export const fmtBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * Lê valor digitado em pt-BR ("1.590,00", "1590", "1.590") ou em formato
 * americano ("1590.00"). Arredondamento só acontece na exibição.
 */
export function parseBRL(entrada: string): number {
  const s = String(entrada ?? "").replace(/[^\d.,-]/g, "").trim();
  if (!s) return 0;

  const temVirgula = s.includes(",");
  let norm: string;

  if (temVirgula) {
    // Vírgula é sempre o decimal no pt-BR; pontos viram separador de milhar.
    norm = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(".")) {
    // "1.590" é mil quinhentos e noventa; "2.5" é dois e meio.
    const ultimo = s.slice(s.lastIndexOf(".") + 1);
    norm = ultimo.length === 3 ? s.replace(/\./g, "") : s.replace(/\.(?=.*\.)/g, "");
  } else {
    norm = s;
  }

  const n = parseFloat(norm);
  return Number.isFinite(n) ? n : 0;
}

export interface Investimento {
  subtotalMensal: number;
  subtotalUnico: number;
  primeiroMes: number;
  totalContrato: number;
  meses: number;
  /** Exibida sempre em linha própria. NUNCA somada aos honorários. */
  verbaMidia: number;
  /** Verba de mídia ao longo de todo o contrato — informativo, também fora dos subtotais. */
  verbaMidiaContrato: number;
}

export function calcularInvestimento(e: PropostaEstado): Investimento {
  const meses = Math.max(1, Math.round(e.meses || 1));

  const soma = (tipo: TipoCobranca) =>
    e.servicos
      .filter((s) => s.tipo === tipo)
      .reduce((acc, s) => acc + parseBRL(s.valor), 0);

  const subtotalMensal = soma("mensal");
  const subtotalUnico = soma("unico");
  const verbaMidia = parseBRL(e.verbaMidia);

  return {
    subtotalMensal,
    subtotalUnico,
    primeiroMes: subtotalMensal + subtotalUnico,
    totalContrato: subtotalMensal * meses + subtotalUnico,
    meses,
    verbaMidia,
    verbaMidiaContrato: verbaMidia * meses,
  };
}

/* ── Textos determinísticos ──────────────────────────────── */

const LEITURA_OBJETIVO: Record<Objetivo, string> = {
  leads:
    "O que está em jogo aqui é volume de leads qualificados — contato de quem tem intenção real de contratar, não número de visitas. Por isso o plano abaixo é medido por custo por lead e por conversão em cliente.",
  "vender-online":
    "O que está em jogo aqui é venda concluída, não visita à loja. Por isso o plano abaixo separa quem já procura pelo produto de quem ainda está descobrindo, e mede receita e custo por venda.",
  autoridade:
    "O que está em jogo aqui é ser encontrado e reconhecido por quem decide — para que o contato chegue já sabendo quem você é. Mesmo assim, a medição continua em contato gerado e conversão em cliente, não em curtidas.",
  "reduzir-cpl":
    "O que está em jogo aqui é pagar menos pelo mesmo contato qualificado. Por isso o trabalho começa pela leitura do que já roda: onde o dinheiro está indo, quais termos trazem contato de alta intenção e quais só trazem volume.",
  reestruturar:
    "O que está em jogo aqui é arrumar o que já existe antes de colocar mais dinheiro. Por isso o trabalho começa por estrutura, rastreamento e limpeza do que gasta sem gerar contato qualificado.",
};

/** Como cada item aparece quando o cliente TEM. */
const SITUACAO_POSITIVA: Record<Situacao, string> = {
  anuncia: "já anuncia",
  site: "tem site",
  google: "tem perfil no Google",
  rastreamento: "tem rastreamento configurado",
  crm: "tem CRM",
};

/** Substantivo usado na frase de negação ("ainda não tem site nem CRM"). */
const SITUACAO_SUBSTANTIVO: Record<Exclude<Situacao, "anuncia">, string> = {
  site: "site",
  google: "perfil no Google",
  rastreamento: "rastreamento configurado",
  crm: "CRM",
};

function listar(itens: string[], conector = "e"): string {
  if (itens.length === 0) return "";
  const ultimo = itens[itens.length - 1] ?? "";
  if (itens.length === 1) return ultimo;
  return `${itens.slice(0, -1).join(", ")} ${conector} ${ultimo}`;
}

/** Conselhos de classe: comunicação com restrição própria (§ conteúdo). */
export function avisoConselho(segmento: string): string | null {
  const s = segmento.toLowerCase();
  if (/advoc|jurídic|juridic|direito|oab/.test(s)) {
    return "Toda a comunicação desta proposta segue as restrições de publicidade da OAB: sem captação de clientela, sem promessa de resultado e sem menção a valores de honorários em anúncio.";
  }
  if (/odonto|dentist|dental|cfo/.test(s)) {
    return "Toda a comunicação desta proposta segue as restrições de publicidade do CFO: sem promessa de resultado, sem antes e depois usado como propaganda e sem preço de procedimento em anúncio.";
  }
  if (/saúde|saude|clínic|clinic|médic|medic|psic|terap|cfm|crp/.test(s)) {
    return "Toda a comunicação desta proposta segue as restrições de publicidade do conselho de classe (CFM/CFP conforme a especialidade): sem promessa de resultado, sem antes e depois usado como propaganda e sem sensacionalismo.";
  }
  return null;
}

/** Parágrafos do diagnóstico. Sempre abrem pelo problema do cliente. */
export function textoDiagnostico(e: PropostaEstado): string[] {
  const empresa = e.clienteEmpresa.trim() || "A empresa";
  const p: string[] = [];

  if (e.problema.trim()) {
    p.push(`O ponto de partida desta proposta é o que ${empresa} nos relatou: ${e.problema.trim()}`);
  } else {
    p.push(
      `O ponto de partida desta proposta é o problema que ${empresa} precisa resolver, e não a lista de serviços que temos para vender.`
    );
  }

  p.push(LEITURA_OBJETIVO[e.objetivo]);

  const tem = e.situacao.map((s) => SITUACAO_POSITIVA[s]);

  const negacoes: string[] = [];
  if (!e.situacao.includes("anuncia")) negacoes.push("ainda não anuncia");
  const faltando = (["site", "google", "rastreamento", "crm"] as const)
    .filter((k) => !e.situacao.includes(k))
    .map((k) => SITUACAO_SUBSTANTIVO[k]);
  if (faltando.length) negacoes.push(`ainda não tem ${listar(faltando, "nem")}`);

  if (tem.length || negacoes.length) {
    let frase: string;
    if (tem.length && negacoes.length) {
      frase = `Hoje ${empresa} ${listar(tem)}, e ${listar(negacoes)}.`;
    } else if (tem.length) {
      frase = `Hoje ${empresa} ${listar(tem)}.`;
    } else {
      frase = `Hoje ${empresa} ${listar(negacoes)}.`;
    }
    if (!e.situacao.includes("rastreamento")) {
      frase +=
        " Sem rastreamento configurado não dá para saber qual campanha gerou qual contato, então medir é a primeira entrega — antes de aumentar qualquer verba.";
    }
    if (e.clienteCidade.trim()) {
      frase += ` O atendimento considerado é em ${e.clienteCidade.trim()}.`;
    }
    p.push(frase);
  }

  p.push(
    "Sobre ritmo: tráfego pago costuma dar sinal em dias; SEO, em semanas a meses. Nenhum dos dois é previsão de resultado — o que está no contrato é método, medição e ajuste do que estiver caro ou fora do perfil."
  );

  return p;
}

export const AVISO_VERBA =
  "A verba de mídia é paga por você diretamente a Google e Meta, no cartão cadastrado na sua conta de anúncios. Ela não faz parte do fee de gestão e não é repassada a nós em nenhum momento.";

export const AVISO_VERBA_CURTO =
  "Verba paga direto à plataforma — fora do fee de gestão.";

/* ── Texto para WhatsApp ─────────────────────────────────── */

export function textoWhatsApp(e: PropostaEstado): string {
  const inv = calcularInvestimento(e);
  const L: string[] = [];
  const empresa = e.clienteEmpresa.trim() || "sua empresa";

  L.push(`*PROPOSTA COMERCIAL — ${empresa.toUpperCase()}*`);
  if (e.agenciaNome.trim()) L.push(`Enviada por ${e.agenciaNome.trim()}`);
  L.push(`Válida por ${e.validadeDias} dias (até ${dataValidade(e)})`);
  L.push("");

  L.push("📌 *O PONTO DE PARTIDA*");
  textoDiagnostico(e).forEach((par) => L.push(par));
  L.push("");

  if (e.servicos.length) {
    L.push("🧩 *O QUE ENTRA*");
    e.servicos.forEach((s) => {
      const valor = parseBRL(s.valor);
      const sufixo = s.tipo === "mensal" ? "/mês" : " (valor único)";
      L.push(`▪️ *${s.nome || "Serviço"}* — ${fmtBRL.format(valor)}${sufixo}`);
      if (s.descricao.trim()) L.push(s.descricao.trim());
      s.entregas.filter(Boolean).forEach((en) => L.push(`  • ${en}`));
      L.push("");
    });
  }

  L.push("💰 *INVESTIMENTO*");
  if (inv.subtotalMensal > 0) L.push(`Honorários mensais: ${fmtBRL.format(inv.subtotalMensal)}/mês`);
  if (inv.subtotalUnico > 0) L.push(`Valor único (implantação): ${fmtBRL.format(inv.subtotalUnico)}`);
  L.push(`Primeiro mês: ${fmtBRL.format(inv.primeiroMes)}`);
  L.push(`Total do contrato (${inv.meses} meses): ${fmtBRL.format(inv.totalContrato)}`);
  L.push("");
  L.push(`📣 Verba de mídia sugerida: ${fmtBRL.format(inv.verbaMidia)}/mês`);
  L.push(AVISO_VERBA);
  if (e.pagamento.trim()) {
    L.push("");
    L.push(`Condição de pagamento: ${e.pagamento.trim()}`);
  }
  L.push("");

  L.push("🛠️ *COMO COMEÇA*");
  METODO.forEach((m) => L.push(`${m.n}. *${m.titulo}* — ${m.texto}`));
  L.push("");

  const cases = e.cases.slice(0, 3).filter((c) => c.resultado.trim() || c.nicho.trim());
  if (cases.length) {
    L.push("📈 *O QUE JÁ FIZEMOS*");
    cases.forEach((c) => {
      L.push(`▪️ ${c.nicho.trim()}: ${c.resultado.trim()}`);
      if (c.contexto.trim()) L.push(`  ${c.contexto.trim()}`);
    });
    L.push("");
  }

  const aviso = avisoConselho(e.clienteSegmento);
  if (aviso) {
    L.push(`⚖️ ${aviso}`);
    L.push("");
  }

  if (e.observacoes.trim()) {
    L.push("📝 *OBSERVAÇÕES*");
    L.push(e.observacoes.trim());
    L.push("");
  }

  L.push("➡️ *PRÓXIMO PASSO*");
  L.push(
    "Uma reunião de 30 minutos para revisar este escopo, ajustar o que não fizer sentido e definir a data de início."
  );
  const contatos = [e.agenciaWhatsapp, e.agenciaEmail, e.agenciaSite].map((c) => c.trim()).filter(Boolean);
  if (contatos.length) L.push(contatos.join(" · "));

  return L.join("\n");
}

/* ── Datas ───────────────────────────────────────────────── */

const fmtData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });

export function dataHoje(base = new Date()): string {
  return fmtData.format(base);
}

export function dataValidade(e: PropostaEstado, base = new Date()): string {
  const d = new Date(base);
  d.setDate(d.getDate() + (Number(e.validadeDias) || 0));
  return fmtData.format(d);
}

/* ── Link compartilhável (?p=base64) ─────────────────────── */

/** Base64 seguro para URL e para acento (a logo fica de fora: estoura o limite). */
function b64encode(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64decode(b64: string): string {
  const norm = b64.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(norm.padEnd(Math.ceil(norm.length / 4) * 4, "="));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Serializa o estado SEM a logo — data URL de imagem não cabe numa URL. */
export function serializar(e: PropostaEstado): string {
  const { agenciaLogo: _logo, ...resto } = e;
  void _logo;
  return b64encode(JSON.stringify(resto));
}

export function desserializar(b64: string): PropostaEstado | null {
  try {
    const bruto = JSON.parse(b64decode(b64));
    if (!bruto || typeof bruto !== "object") return null;
    return normalizar(bruto as Partial<PropostaEstado>);
  } catch {
    return null;
  }
}

/** Completa campos faltando e descarta lixo — protege contra link adulterado. */
export function normalizar(bruto: Partial<PropostaEstado>): PropostaEstado {
  const texto = (v: unknown, padrao = ""): string => (typeof v === "string" ? v : padrao);
  const objetivosValidos = OBJETIVOS.map((o) => o.key);
  const situacoesValidas = SITUACOES.map((s) => s.key);

  return {
    ...ESTADO_INICIAL,
    clienteEmpresa: texto(bruto.clienteEmpresa),
    clienteSegmento: texto(bruto.clienteSegmento),
    clienteCidade: texto(bruto.clienteCidade),
    clienteContato: texto(bruto.clienteContato),
    clienteCargo: texto(bruto.clienteCargo),
    agenciaNome: texto(bruto.agenciaNome),
    agenciaSite: texto(bruto.agenciaSite),
    agenciaWhatsapp: texto(bruto.agenciaWhatsapp),
    agenciaEmail: texto(bruto.agenciaEmail),
    agenciaLogo: texto(bruto.agenciaLogo),
    cor: /^#[0-9a-f]{6}$/i.test(texto(bruto.cor)) ? texto(bruto.cor) : COR_PADRAO,
    problema: texto(bruto.problema),
    objetivo: objetivosValidos.includes(bruto.objetivo as Objetivo)
      ? (bruto.objetivo as Objetivo)
      : "leads",
    situacao: Array.isArray(bruto.situacao)
      ? bruto.situacao.filter((s): s is Situacao => situacoesValidas.includes(s as Situacao))
      : [],
    servicos: Array.isArray(bruto.servicos)
      ? bruto.servicos.slice(0, 20).map((s, i) => ({
          id: texto(s?.id, `s${i}`),
          nome: texto(s?.nome),
          descricao: texto(s?.descricao),
          tipo: s?.tipo === "unico" ? "unico" : "mensal",
          valor: texto(s?.valor),
          entregas: Array.isArray(s?.entregas)
            ? s.entregas.filter((x): x is string => typeof x === "string").slice(0, 15)
            : [],
        }))
      : [],
    verbaMidia: texto(bruto.verbaMidia),
    meses: Number.isFinite(Number(bruto.meses)) ? Math.max(1, Math.round(Number(bruto.meses))) : 6,
    pagamento: texto(bruto.pagamento),
    cases: Array.isArray(bruto.cases)
      ? bruto.cases.slice(0, 3).map((c, i) => ({
          id: texto(c?.id, `c${i}`),
          nicho: texto(c?.nicho),
          resultado: texto(c?.resultado),
          contexto: texto(c?.contexto),
        }))
      : [],
    validadeDias: Number.isFinite(Number(bruto.validadeDias))
      ? Math.max(1, Math.round(Number(bruto.validadeDias)))
      : 15,
    observacoes: texto(bruto.observacoes),
  };
}

/* ── Rascunhos (localStorage) ────────────────────────────── */

const CHAVE_RASCUNHOS = "hub_propostas_v1";

export interface Rascunho {
  id: string;
  nome: string;
  atualizadoEm: number;
  estado: PropostaEstado;
}

export function lerRascunhos(): Rascunho[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CHAVE_RASCUNHOS);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((r) => r && typeof r.id === "string")
      .map((r) => ({
        id: r.id,
        nome: typeof r.nome === "string" ? r.nome : "Proposta sem nome",
        atualizadoEm: Number(r.atualizadoEm) || 0,
        estado: normalizar(r.estado ?? {}),
      }))
      .sort((a, b) => b.atualizadoEm - a.atualizadoEm);
  } catch {
    return [];
  }
}

/** Grava (ou atualiza) um rascunho. Devolve erro legível se o navegador recusar. */
export function salvarRascunho(id: string, estado: PropostaEstado): { ok: boolean; erro?: string } {
  if (typeof window === "undefined") return { ok: false, erro: "Indisponível." };
  const nome = estado.clienteEmpresa.trim() || "Proposta sem nome";
  const atuais = lerRascunhos().filter((r) => r.id !== id);
  const lista = [{ id, nome, atualizadoEm: Date.now(), estado }, ...atuais].slice(0, 20);
  try {
    window.localStorage.setItem(CHAVE_RASCUNHOS, JSON.stringify(lista));
    return { ok: true };
  } catch {
    return {
      ok: false,
      erro:
        "O navegador recusou salvar — normalmente é a logo ocupando espaço demais. Remova a logo ou apague um rascunho antigo e tente de novo.",
    };
  }
}

export function excluirRascunho(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CHAVE_RASCUNHOS,
      JSON.stringify(lerRascunhos().filter((r) => r.id !== id))
    );
  } catch {
    /* localStorage indisponível — ignora */
  }
}

/* ── Gancho de catálogo (Caminho A + preset) ─────────────── */

/**
 * Estrutura para um dia carregar um catálogo pronto de serviços (ex.: a tabela
 * de uma agência) sem mexer nesta ferramenta.
 *
 * IMPORTANTE: nenhum preset com valor real pode ser importado estaticamente
 * aqui — isso jogaria a tabela de preços dentro do bundle público. O preset
 * deve chegar em tempo de execução, de uma rota que exige autenticação, e o
 * resultado ser passado para `aplicarPreset`.
 */
export interface CatalogPreset {
  nome: string;
  servicos: Omit<Servico, "id">[];
  verbaMidiaSugerida?: string;
  pagamento?: string;
  cases?: Omit<CaseProva, "id">[];
}

export function aplicarPreset(e: PropostaEstado, preset: CatalogPreset): PropostaEstado {
  return {
    ...e,
    servicos: preset.servicos.map((s, i) => ({ ...s, id: `preset-${i}-${Date.now()}` })),
    verbaMidia: preset.verbaMidiaSugerida ?? e.verbaMidia,
    pagamento: preset.pagamento ?? e.pagamento,
    cases: preset.cases
      ? preset.cases.slice(0, 3).map((c, i) => ({ ...c, id: `presetc-${i}-${Date.now()}` }))
      : e.cases,
  };
}
