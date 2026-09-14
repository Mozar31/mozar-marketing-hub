import type { ReactNode } from "react";

/**
 * Conteúdo editorial longo por ferramenta, renderizado NO SERVIDOR abaixo da
 * ferramenta.
 *
 * Existe porque o corpo das ferramentas entra por import dinâmico com
 * `ssr: false` (ver ToolRunner) — ou seja, não vai no HTML. Todo texto que
 * precisa ser indexado tem de passar por aqui.
 *
 * Ferramenta sem conteúdo (ou com conteúdo ainda por escrever) não renderiza
 * nada: nem o espaçamento, nem a linha divisória.
 */
const CONTEUDO: Record<string, ReactNode> = {
  /* CONTEÚDO SEO: 700-1000 palavras + FAQ */
  "gerador-de-proposta": null,
};

export function ToolContent({ slug }: { slug: string }) {
  const conteudo = CONTEUDO[slug];
  if (!conteudo) return null;
  return (
    <section className="mt-14 border-t border-white/10 pt-8 text-sm leading-relaxed text-ink-300">
      {conteudo}
    </section>
  );
}
