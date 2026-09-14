import { NextResponse } from "next/server";

/**
 * Reescrita da proposta comercial com IA — roda no SERVIDOR.
 *
 * Recebe só os parâmetros da proposta (cliente, segmento, objetivo, o que o
 * cliente falou e os serviços escolhidos) e devolve os parágrafos de abertura
 * já na voz da agência. Nenhum valor, nenhuma tabela de preço sai daqui.
 *
 * A chave do modelo vive em variável de ambiente no servidor:
 *   ANTHROPIC_API_KEY  (preferida)  ou  OPENAI_API_KEY
 * Sem chave configurada, a ferramenta segue funcionando com o texto
 * determinístico — a IA é um extra, não um requisito.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODELO_CLAUDE = "claude-sonnet-5";
const MODELO_OPENAI = "gpt-4o-mini";

/** Limite simples por IP: a página é pública e a chave é do dono. */
const JANELA_MS = 60 * 60 * 1000;
const MAX_POR_JANELA = 15;
const usos = new Map<string, number[]>();

function excedeu(ip: string): boolean {
  const agora = Date.now();
  const anteriores = (usos.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  anteriores.push(agora);
  usos.set(ip, anteriores);
  if (usos.size > 5000) usos.clear(); // evita crescer sem limite
  return anteriores.length > MAX_POR_JANELA;
}

interface Corpo {
  agencia?: string;
  cliente?: string;
  segmento?: string;
  objetivo?: string;
  fala?: string;
  servicos?: unknown;
  meses?: number;
}

const limpar = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

function montarPrompt(c: Corpo): string {
  const servicos = Array.isArray(c.servicos)
    ? c.servicos.map((s) => limpar(s, 80)).filter(Boolean).slice(0, 12)
    : [];

  return [
    `Agência: ${limpar(c.agencia, 80) || "a agência"}`,
    `Cliente: ${limpar(c.cliente, 120) || "o cliente"}`,
    `Segmento: ${limpar(c.segmento, 80) || "não informado"}`,
    `Objetivo: ${limpar(c.objetivo, 80) || "não informado"}`,
    `Prazo do contrato: ${Math.max(1, Math.round(Number(c.meses) || 6))} meses`,
    `Serviços contratados: ${servicos.join(", ") || "não informado"}`,
    `O que o cliente falou (palavras dele, pode estar em primeira pessoa): ${
      limpar(c.fala, 1200) || "não informado"
    }`,
  ].join("\n");
}

const SISTEMA = `Você escreve a abertura de propostas comerciais de uma agência de marketing digital brasileira.

VOZ (regra mais importante): quem fala é a AGÊNCIA — "nossa equipe", "vamos", "o trabalho envolve". O cliente aparece SEMPRE em terceira pessoa, pelo nome da empresa. Nunca escreva em primeira pessoa do cliente. Se a fala do cliente estiver em primeira pessoa ("eu quero..."), traduza para a voz da agência ("a Empresa X procurou a agência querendo...") ou use aspas identificando que é fala do cliente.

FORMATO: 3 a 4 parágrafos, separados por uma linha em branco. Português do Brasil. Texto corrido, sem títulos, sem marcadores, sem emojis, sem markdown.
1. O objetivo desta proposta, citando o nome do cliente e os serviços escolhidos.
2. O que o cliente trouxe, reescrito na voz da agência.
3. Como será a estratégia, concreta e ligada aos serviços contratados.
4. Como será o acompanhamento e a medição.

PROIBIDO: prometer resultado ou garantia; citar prazo específico de resultado (o único permitido é "tráfego pago costuma dar sinal em dias; SEO, em semanas a meses"); inventar métrica, percentual, prêmio ou estudo; citar valores em reais; usar "cada vez mais", "no mundo digital de hoje", "revolucionar", "potencializar", "alavancar seus resultados".
OBRIGATÓRIO: falar em leads qualificados, alta intenção, custo por lead e conversão em cliente — nunca em "engajamento" ou "presença digital".
Se o segmento for advocacia ou saúde, mantenha o tom sóbrio, sem captação de clientela e sem promessa.

Responda apenas com os parágrafos, nada mais.`;

async function comClaude(chave: string, prompt: string): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": chave,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODELO_CLAUDE,
      max_tokens: 900,
      system: SISTEMA,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!r.ok) throw new Error(`claude_${r.status}`);
  const data = await r.json();
  return (data?.content ?? [])
    .filter((b: { type?: string }) => b?.type === "text")
    .map((b: { text?: string }) => b.text ?? "")
    .join("")
    .trim();
}

async function comOpenAI(chave: string, prompt: string): Promise<string> {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${chave}` },
    body: JSON.stringify({
      model: MODELO_OPENAI,
      max_tokens: 900,
      messages: [
        { role: "system", content: SISTEMA },
        { role: "user", content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!r.ok) throw new Error(`openai_${r.status}`);
  const data = await r.json();
  return String(data?.choices?.[0]?.message?.content ?? "").trim();
}

export async function POST(req: Request) {
  const anthropic = process.env.ANTHROPIC_API_KEY;
  const openai = process.env.OPENAI_API_KEY;
  if (!anthropic && !openai) {
    return NextResponse.json(
      {
        error: "sem_chave",
        mensagem:
          "A reescrita com IA ainda não está configurada no servidor. A proposta continua sendo gerada com o texto padrão.",
      },
      { status: 200 }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "desconhecido";
  if (excedeu(ip)) {
    return NextResponse.json(
      { error: "muitas_tentativas", mensagem: "Muitas reescritas seguidas. Tente de novo daqui a pouco." },
      { status: 429 }
    );
  }

  let corpo: Corpo;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ error: "requisicao_invalida" }, { status: 400 });
  }
  if (!limpar(corpo.cliente, 120)) {
    return NextResponse.json({ error: "sem_cliente", mensagem: "Informe o nome da empresa cliente." }, { status: 400 });
  }

  try {
    const prompt = montarPrompt(corpo);
    const texto = anthropic ? await comClaude(anthropic, prompt) : await comOpenAI(openai!, prompt);
    if (!texto) throw new Error("vazio");
    return NextResponse.json({ texto: texto.slice(0, 4000) });
  } catch {
    return NextResponse.json(
      {
        error: "falha_ia",
        mensagem: "A IA não respondeu agora. A proposta segue com o texto padrão — tente de novo em instantes.",
      },
      { status: 200 }
    );
  }
}
