import Link from "next/link";
import type { Metadata } from "next";
import { CATEGORIES, featuredTools } from "@/lib/registry";
import { ToolCard } from "@/components/ui";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <p className="mono text-sm font-bold text-info-400">Erro 404</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">
        Esta página não existe
      </h1>
      <p className="mt-4 max-w-2xl text-ink-300">
        O endereço pode ter mudado ou o link que você seguiu está desatualizado. Todas as
        ferramentas continuam disponíveis — é só escolher abaixo ou usar a busca no topo do site.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/ferramentas/" className="btn-primary">
          Ver todas as ferramentas
        </Link>
        <Link href="/" className="btn-ghost">
          Voltar para o início
        </Link>
      </div>

      <nav aria-label="Áreas do hub" className="mt-10">
        <p className="mb-3 font-display text-sm font-bold text-ink-300">Procurar por área</p>
        <ul className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/ferramentas/categoria/${c.slug}/`}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-ink-300 transition hover:border-info-500/50 hover:text-ink-100"
              >
                <span aria-hidden="true">{c.icon}</span> {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className="mt-10" aria-labelledby="mais-usadas-404">
        <h2 id="mais-usadas-404" className="mb-3 font-display text-sm font-bold text-ink-300">
          Mais usadas
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featuredTools().slice(0, 4).map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>
    </div>
  );
}
