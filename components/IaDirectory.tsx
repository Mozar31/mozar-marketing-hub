"use client";

import { useState } from "react";
import Link from "next/link";
import { IAS, IA_TAREFAS, type IaTarefa } from "@/lib/ai-directory";

/** Diretório de IAs com filtro por tarefa (client). */
export function IaDirectory() {
  const [tarefa, setTarefa] = useState<IaTarefa | "todas">("todas");
  const visiveis = tarefa === "todas" ? IAS : IAS.filter((i) => i.tarefa === tarefa);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por tarefa">
        {[{ slug: "todas", label: "Todas", icon: "✨" }, ...IA_TAREFAS].map((c) => {
          const ativo = tarefa === c.slug;
          return (
            <button
              key={c.slug}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => setTarefa(c.slug as IaTarefa | "todas")}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                ativo ? "border-action-500 bg-action-500/20 text-ink-100" : "border-white/15 text-ink-300 hover:border-info-500/50"
              }`}
            >
              <span aria-hidden="true" className="mr-1">{c.icon}</span>{c.label}
            </button>
          );
        })}
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visiveis.map((ia) => (
          <li key={ia.slug}>
            <Link href={`/ias/${ia.slug}/`} className="card-surface flex h-full flex-col p-5 transition hover:border-info-500/40">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-display text-base font-bold">{ia.nome}</span>
                {ia.idiomaPt && <span className="shrink-0 rounded-full border border-ok-500/30 px-2 py-0.5 text-[0.6rem] font-semibold text-ok-400">PT-BR</span>}
              </div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-info-400">{ia.tarefaLabel}</p>
              <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ink-400">{ia.resumo}</p>
              <span className="mono mt-auto pt-3 text-[0.7rem] text-ink-400">{ia.preco}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
