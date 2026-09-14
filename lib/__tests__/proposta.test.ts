import { describe, it, expect } from "vitest";
import {
  ESTADO_INICIAL,
  MODELOS_SERVICO,
  avisoConselho,
  calcularInvestimento,
  desserializar,
  fmtBRL,
  normalizar,
  parseBRL,
  serializar,
  textoDiagnostico,
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

describe("calcularInvestimento — o caso combinado com o cliente", () => {
  /** R$ 1.590,00 + R$ 899,00 (únicos) + R$ 1.000,00/mês em 6 meses. */
  const caso = estado({
    meses: 6,
    verbaMidia: "3.000,00",
    servicos: [
      servico({ nome: "Site", tipo: "unico", valor: "1.590,00" }),
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
    const verba = parseBRL(caso.verbaMidia);
    expect(verba).toBe(3000);

    // Os totais são exatamente os mesmos com verba zerada ou multiplicada.
    const semVerba = calcularInvestimento({ ...caso, verbaMidia: "0" });
    const comVerbaAlta = calcularInvestimento({ ...caso, verbaMidia: "99.999,00" });

    for (const chave of ["subtotalMensal", "subtotalUnico", "primeiroMes", "totalContrato"] as const) {
      expect(inv[chave], chave).toBe(semVerba[chave]);
      expect(inv[chave], chave).toBe(comVerbaAlta[chave]);
    }

    // E a verba aparece por fora, em campo próprio.
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

describe("textos automáticos — regras de conteúdo", () => {
  const cheio = estado({
    clienteEmpresa: "Clínica Exemplo",
    clienteCidade: "Porto Alegre",
    clienteSegmento: "Odontologia e clínicas",
    problema: "as campanhas trazem contato, mas quase ninguém fecha.",
    objetivo: "leads",
    situacao: ["anuncia", "site"],
    agenciaNome: "Agência Exemplo",
    verbaMidia: "2.000,00",
    servicos: [servico({ nome: "Gestão de Google Ads", valor: "1.500,00" })],
  });

  const todosOsTextos = (e: PropostaEstado) =>
    [...textoDiagnostico(e), textoWhatsApp(e), ...MODELOS_SERVICO.flatMap((m) => [m.nome, m.descricao, ...m.entregas])]
      .join(" ")
      .toLowerCase();

  it("abre pelo problema do cliente, não pela lista de serviços", () => {
    const primeiro = textoDiagnostico(cheio)[0] ?? "";
    expect(primeiro).toContain("Clínica Exemplo");
    expect(primeiro).toContain("quase ninguém fecha");
    expect(primeiro.toLowerCase()).not.toContain("google ads");
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
    expect(textoDiagnostico(cheio).join(" ")).toContain(
      "tráfego pago costuma dar sinal em dias; SEO, em semanas a meses"
    );
  });

  it("fala em lead qualificado e custo por lead, não em engajamento", () => {
    const t = todosOsTextos(cheio);
    expect(t).toContain("lead");
    expect(t).not.toContain("engajamento");
    expect(t).not.toContain("presença digital");
  });

  it("deixa a separação entre fee e verba explícita em pelo menos dois pontos", () => {
    const zap = textoWhatsApp(cheio).toLowerCase();
    const ocorrencias = [
      zap.includes("verba de mídia sugerida"),
      zap.includes("não faz parte do fee de gestão"),
      zap.includes("paga por você diretamente"),
    ].filter(Boolean).length;
    expect(ocorrencias).toBeGreaterThanOrEqual(2);
  });

  it("avisa sobre o conselho de classe em advocacia e saúde", () => {
    expect(avisoConselho("Advocacia")).toContain("OAB");
    expect(avisoConselho("Odontologia e clínicas")).toContain("CFO");
    expect(avisoConselho("Saúde mental")).toMatch(/CFM|CFP/);
    expect(avisoConselho("E-commerce")).toBeNull();
  });

  it("a frase de situação atual não inventa concordância errada", () => {
    const so = textoDiagnostico(estado({ clienteEmpresa: "Loja X", situacao: ["site"] })).join(" ");
    expect(so).toContain("Loja X tem site");
    expect(so).toContain("ainda não anuncia");
    expect(so).toContain("ainda não tem perfil no Google, rastreamento configurado nem CRM");
  });

  it("nenhum modelo de serviço vem com valor preenchido", () => {
    for (const m of MODELOS_SERVICO) {
      expect(m.valor, m.nome).toBe("");
    }
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
    servicos: [servico({ nome: "SEO", valor: "2.000,00" })],
  });

  it("vai e volta preservando o conteúdo", () => {
    const volta = desserializar(serializar(original))!;
    expect(volta).not.toBeNull();
    expect(volta.clienteEmpresa).toBe("Ação & Cia");
    expect(volta.problema).toBe(original.problema);
    expect(volta.meses).toBe(12);
    expect(volta.servicos[0]?.nome).toBe("SEO");
    expect(calcularInvestimento(volta).totalContrato).toBe(24000);
  });

  it("não leva a logo no link (estouraria o limite da URL)", () => {
    const b64 = serializar(original);
    expect(b64).not.toContain("data:image");
    expect(desserializar(b64)!.agenciaLogo).toBe("");
  });

  it("não quebra com link adulterado", () => {
    expect(desserializar("xxx-não-é-base64")).toBeNull();
    expect(desserializar("")).toBeNull();
  });

  it("normaliza campos fora do esperado em vez de confiar no link", () => {
    const n = normalizar({
      cor: "javascript:alert(1)",
      objetivo: "hackear" as never,
      meses: -3,
      situacao: ["site", "invalido"] as never,
      cases: [{}, {}, {}, {}] as never,
    });
    expect(n.cor).toBe("#0b5ed7");
    expect(n.objetivo).toBe("leads");
    expect(n.meses).toBe(1);
    expect(n.situacao).toEqual(["site"]);
    expect(n.cases).toHaveLength(3);
  });
});

describe("texto para WhatsApp", () => {
  it("traz os totais e a verba em linhas separadas", () => {
    const t = textoWhatsApp(
      estado({
        clienteEmpresa: "Empresa Y",
        agenciaNome: "Agência Z",
        meses: 6,
        verbaMidia: "1.000,00",
        servicos: [
          servico({ nome: "Site", tipo: "unico", valor: "1.590,00" }),
          servico({ nome: "Landing Page", tipo: "unico", valor: "899,00" }),
          servico({ nome: "Google Ads", tipo: "mensal", valor: "1.000,00" }),
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
