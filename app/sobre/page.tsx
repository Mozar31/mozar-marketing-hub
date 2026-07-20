import type { Metadata } from "next";
import { TOOLS } from "@/lib/registry";
import { Breadcrumbs, CtaBlock } from "@/components/ui";
import { waLink } from "@/lib/config";

export const metadata: Metadata = {
  title: "Sobre o Marketing Hub",
  description:
    "Quem faz o Marketing Hub da Consig Invest, como as ferramentas funcionam, de onde vêm os dados e por que o uso é gratuito.",
  alternates: { canonical: "/sobre/" },
};

export default function SobrePage() {
  const locais = TOOLS.filter((t) => t.badges.includes("local-only")).length;
  const api = TOOLS.filter((t) => t.badges.includes("usa-api")).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ label: "Sobre" }]} />

      <h1 className="font-display mt-4 text-3xl font-bold sm:text-4xl">Sobre o Marketing Hub</h1>
      <p className="mt-4 text-ink-300">
        O Marketing Hub é um conjunto de {TOOLS.length} ferramentas de marketing digital mantido pela{" "}
        <strong>Consig Invest</strong>. Ele existe para resolver as tarefas do dia a dia de quem
        cuida de site, anúncios e presença no Google — sem cadastro, sem limite diário e sem custo.
      </p>

      <h2 className="font-display mt-8 text-xl font-bold">Como as ferramentas funcionam</h2>
      <p className="mt-3 text-ink-300">
        <strong>{locais} ferramentas rodam inteiramente no seu navegador.</strong> Ao converter um
        PDF, limpar uma lista de contatos ou redimensionar uma imagem, o arquivo nunca é enviado
        para servidor: o processamento acontece no seu próprio computador e o resultado é gerado
        localmente. Se você desconectar a internet depois de abrir a página, elas continuam
        funcionando.
      </p>
      <p className="mt-3 text-ink-300">
        <strong>{api} ferramentas consultam APIs públicas do Google</strong> — a auditoria de
        velocidade usa o PageSpeed Insights e a análise da ficha usa o Places API. Nesses casos a
        fonte é citada na própria página do resultado, junto com a data e a hora da consulta.
      </p>

      <h2 className="font-display mt-8 text-xl font-bold">O que a gente não faz</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-300">
        <li>Não pedimos cadastro nem e-mail para liberar nenhuma ferramenta.</li>
        <li>Não guardamos os arquivos que você processa — eles não chegam até nós.</li>
        <li>Não inventamos números: toda projeção mostra a memória de cálculo.</li>
        <li>Não publicamos ferramenta pela metade — se está no menu, está funcionando.</li>
      </ul>

      <h2 className="font-display mt-8 text-xl font-bold">Por que é gratuito</h2>
      <p className="mt-3 text-ink-300">
        A Consig Invest trabalha com tráfego pago, sites e presença digital para empresas. As
        ferramentas são a forma mais honesta que encontramos de mostrar como trabalhamos: se elas
        resolverem seu problema hoje, talvez você lembre da gente quando precisar de algo maior.
      </p>

      <div className="mt-10">
        <CtaBlock
          title="Precisa de mais do que uma ferramenta?"
          text="A Consig Invest cuida de tráfego pago, sites e presença no Google para empresas que querem crescer com previsibilidade."
          buttonLabel="Falar no WhatsApp"
          href={waLink("Olá, vim através do Hub da Consig Invest e gostaria de mais informações...")}
        />
      </div>
    </div>
  );
}
