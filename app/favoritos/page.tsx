"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TOOLS } from "@/lib/registry";
import { ToolCard } from "@/components/ui";
import { lerFavoritos } from "@/lib/tools/favorites";

/**
 * Página de favoritos. Lê os slugs salvos no localStorage e mostra as
 * ferramentas correspondentes. Sem login, sem servidor.
 */
export default function FavoritosPage() {
  const [slugs, setSlugs] = useState<string[] | null>(null);

  useEffect(() => {
    const sync = () => setSlugs(lerFavoritos());
    sync();
    window.addEventListener("favoritos:mudou", sync);
    return () => window.removeEventListener("favoritos:mudou", sync);
  }, []);

  const ferramentas = slugs
    ? slugs.map((s) => TOOLS.find((t) => t.slug === s)).filter((t): t is (typeof TOOLS)[number] => Boolean(t))
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav aria-label="Trilha" className="mb-4 text-xs text-ink-400">
        <Link href="/" className="hover:text-ink-200">Início</Link> <span aria-hidden="true">/</span> Favoritos
      </nav>
      <h1 className="font-display text-2xl font-extrabold">Suas ferramentas favoritas</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-400">
        As ferramentas que você salvar ficam guardadas <strong>só neste navegador</strong> — nada é enviado
        para a gente. Clique na estrela ☆ dentro de qualquer ferramenta para adicionar.
      </p>

      {slugs === null ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card-surface h-40 animate-pulse p-5" />)}
        </div>
      ) : ferramentas.length === 0 ? (
        <div className="card-surface mt-8 p-8 text-center">
          <p className="font-display text-lg font-bold">Você ainda não salvou nenhuma ferramenta</p>
          <p className="mt-2 text-sm text-ink-400">Abra uma ferramenta e clique na estrela para favoritar.</p>
          <Link href="/ferramentas/" className="btn-primary mt-4 inline-flex">Ver todas as ferramentas</Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ferramentas.map((t) => (
            <li key={t.slug}><ToolCard tool={t} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}
