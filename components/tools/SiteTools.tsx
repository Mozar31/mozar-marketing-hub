"use client";

import { useState } from "react";
import { waLink } from "@/lib/config";

/**
 * Verificador de tags e pixels (#03) — chama a rota de servidor /api/tags,
 * que lê o site público informado e detecta o que está instalado.
 */

interface Tag {
  nome: string;
  categoria: string;
  id: string | null;
}
interface Resultado {
  ok: boolean;
  url: string;
  encontrados: Tag[];
  faltandoEssenciais: string[];
  total: number;
}

const ERROS: Record<string, string> = {
  url_vazia: "Digite o endereço do site.",
  url_invalida: "Esse endereço não parece válido. Ex.: seusite.com.br",
  url_bloqueada: "Esse endereço não pode ser analisado (endereço interno ou inválido).",
  site_inacessivel: "Não conseguimos acessar esse site agora. Confira o endereço ou tente de novo.",
  timeout: "O site demorou demais para responder. Tente de novo.",
  requisicao_invalida: "Algo deu errado no envio. Tente de novo.",
};

export function TagsTool() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [res, setRes] = useState<Resultado | null>(null);

  const analisar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setErro("");
    setRes(null);
    setLoading(true);
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      const r = await fetch("/api/tags/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const data = await r.json();
      if (data.error) {
        setErro(ERROS[data.error] || "Não foi possível analisar esse site.");
      } else {
        setRes(data as Resultado);
      }
    } catch {
      setErro("Não foi possível analisar agora. Tente de novo em instantes.");
    } finally {
      setLoading(false);
    }
  };

  // Agrupa por categoria para exibir organizado.
  const porCategoria = (res?.encontrados ?? []).reduce<Record<string, Tag[]>>((acc, t) => {
    (acc[t.categoria] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div>
      <div className="card-surface mb-5 p-4">
        <p className="text-sm leading-relaxed text-ink-300">
          <strong className="text-ink-100">Para que serve:</strong> digite o endereço de um site e descubra
          quais <strong>tags e pixels de marketing</strong> estão instalados — Google Analytics, Gerenciador
          de Tags, Pixel da Meta, Google Ads, TikTok, e mais. Ótimo para auditar o site de um cliente e ver
          o que falta para medir e anunciar direito. <strong>Nosso servidor lê apenas a página pública</strong> que você informar.
        </p>
      </div>

      <form onSubmit={analisar} className="flex flex-wrap gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Ex.: seusite.com.br"
          className="input-base flex-1 min-w-[16rem]"
          aria-label="Endereço do site"
          inputMode="url"
        />
        <button type="submit" className="btn-primary" disabled={loading || !url.trim()}>
          {loading ? "Analisando…" : "Analisar site"}
        </button>
      </form>

      {loading && (
        <p className="mono mt-5 flex items-center gap-2 text-sm text-info-400" role="status" aria-live="polite">
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-info-400/30 border-t-info-400" />
          Lendo o site e procurando as tags…
        </p>
      )}

      {erro && (
        <div className="mt-5 rounded-lg border border-warn-500/50 bg-warn-500/10 p-4" role="alert">
          <p className="text-sm text-warn-400">⚠️ {erro}</p>
        </div>
      )}

      {res && (
        <div className="mt-6">
          <div className="card-surface p-4">
            <p className="font-display text-sm font-bold">
              {res.total > 0 ? `🔎 ${res.total} ferramenta${res.total === 1 ? "" : "s"} encontrada${res.total === 1 ? "" : "s"}` : "Nenhuma tag de marketing encontrada"}
            </p>
            <p className="mt-0.5 break-all text-xs text-ink-400">{res.url}</p>
          </div>

          {res.total > 0 && (
            <div className="mt-4 space-y-4">
              {Object.entries(porCategoria).map(([cat, tags]) => (
                <section key={cat}>
                  <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-info-400">{cat}</h3>
                  <ul className="space-y-2">
                    {tags.map((t) => (
                      <li key={t.nome} className="flex items-start gap-2.5 rounded-lg border border-ok-500/25 bg-ok-500/[0.06] px-4 py-2.5">
                        <span aria-hidden="true" className="mt-0.5 text-ok-400">✓</span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-ink-100">{t.nome}</span>
                          {t.id && <span className="mono block text-[0.72rem] text-ink-400">ID: {t.id}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          {res.faltandoEssenciais.length > 0 && (
            <section className="mt-5 rounded-xl border border-warn-500/40 bg-warn-500/[0.08] p-5">
              <h3 className="font-display text-sm font-bold text-warn-400">📉 Está faltando (recomendado ter)</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-300">
                Sem essas ferramentas, o site fica “no escuro”: você não mede resultados nem consegue
                remarketing/otimização de anúncios direito.
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {res.faltandoEssenciais.map((n) => (
                  <li key={n} className="pl-4 text-sm text-ink-200 before:mr-2 before:text-warn-400 before:content-['○'] before:-ml-4">{n}</li>
                ))}
              </ul>
            </section>
          )}

          <a
            href={waLink(`Analisei as tags do site ${res.url} no Hub da Consig Invest e quero ajuda para instalar/corrigir o rastreamento.`)}
            target="_blank"
            rel="noopener"
            className="btn-primary mt-5"
          >
            💬 Quero ajuda para instalar/corrigir o rastreamento
          </a>
        </div>
      )}

      <p className="mt-6 border-t border-white/10 pt-4 text-[0.72rem] leading-relaxed text-ink-400">
        Detectamos as tags pelo código público da página inicial do site. Algumas ferramentas carregam só
        em páginas internas ou após consentimento de cookies e podem não aparecer aqui.
      </p>
    </div>
  );
}
