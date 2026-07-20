import type { Metadata } from "next";
import { CATEGORIES, toolsByCategory } from "@/lib/registry";
import { ToolCard, Breadcrumbs } from "@/components/ui";

export const metadata: Metadata = {
  title: "Todas as ferramentas",
  description:
    "Ferramentas gratuitas de marketing digital: velocidade e SEO, ficha do Google, ROI de tráfego pago, conversores de PDF e imagem, planilhas e utilitários.",
  alternates: { canonical: "/ferramentas/" },
};

export default function FerramentasPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Breadcrumbs items={[{ label: "Ferramentas" }]} />

      <h1 className="text-3xl font-extrabold md:text-4xl">Todas as ferramentas</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-300 md:text-base">
        Organizadas por área de trabalho. Use a busca no topo (ou aperte{" "}
        <kbd className="rounded border border-white/20 px-1.5 py-0.5 text-xs">/</kbd>) para
        encontrar pela tarefa que você precisa resolver.
      </p>

      {CATEGORIES.map((cat) => {
        const tools = toolsByCategory(cat.slug);
        if (!tools.length) return null;
        return (
          <section key={cat.slug} id={cat.slug} className="mt-12 scroll-mt-32">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <span aria-hidden="true">{cat.icon}</span> {cat.label}
            </h2>
            <p className="mb-4 mt-1 max-w-3xl text-sm text-ink-400">{cat.description}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {tools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
