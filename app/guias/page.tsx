import type { Metadata } from "next";
import Link from "next/link";
import { GUIAS } from "@/lib/guides";
import { Breadcrumbs } from "@/components/ui";
import { EmailCapture } from "@/components/EmailCapture";

export const metadata: Metadata = {
  title: "Guias de marketing digital",
  description:
    "Guias práticos em português sobre marketing digital: ROAS, tags e pixels, SEO para IA e mais — com as ferramentas gratuitas para aplicar na hora.",
  alternates: { canonical: "/guias/" },
};

export default function GuiasPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Breadcrumbs items={[{ label: "Guias" }]} />
      <h1 className="font-display text-2xl font-extrabold md:text-3xl">Guias de marketing digital</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-300">
        Explicações diretas, em português, sobre as dúvidas mais comuns de quem trabalha com marketing —
        e as ferramentas gratuitas para colocar em prática.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {GUIAS.map((g) => (
          <li key={g.slug}>
            <Link href={`/guias/${g.slug}/`} className="card-surface block h-full p-5 transition hover:border-info-500/40">
              <h2 className="font-display text-base font-bold leading-snug">{g.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-400">{g.description}</p>
              <span className="mt-3 inline-block text-xs font-semibold text-info-400">Ler o guia →</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mx-auto mt-10 max-w-xl">
        <EmailCapture origem="guias" />
      </div>
    </div>
  );
}
