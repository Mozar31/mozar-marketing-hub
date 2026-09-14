import { describe, it, expect } from "vitest";
import {
  CATALOGO,
  ESTADO_INICIAL,
  avisoConselho,
  calcularInvestimento,
  desserializar,
  fmtBRL,
  normalizar,
  paginarServicos,
  parseBRL,
  serializar,
  paginarParagrafos,
  textoProposta,
  textoWhatsApp,
  type PropostaEstado,
  type Servico,
} from "../tools/proposta";

/**
 * A proposta é um documento comercial: se um total sair errado, alguém assina
 * contrato errado. Por isso as fórmulas e a separação entre honorários e verba
 * de mídia ficam travadas aqui.
 */

const servico = (over: Partial<Servico>): Servico => ({
  id: Math.random().toString(36).slice(2),
  nome: "Serviço",
  descricao: "",
  tipo: "mensal",
  valor: "0",
  entregas: [],
  ...over,
});

const estado = (over: Partial<PropostaEstado> = {}): PropostaEstado => ({
  ...ESTADO_INICIAL,
  ...over,
});

describe("parseBRL — lê o que a pessoa digitou", () => {
  it("entende o formato pt-BR", () => {
    expect(parseBRL("1.590,00")).toBe(1590);
    expect(parseBRL("R$ 1.590,00")).toBe(1590);
    expect(parseBRL("899,50")).toBe(899.5);
    expect(parseBRL("12.345.678,90")).toBe(12345678.9);
  });

  it("entende milhar sem centavos e decimal com ponto", () => {
    expect(parseBRL("1.590")).toBe(1590);
    expect(parseBRL("2.5")).toBe(2.5);
    expect(parseBRL("1590")).toBe(1590);
  });

  it("devolve zero para vazio ou lixo", () => {
    expect(parseBRL("")).toBe(0);
    expect(parseBRL("abc")).toBe(0);
    expect(parseBRL("   ")).toBe(0);
  });
});

describe("catálogo de serviços", () => {
  it("todo item tem nome único, valor legível e tipo válido", () => {
    const nomes = CATALOGO.map((c) => c.nome);
    expect(new Set(nomes).size).toBe(nomes.length);
    for (const c of CATALOGO) {
      expect(parseBRL(c.valor), c.nome).toBeGreaterThan(0);
      expect(["mensal", "unico"], c.nome).toContain(c.tipo);
      expect(c.entregas.length, c.nome).toBeGreaterThan(2);
    }
  });

  it("os valores do catálogo batem com a tabela da agência", () => {
    const esperado: Record<string, number> = {
      "Gestão de Google Ads": 1000,
      "Gestão de Meta Ads": 1000,
      "Google Meu Negócio": 500,
      "Atualização do Google Meu Negócio": 300,
      "SEO Básico": 300,
      "SEO Completo": 800,
      "Site Completo": 1590,
      "Landing Page": 899,
      "Social Media — Básico": 500,
      "Social Media — Prata": 800,
      "Social Media — Ouro": 1200,
      "Social Media — Diamante": 2000,
      "Disparo de WhatsApp — Software": 500,
      "Disparo de WhatsApp — API oficial": 500,
      "E-mail Marketing — implantação": 500,
      "Disparo de E-mail Marketing": 300,
    };
    for (const [nome, valor] of Object.entries(esperado)) {
      const item = CATALOGO.find((c) => c.nome === nome);
      expect(item, nome).toBeDefined();
      expect(parseBRL(item!.valor), nome).toBe(valor);
    }
    expect(CATALOGO).toHaveLength(Object.keys(esperado).length);
  });
});

describe("calcularInvestimento — o caso combinado com o cliente", () => {
  /** R$ 1.590,00 + R$ 899,00 (únicos) + R$ 1.000,00/mês em 6 meses. */
  const caso = estado({
    meses: 6,
    verbaMidia: "3.000,00",
    servicos: [
      servico({ nome: "Site Completo", tipo: "unico", valor: "1.590,00" }),
      servico({ nome: "Landing Page", tipo: "unico", valor: "899,00" }),
      servico({ nome: "Gestão de Google Ads", tipo: "mensal", valor: "1.000,00" }),
    ],
  });

  it("fecha o total do contrato em R$ 8.489,00", () => {
    const inv = calcularInvestimento(caso);
    expect(inv.subtotalUnico).toBe(2489);
    expect(inv.subtotalMensal).toBe(1000);
    expect(inv.totalContrato).toBe(8489);
    expect(fmtBRL.format(inv.totalContrato).replace(/ /g, " ")).toBe("R$ 8.489,00");
  });

  it("primeiro mês = mensal + único", () => {
    expect(calcularInvestimento(caso).primeiroMes).toBe(3489);
  });

  it("a verba de mídia NUNCA entra em nenhum subtotal de honorários", () => {
    const inv = calcularInvestimento(caso);
    expect(parseBRL(caso.verbaMidia)).toBe(3000);

    // Os totais são exatamente os mesmos com verba zerada ou multiplicada.
    const semVerba = calcularInvestimento({ ...caso, verbaMidia: "0" });
    const comVerbaAlta = calcularInvestimento({ ...caso, verbaMidia: "99.999,00" });

    for (const chave of ["subtotalMensal", "subtotalUnico", "primeiroMes", "totalContrato"] as const) {
      expect(inv[chave], chave).toBe(semVerba[chave]);
      expect(inv[chave], chave).toBe(comVerbaAlta[chave]);
    }

    expect(inv.verbaMidia).toBe(3000);
    expect(inv.verbaMidiaContrato).toBe(18000);
  });

  it("prazo de 1 mês não quebra o total", () => {
    const inv = calcularInvestimento({ ...caso, meses: 1 });
    expect(inv.totalContrato).toBe(3489);
    expect(inv.totalContrato).toBe(inv.primeiroMes);
  });

  it("meses inválidos caem para 1 em vez de zerar o contrato", () => {
    expect(calcularInvestimento({ ...caso, meses: 0 }).meses).toBe(1);
    expect(calcularInvestimento({ ...caso, meses: -4 }).meses).toBe(1);
  });

  it("proposta vazia soma zero, sem NaN", () => {
    const inv = calcularInvestimento(estado());
    expect(inv.totalContrato).toBe(0);
    expect(Number.isNaN(inv.primeiroMes)).toBe(false);
  });
});

describe("paginação do documento", () => {
  it("não perde nem duplica serviço ao quebrar em páginas", () => {
    const muitos = CATALOGO.map((c) => servico({ ...c, id: c.nome }));
    const paginas = paginarServicos(muitos);
    const achatado = paginas.flat().map((s) => s.id);
    expect(achatado).toEqual(muitos.map((s) => s.id));
    expect(paginas.length).toBeGreaterThan(1);
  });

  it("um serviço enorme sozinho ainda gera uma página", () => {
    const gigante = servico({ entregas: Array.from({ length: 40 }, (_, i) => `Item ${i}`) });
    expect(paginarServicos([gigante])).toHaveLength(1);
  });

  it("proposta sem serviço não gera página de escopo", () => {
    expect(paginarServicos([])).toEqual([]);
  });
});

describe("textos automáticos — regras de conteúdo", () => {
  const cheio = estado({
    clienteEmpresa: "Clínica Exemplo",
    clienteSegmento: "Odontologia e clínicas",
    problema: "as campanhas trazem contato, mas quase ninguém fecha.",
    objetivo: "leads",
    verbaMidia: "2.000,00",
    servicos: [servico({ nome: "Gestão de Google Ads", valor: "1.000,00" })],
  });

  const todosOsTextos = (e: PropostaEstado) =>
    [
      ...textoProposta(e),
      textoWhatsApp(e),
      ...CATALOGO.flatMap((c) => [c.nome, c.descricao, ...c.entregas]),
    ]
      .join(" ")
      .toLowerCase();

  it("fala na voz da agência e cita o cliente em terceira pessoa", () => {
    const todos = textoProposta(cheio).join(" ");
    expect(todos).toContain("Clínica Exemplo");
    // a fala do cliente entra entre aspas, para não misturar primeira e terceira pessoa
    expect(todos).toContain("“as campanhas trazem contato, mas quase ninguém fecha.”");
    expect(todos).toContain("nossa equipe");
    expect(todos.toLowerCase()).not.toContain("nos relatou: eu");
  });

  it("a fala do cliente em primeira pessoa fica dentro das aspas, nunca solta no texto", () => {
    const comEu = estado({
      clienteEmpresa: "Alquimistas",
      problema: "eu quero iniciar com duas coisas, fazer o Google meu negócio e o site.",
    });
    const todos = textoProposta(comEu).join(" ");
    const posAspas = todos.indexOf("“eu quero iniciar");
    expect(posAspas).toBeGreaterThan(-1);
    // fora das aspas não pode sobrar "eu quero"
    expect(todos.replace(/“[^”]*”/g, "")).not.toContain("eu quero");
  });

  it("o texto da IA, quando existe, substitui o texto padrão", () => {
    const comIA = estado({
      clienteEmpresa: "X",
      textoIA: ["Primeiro parágrafo.", "Segundo parágrafo."].join("\n\n"),
    });
    expect(textoProposta(comIA)).toEqual(["Primeiro parágrafo.", "Segundo parágrafo."]);
  });

  it("não promete resultado nem cita prazo específico de resultado", () => {
    const t = todosOsTextos(cheio);
    for (const proibido of [
      "garantimos",
      "garantia de resultado",
      "resultado garantido",
      "em 30 dias",
      "em 90 dias",
      "primeiros 30 dias",
      "em 3 meses você",
    ]) {
      expect(t, proibido).not.toContain(proibido);
    }
  });

  it("não usa clichê de agência", () => {
    const t = todosOsTextos(cheio);
    for (const clich of [
      "cada vez mais",
      "no mundo digital de hoje",
      "revolucionar",
      "potencializar",
      "alavancar seus resultados",
    ]) {
      expect(t, clich).not.toContain(clich);
    }
  });

  it("usa a única formulação de ritmo permitida", () => {
    expect(textoProposta(cheio).join(" ")).toContain(
      "tráfego pago costuma dar sinal em dias; SEO, em semanas a meses"
    );
  });

  it("site e landing page não cobram domínio do cliente", () => {
    for (const nome of ["Site Completo", "Landing Page"]) {
      const item = CATALOGO.find((c) => c.nome === nome)!;
      expect(item.entregas.join(" "), nome).not.toContain("Domínio .com.br (1 ano)");
      expect(item.entregas.join(" "), nome).toContain("pago por ele");
    }
  });

  it("deixa a separação entre fee e verba explícita em pelo menos dois pontos", () => {
    const zap = textoWhatsApp(cheio).toLowerCase();
    const ocorrencias = [
      zap.includes("verba de mídia sugerida"),
      zap.includes("pago diretamente a google e meta"),
      zap.includes("separado da gestão"),
    ].filter(Boolean).length;
    expect(ocorrencias).toBeGreaterThanOrEqual(2);
  });

  it("avisa sobre o conselho de classe em advocacia e saúde", () => {
    expect(avisoConselho("Advocacia")).toContain("OAB");
    expect(avisoConselho("Odontologia e clínicas")).toContain("CFO");
    expect(avisoConselho("Saúde mental")).toMatch(/CFM|CFP/);
    expect(avisoConselho("E-commerce")).toBeNull();
  });
});

describe("paginação do texto da proposta", () => {
  it("não perde parágrafo e quebra texto longo em mais de uma página", () => {
    const pars = Array.from({ length: 12 }, (_, i) => "Parágrafo ".repeat(20) + i);
    const paginas = paginarParagrafos(pars);
    expect(paginas.flat()).toEqual(pars);
    expect(paginas.length).toBeGreaterThan(1);
  });

  it("texto curto cabe em uma página só", () => {
    expect(paginarParagrafos(["Um.", "Dois."])).toHaveLength(1);
  });
});

describe("link compartilhável", () => {
  const original = estado({
    clienteEmpresa: "Ação & Cia",
    problema: "não sabemos de onde vêm os contatos",
    agenciaLogo: "data:image/png;base64,AAAA",
    cor: "#ff0000",
    meses: 12,
    verbaMidia: "1.000,00",
    servicos: [servico({ nome: "SEO Completo", valor: "800,00" })],
  });

  it("vai e volta preservando o conteúdo", () => {
    const volta = desserializar(serializar(original))!;
    expect(volta).not.toBeNull();
    expect(volta.clienteEmpresa).toBe("Ação & Cia");
    expect(volta.problema).toBe(original.problema);
    expect(volta.meses).toBe(12);
    expect(volta.servicos[0]?.nome).toBe("SEO Completo");
    expect(calcularInvestimento(volta).totalContrato).toBe(9600);
  });

  it("não leva a logo enviada pelo usuário no link (estouraria a URL)", () => {
    const b64 = serializar(original);
    expect(b64).not.toContain("data:image");
    expect(desserializar(b64)!.agenciaLogo).toBe(ESTADO_INICIAL.agenciaLogo);
  });

  it("não quebra com link adulterado", () => {
    expect(desserializar("xxx-não-é-base64")).toBeNull();
    expect(desserializar("")).toBeNull();
  });

  it("recusa logo de host externo vinda do link", () => {
    expect(normalizar({ agenciaLogo: "https://site-de-terceiro.com/x.png" }).agenciaLogo).toBe(
      ESTADO_INICIAL.agenciaLogo
    );
    expect(normalizar({ agenciaLogo: "/logo.png" }).agenciaLogo).toBe("/logo.png");
  });

  it("normaliza campos fora do esperado em vez de confiar no link", () => {
    const n = normalizar({
      cor: "javascript:alert(1)",
      objetivo: "hackear" as never,
      meses: -3,
    });
    expect(n.cor).toBe(ESTADO_INICIAL.cor);
    expect(n.objetivo).toBe("leads");
    expect(n.meses).toBe(1);
  });
});

describe("texto para WhatsApp", () => {
  it("traz os totais e a verba em linhas separadas", () => {
    const t = textoWhatsApp(
      estado({
        clienteEmpresa: "Empresa Y",
        meses: 6,
        verbaMidia: "1.000,00",
        servicos: [
          servico({ nome: "Site Completo", tipo: "unico", valor: "1.590,00" }),
          servico({ nome: "Landing Page", tipo: "unico", valor: "899,00" }),
          servico({ nome: "Gestão de Google Ads", tipo: "mensal", valor: "1.000,00" }),
        ],
      })
    ).replace(/ /g, " ");

    expect(t).toContain("Total do contrato (6 meses): R$ 8.489,00");
    expect(t).toContain("Primeiro mês: R$ 3.489,00");
    expect(t).toContain("Verba de mídia sugerida: R$ 1.000,00/mês");
    // A verba não pode aparecer somada em lugar nenhum: 8.489 + 1.000 = 9.489.
    expect(t).not.toContain("9.489,00");
  });
});
