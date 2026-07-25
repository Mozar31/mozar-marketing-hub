/**
 * Diretório curado de IAs para marketing (módulos 04/05 da spec).
 * Curadoria em português, por TAREFA — o diferencial vs. diretórios genéricos.
 * Preço é qualitativo de propósito (muda toda hora): sempre confira no site
 * oficial. `verificado` é a data da última checagem editorial.
 *
 * Regras da spec: não chamar de "melhor" sem metodologia; preço com data e link
 * oficial; nada de dado inventado. `afiliado` fica pronto para quando houver
 * link de parceria (com aviso), sem alterar a curadoria.
 */

export type IaTarefa = "texto" | "imagem" | "video" | "audio" | "pesquisa" | "design" | "produtividade";

export interface IaTool {
  slug: string;
  nome: string;
  tarefa: IaTarefa;
  tarefaLabel: string;
  resumo: string;
  preco: string; // qualitativo
  idiomaPt: boolean;
  site: string;
  bomPara: string[];
  atencao: string; // limitação honesta
  verificado: string; // ISO
}

export const IA_TAREFAS: { slug: IaTarefa; label: string; icon: string }[] = [
  { slug: "texto", label: "Escrita e texto", icon: "✍️" },
  { slug: "imagem", label: "Imagem", icon: "🎨" },
  { slug: "video", label: "Vídeo", icon: "🎬" },
  { slug: "audio", label: "Áudio e voz", icon: "🎙️" },
  { slug: "pesquisa", label: "Pesquisa", icon: "🔎" },
  { slug: "design", label: "Design", icon: "🖌️" },
];

export const IAS: IaTool[] = [
  {
    slug: "chatgpt", nome: "ChatGPT", tarefa: "texto", tarefaLabel: "Escrita e texto",
    resumo: "Assistente de IA da OpenAI para escrever, resumir, tirar dúvidas, gerar ideias e roteiros. O mais popular para uso geral de marketing.",
    preco: "Tem plano grátis; pago (Plus) a partir de ~US$ 20/mês.", idiomaPt: true, site: "https://chat.openai.com/",
    bomPara: ["Escrever copy e e-mails", "Resumir e reescrever textos", "Brainstorm de campanhas"],
    atencao: "Pode inventar dados (‘alucinar’) — sempre confira fatos, números e nomes.", verificado: "2026-07-24",
  },
  {
    slug: "claude", nome: "Claude", tarefa: "texto", tarefaLabel: "Escrita e texto",
    resumo: "Assistente da Anthropic, forte em textos longos, análise de documentos e respostas cuidadosas. Bom para conteúdo e revisão.",
    preco: "Tem plano grátis; pago a partir de ~US$ 20/mês.", idiomaPt: true, site: "https://claude.ai/",
    bomPara: ["Textos longos e artigos", "Analisar documentos/planilhas", "Revisar e melhorar copy"],
    atencao: "Como toda IA, pode errar fatos — revise antes de publicar.", verificado: "2026-07-24",
  },
  {
    slug: "gemini", nome: "Google Gemini", tarefa: "texto", tarefaLabel: "Escrita e texto",
    resumo: "IA do Google, integrada ao ecossistema (Docs, Gmail, Search). Boa para quem já usa as ferramentas do Google.",
    preco: "Tem plano grátis; pago (Advanced) a partir de ~US$ 20/mês.", idiomaPt: true, site: "https://gemini.google.com/",
    bomPara: ["Texto integrado ao Google Workspace", "Resumos e pesquisa", "Apoio no dia a dia"],
    atencao: "Confirme fatos; integrações variam por conta/país.", verificado: "2026-07-24",
  },
  {
    slug: "perplexity", nome: "Perplexity", tarefa: "pesquisa", tarefaLabel: "Pesquisa",
    resumo: "‘Buscador com IA’ que responde perguntas citando as fontes. Ótimo para pesquisa de mercado e concorrência com links.",
    preco: "Tem plano grátis; pago (Pro) a partir de ~US$ 20/mês.", idiomaPt: true, site: "https://www.perplexity.ai/",
    bomPara: ["Pesquisar com fontes citadas", "Resumir tendências", "Checar concorrentes"],
    atencao: "As fontes ajudam, mas ainda vale abrir e confirmar as principais.", verificado: "2026-07-24",
  },
  {
    slug: "midjourney", nome: "Midjourney", tarefa: "imagem", tarefaLabel: "Imagem",
    resumo: "Geração de imagens de alta qualidade artística a partir de texto. Referência para criativos e conceitos visuais.",
    preco: "Pago, a partir de ~US$ 10/mês.", idiomaPt: false, site: "https://www.midjourney.com/",
    bomPara: ["Imagens conceituais e criativas", "Moodboards", "Arte para posts"],
    atencao: "Interface em inglês; cuidado com direitos de uso e semelhança com marcas.", verificado: "2026-07-24",
  },
  {
    slug: "canva-magic", nome: "Canva (Magic Studio)", tarefa: "design", tarefaLabel: "Design",
    resumo: "Editor de design com recursos de IA (gerar imagem, texto, remover fundo, redimensionar). Ideal para social e materiais rápidos.",
    preco: "Tem plano grátis; Pro a partir de ~R$ 35/mês.", idiomaPt: true, site: "https://www.canva.com/",
    bomPara: ["Posts e criativos de social", "Templates prontos", "Design sem ser designer"],
    atencao: "Recursos de IA variam por plano; revise resultados gerados.", verificado: "2026-07-24",
  },
  {
    slug: "leonardo-ai", nome: "Leonardo.Ai", tarefa: "imagem", tarefaLabel: "Imagem",
    resumo: "Geração de imagens com bom controle (estilos, modelos, upscale). Alternativa flexível ao Midjourney para times de criação.",
    preco: "Tem plano grátis (créditos diários); pago a partir de ~US$ 10/mês.", idiomaPt: false, site: "https://leonardo.ai/",
    bomPara: ["Imagens para anúncios", "Variações de criativo", "Controle de estilo"],
    atencao: "Interface em inglês; verifique licença de uso comercial.", verificado: "2026-07-24",
  },
  {
    slug: "elevenlabs", nome: "ElevenLabs", tarefa: "audio", tarefaLabel: "Áudio e voz",
    resumo: "Vozes de IA muito naturais em português para narração de vídeos, anúncios e áudios. Também clona vozes (com consentimento).",
    preco: "Tem plano grátis limitado; pago a partir de ~US$ 5/mês.", idiomaPt: true, site: "https://elevenlabs.io/",
    bomPara: ["Narração de vídeos/reels", "Áudio de anúncios", "Locução em PT"],
    atencao: "Só clone vozes com autorização; interface em inglês.", verificado: "2026-07-24",
  },
  {
    slug: "capcut", nome: "CapCut", tarefa: "video", tarefaLabel: "Vídeo",
    resumo: "Editor de vídeo gratuito com IA (legendas automáticas, cortes, remover fundo). Muito usado para Reels, TikTok e Shorts.",
    preco: "Grátis; recursos Pro pagos.", idiomaPt: true, site: "https://www.capcut.com/",
    bomPara: ["Editar Reels/TikTok", "Legendas automáticas", "Cortes rápidos"],
    atencao: "Confira termos de uso comercial e direitos de trilhas/efeitos.", verificado: "2026-07-24",
  },
  {
    slug: "runway", nome: "Runway", tarefa: "video", tarefaLabel: "Vídeo",
    resumo: "Geração e edição de vídeo com IA (texto→vídeo, efeitos avançados). Para criativos que querem vídeo generativo.",
    preco: "Tem plano grátis limitado; pago a partir de ~US$ 12/mês.", idiomaPt: false, site: "https://runwayml.com/",
    bomPara: ["Vídeo generativo", "Efeitos avançados", "Conceitos criativos"],
    atencao: "Interface em inglês; consome créditos rápido em vídeo.", verificado: "2026-07-24",
  },
  {
    slug: "heygen", nome: "HeyGen", tarefa: "video", tarefaLabel: "Vídeo",
    resumo: "Cria vídeos com ‘avatares’ de IA que falam seu roteiro, com voz em português. Bom para conteúdo escalável sem gravar.",
    preco: "Tem plano grátis limitado; pago a partir de ~US$ 29/mês.", idiomaPt: true, site: "https://www.heygen.com/",
    bomPara: ["Vídeos falados sem gravar", "Treinamentos/explicadores", "Conteúdo em escala"],
    atencao: "Avatar de IA pode soar artificial; use com bom senso e transparência.", verificado: "2026-07-24",
  },
  {
    slug: "notebooklm", nome: "NotebookLM", tarefa: "produtividade", tarefaLabel: "Produtividade",
    resumo: "Do Google: você joga seus documentos e ele resume, responde e até gera um ‘podcast’ resumindo o material. Ótimo para estudar briefings e pesquisas.",
    preco: "Grátis.", idiomaPt: true, site: "https://notebooklm.google.com/",
    bomPara: ["Resumir briefings/PDFs", "Estudar um tema rápido", "Perguntar aos seus documentos"],
    atencao: "Baseia-se no que você envia; ainda pode interpretar errado — confira.", verificado: "2026-07-24",
  },
];

export const getIa = (slug: string) => IAS.find((i) => i.slug === slug);
export const iasPorTarefa = (t: IaTarefa) => IAS.filter((i) => i.tarefa === t);
