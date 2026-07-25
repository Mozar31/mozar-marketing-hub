import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui";
import { IaDirectory } from "@/components/IaDirectory";

export const metadata: Metadata = {
  title: "Diretório de IAs para marketing (em português)",
  description:
    "Ferramentas de IA para marketing, curadas em português e organizadas por tarefa: escrita, imagem, vídeo, áudio e pesquisa. Com preço, idioma e link oficial.",
  alternates: { canonical: "/ias/" },
};

export default function IasPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs items={[{ label: "Inteligências Artificiais" }]} />
      <h1 className="font-display text-2xl font-extrabold md:text-3xl">Diretório de IAs para marketing</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-300">
        Uma seleção enxuta e confiável — não uma lista de milhares. Escolhemos as IAs que resolvem tarefas
        reais de marketing, organizadas <strong>por tarefa</strong>, com preço, se funciona em português e link
        oficial. Confira sempre o preço atual no site da ferramenta.
      </p>

      <div className="mt-8"><IaDirectory /></div>
    </div>
  );
}
