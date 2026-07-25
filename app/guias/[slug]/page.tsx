import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GUIAS, getGuia } from "@/lib/guides";
import { getTool } from "@/lib/registry";
import { Breadcrumbs, ToolCard, CtaBlock } from "@/components/ui";
import { waLink } from "@/lib/config";
import { SITE_URL } from "@/app/layout";

export function generateStaticParams() {
  return GUIAS.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuia(slug);
  if (!g) return {};
  const url = `/guias/${g.slug}/`;
  return {
    title: g.title,
    description: g.description,
    keywords: g.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${g.title} — Marketing Hub Consig Invest`,
      description: g.description,
      url,
      type: "article",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: g.title }],
    },
  };
}

const fmtData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

export default async function GuiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuia(slug);
  if (!g) notFound();

  const relacionadas = g.ferramentas.map(getTool).filter((t): t is NonNullable<typeof t> => Boolean(t));

  // Article + FAQPage: ajuda buscadores e IA a entender e citar (nosso próprio AEO).
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.description,
    inLanguage: "pt-BR",
    datePublished: g.atualizado,
    dateModified: g.atualizado,
    author: { "@type": "Organization", name: "Consig Invest Marketing Digital" },
    publisher: { "@type": "Organization", name: "Consig Invest Marketing Digital", logo: `${SITE_URL}/logo.png` },
    mainEntityOfPage: `${SITE_URL}/guias/${g.slug}/`,
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: g.secoes.map((s) => ({
      "@type": "Question",
      name: s.titulo,
      acceptedAnswer: { "@type": "Answer", text: s.paragrafos.join(" ") },
    })),
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <Breadcrumbs items={[{ label: "Guias", href: "/guias/" }, { label: g.title }]} />

      <header className="mb-6">
        <h1 className="font-display text-2xl font-extrabold leading-tight md:text-3xl">{g.title}</h1>
        <p className="mt-2 text-xs text-ink-400">Atualizado em {fmtData.format(new Date(g.atualizado))} · Consig Invest</p>
      </header>

      <p className="text-[0.98rem] leading-relaxed text-ink-200">{g.intro}</p>

      <div className="mt-8 space-y-8">
        {g.secoes.map((s) => (
          <section key={s.titulo}>
            <h2 className="font-display text-lg font-bold text-info-400">{s.titulo}</h2>
            <div className="mt-2 space-y-3">
              {s.paragrafos.map((p, i) => (
                <p key={i} className="leading-relaxed text-ink-200">{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      {relacionadas.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-base font-bold">Ferramentas gratuitas deste guia</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {relacionadas.map((t) => <ToolCard key={t.slug} tool={t} compact />)}
          </div>
        </section>
      )}

      <div className="mt-12">
        <CtaBlock
          title="Quer que a gente cuide disso por você?"
          text="A Consig Invest faz o marketing digital da sua empresa: sites, tráfego pago, SEO e automação, com foco em gerar clientes."
          buttonLabel="💬 Falar com um especialista"
          href={waLink(`Vim pelo guia "${g.title}" no Hub da Consig Invest e quero ajuda com meu marketing.`)}
        />
      </div>

      <p className="mt-8 border-t border-white/10 pt-4 text-[0.72rem] leading-relaxed text-ink-400">
        Conteúdo educativo da Consig Invest. As ferramentas citadas são gratuitas e funcionam direto no navegador.
      </p>
    </article>
  );
}
