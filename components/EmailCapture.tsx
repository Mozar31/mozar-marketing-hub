"use client";

import { useState } from "react";

/**
 * Captura de e-mail (newsletter). Modelo que gerou milhões de leads em hubs de
 * ferramentas: dá valor grátis e coleta o e-mail para nutrir depois.
 * Envia para /api/lead. O disparo de e-mail é configurado separadamente.
 */
export function EmailCapture({ origem = "geral", titulo, texto }: { origem?: string; titulo?: string; texto?: string }) {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "erro">("idle");

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email) || estado === "enviando") return;
    setEstado("enviando");
    try {
      const r = await fetch("/api/lead/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), nome: nome.trim() || null, origem }),
      });
      setEstado(r.ok ? "ok" : "erro");
    } catch {
      setEstado("erro");
    }
  };

  if (estado === "ok") {
    return (
      <div className="rounded-xl border border-ok-500/30 bg-ok-500/[0.06] p-5 text-center">
        <p className="font-display text-sm font-bold text-ok-400">✅ Pronto! Você está na lista.</p>
        <p className="mt-1 text-xs text-ink-300">Vamos avisar quando sair conteúdo e ferramentas novas.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-info-500/20 bg-info-500/[0.05] p-5">
      <p className="font-display text-sm font-bold text-ink-100">{titulo ?? "Receba novidades e novos guias no seu e-mail"}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-400">{texto ?? "Sem spam. Só conteúdo útil de marketing e avisos de ferramentas novas. Cancele quando quiser."}</p>
      <form onSubmit={enviar} className="mt-3 flex flex-wrap gap-2">
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome (opcional)" className="input-base min-w-[10rem] flex-1" aria-label="Seu nome" />
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu melhor e-mail" className="input-base min-w-[12rem] flex-1" aria-label="Seu e-mail" />
        <button type="submit" className="btn-primary" disabled={estado === "enviando"}>
          {estado === "enviando" ? "Enviando…" : "Quero receber"}
        </button>
      </form>
      {estado === "erro" && <p className="mt-2 text-xs text-warn-400">⚠️ Não foi possível cadastrar agora. Tente de novo em instantes.</p>}
      <p className="mt-2 text-[0.68rem] text-ink-400">Ao enviar, você concorda em receber e-mails da Consig Invest. Seus dados não são vendidos.</p>
    </div>
  );
}
