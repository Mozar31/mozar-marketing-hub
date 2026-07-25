import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { IAS, getIa, iasPorTarefa } from "@/lib/ai-directory";
import { Breadcrumbs, CtaBlock } from "@/components/ui";
import { waLink } from "@/lib/config";
import { SITE_URL } from "@/app/layout";

export function generateStaticParams() {
  return IAS.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const ia = getIa(slug);
  if (!ia) return {};
  const url = `/ias/${ia.slug}/`;
  const title = `${ia.nome}: para que serve, preço e alternativas`;
  return {
    title,
    description: ia.resumo,
    alternates: { canonical: url },
    openGraph: { title: `${title} — Marketing Hub Consig Invest`, description: ia.resumo, url, type: "article", images: [{ url: "/og.png", width: 1200, height: 630, alt: ia.nome }] },
  };
}

const fmtData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

export default async function IaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ia = getIa(slug);
  if (!ia) notFound();

  const alternativas = iasPorTarefa(ia.tarefa).filter((i) => i.slug !== ia.slug).slice(0, 3);

  const ld = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: ia.nome,
    description: ia.resumo,
    applicationCategory: "BusinessApplication",
    inLanguage: ia.idiomaPt ? "pt-BR" : "en",
    url: ia.site,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Breadcrumbs items={[{ label: "IAs", href: "/ias/" }, { label: ia.nome }]} />

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-extrabold md:text-3xl">{ia.nome}</h1>
          {ia.idiomaPt && <span className="rounded-full border border-ok-500/30 px-2 py-0.5 text-[0.62rem] font-semibold text-ok-400">Funciona em PT-BR</span>}
        </div>
        <p className="mt-1 font-display text-sm font-semibold text-info-400">{ia.tarefaLabel}</p>
      </header>

      <p className="text-[0.98rem] leading-relaxed text-ink-200">{ia.resumo}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="card-surface p-4">
          <p className="text-[0.66rem] font-semibold uppercase tracking-wide text-ink-400">Preço</p>
          <p className="mt-1 text-sm text-ink-100">{ia.preco}</p>
          <p className="mt-1 text-[0.68rem] text-ink-400">Confira o valor atual no site oficial.</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-[0.66rem] font-semibold uppercase tracking-wide text-ink-400">Idioma</p>
          <p className="mt-1 text-sm text-ink-100">{ia.idiomaPt ? "Funciona bem em português" : "Interface/uso melhor em inglês"}</p>
          <p className="mt-1 text-[0.68rem] text-ink-400">Verificado em {fmtData.format(new Date(ia.verificado))}.</p>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="font-display text-base font-bold text-ok-400">✅ Bom para</h2>
        <ul className="mt-2 space-y-1.5">
          {ia.bomPara.map((b) => (
            <li key={b} className="pl-4 text-sm text-ink-200 before:mr-2 before:text-ok-400 before:content-['✓'] before:-ml-4">{b}</li>
          ))}
        </ul>
      </section>

      <section className="mt-5 rounded-xl border border-warn-500/30 bg-warn-500/[0.06] p-4">
        <h2 className="font-display text-sm font-bold text-warn-400">⚠️ Fique atento</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-300">{ia.atencao}</p>
      </section>

      <a href={ia.site} target="_blank" rel="noopener nofollow" className="btn-primary mt-6">
        Abrir o site oficial do {ia.nome} →
      </a>

      {alternativas.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-base font-bold">Alternativas de {ia.tarefaLabel.toLowerCase()}</h2>
          <div className="flex flex-wrap gap-2">
            {alternativas.map((a) => (
              <Link key={a.slug} href={`/ias/${a.slug}/`} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-ink-200 hover:border-info-500/50">
                {a.nome}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10">
        <CtaBlock
          title="Não sabe qual IA usar no seu caso?"
          text="A Consig Invest ajuda a montar e implantar o stack de IA e automação certo para o seu marketing."
          buttonLabel="💬 Falar com um especialista"
          href={waLink(`Vi a página da IA "${ia.nome}" no Hub da Consig Invest e quero ajuda para escolher/implantar ferramentas de IA no meu marketing.`)}
        />
      </div>

      <p className="mt-8 border-t border-white/10 pt-4 text-[0.72rem] leading-relaxed text-ink-400">
        Informações de curadoria da Consig Invest, verificadas na data indicada. Preços e recursos mudam com
        frequência — confirme sempre no site oficial. Não temos vínculo com as ferramentas listadas, salvo aviso.
      </p>
    </div>
  );
}
