import { describe, it, expect } from "vitest";
import { detectarTags } from "../server/tags";
import { analisarSeo } from "../server/seo";
import { extrairLinks } from "../server/links";
import { alvoSeguro, resolverAlvo } from "../server/http";

/**
 * As ferramentas de servidor (tags, SEO, links, Auditoria 360) leem sites de
 * terceiros. Um erro aqui vira acusação falsa na cara do cliente — por isso o
 * comportamento fica travado em teste.
 */

describe("detectarTags", () => {
  it("encontra GA4 e GTM e extrai o ID", () => {
    const html = `<script src="https://www.googletagmanager.com/gtag/js?id=G-5J8EVSG403"></script>
                  <script>GTM-ABC1234</script>`;
    const r = detectarTags(html);
    const nomes = r.encontrados.map((t) => t.nome);
    expect(nomes).toContain("Google Analytics 4 (GA4)");
    expect(nomes).toContain("Google Tag Manager");
    expect(r.encontrados.find((t) => t.nome.includes("GA4"))?.id).toBe("G-5J8EVSG403");
  });

  it("não confunde 'G-Digital' com um ID de GA4 (case-sensitive)", () => {
    const r = detectarTags(`<a href="/g-digital">G-Digital agência</a>`);
    expect(r.encontrados.some((t) => t.nome.includes("GA4"))).toBe(false);
  });

  it("lista as essenciais que faltam", () => {
    const r = detectarTags(`<script src="https://www.googletagmanager.com/gtag/js?id=G-AAAAAAAA1"></script>`);
    expect(r.faltandoEssenciais).toContain("Google Tag Manager");
    expect(r.faltandoEssenciais).toContain("Meta Pixel (Facebook/Instagram)");
    expect(r.faltandoEssenciais).not.toContain("Google Analytics 4 (GA4)");
  });
});

describe("analisarSeo", () => {
  const bom = `<!doctype html><html lang="pt-BR"><head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Página de teste com um bom tamanho de título</title>
    <meta name="description" content="Uma descrição de exemplo com tamanho adequado para os resultados do Google, entre cinquenta e cento e sessenta caracteres certo.">
    <link rel="canonical" href="https://exemplo.com/">
    <meta property="og:title" content="Exemplo">
    <meta property="og:image" content="https://exemplo.com/img.png">
    </head><body><h1>Único título</h1><img src="a.png" alt="descrição"></body></html>`;

  it("dá nota alta e nenhum erro para uma página bem feita", () => {
    const r = analisarSeo(bom, "https://exemplo.com/");
    expect(r.resumo.erro).toBe(0);
    expect(r.nota).toBeGreaterThanOrEqual(90);
  });

  it("acusa erro quando falta title e H1", () => {
    const r = analisarSeo(`<html><head></head><body><p>oi</p></body></html>`, "https://exemplo.com/");
    const erros = r.pontos.filter((p) => p.nivel === "erro").map((p) => p.chave);
    expect(erros).toContain("title");
    expect(erros).toContain("h1");
  });

  it("marca erro de HTTPS quando a URL final é http", () => {
    const r = analisarSeo(bom, "http://exemplo.com/");
    expect(r.pontos.find((p) => p.chave === "https")?.nivel).toBe("erro");
  });

  it("detecta noindex como erro", () => {
    const r = analisarSeo(`<html><head><meta name="robots" content="noindex, nofollow"><title>x titulo aqui</title></head><body><h1>a</h1></body></html>`, "https://exemplo.com/");
    expect(r.pontos.find((p) => p.chave === "robots")?.nivel).toBe("erro");
  });

  it("conta imagens sem alt", () => {
    const r = analisarSeo(`<html><head><title>titulo de tamanho ok</title></head><body><h1>a</h1><img src="1.png"><img src="2.png" alt="ok"></body></html>`, "https://exemplo.com/");
    const alt = r.pontos.find((p) => p.chave === "alt");
    expect(alt?.nivel).toBe("aviso");
    expect(alt?.valor).toContain("1 de 2");
  });
});

describe("extrairLinks", () => {
  const html = `
    <a href="/interna">Página interna</a>
    <a href="https://externo.com/pagina">Externo</a>
    <a href="/interna">Duplicada</a>
    <a href="#topo">Âncora</a>
    <a href="mailto:a@b.com">Email</a>
    <a href="https://externo.com/pagina#secao">Mesma que externo com hash</a>
  `;
  const links = extrairLinks(html, "https://site.com/pagina/");

  it("resolve relativos para absolutos", () => {
    expect(links.some((l) => l.url === "https://site.com/interna")).toBe(true);
  });

  it("remove duplicados e ignora âncoras/mailto", () => {
    const urls = links.map((l) => l.url);
    expect(urls.filter((u) => u === "https://site.com/interna").length).toBe(1);
    expect(urls.some((u) => u.includes("mailto"))).toBe(false);
    expect(urls.some((u) => u.includes("#"))).toBe(false);
    // externo com e sem hash colapsam em um só
    expect(urls.filter((u) => u === "https://externo.com/pagina").length).toBe(1);
  });

  it("marca links internos vs externos pelo host", () => {
    expect(links.find((l) => l.url === "https://site.com/interna")?.interno).toBe(true);
    expect(links.find((l) => l.url === "https://externo.com/pagina")?.interno).toBe(false);
  });
});

describe("guarda anti-SSRF", () => {
  it("bloqueia localhost e IPs privados", () => {
    expect(alvoSeguro(new URL("http://localhost/"))).toBe(false);
    expect(alvoSeguro(new URL("http://127.0.0.1/"))).toBe(false);
    expect(alvoSeguro(new URL("http://192.168.0.1/"))).toBe(false);
    expect(alvoSeguro(new URL("http://169.254.169.254/"))).toBe(false);
    expect(alvoSeguro(new URL("http://10.0.0.5/"))).toBe(false);
  });

  it("libera sites públicos", () => {
    expect(alvoSeguro(new URL("https://exemplo.com/"))).toBe(true);
  });

  it("resolverAlvo adiciona https e recusa alvo interno", () => {
    expect(resolverAlvo("exemplo.com").toString()).toBe("https://exemplo.com/");
    expect(() => resolverAlvo("localhost")).toThrow("url_bloqueada");
    expect(() => resolverAlvo("")).toThrow("url_vazia");
  });
});
