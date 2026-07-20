import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui";
import { NewsFeed } from "@/components/NewsFeed";

export const metadata: Metadata = {
  title: "Novidades do marketing digital",
  description:
    "Atualizações de Google Ads, Meta, SEO, analytics e inteligência artificial, resumidas em português com link para a fonte oficial.",
  alternates: { canonical: "/novidades/" },
};

export default function NovidadesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Breadcrumbs items={[{ label: "Novidades" }]} />

      <h1 className="mt-4 font-display text-3xl font-extrabold md:text-4xl">
        Novidades do marketing digital
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-300 md:text-base">
        O que mudou nas plataformas que você usa — Google, Meta, SEO, analytics e IA. Resumo em
        português, com data e link para o anúncio oficial. Atualizado automaticamente a partir dos
        blogs e changelogs dos próprios fornecedores.
      </p>

      <div className="mt-8">
        <NewsFeed />
      </div>
    </div>
  );
}
