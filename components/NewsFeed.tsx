"use client";

import { useEffect, useMemo, useState } from "react";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/config";

/**
 * Feed de novidades — lê `news_items` publicadas do Supabase.
 *
 * O site é exportação estática, então a busca acontece no navegador do visitante,
 * em tempo de execução. A publishable key é pública por design: o RLS só deixa ler
 * status='published' (ver SECURITY.md).
 */

interface NewsItem {
  id: string;
  titulo: string;
  resumo: string | null;
  canonical_url: string;
  autor: string | null;
  publicado_em: string;
  categoria: string;
  tipo: "anuncio" | "analise" | "rumor" | "patrocinado";
  news_sources: { nome: string; fornecedor: string } | null;
}

const CATEGORIAS: { slug: string; label: string }[] = [
  { slug: "todas", label: "Todas" },
  { slug: "ia", label: "Inteligência artificial" },
  { slug: "google", label: "Google" },
  { slug: "meta", label: "Meta" },
  { slug: "seo", label: "SEO" },
  { slug: "analytics", label: "Analytics" },
  { slug: "web", label: "Web" },
];

const TIPO_LABEL: Record<NewsItem["tipo"], { texto: string; classe: string }> = {
  anuncio: { texto: "Anúncio oficial", classe: "bg-action-500/15 text-action-500 border-action-500/30" },
  analise: { texto: "Análise", classe: "bg-info-500/15 text-info-400 border-info-500/30" },
  rumor: { texto: "Rumor", classe: "bg-warn-500/15 text-warn-400 border-warn-500/30" },
  patrocinado: { texto: "Patrocinado", classe: "bg-white/10 text-ink-300 border-white/20" },
};

const fmtData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

function tempoRelativo(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  if (dias < 30) return `há ${Math.floor(dias / 7)} sem.`;
  return fmtData.format(new Date(iso));
}

export function NewsFeed() {
  const [itens, setItens] = useState<NewsItem[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [cat, setCat] = useState("todas");

  useEffect(() => {
    const ctrl = new AbortController();
    const url =
      `${SUPABASE_URL}/rest/v1/news_items` +
      `?select=id,titulo,resumo,canonical_url,autor,publicado_em,categoria,tipo,news_sources(nome,fornecedor)` +
      `&status=eq.published&order=publicado_em.desc&limit=60`;

    fetch(url, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
      signal: ctrl.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: NewsItem[]) => setItens(data))
      .catch((e) => {
        if (e.name !== "AbortError") setErro("Não foi possível carregar as novidades agora. Tente recarregar a página.");
      });

    return () => ctrl.abort();
  }, []);

  const visiveis = useMemo(
    () => (itens ?? []).filter((i) => cat === "todas" || i.categoria === cat),
    [itens, cat]
  );

  // categorias que realmente têm notícia, para não mostrar filtro vazio
  const catsComItens = useMemo(() => {
    const presentes = new Set((itens ?? []).map((i) => i.categoria));
    return CATEGORIAS.filter((c) => c.slug === "todas" || presentes.has(c.slug));
  }, [itens]);

  if (erro) {
    return (
      <p className="rounded-lg border border-warn-500/50 bg-warn-500/10 p-4 text-sm text-warn-400" role="alert">
        ⚠️ {erro}
      </p>
    );
  }

  if (itens === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-surface h-44 animate-pulse p-5" />
        ))}
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="card-surface p-8 text-center">
        <p className="font-display text-lg font-bold">Ainda não há novidades publicadas</p>
        <p className="mt-2 text-sm text-ink-400">
          As atualizações das plataformas aparecem aqui automaticamente. Volte em breve.
        </p>
      </div>
    );
  }

  return (
    <div>
      {catsComItens.length > 2 && (
        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por área">
          {catsComItens.map((c) => (
            <button
              key={c.slug}
              type="button"
              role="tab"
              aria-selected={cat === c.slug}
              onClick={() => setCat(c.slug)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                cat === c.slug
                  ? "border-action-500 bg-action-500/20 text-ink-100"
                  : "border-white/15 text-ink-300 hover:border-info-500/50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visiveis.map((item) => {
          const tipo = TIPO_LABEL[item.tipo] ?? TIPO_LABEL.analise;
          return (
            <li key={item.id} className="card-surface flex flex-col p-5 transition hover:border-info-500/40">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold ${tipo.classe}`}>
                  {tipo.texto}
                </span>
                <span className="mono text-[0.68rem] text-ink-400">{tempoRelativo(item.publicado_em)}</span>
              </div>

              <h2 className="font-display text-[0.95rem] font-bold leading-snug">
                <a
                  href={item.canonical_url}
                  target="_blank"
                  rel="noopener nofollow"
                  className="hover:text-info-400"
                >
                  {item.titulo}
                </a>
              </h2>

              {item.resumo && (
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink-400">{item.resumo}</p>
              )}

              <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-[0.7rem] text-ink-400">
                <span className="truncate">
                  {item.news_sources?.nome ?? item.news_sources?.fornecedor ?? "Fonte oficial"}
                </span>
                <a
                  href={item.canonical_url}
                  target="_blank"
                  rel="noopener nofollow"
                  className="shrink-0 font-semibold text-info-400 hover:underline"
                >
                  Ler na fonte →
                </a>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 border-t border-white/10 pt-4 text-[0.72rem] leading-relaxed text-ink-400">
        Resumos curtos com link para a publicação original de cada plataforma. O conteúdo completo
        pertence à fonte citada; aqui você vê apenas um resumo para se situar rápido.
      </p>
    </div>
  );
}
