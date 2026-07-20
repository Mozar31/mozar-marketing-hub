import { describe, it, expect } from "vitest";
import { parsePageSpec, baseName, escapeHTML, fmtBRL, fmtNum, fmtDec } from "../tools/runtime";

/**
 * parsePageSpec decide QUAIS páginas entram no PDF gerado. Um erro aqui
 * entrega ao usuário um arquivo silenciosamente errado — o pior tipo de bug.
 */
describe("parsePageSpec — seleção de páginas (índices base 0)", () => {
  it("aceita página solta", () => {
    expect(parsePageSpec("3", 10)).toEqual([2]);
  });

  it("aceita intervalo", () => {
    expect(parsePageSpec("2-4", 10)).toEqual([1, 2, 3]);
  });

  it("aceita a combinação que aparece na dica da interface: 1, 3-5, 8", () => {
    expect(parsePageSpec("1, 3-5, 8", 10)).toEqual([0, 2, 3, 4, 7]);
  });

  it("não repete página citada duas vezes", () => {
    expect(parsePageSpec("2, 2, 1-3", 10)).toEqual([0, 1, 2]);
  });

  it("devolve sempre em ordem crescente, mesmo fora de ordem na entrada", () => {
    expect(parsePageSpec("9, 2, 5", 10)).toEqual([1, 4, 8]);
  });

  it("aceita intervalo invertido (5-2)", () => {
    expect(parsePageSpec("5-2", 10)).toEqual([1, 2, 3, 4]);
  });

  it("descarta páginas fora do documento em vez de gerar arquivo quebrado", () => {
    expect(parsePageSpec("1, 99", 3)).toEqual([0]);
    expect(parsePageSpec("0", 3)).toEqual([]);
    expect(parsePageSpec("2-99", 3)).toEqual([1, 2]);
  });

  it("ignora lixo digitado sem quebrar", () => {
    expect(parsePageSpec("abc, 2, --, 3-", 5)).toEqual([1]);
    expect(parsePageSpec("", 5)).toEqual([]);
  });

  it("tolera espaços sobrando", () => {
    expect(parsePageSpec("  1 ,  3 - 4  ", 10)).toEqual([0, 2, 3]);
  });
});

describe("baseName — nome do arquivo de saída", () => {
  it("tira só a última extensão", () => {
    expect(baseName("relatorio.pdf")).toBe("relatorio");
    expect(baseName("backup.tar.gz")).toBe("backup.tar");
  });

  it("preserva ponto no meio e nome sem extensão", () => {
    expect(baseName("nota.fiscal.2026.pdf")).toBe("nota.fiscal.2026");
    expect(baseName("semextensao")).toBe("semextensao");
  });

  it("mantém acento e espaço do nome original", () => {
    expect(baseName("Relatório de Março.xlsx")).toBe("Relatório de Março");
  });
});

describe("escapeHTML — saída exibida na tela", () => {
  it("neutraliza tag injetada pelo conteúdo do arquivo", () => {
    expect(escapeHTML("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;"
    );
  });

  it("escapa o & antes dos demais, sem duplicar entidade", () => {
    expect(escapeHTML("a & <b>")).toBe("a &amp; &lt;b&gt;");
  });
});

describe("formatação pt-BR (vírgula decimal e ponto de milhar)", () => {
  const limpa = (s: string) => s.replace(/ | /g, " ");

  it("moeda em real", () => {
    expect(limpa(fmtBRL.format(1234.5))).toBe("R$ 1.234,50");
    expect(limpa(fmtBRL.format(0))).toBe("R$ 0,00");
  });

  it("número inteiro com separador de milhar", () => {
    expect(limpa(fmtNum.format(1234567))).toBe("1.234.567");
  });

  it("decimal com vírgula", () => {
    expect(limpa(fmtDec.format(3.456))).toContain(",");
  });
});
