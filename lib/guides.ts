/**
 * Guias editoriais — conteúdo próprio em português que atrai busca orgânica
 * (cap. 16 da spec) e leva o leitor às ferramentas do hub. Escritos em formato
 * de perguntas e respostas, que é o que buscadores e IA mais reaproveitam.
 */

export interface GuiaSecao {
  /** De preferência em forma de pergunta (bom para SEO e para IA). */
  titulo: string;
  paragrafos: string[];
}

export interface Guia {
  slug: string;
  title: string;
  description: string; // 120–160 chars
  atualizado: string; // ISO date
  keywords: string[];
  ferramentas: string[]; // slugs relacionados
  intro: string;
  secoes: GuiaSecao[];
}

export const GUIAS: Guia[] = [
  {
    slug: "o-que-e-roas",
    title: "O que é ROAS e como calcular (com exemplo)",
    description:
      "ROAS é o retorno sobre o investimento em anúncios. Veja a fórmula, a diferença para o ROI e como saber o ROAS mínimo para não ter prejuízo.",
    atualizado: "2026-07-24",
    keywords: ["roas", "o que é roas", "como calcular roas", "roas mínimo", "retorno sobre investimento em anúncios", "roas e roi"],
    ferramentas: ["simulador-roi", "calculadora-de-midia", "break-even-cac-ltv"],
    intro:
      "ROAS (do inglês Return On Ad Spend) é o retorno que cada real investido em anúncios gera em faturamento. É a métrica que responde a pergunta mais comum de quem anuncia: “o anúncio está valendo a pena?”. Abaixo, a fórmula, um exemplo em reais e o erro mais comum de quem olha só para o ROAS.",
    secoes: [
      {
        titulo: "Qual é a fórmula do ROAS?",
        paragrafos: [
          "ROAS = faturamento gerado pelos anúncios ÷ valor investido nos anúncios. O resultado é um número “x”.",
          "Exemplo: se você investiu R$ 3.000 em anúncios e eles geraram R$ 9.000 em vendas, o ROAS foi de 3x — ou seja, cada R$ 1 investido trouxe R$ 3 de faturamento. Um ROAS de 1x significa que você apenas empatou em faturamento (mas provavelmente teve prejuízo, porque faturamento não é lucro).",
        ],
      },
      {
        titulo: "Qual a diferença entre ROAS e ROI?",
        paragrafos: [
          "O ROAS olha só para o faturamento sobre a mídia. O ROI (retorno sobre investimento) considera o lucro — ou seja, desconta o custo do produto, impostos e a própria mídia. Por isso um ROAS bonito pode esconder prejuízo: se a sua margem é baixa, um ROAS de 3x pode não pagar as contas.",
          "Regra prática: use o ROAS para acompanhar a campanha no dia a dia e o ROI para decidir se o negócio está saudável.",
        ],
      },
      {
        titulo: "Qual é o ROAS mínimo para não ter prejuízo?",
        paragrafos: [
          "O ROAS de equilíbrio depende da sua margem de lucro. A conta é: ROAS mínimo = 1 ÷ margem. Se a sua margem é de 40%, você precisa de pelo menos 1 ÷ 0,40 = 2,5x só para empatar. Abaixo disso, a campanha dá prejuízo mesmo vendendo.",
          "Ou seja: não existe “ROAS bom” universal. Um ROAS de 2x pode ser ótimo para quem tem margem alta e péssimo para quem tem margem apertada.",
        ],
      },
      {
        titulo: "Como calcular o ROAS da minha campanha?",
        paragrafos: [
          "Você pode simular tudo isso em segundos nas nossas calculadoras gratuitas, com as fórmulas visíveis e cenários conservador/base/agressivo. É útil tanto para planejar uma verba nova quanto para mostrar o retorno a um cliente.",
        ],
      },
    ],
  },
  {
    slug: "como-verificar-tags-de-um-site",
    title: "Como verificar as tags e pixels de um site",
    description:
      "Descubra quais tags e pixels (Google Analytics, GTM, Pixel da Meta, Google Ads) estão instalados em qualquer site — e por que isso importa para anunciar.",
    atualizado: "2026-07-24",
    keywords: ["verificar tags de um site", "ver pixel de um site", "google analytics instalado", "pixel da meta", "gtm", "auditar rastreamento"],
    ferramentas: ["verificador-tags-pixels", "auditoria-360", "auditor-seo-tecnico"],
    intro:
      "Antes de anunciar (ou de assumir um cliente), a primeira coisa a checar é se o site “mede” o que acontece. Sem rastreamento, você anuncia no escuro: não sabe quantas pessoas viraram lead nem consegue fazer remarketing. Veja como descobrir o que está instalado em qualquer site.",
    secoes: [
      {
        titulo: "O que são tags e pixels?",
        paragrafos: [
          "Tags e pixels são pequenos códigos que um site instala para medir o comportamento dos visitantes e alimentar as plataformas de anúncio. Os mais comuns: Google Analytics 4 (GA4) para medir visitas, Google Tag Manager (GTM) para gerenciar as tags, Pixel da Meta para anunciar no Facebook/Instagram, e a tag do Google Ads para conversões e remarketing.",
        ],
      },
      {
        titulo: "Por que verificar as tags de um site?",
        paragrafos: [
          "Porque sem elas você perde três coisas: medir resultado (quantos visitantes viraram contato), otimizar anúncios (as plataformas aprendem com as conversões) e fazer remarketing (impactar de novo quem já visitou). Um site sem rastreamento é um dos primeiros “furos” que uma agência corrige ao pegar um cliente.",
        ],
      },
      {
        titulo: "Como descobrir quais tags um site tem?",
        paragrafos: [
          "Você não precisa de nenhuma extensão. Cole o endereço do site no nosso verificador de tags e pixels e ele lê o código público da página e mostra o que está instalado — GA4, GTM, Pixel da Meta, Google Ads, TikTok e mais — além de apontar o que está faltando.",
          "Se quiser um raio-X completo (tags + SEO + links quebrados) num relatório só, use a Auditoria 360.",
        ],
      },
    ],
  },
  {
    slug: "o-que-e-aeo-geo",
    title: "AEO e GEO: como aparecer nas respostas do ChatGPT e do Google com IA",
    description:
      "Cada vez mais gente pergunta para a IA em vez de rolar o Google. Entenda o que é AEO/GEO e o que fazer para sua marca ser citada nas respostas.",
    atualizado: "2026-07-24",
    keywords: ["aeo", "geo", "o que é aeo", "generative engine optimization", "aparecer no chatgpt", "seo para ia", "ai overviews", "ser citado pela ia"],
    ferramentas: ["prontidao-para-ia", "dados-estruturados", "auditor-seo-tecnico"],
    intro:
      "AEO (Answer Engine Optimization) e GEO (Generative Engine Optimization) são o “SEO da era da IA”: em vez de otimizar só para aparecer na lista do Google, você otimiza para ser citado nas respostas do ChatGPT, do Perplexity e das visões gerais com IA do Google. Como boa parte das buscas passou a terminar dentro de uma resposta de IA (sem clique), estar dentro dessa resposta virou disputa nova.",
    secoes: [
      {
        titulo: "Qual a diferença entre SEO, AEO e GEO?",
        paragrafos: [
          "SEO tradicional busca ranquear sua página na lista de resultados. AEO/GEO buscam que sua página seja usada como fonte dentro de uma resposta gerada por IA. Não são opostos: um bom SEO técnico é a base, e o AEO/GEO adiciona sinais que ajudam a IA a entender, confiar e citar seu conteúdo.",
        ],
      },
      {
        titulo: "O que ajuda uma página a ser citada pela IA?",
        paragrafos: [
          "Na prática, alguns sinais on-page fazem diferença: conteúdo em texto de verdade (a IA cita o que está escrito, não imagens); formato de pergunta e resposta clara; dados estruturados (Schema) para a IA entender do que a página trata; autoria e marca identificadas; data de publicação/atualização visível; e o novo arquivo llms.txt, que resume o site para assistentes de IA e ainda é pouco usado — um bom diferencial.",
        ],
      },
      {
        titulo: "Como saber se minha página está pronta para a IA?",
        paragrafos: [
          "Cole o endereço no nosso verificador de prontidão para IA (AEO/GEO): ele lê a página pública e dá uma nota, apontando o que melhorar em cada sinal. Para os dados estruturados, use o gerador de dados estruturados; para a base técnica, o auditor de SEO técnico.",
        ],
      },
    ],
  },
];

export const getGuia = (slug: string) => GUIAS.find((g) => g.slug === slug);
