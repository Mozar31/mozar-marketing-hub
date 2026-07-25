import { NextResponse } from "next/server";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/config";

/**
 * Captura de lead (newsletter/e-mail). Grava na tabela `leads` do Supabase.
 * Requer a tabela criada com política de INSERT anônimo (ver n8n/leads.sql).
 * Nada é lido de volta pela chave pública — só insere.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { email?: string; nome?: string | null; origem?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "requisicao_invalida" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const nome = (body.nome || "").toString().trim().slice(0, 120) || null;
  const origem = (body.origem || "geral").toString().trim().slice(0, 60);

  // Validação simples de e-mail e limite de tamanho.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
    return NextResponse.json({ error: "email_invalido" }, { status: 400 });
  }

  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ email, nome, origem }),
    });
    if (!resp.ok) {
      return NextResponse.json({ error: "falha_ao_salvar" }, { status: 200 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "falha_ao_salvar" }, { status: 200 });
  }
}
