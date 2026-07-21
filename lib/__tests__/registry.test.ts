import { describe, it, expect } from "vitest";
import {
  TOOLS,
  CATEGORIES,
  getTool,
  toolsByCategory,
  searchTools,
  normalize,
} from "../registry";
import { FILE_TOOLS } from "../tools/converters";

/**
 * O registry alimenta rotas, menu, busca e sitemap. Se ele quebrar, o site
 * inteiro quebra junto — por isso as invariantes ficam travadas em teste.
 */

describe("registry — integridade do catálogo", () => {
  it("não tem slug repetido", () => {
    const slugs = TOOLS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("todo slug é seguro para URL", () => {
    for (const t of TOOLS) {
      expect(t.slug, t.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("toda ferramenta aponta para uma categoria que existe", () => {
    const cats = new Set(CATEGORIES.map((c) => c.slug));
    for (const t of TOOLS) {
      expect(cats.has(t.category), `${t.slug} → ${t.category}`).toBe(true);
    }
  });

  it("nenhuma categoria fica vazia (§ sem menu que leva a lugar nenhum)", () => {
    for (const c of CATEGORIES) {
      expect(toolsByCategory(c.slug).length, c.slug).toBeGreaterThan(0);
    }
  });

  it("toda ferramenta tem título, tagline e palavras-chave", () => {
    for (const t of TOOLS) {
      expect(t.title.length, t.slug).toBeGreaterThan(3);
      expect(t.tagline.length, t.slug).toBeGreaterThan(3);
      expect(t.keywords.length, t.slug).toBeGreaterThan(2);
    }
  });

  it("meta description cabe no limite do Google (até 160 caracteres)", () => {
    for (const t of TOOLS) {
      expect(t.description.length, `${t.slug}: ${t.description.length}`).toBeLessThanOrEqual(160);
      expect(t.description.length, t.slug).toBeGreaterThanOrEqual(70);
    }
  });

  it("cada ferramenta declara se roda local ou usa API — nunca os dois", () => {
    for (const t of TOOLS) {
      const local = t.badges.includes("local-only");
      const api = t.badges.includes("usa-api");
      expect(local || api, `${t.slug} sem selo de origem`).toBe(true);
      expect(local && api, `${t.slug} com selos contraditórios`).toBe(false);
    }
  });

  it("toda ferramenta que usa API cita a fonte (§ sempre citar a fonte)", () => {
    for (const t of TOOLS.filter((x) => x.badges.includes("usa-api"))) {
      expect(t.source, t.slug).toBeDefined();
      expect(t.source!.url, t.slug).toMatch(/^https:\/\//);
    }
  });

  it("legacyHash não se repete entre ferramentas", () => {
    const hashes = TOOLS.map((t) => t.legacyHash).filter(Boolean);
    expect(new Set(hashes).size).toBe(hashes.length);
  });
});

describe("registry — nenhum botão vazio (PROMPT 17)", () => {
  /** Slugs com interface própria, espelhando o CUSTOM do ToolRunner. */
  const CUSTOM = [
    "velocidade-e-seo", "ficha-google", "previa-google-e-redes", "dados-estruturados",
    "simulador-roi", "calculadora-de-midia", "break-even-cac-ltv", "construtor-utm",
    "gerador-google-ads",
    "link-whatsapp", "presets-de-criativos", "estudio-de-cores",
    "limpar-lista-de-contatos", "formatar-json", "texto-base64", "url-encode",
  ];

  it("toda ferramenta do registry tem implementação", () => {
    const semImplementacao = TOOLS.filter(
      (t) => !CUSTOM.includes(t.slug) && !FILE_TOOLS[t.slug]
    ).map((t) => t.slug);
    expect(semImplementacao).toEqual([]);
  });

  it("nenhuma implementação ficou órfã fora do registry", () => {
    const orfas = [...CUSTOM, ...Object.keys(FILE_TOOLS)].filter((s) => !getTool(s));
    expect(orfas).toEqual([]);
  });
});

describe("busca por tarefa", () => {
  const primeiro = (q: string) => searchTools(q)[0]?.slug;

  it("acha pelo que a pessoa quer fazer, não pelo nome técnico", () => {
    expect(primeiro("converter pdf em word")).toBe("pdf-para-word");
    expect(primeiro("comprimir imagem")).toBe("comprimir-imagem");
    expect(primeiro("foto do iphone nao abre")).toBe("heic-para-jpg");
  });

  it("ignora acento e caixa", () => {
    expect(searchTools("PDF PARA TEXTO")[0]?.slug).toBe("pdf-para-texto");
    expect(searchTools("previa")[0]?.slug).toBe("previa-google-e-redes");
  });

  it("não devolve nada para consulta vazia ou só de stopwords", () => {
    expect(searchTools("")).toEqual([]);
    expect(searchTools("   ")).toEqual([]);
    expect(searchTools("de para o")).toEqual([]);
  });

  it("normalize remove acentuação", () => {
    expect(normalize("Prévia Ação")).toBe("previa acao");
  });
});
