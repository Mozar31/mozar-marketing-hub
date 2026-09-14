/**
 * Gerador de proposta comercial — lógica pura (§23).
 *
 * Tudo roda no navegador: nenhum dado do cliente, valor ou logo sai do
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

export type Objetivo =
  | "leads"
  | "vender-online"
  | "autoridade"
  | "reduzir-cpl"
  | "reestruturar";

export interface PropostaEstado {
  /* Cliente */
  clienteEmpresa: string;
  clienteSegmento: string;
  clienteContato: string;

  /* Diagnóstico */
  problema: string;
  objetivo: Objetivo;

  /* Escopo e investimento */
  servicos: Servico[];
  verbaMidia: string;
  meses: number;
  pagamento: string;

  /* Quem envia (vem preenchido; editável no bloco "Meus dados") */
  agenciaNome: string;
  agenciaLinha2: string;
  agenciaSite: string;
  agenciaWhatsapp: string;
  agenciaEmail: string;
  /** URL ou data URL da logo. Só em memória e no localStorage — nunca vai para a URL. */
  agenciaLogo: string;
  cor: string;

  /* Fechamento */
  validadeDias: number;
  observacoes: string;
}

/* ── Identidade visual (extraída do PDF padrão da agência) ── */

export const MARCA = {
  navy: "#0A3C90",
  azul: "#5470FE",
  cinza: "#E8E8E8",
  titulo: "#0D2440",
  corpo: "#12233C",
  verde: "#7CB342",
} as const;

export const COR_PADRAO = MARCA.navy;

export const ESTADO_INICIAL: PropostaEstado = {
  clienteEmpresa: "",
  clienteSegmento: "",
  clienteContato: "",

  problema: "",
  objetivo: "leads",

  servicos: [],
  verbaMidia: "",
  meses: 6,
  pagamento: "",

  agenciaNome: "Consig Invest",
  agenciaLinha2: "Agência de Marketing Digital",
  agenciaSite: "www.consiginvest.com",
  agenciaWhatsapp: "(51) 98349-3659",
  agenciaEmail: "contato@consiginvest.com",
  agenciaLogo: "/logo.png",
  cor: COR_PADRAO,

  validadeDias: 15,
  observacoes: "",
};

/* ── Listas de apoio ─────────────────────────────────────── */

export const SEGMENTOS = [
  "Odontologia e clínicas",
  "Advocacia",
  "Contabilidade",
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
  { key: "reestruturar", label: "Reestruturar o que já roda" },
];

export const PRAZOS = [3, 6, 12] as const;

/* ── Catálogo de serviços e valores ──────────────────────── */

export interface ItemCatalogo {
  nome: string;
  descricao: string;
  tipo: TipoCobranca;
  valor: string;
  entregas: string[];
  /** Agrupamento na interface. */
  grupo: "Anúncios" | "Google" | "SEO" | "Site" | "Social Media" | "Mensagens";
}

/**
 * Tabela de planos e valores da agência.
 *
 * ATENÇÃO: esta ferramenta é pública. Tudo o que está aqui vai para o
 * JavaScript da página e pode ser lido por qualquer visitante. Entrou aqui a
 * pedido do dono (14/09/2026); se um dia precisar ficar privado, o caminho é
 * servir o catálogo por rota autenticada em runtime, não esconder no bundle.
 */
export const CATALOGO: ItemCatalogo[] = [
  {
    grupo: "Anúncios",
    nome: "Gestão de Google Ads",
    descricao:
      "Campanhas na rede de pesquisa para aparecer no momento em que a pessoa está procurando pelo serviço.",
    tipo: "mensal",
    valor: "1.000,00",
    entregas: [
      "Criação e configuração completa da campanha",
      "Pesquisa de palavras-chave (alta intenção de conversão)",
      "Criação de grupos de anúncios e segmentações",
      "Configuração de conversões (WhatsApp, formulário, ligação)",
      "Otimizações semanais de performance",
      "Negativação de palavras-chave para evitar cliques ruins",
      "Ajuste de orçamento e estratégia de lances",
      "Relatório semanal em vídeo com análise e melhorias",
    ],
  },
  {
    grupo: "Anúncios",
    nome: "Gestão de Meta Ads",
    descricao:
      "Campanhas no Facebook e Instagram para alcançar quem ainda não procura pelo serviço, com medição de lead e conversa iniciada.",
    tipo: "mensal",
    valor: "1.000,00",
    entregas: [
      "Criação e estruturação do gerenciador de anúncios",
      "Configuração de pixel e eventos (quando aplicável)",
      "Criação de campanhas para tráfego, leads ou WhatsApp",
      "Segmentação por interesse + comportamento + região",
      "Criação de públicos personalizados e remarketing",
      "Testes A/B de criativos e públicos",
      "Otimização contínua para reduzir custo por lead",
      "Ajuste de orçamento e escala de campanhas",
      "Relatório semanal em vídeo com análise e melhorias",
    ],
  },
  {
    grupo: "Google",
    nome: "Google Meu Negócio",
    descricao: "Criação e configuração completa do perfil da empresa no Google e no Maps.",
    tipo: "unico",
    valor: "500,00",
    entregas: [
      "Criação e configuração completa do perfil",
      "Cadastro correto de endereço, área atendida e categorias",
      "Configuração de serviços e descrição profissional",
      "Inserção de horário, telefone, site e WhatsApp",
      "Otimização para aparecer no Google Maps",
      "Configuração inicial de fotos e identidade",
      "Orientação para começar a receber avaliações",
    ],
  },
  {
    grupo: "Google",
    nome: "Atualização do Google Meu Negócio",
    descricao: "Revisão e otimização de um perfil que já existe, para ranquear melhor no local.",
    tipo: "unico",
    valor: "300,00",
    entregas: [
      "Revisão e correção de dados",
      "Atualização de descrição e serviços",
      "Ajuste de categorias e posicionamento local",
      "Postagens iniciais no perfil",
      "Melhoria de palavras-chave no perfil",
      "Checklist de otimização completa para ranqueamento",
    ],
  },
  {
    grupo: "SEO",
    nome: "SEO Básico",
    descricao: "Posicionamento orgânico local: o essencial para ser encontrado na busca da região.",
    tipo: "mensal",
    valor: "300,00",
    entregas: [
      "Pesquisa de palavras-chave locais (ex.: “serviço + cidade”)",
      "Otimização de títulos e descrições das páginas (SEO On-Page)",
      "Ajuste de URLs e estrutura do site",
      "Configuração básica de SEO técnico",
      "Otimização de página inicial e páginas principais",
      "Estratégia de posicionamento no Google local",
      "Relatório mensal simples de evolução",
    ],
  },
  {
    grupo: "SEO",
    nome: "SEO Completo",
    descricao:
      "Planejamento de seis meses com conteúdo, blog e autoridade para capturar busca de alta intenção sem pagar por clique.",
    tipo: "mensal",
    valor: "800,00",
    entregas: [
      "Planejamento estratégico de SEO completo (6 meses)",
      "Pesquisa avançada de palavras-chave (SEO local + nacional)",
      "Criação de artigos e conteúdos para blog (SEO Conteúdo)",
      "Publicação e otimização de posts semanal/mensal",
      "Estruturação de blog e categorias para ranqueamento",
      "Otimização contínua de páginas e conteúdos",
      "Estratégia para aumentar autoridade do site no Google",
      "Monitoramento de crescimento orgânico e ranking de palavras-chave",
      "Relatórios mensais detalhados com evolução",
    ],
  },
  {
    grupo: "Site",
    nome: "Site Completo",
    descricao: "Site institucional de até 6 páginas, pensado para converter visita em contato.",
    tipo: "unico",
    valor: "1.590,00",
    entregas: [
      "Até 6 páginas",
      "Domínio .com.br (1 ano)",
      "Hospedagem (1 ano)",
      "E-mail profissional (1 ano)",
      "Layout profissional responsivo (celular e PC)",
      "Apresentação institucional e criação de conteúdo de blog para SEO",
      "Botão WhatsApp e formulários integrados",
      "Suporte e manutenção",
    ],
  },
  {
    grupo: "Site",
    nome: "Landing Page",
    descricao: "Página única de destino para campanha, com uma oferta e um caminho de conversão.",
    tipo: "unico",
    valor: "899,00",
    entregas: [
      "1 página",
      "Domínio .com.br (1 ano)",
      "Hospedagem (1 ano)",
      "E-mail profissional (1 ano)",
      "Layout profissional responsivo (celular e PC)",
      "Página focada em conversão (WhatsApp ou formulário)",
      "Integração com botão WhatsApp",
      "Suporte e manutenção",
    ],
  },
  {
    grupo: "Social Media",
    nome: "Social Media — Básico",
    descricao: "Presença organizada no perfil, com calendário e artes padronizadas.",
    tipo: "mensal",
    valor: "500,00",
    entregas: [
      "12 posts estáticos",
      "Identidade visual padronizada",
      "Artes com copy persuasiva",
      "Calendário mensal de postagens",
      "Bio otimizada e ajustes no perfil",
      "Sugestão de hashtags e temas",
    ],
  },
  {
    grupo: "Social Media",
    nome: "Social Media — Prata",
    descricao: "Mais volume de posts e a entrada do vídeo curto no perfil.",
    tipo: "mensal",
    valor: "800,00",
    entregas: [
      "20 posts estáticos",
      "Identidade visual profissional",
      "Edição básica de vídeo (Reels simples)",
      "10 roteiros prontos para Reels",
      "Calendário mensal estratégico",
      "Copy e legendas otimizadas",
    ],
  },
  {
    grupo: "Social Media",
    nome: "Social Media — Ouro",
    descricao: "Volume alto e edição completa de vídeo, com conteúdo focado em autoridade e venda.",
    tipo: "mensal",
    valor: "1.200,00",
    entregas: [
      "30 posts estáticos",
      "10 artes para Stories",
      "Edição completa de vídeo (Reels com cortes, legenda e ritmo)",
      "60 roteiros prontos para Reels",
      "Planejamento estratégico do mês inteiro",
      "Conteúdo focado em autoridade + vendas",
    ],
  },
  {
    grupo: "Social Media",
    nome: "Social Media — Diamante",
    descricao: "Operação completa de conteúdo, com postagem diária e acompanhamento semanal.",
    tipo: "mensal",
    valor: "2.000,00",
    entregas: [
      "40 posts estáticos premium",
      "20 artes para Stories (sequência estratégica)",
      "Reels editados completos (legenda + cortes + efeitos + ritmo)",
      "100 roteiros prontos para Reels (autoridade + vendas)",
      "Planejamento estratégico mensal completo",
      "Calendário de conteúdo avançado (postagens diárias)",
      "Copy persuasiva profissional para posts e Reels",
      "Criação de destaques (capas e organização do perfil)",
      "Otimização completa do Instagram (bio, nome, categorias)",
      "Estratégia de crescimento e posicionamento de marca",
      "Suporte direto para ideias e direcionamento semanal",
      "Análise de concorrentes e referências de conteúdo",
      "Relatório semanal com insights e próximos passos",
    ],
  },
  {
    grupo: "Mensagens",
    nome: "Disparo de WhatsApp — Software",
    descricao: "Licença e configuração do software de disparo na máquina do cliente.",
    tipo: "unico",
    valor: "500,00",
    entregas: [
      "Licença do software por 1 ano",
      "Configuração completa no computador",
      "Configuração de múltiplas contas",
      "Treinamento online para uso correto",
      "Suporte técnico incluso",
      "Orientação para evitar bloqueios e melhorar entregabilidade",
    ],
  },
  {
    grupo: "Mensagens",
    nome: "Disparo de WhatsApp — API oficial",
    descricao:
      "Implementação da API oficial e operação mensal das campanhas. Mensagens do tipo Utility custam R$ 0,06 cada, cobradas à parte pela Meta.",
    tipo: "mensal",
    valor: "500,00",
    entregas: [
      "Configuração completa da API oficial",
      "Integração com o WhatsApp Business Manager",
      "Ajuste de templates e mensagens padrão",
      "Configuração inicial de automações",
      "Treinamento básico para operação",
      "Programação de disparos e campanhas",
      "Criação de mensagens automáticas",
      "Segmentação e organização de listas",
      "Monitoramento, suporte e melhorias mensais",
    ],
  },
  {
    grupo: "Mensagens",
    nome: "E-mail Marketing — implantação",
    descricao: "Ferramenta configurada, domínio autenticado e estrutura de listas pronta para uso.",
    tipo: "unico",
    valor: "500,00",
    entregas: [
      "Configuração completa da ferramenta",
      "Configuração de domínio (SPF/DKIM/DMARC)",
      "Criação de estrutura de listas e segmentação",
      "Template profissional padrão",
      "Configuração de automações básicas",
      "Treinamento inicial",
    ],
  },
  {
    grupo: "Mensagens",
    nome: "Disparo de E-mail Marketing",
    descricao:
      "Operação mensal dos envios. O valor acompanha o volume contratado — ajuste o campo conforme a faixa.",
    tipo: "mensal",
    valor: "300,00",
    entregas: [
      "10 mil e-mails/mês — R$ 300,00",
      "20 mil e-mails/mês — R$ 400,00",
      "40 mil e-mails/mês — R$ 550,00",
      "60 mil e-mails/mês — R$ 700,00",
      "100 mil e-mails/mês — R$ 1.000,00",
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
      "Campanhas no ar, leitura semanal dos números e ajuste do que estiver caro ou fora do perfil. Relatório com custo por lead e conversão em cliente.",
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

  p.push(
    "Sobre ritmo: tráfego pago costuma dar sinal em dias; SEO, em semanas a meses. Nenhum dos dois é previsão de resultado — o que está no contrato é método, medição e ajuste do que estiver caro ou fora do perfil."
  );

  return p;
}

export const AVISO_VERBA =
  "O valor investido nos anúncios é pago diretamente a Google e Meta, separado da gestão, com pagamento feito na própria plataforma via Pix ou cartão de crédito, com total controle do cliente sobre a verba de mídia.";

export const AVISO_VERBA_CURTO =
  "Verba paga direto à plataforma — fora do fee de gestão.";

/* ── Texto para WhatsApp ─────────────────────────────────── */

export function textoWhatsApp(e: PropostaEstado): string {
  const inv = calcularInvestimento(e);
  const L: string[] = [];
  const empresa = e.clienteEmpresa.trim() || "sua empresa";

  L.push(`*PROPOSTA DE MARKETING — ${empresa.toUpperCase()}*`);
  if (e.agenciaNome.trim()) L.push(`Enviada por ${e.agenciaNome.trim()}`);
  L.push(`Válida por ${e.validadeDias} dias (até ${dataValidade(e)})`);
  L.push("");

  L.push("📌 *O PONTO DE PARTIDA*");
  textoDiagnostico(e).forEach((par) => L.push(par));
  L.push("");

  if (e.servicos.length) {
    L.push("🧩 *O QUE ENTRA*");
    e.servicos.forEach((s) => {
      const sufixo = s.tipo === "mensal" ? "/mês" : " (valor único)";
      L.push(`▪️ *${s.nome || "Serviço"}* — ${fmtBRL.format(parseBRL(s.valor))}${sufixo}`);
      if (s.descricao.trim()) L.push(s.descricao.trim());
      s.entregas.filter(Boolean).forEach((en) => L.push(`  ✅ ${en}`));
      L.push("");
    });
  }

  L.push("💰 *INVESTIMENTO*");
  if (inv.subtotalMensal > 0) L.push(`Honorários mensais: ${fmtBRL.format(inv.subtotalMensal)}/mês`);
  if (inv.subtotalUnico > 0) L.push(`Valor único (implantação): ${fmtBRL.format(inv.subtotalUnico)}`);
  L.push(`Primeiro mês: ${fmtBRL.format(inv.primeiroMes)}`);
  L.push(`Total do contrato (${inv.meses} meses): ${fmtBRL.format(inv.totalContrato)}`);
  if (inv.verbaMidia > 0) {
    L.push("");
    L.push(`📣 Verba de mídia sugerida: ${fmtBRL.format(inv.verbaMidia)}/mês`);
  }
  L.push(AVISO_VERBA);
  if (e.pagamento.trim()) {
    L.push("");
    L.push(`Condição de pagamento: ${e.pagamento.trim()}`);
  }
  L.push("");

  L.push("🛠️ *COMO COMEÇA*");
  METODO.forEach((m) => L.push(`${m.n}. *${m.titulo}* — ${m.texto}`));
  L.push("");

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
const MESES = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

export function dataHoje(base = new Date()): string {
  return fmtData.format(base);
}

/** Linha da capa no padrão do template: "SETEMBRO / 2026". */
export function mesAno(base = new Date()): string {
  return `${MESES[base.getMonth()] ?? ""} / ${base.getFullYear()}`;
}

export function dataValidade(e: PropostaEstado, base = new Date()): string {
  const d = new Date(base);
  d.setDate(d.getDate() + (Number(e.validadeDias) || 0));
  return fmtData.format(d);
}

/* ── Paginação do documento ──────────────────────────────── */

/**
 * Quebra os serviços em páginas A4 antes de imprimir. Fazemos a conta aqui
 * (em vez de deixar o navegador quebrar sozinho) porque cada página do padrão
 * tem ondas no topo e no rodapé: conteúdo transbordando invadiria a arte.
 */
export function paginarServicos(servicos: Servico[], linhasPorPagina = 30): Servico[][] {
  const paginas: Servico[][] = [];
  let atual: Servico[] = [];
  let linhas = 0;

  for (const s of servicos) {
    const custo = 3 + (s.descricao.trim() ? 2 : 0) + s.entregas.filter((x) => x.trim()).length;
    if (atual.length && linhas + custo > linhasPorPagina) {
      paginas.push(atual);
      atual = [];
      linhas = 0;
    }
    atual.push(s);
    linhas += custo;
  }
  if (atual.length) paginas.push(atual);
  return paginas;
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

/** Serializa o estado; data URL de logo fica de fora (não cabe numa URL). */
export function serializar(e: PropostaEstado): string {
  const enxuto = { ...e, agenciaLogo: e.agenciaLogo.startsWith("data:") ? "" : e.agenciaLogo };
  return b64encode(JSON.stringify(enxuto));
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

  return {
    ...ESTADO_INICIAL,
    clienteEmpresa: texto(bruto.clienteEmpresa),
    clienteSegmento: texto(bruto.clienteSegmento),
    clienteContato: texto(bruto.clienteContato),
    problema: texto(bruto.problema),
    objetivo: objetivosValidos.includes(bruto.objetivo as Objetivo)
      ? (bruto.objetivo as Objetivo)
      : "leads",
    servicos: Array.isArray(bruto.servicos)
      ? bruto.servicos.slice(0, 20).map((s, i) => ({
          id: texto(s?.id, `s${i}`),
          nome: texto(s?.nome),
          descricao: texto(s?.descricao),
          tipo: s?.tipo === "unico" ? "unico" : "mensal",
          valor: texto(s?.valor),
          entregas: Array.isArray(s?.entregas)
            ? s.entregas.filter((x): x is string => typeof x === "string").slice(0, 20)
            : [],
        }))
      : [],
    verbaMidia: texto(bruto.verbaMidia),
    meses: Number.isFinite(Number(bruto.meses)) ? Math.max(1, Math.round(Number(bruto.meses))) : 6,
    pagamento: texto(bruto.pagamento),
    agenciaNome: texto(bruto.agenciaNome, ESTADO_INICIAL.agenciaNome),
    agenciaLinha2: texto(bruto.agenciaLinha2, ESTADO_INICIAL.agenciaLinha2),
    agenciaSite: texto(bruto.agenciaSite, ESTADO_INICIAL.agenciaSite),
    agenciaWhatsapp: texto(bruto.agenciaWhatsapp, ESTADO_INICIAL.agenciaWhatsapp),
    agenciaEmail: texto(bruto.agenciaEmail, ESTADO_INICIAL.agenciaEmail),
    // Só aceita caminho interno ou data URL — nunca um host externo vindo do link.
    agenciaLogo: /^(\/|data:image\/)/.test(texto(bruto.agenciaLogo))
      ? texto(bruto.agenciaLogo)
      : ESTADO_INICIAL.agenciaLogo,
    cor: /^#[0-9a-f]{6}$/i.test(texto(bruto.cor)) ? texto(bruto.cor) : COR_PADRAO,
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
        "O navegador recusou salvar — normalmente é a logo ocupando espaço demais. Troque a logo ou apague um rascunho antigo e tente de novo.",
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
