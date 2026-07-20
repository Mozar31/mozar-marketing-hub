"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { CATEGORIES, toolsByCategory } from "@/lib/registry";
import { waLink } from "@/lib/config";
import { SearchDialog } from "./SearchDialog";

export function Header() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Fecha mega menu com Escape ou clique fora (acessibilidade §17)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
      // Atalho de busca: "/" ou Ctrl+K
      if ((e.key === "/" || (e.key === "k" && (e.ctrlKey || e.metaKey))) && !searchOpen) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") {
          e.preventDefault();
          setSearchOpen(true);
        }
      }
    };
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [searchOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#071225]/95 backdrop-blur">
        {/* ── Linha 1: marca, busca, conta/CTA ── */}
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Image
              src="/logo.png"
              alt=""
              width={38}
              height={38}
              className="rounded-full bg-white ring-2 ring-info-500/40"
              priority
            />
            <span className="flex flex-col leading-tight">
              <span className="font-display text-[0.95rem] font-extrabold tracking-tight">
                CONSIG INVEST <span className="text-info-400">|</span> MARKETING HUB
              </span>
              <span className="hidden text-[0.68rem] text-info-400 sm:block">
                Ferramentas para crescer no Marketing Digital
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="ml-auto flex flex-1 max-w-md items-center gap-2 rounded-lg border border-white/15 bg-navy-900 px-3 py-2 text-left text-sm text-ink-400 transition hover:border-info-500/60"
            aria-label="Buscar ferramentas"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <span className="hidden truncate sm:inline">O que você quer fazer agora?</span>
            <span className="sm:hidden">Buscar</span>
            <kbd className="ml-auto hidden rounded border border-white/15 px-1.5 py-0.5 text-[0.65rem] md:inline">/</kbd>
          </button>

          <a
            href={waLink("Olá, vim através do Hub da Consig Invest e gostaria de mais informações...")}
            target="_blank"
            rel="noopener"
            className="btn-ghost hidden shrink-0 lg:inline-flex"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.6-1.3.1-.2 0-.4 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1.1 2.1-.2 3.7a12 12 0 0 0 4.6 4.2c1.7.8 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.1-.5-.3Z" />
            </svg>
            Falar com especialista
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="shrink-0 rounded-lg border border-white/15 p-2 lg:hidden"
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {mobileOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>

        {/* ── Linha 2: navegação principal com mega menus ── */}
        <nav ref={navRef} className="hidden border-t border-white/[0.07] lg:block" aria-label="Navegação principal">
          <div className="mx-auto flex max-w-7xl items-center gap-1 px-4">
            <MegaItem
              label="Ferramentas"
              id="ferramentas"
              open={openMenu === "ferramentas"}
              onToggle={() => setOpenMenu(openMenu === "ferramentas" ? null : "ferramentas")}
            >
              <div className="grid grid-cols-4 gap-x-6 gap-y-5 p-6">
                {CATEGORIES.map((cat) => {
                  const tools = toolsByCategory(cat.slug).slice(0, 4);
                  return (
                    <div key={cat.slug}>
                      <Link
                        href={`/ferramentas/categoria/${cat.slug}/`}
                        className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-info-400 hover:underline"
                        onClick={() => setOpenMenu(null)}
                      >
                        <span aria-hidden="true">{cat.icon}</span> {cat.label}
                      </Link>
                      <ul className="space-y-1.5">
                        {tools.map((t) => (
                          <li key={t.slug}>
                            <Link
                              href={`/ferramentas/${t.slug}/`}
                              className="text-[0.82rem] text-ink-300 hover:text-ink-100"
                              onClick={() => setOpenMenu(null)}
                            >
                              {t.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-white/10 px-6 py-3">
                <Link href="/ferramentas/" className="text-sm font-semibold text-info-400 hover:underline" onClick={() => setOpenMenu(null)}>
                  Ver todas as ferramentas →
                </Link>
              </div>
            </MegaItem>

            {CATEGORIES.slice(0, 4).map((cat) => (
              <Link
                key={cat.slug}
                href={`/ferramentas/categoria/${cat.slug}/`}
                className="rounded-t-lg px-4 py-3 font-display text-sm font-semibold text-ink-300 transition hover:text-ink-100"
              >
                {cat.short}
              </Link>
            ))}

            <Link
              href="/novidades/"
              className="rounded-t-lg px-4 py-3 font-display text-sm font-semibold text-ink-300 transition hover:text-ink-100"
            >
              Novidades
            </Link>

            <Link
              href="/sobre/"
              className="ml-auto rounded-t-lg px-4 py-3 font-display text-sm font-semibold text-ink-300 transition hover:text-ink-100"
            >
              Como funciona
            </Link>
          </div>
        </nav>

        {/* ── Menu mobile (drawer) ── */}
        {mobileOpen && (
          <nav className="border-t border-white/10 px-4 py-4 lg:hidden" aria-label="Navegação mobile">
            <ul className="space-y-1">
              <li>
                <Link href="/ferramentas/" className="block rounded-lg px-3 py-2.5 font-display font-semibold" onClick={() => setMobileOpen(false)}>
                  Todas as ferramentas
                </Link>
              </li>
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/ferramentas/categoria/${cat.slug}/`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-ink-300"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span aria-hidden="true">{cat.icon}</span> {cat.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/novidades/" className="block rounded-lg px-3 py-2.5 font-display font-semibold text-ink-300" onClick={() => setMobileOpen(false)}>
                  Novidades
                </Link>
              </li>
              <li className="pt-2">
                <a
                  href={waLink("Olá, vim através do Hub da Consig Invest e gostaria de mais informações...")}
                  target="_blank"
                  rel="noopener"
                  className="btn-ghost w-full"
                >
                  Falar com especialista
                </a>
              </li>
            </ul>
          </nav>
        )}
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function MegaItem({
  label,
  id,
  open,
  onToggle,
  children,
}: {
  label: string;
  id: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`mega-${id}`}
        className={`flex items-center gap-1.5 rounded-t-lg px-4 py-3 font-display text-sm font-semibold transition ${
          open ? "bg-navy-800 text-info-400" : "text-ink-300 hover:text-ink-100"
        }`}
      >
        {label}
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" className={open ? "rotate-180" : ""}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          id={`mega-${id}`}
          className="absolute left-0 top-full z-50 w-[min(76rem,calc(100vw-2rem))] rounded-b-xl border border-white/10 bg-navy-800 shadow-2xl"
        >
          {children}
        </div>
      )}
    </div>
  );
}
