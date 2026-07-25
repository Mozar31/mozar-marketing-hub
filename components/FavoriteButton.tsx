"use client";

import { useEffect, useState } from "react";
import { ehFavorito, alternarFavorito } from "@/lib/tools/favorites";

/** Botão de favoritar (estrela) para uma ferramenta. Estado no localStorage. */
export function FavoriteButton({ slug, className = "" }: { slug: string; className?: string }) {
  const [fav, setFav] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    setFav(ehFavorito(slug));
    const sync = () => setFav(ehFavorito(slug));
    window.addEventListener("favoritos:mudou", sync);
    return () => window.removeEventListener("favoritos:mudou", sync);
  }, [slug]);

  return (
    <button
      type="button"
      onClick={() => setFav(alternarFavorito(slug))}
      aria-pressed={fav}
      aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      title={fav ? "Remover dos favoritos" : "Salvar nos favoritos"}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
        fav ? "border-warn-500/50 bg-warn-500/10 text-warn-400" : "border-white/15 text-ink-300 hover:border-info-500/50"
      } ${className}`}
      // Evita "piscar" o estado errado antes de ler o localStorage.
      style={montado ? undefined : { visibility: "hidden" }}
    >
      <span aria-hidden="true">{fav ? "★" : "☆"}</span>
      {fav ? "Favoritada" : "Favoritar"}
    </button>
  );
}
