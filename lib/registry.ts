/**
 * Registry central de módulos do Marketing Hub.
 * Especificação §9 e §23: cada ferramenta é uma entrada declarativa; a interface
 * (home, categorias, busca, mega menu, sitemap) é gerada a partir daqui.
 *
 * Regra: NENHUM botão vazio em produção (PROMPT 17). Só entra no registry o que
 * está implementado. Módulos planejados ficam em BACKLOG.md.
 */

/** Área de trabalho do profissional — usada para navegação por função. */
export type FuncArea =
  | "trafego"
  | "seo"
  | "web"
  | "design"
  | "video"
  | "social"
  | "dados"
  | "conversores";

/** Selos honestos de estado, exigidos pela especificação §6 ("estados obrigatórios"). */
export type ToolBadge =
  | "local-only" // processa no navegador, nada sai do dispositivo
  | "usa-api" // depende de API externa identificada
  | "servidor" // processa no nosso servidor (ex.: lê um site público informado)
  | "beta"
  | "novo";

export interface ToolCategory {
  slug: FuncArea;
  label: string;
  short: string;
  icon: string;
  description: string;
}

export interface Tool {
  slug: string;
  title: string;
  /** Frase curta para o card. */
  tagline: string;
  /** Texto para <meta name="description"> — 120–160 caracteres. */
  description: string;
  category: FuncArea;
  /** Sinônimos e termos de busca por tarefa ("quero converter pdf em word"). */
  keywords: string[];
  badges: ToolBadge[];
  /** Destaque na home. */
  featured?: boolean;
  /** Hash da versão antiga do site, para redirecionar sem quebrar links. */
  legacyHash?: string;
  /** Fonte de dados, quando a ferramenta consome API externa (§6: sempre citar fonte). */
  source?: { name: string; url: string };
}

export const CATEGORIES: ToolCategory[] = [
  {
    slug: "trafego",
    label: "Tráfego pago",
    short: "Tráfego",
    icon: "📈",
    description:
      "Calculadoras de ROI, ROAS, break-even, CAC e LTV, construtor de UTM e métricas de mídia para quem gere verba.",
  },
  {
    slug: "seo",
    label: "SEO e presença",
    short: "SEO",
    icon: "🔍",
    description:
      "Auditoria de velocidade e Core Web Vitals, análise da ficha do Google, prévia de resultado de busca e dados estruturados.",
  },
  {
    slug: "web",
    label: "Web e sites",
    short: "Web",
    icon: "🧱",
    description:
      "Utilitários técnicos para quem cria e mantém sites: dados estruturados, codificação, JSON e verificação de arquivos.",
  },
  {
    slug: "design",
    label: "Design e imagem",
    short: "Design",
    icon: "🎨",
    description:
      "Estúdio de cores e contraste, presets de criativos para redes sociais e tratamento de imagens no navegador.",
  },
  {
    slug: "social",
    label: "Social e mensagens",
    short: "Social",
    icon: "💬",
    description: "Geradores de link e QR Code para WhatsApp e presets de tamanho para cada rede social.",
  },
  {
    slug: "dados",
    label: "Dados e planilhas",
    short: "Dados",
    icon: "📊",
    description: "Conversão entre Excel, CSV e JSON, limpeza de listas de contatos e ajuste de separadores.",
  },
  {
    slug: "conversores",
    label: "Conversores de arquivos",
    short: "Conversores",
    icon: "🔄",
    description:
      "PDF, imagens, documentos e arquivos compactados convertidos direto no seu navegador, sem upload.",
  },
];

export const TOOLS: Tool[] = [
  // ═══════════════ SEO e presença ═══════════════
  {
    slug: "velocidade-e-seo",
    title: "Auditoria de velocidade e SEO",
    tagline: "Notas reais do Google para celular e computador",
    description:
      "Analise a velocidade e o SEO do seu site com dados do Google PageSpeed: notas de celular e computador, LCP, CLS e o que corrigir primeiro.",
    category: "seo",
    keywords: ["pagespeed", "core web vitals", "lighthouse", "lcp", "cls", "velocidade", "site lento", "performance"],
    badges: ["usa-api"],
    featured: true,
    legacyHash: "velocidade",
    source: { name: "Google PageSpeed Insights API v5", url: "https://developers.google.com/speed/docs/insights/v5/get-started" },
  },
  {
    slug: "ficha-google",
    title: "Análise da ficha do Google",
    tagline: "Diagnóstico automático do seu perfil no Maps",
    description:
      "Cole o link da sua empresa no Google Maps e receba um diagnóstico automático da ficha: o que está completo e o que precisa de atenção.",
    category: "seo",
    keywords: ["google meu negocio", "google business profile", "gbp", "maps", "ficha", "seo local", "avaliacoes"],
    badges: ["usa-api"],
    featured: true,
    legacyHash: "google-meu-negocio",
    source: { name: "Google Places API (New)", url: "https://developers.google.com/maps/documentation/places/web-service/overview" },
  },
  {
    slug: "previa-google-e-redes",
    title: "Prévia no Google e nas redes",
    tagline: "Veja como seu link aparece antes de publicar",
    description:
      "Simule como sua página aparece no resultado do Google e ao ser compartilhada no WhatsApp, Facebook e LinkedIn, com contagem de caracteres.",
    category: "seo",
    keywords: ["serp", "open graph", "og", "meta description", "title", "preview", "compartilhamento", "snippet"],
    badges: ["local-only", "novo"],
    featured: true,
  },
  {
    slug: "dados-estruturados",
    title: "Gerador de dados estruturados",
    tagline: "Schema.org para empresa, FAQ, produto e artigo",
    description:
      "Gere o código JSON-LD de dados estruturados (Schema.org) para empresa local, FAQ, produto, artigo e breadcrumb, pronto para colar no site.",
    category: "seo",
    keywords: ["schema", "json-ld", "structured data", "rich snippet", "faq", "localbusiness", "produto"],
    badges: ["local-only", "novo"],
  },

  {
    slug: "verificador-tags-pixels",
    title: "Verificador de tags e pixels",
    tagline: "Veja o que está instalado em qualquer site",
    description:
      "Digite o endereço de um site e descubra quais tags e pixels estão instalados: Google Analytics (GA4), Tag Manager, Pixel da Meta, Google Ads, TikTok e mais.",
    category: "seo",
    keywords: ["tags", "pixel", "ga4", "google analytics", "gtm", "tag manager", "meta pixel", "facebook pixel", "google ads", "tiktok", "rastreamento", "trackeamento", "auditoria"],
    badges: ["servidor", "novo"],
    featured: true,
  },
  {
    slug: "auditor-seo-tecnico",
    title: "Auditor de SEO técnico",
    tagline: "Diagnóstico de SEO on-page em segundos",
    description:
      "Digite um site e receba o diagnóstico de SEO on-page: título, descrição, H1, responsividade, canonical, Open Graph, imagens sem alt, indexação e HTTPS.",
    category: "seo",
    keywords: ["seo", "auditoria", "on-page", "title", "meta description", "h1", "canonical", "open graph", "indexacao", "https", "tecnico", "site"],
    badges: ["servidor", "novo"],
    featured: true,
  },
  {
    slug: "auditoria-360",
    title: "Auditoria 360 do site",
    tagline: "Tags, SEO e links quebrados num relatório só",
    description:
      "Um raio-X do site em um relatório único: tags e pixels instalados, SEO técnico e links quebrados. Ideal para o diagnóstico inicial de um cliente novo.",
    category: "seo",
    keywords: ["auditoria", "360", "diagnostico", "raio-x", "site", "tags", "pixels", "seo", "links quebrados", "cliente", "completo"],
    badges: ["servidor", "novo"],
    featured: true,
  },

  // ═══════════════ Tráfego pago ═══════════════
  {
    slug: "simulador-roi",
    title: "Simulador de ROI e ROAS",
    tagline: "Projete faturamento no Google e no Meta",
    description:
      "Simule cliques, leads, vendas, CPA e ROAS do seu investimento em anúncios no Google Ads (CPC) e no Meta Ads (CPM), com a memória de cálculo visível.",
    category: "trafego",
    keywords: ["roi", "roas", "cpa", "cpc", "cpm", "trafego pago", "google ads", "meta ads", "facebook ads", "simulador"],
    badges: ["local-only"],
    featured: true,
    legacyHash: "roi",
  },
  {
    slug: "calculadora-de-midia",
    title: "Calculadora universal de mídia",
    tagline: "Descubra a métrica que falta em qualquer campanha",
    description:
      "Calcule CPC, CPM, CTR, CPA, ROAS, taxa de conversão e ticket médio a partir dos números que você já tem, com as fórmulas explicadas.",
    category: "trafego",
    keywords: ["cpc", "cpm", "ctr", "cpa", "roas", "taxa de conversao", "metricas", "calculadora", "midia"],
    badges: ["local-only", "novo"],
    featured: true,
  },
  {
    slug: "break-even-cac-ltv",
    title: "Break-even, CAC e LTV",
    tagline: "Até quanto você pode pagar por cliente",
    description:
      "Calcule o ROAS mínimo para não ter prejuízo, o custo máximo de aquisição e o valor do cliente no tempo, considerando margem e recompra.",
    category: "trafego",
    keywords: ["break even", "ponto de equilibrio", "cac", "ltv", "margem", "roas minimo", "lucro"],
    badges: ["local-only", "novo"],
  },
  {
    slug: "construtor-utm",
    title: "Construtor de links UTM",
    tagline: "Links rastreáveis com padrão consistente",
    description:
      "Monte links com parâmetros UTM padronizados para rastrear suas campanhas no Google Analytics, com validação e histórico da sessão.",
    category: "trafego",
    keywords: ["utm", "rastreamento", "analytics", "ga4", "campanha", "link", "parametro", "origem"],
    badges: ["local-only", "novo"],
    featured: true,
  },
  {
    slug: "gerador-google-ads",
    title: "Gerador de anúncios do Google Ads",
    tagline: "Títulos, descrições e extensões prontos",
    description:
      "Monte um anúncio do Google Ads: títulos, descrições, frases de destaque e caminho de exibição, já dentro dos limites de caractere, com contador e boas práticas.",
    category: "trafego",
    keywords: ["google ads", "anuncio", "rede de pesquisa", "rsa", "titulo", "descricao", "callout", "sitelink", "gerador", "copy", "texto de anuncio"],
    badges: ["local-only", "novo"],
    featured: true,
  },
  {
    slug: "analisador-landing-page",
    title: "Analisador de landing page",
    tagline: "Sua página de vendas está pronta para converter?",
    description:
      "Cole uma página de vendas e veja se ela converte: proposta, botão de ação, formulário, WhatsApp, prova social, celular, segurança e medição.",
    category: "trafego",
    keywords: ["landing page", "pagina de vendas", "conversao", "converter", "cta", "botao de acao", "formulario", "otimizacao", "cro", "vendas"],
    badges: ["servidor", "novo"],
    featured: true,
  },

  // ═══════════════ Social e mensagens ═══════════════
  {
    slug: "link-whatsapp",
    title: "Gerador de link e QR do WhatsApp",
    tagline: "Link direto com mensagem pronta",
    description:
      "Crie um link que abre a conversa no seu WhatsApp com a mensagem já escrita, e baixe o QR Code para imprimir ou usar nos anúncios.",
    category: "social",
    keywords: ["whatsapp", "link", "qr code", "wa.me", "mensagem", "clique para conversar", "botao"],
    badges: ["local-only", "novo"],
    featured: true,
  },
  {
    slug: "presets-de-criativos",
    title: "Redimensionamento de criativos",
    tagline: "Tamanho certo para cada rede social",
    description:
      "Redimensione sua imagem para os formatos exatos de Instagram, Facebook, LinkedIn, YouTube e Google Ads, sem sair do navegador.",
    category: "social",
    keywords: ["tamanho", "formato", "instagram", "feed", "stories", "reels", "youtube", "thumbnail", "redimensionar", "criativo"],
    badges: ["local-only", "novo"],
  },

  // ═══════════════ Design ═══════════════
  {
    slug: "estudio-de-cores",
    title: "Estúdio de cores e contraste",
    tagline: "HEX, RGB, HSL, CMYK e acessibilidade",
    description:
      "Converta cores entre HEX, RGB, HSL e CMYK, gere variações claras e escuras e verifique o contraste conforme as regras de acessibilidade WCAG.",
    category: "design",
    keywords: ["cor", "hex", "rgb", "hsl", "cmyk", "paleta", "contraste", "wcag", "acessibilidade"],
    badges: ["local-only"],
    legacyHash: "conversores/conversor-cores",
  },

  // ═══════════════ Dados ═══════════════
  {
    slug: "excel-csv",
    title: "Excel ↔ CSV",
    tagline: "Planilhas convertidas nos dois sentidos",
    description:
      "Converta arquivos .xlsx e .xls em CSV e vice-versa, com uma saída por aba da planilha, direto no navegador.",
    category: "dados",
    keywords: ["excel", "csv", "xlsx", "xls", "planilha", "converter", "aba"],
    badges: ["local-only"],
    legacyHash: "conversores/excel-csv",
  },
  {
    slug: "json-csv",
    title: "JSON ↔ CSV",
    tagline: "Dados de sistema viram tabela",
    description: "Converta dados em JSON para tabela CSV e transforme CSV em JSON estruturado, sem enviar nada para servidor.",
    category: "dados",
    keywords: ["json", "csv", "api", "dados", "tabela", "converter"],
    badges: ["local-only"],
    legacyHash: "conversores/json-csv",
  },
  {
    slug: "separador-csv",
    title: "Trocar separador do CSV",
    tagline: "Resolve o CSV que abre bagunçado no Excel",
    description:
      "Alterne o separador do arquivo CSV entre vírgula e ponto e vírgula para que a planilha abra corretamente no Excel brasileiro.",
    category: "dados",
    keywords: ["csv", "separador", "delimitador", "virgula", "ponto e virgula", "excel", "acentuacao"],
    badges: ["local-only"],
    legacyHash: "conversores/csv-delimitador",
  },
  {
    slug: "limpar-lista-de-contatos",
    title: "Limpador de listas e contatos",
    tagline: "Remove duplicados e corrige telefones",
    description:
      "Limpe listas de contatos: remove duplicados, valida e-mails, padroniza telefones no formato brasileiro e exporta pronto para importar.",
    category: "dados",
    keywords: ["contatos", "lista", "duplicado", "telefone", "email", "limpar", "csv", "importar", "crm"],
    badges: ["local-only", "novo"],
    featured: true,
  },

  // ═══════════════ Web ═══════════════
  {
    slug: "links-quebrados",
    title: "Verificador de links quebrados",
    tagline: "Ache os links com erro 404 do site",
    description:
      "Digite uma página e testamos todos os links dela para achar os quebrados (erro 404 e afins). Link quebrado atrapalha a experiência e o SEO do site.",
    category: "web",
    keywords: ["links quebrados", "404", "link morto", "broken links", "erro", "verificar links", "auditoria", "manutencao", "site"],
    badges: ["servidor", "novo"],
    featured: true,
  },
  {
    slug: "formatar-json",
    title: "Formatar e validar JSON",
    tagline: "Encontra o erro e organiza o código",
    description: "Formate, minifique e valide arquivos JSON, com indicação da linha exata onde está o erro de sintaxe.",
    category: "web",
    keywords: ["json", "formatar", "validar", "minificar", "pretty", "erro", "sintaxe"],
    badges: ["local-only"],
    legacyHash: "conversores/formatar-json",
  },
  {
    slug: "texto-base64",
    title: "Texto ↔ Base64",
    tagline: "Codifica e decodifica com acentos",
    description: "Converta texto para Base64 e de volta, com suporte correto a acentos e caracteres especiais do português.",
    category: "web",
    keywords: ["base64", "codificar", "decodificar", "encode", "decode", "texto"],
    badges: ["local-only"],
    legacyHash: "conversores/texto-base64",
  },
  {
    slug: "url-encode",
    title: "URL encode e decode",
    tagline: "Converte textos para formato de link",
    description: "Codifique e decodifique textos no formato de URL (percent-encoding), útil para parâmetros de link e integrações.",
    category: "web",
    keywords: ["url", "encode", "decode", "percent", "link", "parametro", "querystring"],
    badges: ["local-only"],
    legacyHash: "conversores/url-encode",
  },
  {
    slug: "hash-de-arquivo",
    title: "Hash de arquivo",
    tagline: "Confira a integridade com SHA-256",
    description: "Calcule o hash SHA-256, SHA-1 ou SHA-512 de qualquer arquivo para verificar integridade, sem enviar o arquivo para lugar nenhum.",
    category: "web",
    keywords: ["hash", "sha256", "sha1", "sha512", "checksum", "integridade", "verificar"],
    badges: ["local-only"],
    legacyHash: "conversores/hash-arquivo",
  },
  {
    slug: "imagem-para-base64",
    title: "Imagem para Base64",
    tagline: "Data URI pronto para colar no código",
    description: "Transforme uma imagem em código Base64 (Data URI) para embutir diretamente em HTML, CSS ou e-mail.",
    category: "web",
    keywords: ["base64", "data uri", "imagem", "embutir", "html", "css", "codigo"],
    badges: ["local-only"],
    legacyHash: "conversores/imagem-para-base64",
  },

  // ═══════════════ Conversores — PDF ═══════════════
  {
    slug: "pdf-para-word",
    title: "PDF para Word",
    tagline: "Texto do PDF em documento editável",
    description: "Converta PDF em documento do Word editável extraindo o texto no seu navegador, sem enviar o arquivo para servidor.",
    category: "conversores",
    keywords: ["pdf", "word", "doc", "docx", "editavel", "converter", "texto"],
    badges: ["local-only"],
    featured: true,
    legacyHash: "conversores/pdf-para-word",
  },
  {
    slug: "pdf-para-jpg",
    title: "PDF para JPG",
    tagline: "Cada página vira uma imagem",
    description: "Transforme as páginas do seu PDF em imagens JPG de alta qualidade, processando tudo localmente no navegador.",
    category: "conversores",
    keywords: ["pdf", "jpg", "jpeg", "imagem", "pagina", "converter", "png"],
    badges: ["local-only"],
    legacyHash: "conversores/pdf-para-imagem",
  },
  {
    slug: "pdf-para-texto",
    title: "PDF para texto",
    tagline: "Extraia todo o conteúdo em .txt",
    description: "Extraia todo o texto de um arquivo PDF para um documento .txt limpo, mantendo a separação de parágrafos.",
    category: "conversores",
    keywords: ["pdf", "txt", "texto", "extrair", "copiar", "conteudo"],
    badges: ["local-only"],
    legacyHash: "conversores/pdf-para-txt",
  },
  {
    slug: "juntar-pdf",
    title: "Juntar PDFs",
    tagline: "Vários arquivos em um só",
    description: "Una vários arquivos PDF em um único documento, na ordem que você escolher, direto no navegador.",
    category: "conversores",
    keywords: ["juntar", "unir", "mesclar", "merge", "combinar", "pdf"],
    badges: ["local-only"],
    featured: true,
    legacyHash: "conversores/juntar-pdf",
  },
  {
    slug: "dividir-pdf",
    title: "Dividir PDF",
    tagline: "Extraia um intervalo de páginas",
    description: "Separe um intervalo de páginas do seu PDF em um novo arquivo, sem instalar programa e sem upload.",
    category: "conversores",
    keywords: ["dividir", "separar", "split", "intervalo", "paginas", "pdf"],
    badges: ["local-only"],
    legacyHash: "conversores/dividir-pdf",
  },
  {
    slug: "extrair-paginas-pdf",
    title: "Extrair páginas do PDF",
    tagline: "Escolha páginas soltas: 1, 3-5, 8",
    description: "Selecione páginas específicas ou intervalos do seu PDF e gere um novo arquivo somente com elas.",
    category: "conversores",
    keywords: ["extrair", "paginas", "especificas", "selecionar", "pdf", "intervalo"],
    badges: ["local-only"],
    legacyHash: "conversores/extrair-paginas-pdf",
  },
  {
    slug: "remover-paginas-pdf",
    title: "Remover páginas do PDF",
    tagline: "Apague o que não deve ir junto",
    description: "Remova páginas indesejadas de um PDF e baixe o documento apenas com o conteúdo que interessa.",
    category: "conversores",
    keywords: ["remover", "apagar", "excluir", "deletar", "paginas", "pdf"],
    badges: ["local-only"],
    legacyHash: "conversores/remover-paginas-pdf",
  },
  {
    slug: "girar-pdf",
    title: "Girar PDF",
    tagline: "Corrige páginas deitadas",
    description: "Gire todas as páginas de um PDF em 90, 180 ou 270 graus e corrija documentos digitalizados na posição errada.",
    category: "conversores",
    keywords: ["girar", "rotacionar", "rotate", "orientacao", "deitado", "pdf"],
    badges: ["local-only"],
    legacyHash: "conversores/girar-pdf",
  },
  {
    slug: "inverter-ordem-pdf",
    title: "Inverter ordem do PDF",
    tagline: "Última página vira a primeira",
    description: "Inverta a ordem das páginas de um PDF — útil para digitalizações feitas de trás para frente.",
    category: "conversores",
    keywords: ["inverter", "reverter", "ordem", "reverse", "paginas", "pdf", "digitalizacao"],
    badges: ["local-only"],
    legacyHash: "conversores/inverter-pdf",
  },
  {
    slug: "word-para-pdf",
    title: "Word para PDF",
    tagline: "Documento pronto para enviar",
    description: "Converta arquivos .docx do Word em PDF no navegador, mantendo o texto e a estrutura do documento.",
    category: "conversores",
    keywords: ["word", "docx", "pdf", "converter", "documento", "enviar"],
    badges: ["local-only"],
    legacyHash: "conversores/word-para-pdf",
  },
  {
    slug: "imagem-para-pdf",
    title: "Imagem para PDF",
    tagline: "Fotos viram um PDF único",
    description: "Junte uma ou várias imagens JPG, PNG ou WebP em um único arquivo PDF, na ordem que você escolher.",
    category: "conversores",
    keywords: ["imagem", "foto", "jpg", "png", "pdf", "juntar", "digitalizar"],
    badges: ["local-only"],
    legacyHash: "conversores/imagem-para-pdf",
  },

  // ═══════════════ Conversores — Imagens ═══════════════
  {
    slug: "converter-imagem",
    title: "Converter imagem",
    tagline: "JPG, PNG e WebP em um clique",
    description: "Converta imagens entre os formatos JPG, PNG e WebP mantendo a qualidade, sem enviar o arquivo para servidor.",
    category: "conversores",
    keywords: ["converter", "imagem", "jpg", "png", "webp", "formato", "trocar"],
    badges: ["local-only"],
    featured: true,
    legacyHash: "conversores/converter-imagem",
  },
  {
    slug: "comprimir-imagem",
    title: "Comprimir imagem",
    tagline: "Menos peso, mesma aparência",
    description: "Reduza o tamanho de imagens JPG, PNG e WebP com controle de qualidade e veja quanto foi economizado.",
    category: "conversores",
    keywords: ["comprimir", "reduzir", "peso", "otimizar", "tamanho", "imagem", "leve"],
    badges: ["local-only"],
    featured: true,
    legacyHash: "conversores/comprimir-imagem",
  },
  {
    slug: "redimensionar-imagem",
    title: "Redimensionar imagem",
    tagline: "Largura e altura sob medida",
    description: "Altere a largura e a altura de uma imagem mantendo a proporção automaticamente, direto no navegador.",
    category: "conversores",
    keywords: ["redimensionar", "resize", "tamanho", "largura", "altura", "proporcao", "imagem"],
    badges: ["local-only"],
    legacyHash: "conversores/redimensionar-imagem",
  },
  {
    slug: "heic-para-jpg",
    title: "HEIC para JPG",
    tagline: "Fotos de iPhone que abrem em tudo",
    description: "Converta fotos .heic e .heif do iPhone para JPG universal, compatível com Windows, Word e qualquer site.",
    category: "conversores",
    keywords: ["heic", "heif", "iphone", "apple", "jpg", "foto", "converter", "abrir"],
    badges: ["local-only"],
    featured: true,
    legacyHash: "conversores/heic-para-jpg",
  },
  {
    slug: "girar-imagem",
    title: "Girar imagem",
    tagline: "90, 180 ou 270 graus",
    description: "Gire uma imagem em 90, 180 ou 270 graus e baixe o resultado corrigido, sem instalar nada.",
    category: "conversores",
    keywords: ["girar", "rotacionar", "rotate", "imagem", "foto", "orientacao"],
    badges: ["local-only"],
    legacyHash: "conversores/girar-imagem",
  },
  {
    slug: "espelhar-imagem",
    title: "Espelhar imagem",
    tagline: "Inverte na horizontal ou vertical",
    description: "Espelhe uma imagem na horizontal ou na vertical e baixe o arquivo invertido em segundos.",
    category: "conversores",
    keywords: ["espelhar", "inverter", "flip", "mirror", "horizontal", "vertical", "imagem"],
    badges: ["local-only"],
    legacyHash: "conversores/espelhar-imagem",
  },
  {
    slug: "imagem-preto-e-branco",
    title: "Imagem em preto e branco",
    tagline: "Escala de cinza ou P&B puro",
    description: "Converta uma imagem colorida para escala de cinza ou preto e branco puro, útil para impressão e documentos.",
    category: "conversores",
    keywords: ["preto e branco", "cinza", "grayscale", "pb", "monocromatico", "imagem", "impressao"],
    badges: ["local-only"],
    legacyHash: "conversores/imagem-pb",
  },
  {
    slug: "juntar-imagens",
    title: "Juntar imagens",
    tagline: "Lado a lado ou empilhadas",
    description: "Combine várias imagens em uma só, lado a lado ou empilhadas, para montar comparativos e antes e depois.",
    category: "conversores",
    keywords: ["juntar", "combinar", "unir", "colagem", "lado a lado", "antes e depois", "imagem"],
    badges: ["local-only"],
    legacyHash: "conversores/juntar-imagens",
  },
  {
    slug: "remover-dados-da-foto",
    title: "Remover dados da foto (EXIF)",
    tagline: "Apaga localização GPS e metadados",
    description: "Remova a localização GPS, o modelo da câmera e outros metadados EXIF de uma foto antes de publicá-la.",
    category: "conversores",
    keywords: ["exif", "metadados", "gps", "localizacao", "privacidade", "remover", "foto", "limpar"],
    badges: ["local-only"],
    featured: true,
    legacyHash: "conversores/remover-exif",
  },

  // ═══════════════ Conversores — Compactados ═══════════════
  {
    slug: "criar-zip",
    title: "Criar arquivo ZIP",
    tagline: "Compacte vários arquivos de uma vez",
    description: "Junte e compacte vários arquivos em um único .zip direto no navegador, sem enviar nada para servidor.",
    category: "conversores",
    keywords: ["zip", "compactar", "comprimir", "zipar", "arquivo", "juntar", "enviar"],
    badges: ["local-only"],
    legacyHash: "conversores/criar-zip",
  },
  {
    slug: "extrair-zip",
    title: "Extrair arquivo ZIP",
    tagline: "Veja e baixe o conteúdo do .zip",
    description: "Abra um arquivo .zip no navegador, veja a lista de arquivos dentro dele e baixe individualmente o que precisar.",
    category: "conversores",
    keywords: ["zip", "extrair", "descompactar", "unzip", "abrir", "arquivo"],
    badges: ["local-only"],
    legacyHash: "conversores/extrair-zip",
  },
];

// ─────────────────────────── Helpers ───────────────────────────

export const getTool = (slug: string): Tool | undefined => TOOLS.find((t) => t.slug === slug);

export const getCategory = (slug: string): ToolCategory | undefined =>
  CATEGORIES.find((c) => c.slug === slug);

export const toolsByCategory = (slug: FuncArea): Tool[] => TOOLS.filter((t) => t.category === slug);

export const featuredTools = (): Tool[] => TOOLS.filter((t) => t.featured);

export const newTools = (): Tool[] => TOOLS.filter((t) => t.badges.includes("novo"));

/** Normaliza para busca: minúsculas, sem acento. */
export const normalize = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Busca orientada a tarefa (§23 "Busca universal orientada a tarefa").
 * Aceita frases como "converter pdf em word" ou "quanto pagar por cliente".
 */
export function searchTools(query: string): Tool[] {
  const q = normalize(query.trim());
  if (!q) return [];
  const terms = q.split(/\s+/).filter((t) => t.length > 1 && !STOPWORDS.has(t));
  if (!terms.length) return [];

  return TOOLS.map((tool) => {
    const haystack = normalize(
      [tool.title, tool.tagline, tool.description, tool.keywords.join(" "), tool.slug].join(" ")
    );
    const titleHay = normalize(tool.title + " " + tool.keywords.join(" "));
    let score = 0;
    for (const term of terms) {
      if (titleHay.includes(term)) score += 3;
      else if (haystack.includes(term)) score += 1;
    }
    // frase inteira no título vale bônus
    if (normalize(tool.title).includes(q)) score += 5;
    return { tool, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.tool);
}

const STOPWORDS = new Set([
  "de", "da", "do", "em", "para", "por", "com", "que", "uma", "um", "os", "as",
  "no", "na", "meu", "minha", "quero", "como", "fazer", "e", "ou", "the", "to",
]);
