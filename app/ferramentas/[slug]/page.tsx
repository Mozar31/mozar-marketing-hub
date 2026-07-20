import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TOOLS, getTool, getCategory, toolsByCategory } from "@/lib/registry";
import { Breadcrumbs, Badge, LocalOnlyNotice, SourceNote, CtaBlock, ToolCard } from "@/components/ui";
import { ToolRunner } from "@/components/tools/ToolRunner";
import { waLink } from "@/lib/config";
import { SITE_URL } from "@/app/layout";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  const url = `/ferramentas/${tool.slug}/`;
  return {
    title: tool.title,
    description: tool.description,
    keywords: tool.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${tool.title} — Marketing Hub Consig Invest`,
      description: tool.description,
      url,
      type: "website",
    },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const cat = getCategory(tool.category)!;
  const related = toolsByCategory(tool.category).filter((t) => t.slug !== tool.slug).slice(0, 4);
  const isLocal = tool.badges.includes("local-only");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.title,
    description: tool.description,
    url: `${SITE_URL}/ferramentas/${tool.slug}/`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "pt-BR",
    offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
    publisher: { "@type": "Organization", name: "Consig Invest Marketing Digital" },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Ferramentas", item: `${SITE_URL}/ferramentas/` },
      { "@type": "ListItem", position: 3, name: cat.label, item: `${SITE_URL}/ferramentas/categoria/${cat.slug}/` },
      { "@type": "ListItem", position: 4, name: tool.title },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <Breadcrumbs
        items={[
          { label: "Ferramentas", href: "/ferramentas/" },
          { label: cat.label, href: `/ferramentas/categoria/${cat.slug}/` },
          { label: tool.title },
        ]}
      />

      <header className="mb-7">
        <h1 className="text-2xl font-extrabold md:text-3xl">{tool.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-300 md:text-base">
          {tool.description}
        </p>
        {tool.badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tool.badges.map((b) => (
              <Badge key={b} badge={b} />
            ))}
          </div>
        )}
      </header>

      {isLocal && <LocalOnlyNotice />}

      <ToolRunner slug={tool.slug} />

      <SourceNote
        source={tool.source}
        note={
          isLocal
            ? "Esta ferramenta funciona inteiramente no seu navegador: nenhum arquivo ou dado é enviado para servidores da Consig Invest."
            : undefined
        }
      />

      {related.length > 0 && (
        <section className="mt-14" aria-labelledby="relacionadas">
          <h2 id="relacionadas" className="mb-4 font-display text-base font-bold">
            Também em {cat.label}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((t) => (
              <ToolCard key={t.slug} tool={t} compact />
            ))}
          </div>
          <Link
            href={`/ferramentas/categoria/${cat.slug}/`}
            className="mt-4 inline-block text-sm font-semibold text-info-400 hover:underline"
          >
            Ver todas de {cat.label} →
          </Link>
        </section>
      )}

      <CtaBlock
        title="Quer que a gente faça isso por você?"
        text="A Consig Invest cuida do marketing digital da sua empresa: sites, tráfego pago, SEO e automação, com foco em gerar clientes."
        buttonLabel="💬 Falar com um especialista"
        href={waLink(`Olá, vim através do Hub da Consig Invest! Usei a ferramenta "${tool.title}" e gostaria de mais informações.`)}
      />
    </div>
  );
}
