"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchTools, CATEGORIES, type Tool } from "@/lib/registry";

/**
 * Busca inline no cabeçalho — fica no canto e abre um menu logo abaixo,
 * sem tomar a tela inteira (pedido do cliente). Só busca; sem atalho "/".
 */
export function HeaderSearch({ className = "ml-auto flex-1 max-w-md" }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const results: Tool[] = query.trim() ? searchTools(query).slice(0, 6) : [];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const go = (tool: Tool) => {
    setOpen(false);
    setQuery("");
    router.push(`/ferramentas/${tool.slug}/`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && results[active]) go(results[active]!);
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-navy-900 px-3 py-2 focus-within:border-info-500/60">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-ink-400" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
          onFocus={() => query.trim() && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="O que você quer fazer?"
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
          aria-label="Buscar ferramentas"
        />
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-white/15 bg-navy-800 shadow-2xl">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-ink-400">
              Nada encontrado para “{query}”.
            </p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto p-1.5">
              {results.map((tool, i) => {
                const cat = CATEGORIES.find((c) => c.slug === tool.category);
                return (
                  <li key={tool.slug}>
                    <button
                      type="button"
                      onClick={() => go(tool)}
                      onMouseEnter={() => setActive(i)}
                      className={`flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition ${i === active ? "bg-white/[0.07]" : ""}`}
                    >
                      <span aria-hidden="true" className="mt-0.5 text-base">{cat?.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-sm font-semibold">{tool.title}</span>
                        <span className="block truncate text-xs text-ink-400">{tool.tagline}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
