import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES, getCategory, toolsByCategory, type FuncArea } from "@/lib/registry";
import { ToolCard, Breadcrumbs } from "@/components/ui";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategory(slug as FuncArea);
  if (!cat) return {};
  const count = toolsByCategory(cat.slug).length;
  return {
    title: cat.label,
    description: `${count} ferramentas de ${cat.label.toLowerCase()}: ${cat.description}`,
    alternates: { canonical: `/ferramentas/categoria/${cat.slug}/` },
  };
}

export default async function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = getCategory(slug as FuncArea);
  if (!cat) notFound();

  const tools = toolsByCategory(cat.slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Breadcrumbs items={[{ label: "Ferramentas", href: "/ferramentas/" }, { label: cat.label }]} />

      <h1 className="flex items-center gap-3 text-3xl font-extrabold md:text-4xl">
        <span aria-hidden="true">{cat.icon}</span> {cat.label}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-300 md:text-base">
        {cat.description}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>

      <nav aria-label="Outras categorias" className="mt-14 border-t border-white/10 pt-6">
        <p className="mb-3 font-display text-sm font-bold text-ink-300">Outras áreas</p>
        <ul className="flex flex-wrap gap-2">
          {CATEGORIES.filter((c) => c.slug !== cat.slug).map((c) => (
            <li key={c.slug}>
              <a
                href={`/ferramentas/categoria/${c.slug}/`}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-ink-300 transition hover:border-info-500/50 hover:text-ink-100"
              >
                <span aria-hidden="true">{c.icon}</span> {c.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
