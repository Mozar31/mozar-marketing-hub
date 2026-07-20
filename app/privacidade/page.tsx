import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description:
    "Como o Marketing Hub trata seus dados: arquivos processados apenas no navegador, quais APIs são consultadas e quais informações não são coletadas.",
  alternates: { canonical: "/privacidade/" },
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ label: "Privacidade" }]} />

      <h1 className="font-display mt-4 text-3xl font-bold sm:text-4xl">Política de privacidade</h1>
      <p className="mt-2 text-sm text-ink-400">Última atualização: julho de 2026</p>

      <h2 className="font-display mt-8 text-xl font-bold">1. Arquivos que você envia</h2>
      <p className="mt-3 text-ink-300">
        Nas ferramentas marcadas com o selo <strong>“Processa no seu navegador”</strong>, os
        arquivos (PDFs, imagens, planilhas, listas de contatos) <strong>não são enviados para
        nenhum servidor</strong>. Todo o processamento acontece no seu dispositivo, dentro da aba do
        navegador. Ao fechar a página, nada permanece.
      </p>

      <h2 className="font-display mt-8 text-xl font-bold">2. Consultas a serviços do Google</h2>
      <p className="mt-3 text-ink-300">
        Duas ferramentas enviam informação para fora:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-300">
        <li>
          <strong>Auditoria de velocidade e SEO</strong> — o endereço do site que você digita é
          enviado ao Google PageSpeed Insights, que é quem executa a análise.
        </li>
        <li>
          <strong>Análise da ficha do Google</strong> — o link do Maps que você cola é enviado ao
          nosso servidor de automação, que consulta o Google Places API e devolve o diagnóstico. O
          resultado fica em cache por até 7 dias para evitar consultas repetidas.
        </li>
      </ul>
      <p className="mt-3 text-ink-300">
        Nos dois casos, o que é enviado é apenas o endereço público que você informou — nenhum dado
        pessoal seu acompanha a consulta.
      </p>

      <h2 className="font-display mt-8 text-xl font-bold">3. O que não coletamos</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-300">
        <li>Não exigimos cadastro, e-mail, telefone ou qualquer identificação.</li>
        <li>Não usamos cookies de publicidade nem rastreadores de terceiros.</li>
        <li>Não vendemos, compartilhamos ou revendemos dados — não temos dados para isso.</li>
      </ul>

      <h2 className="font-display mt-8 text-xl font-bold">4. Armazenamento no seu navegador</h2>
      <p className="mt-3 text-ink-300">
        Algumas ferramentas guardam preferências temporárias (como o histórico de links UTM da
        sessão) no armazenamento local do próprio navegador. Essa informação fica no seu
        dispositivo e pode ser apagada a qualquer momento limpando os dados do site.
      </p>

      <h2 className="font-display mt-8 text-xl font-bold">5. Contato</h2>
      <p className="mt-3 text-ink-300">
        Dúvidas sobre esta política ou sobre tratamento de dados (LGPD): fale com a Consig Invest
        pelo WhatsApp disponível no topo do site.
      </p>
    </div>
  );
}
