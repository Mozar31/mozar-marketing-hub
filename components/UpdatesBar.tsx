"use client";

import { useState } from "react";
import Link from "next/link";
import { TOOLS, newTools } from "@/lib/registry";

/**
 * Faixa de atualizações — §5 e §6.
 * REGRA CRÍTICA da especificação: "Cada item precisa vir de estado real do banco;
 * nada de animação que simule live data."
 *
 * Enquanto não há banco (Checkpoint 4), esta faixa mostra apenas fatos verificáveis
 * derivados do próprio registry e da data de build. Nenhum número inventado,
 * nenhum "ao vivo" simulado.
 */
const localOnlyCount = TOOLS.filter((t) => t.badges.includes("local-only")).length;
const apiCount = TOOLS.filter((t) => t.badges.includes("usa-api")).length;
const novos = newTools().length;

const ITEMS: { label: string; value: string; href?: string }[] = [
  { label: "Ferramentas disponíveis", value: String(TOOLS.length), href: "/ferramentas/" },
  { label: "Rodam no seu navegador", value: String(localOnlyCount) },
  { label: "Novas nesta versão", value: String(novos) },
  { label: "Com dados de API oficial", value: String(apiCount) },
];

export function UpdatesBar() {
  const [paused, setPaused] = useState(false);

  return (
    <div className="border-b border-white/[0.07] bg-navy-800/60">
      <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 py-1.5 text-[0.72rem]">
        <span className="shrink-0 font-semibold uppercase tracking-wide text-info-400">
          No hub
        </span>
        <ul
          className="flex shrink-0 items-center gap-5"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {ITEMS.map((item) => (
            <li key={item.label} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
              <span className="mono font-bold text-ink-100">{item.value}</span>
              {item.href ? (
                <Link href={item.href} className="text-ink-400 hover:text-ink-200 hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className="text-ink-400">{item.label}</span>
              )}
            </li>
          ))}
        </ul>
        <span className="ml-auto hidden shrink-0 text-ink-400 md:inline" aria-live="polite">
          {paused ? "pausado" : ""}
        </span>
      </div>
    </div>
  );
}
