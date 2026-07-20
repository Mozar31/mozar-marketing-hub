"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchTools, featuredTools, CATEGORIES, type Tool } from "@/lib/registry";

/** Busca universal orientada a tarefa — §23. Aceita "converter pdf em word". */
export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results: Tool[] = query.trim() ? searchTools(query).slice(0, 8) : featuredTools().slice(0, 6);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const go = (tool: Tool) => {
    onClose();
    router.push(`/ferramentas/${tool.slug}/`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const t = results[active];
      if (t) go(t);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 p-4 pt-[10vh] backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Buscar ferramentas"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-white/15 bg-navy-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-400" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={onKeyDown}
            placeholder="O que você quer fazer? Ex.: converter pdf em word, calcular roas…"
            className="flex-1 bg-transparent text-[0.95rem] outline-none placeholder:text-ink-400"
            aria-label="Buscar por tarefa ou nome da ferramenta"
          />
          <button type="button" onClick={onClose} aria-label="Fechar busca" className="text-ink-400 hover:text-ink-100">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {!query.trim() && (
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
              Mais usadas
            </p>
          )}

          {results.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-sm text-ink-300">
                Nada encontrado para <strong className="text-ink-100">“{query}”</strong>.
              </p>
              <p className="mt-2 text-xs text-ink-400">
                Tente descrever a tarefa: “comprimir imagem”, “quanto pagar por cliente”, “link do whatsapp”.
              </p>
            </div>
          ) : (
            <ul>
              {results.map((tool, i) => {
                const cat = CATEGORIES.find((c) => c.slug === tool.category);
                return (
                  <li key={tool.slug}>
                    <button
                      type="button"
                      onClick={() => go(tool)}
                      onMouseEnter={() => setActive(i)}
                      className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                        i === active ? "bg-white/[0.07]" : ""
                      }`}
                    >
                      <span aria-hidden="true" className="mt-0.5 text-lg">{cat?.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-sm font-semibold">{tool.title}</span>
                        <span className="block truncate text-xs text-ink-400">{tool.tagline}</span>
                      </span>
                      {tool.badges.includes("local-only") && (
                        <span className="mt-0.5 shrink-0 rounded-full bg-ok-500/15 px-2 py-0.5 text-[0.62rem] font-semibold text-ok-400">
                          no navegador
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-white/10 px-4 py-2 text-[0.68rem] text-ink-400">
          <span><kbd className="rounded border border-white/15 px-1">↑</kbd><kbd className="ml-0.5 rounded border border-white/15 px-1">↓</kbd> navegar</span>
          <span><kbd className="rounded border border-white/15 px-1">Enter</kbd> abrir</span>
          <span><kbd className="rounded border border-white/15 px-1">Esc</kbd> fechar</span>
        </div>
      </div>
    </div>
  );
}
