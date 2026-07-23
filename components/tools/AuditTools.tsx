"use client";

import { useState } from "react";
import { waLink } from "@/lib/config";

/**
 * Ferramentas que leem um site público no NOSSO servidor (motor, Fase B):
 *  - SeoTool         → /api/seo        (auditor de SEO técnico, #17)
 *  - LinksTool       → /api/links      (verificador de links quebrados, #18)
 *  - Auditoria360    → /api/auditoria  (junta tags + SEO + links, #01)
 */

const ERROS: Record<string, string> = {
  url_vazia: "Digite o endereço do site.",
  url_invalida: "Esse endereço não parece válido. Ex.: seusite.com.br",
  url_bloqueada: "Esse endereço não pode ser analisado (endereço interno ou inválido).",
  site_inacessivel: "Não conseguimos acessar esse site agora. Confira o endereço ou tente de novo.",
  timeout: "O site demorou demais para responder. Tente de novo.",
  requisicao_invalida: "Algo deu errado no envio. Tente de novo.",
};

/** Hook comum: gerencia URL, loading, erro e resultado de uma rota de análise. */
function useAnalise<T>(endpoint: string, timeoutMs: number) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [res, setRes] = useState<T | null>(null);

  const analisar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setErro("");
    setRes(null);
    setLoading(true);
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const data = await r.json();
      if (data.error) setErro(ERROS[data.error] || "Não foi possível analisar esse site.");
      else setRes(data as T);
    } catch {
      setErro("Não foi possível analisar agora. Tente de novo em instantes.");
    } finally {
      setLoading(false);
    }
  };

  return { url, setUrl, loading, erro, res, analisar };
}

function Formulario({ url, setUrl, loading, analisar, rotulo }: { url: string; setUrl: (v: string) => void; loading: boolean; analisar: (e: React.FormEvent) => void; rotulo: string }) {
  return (
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
        {loading ? "Analisando…" : rotulo}
      </button>
    </form>
  );
}

function Carregando({ texto }: { texto: string }) {
  return (
    <p className="mono mt-5 flex items-center gap-2 text-sm text-info-400" role="status" aria-live="polite">
      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-info-400/30 border-t-info-400" />
      {texto}
    </p>
  );
}

function ErroBox({ erro }: { erro: string }) {
  return (
    <div className="mt-5 rounded-lg border border-warn-500/50 bg-warn-500/10 p-4" role="alert">
      <p className="text-sm text-warn-400">⚠️ {erro}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// #17 — Auditor de SEO técnico
// ─────────────────────────────────────────────────────────────────────────────

type SeoNivel = "ok" | "aviso" | "erro";
interface SeoAchado { chave: string; titulo: string; nivel: SeoNivel; valor?: string; detalhe: string; }
interface SeoRes { ok: boolean; url: string; pontos: SeoAchado[]; nota: number; resumo: { ok: number; aviso: number; erro: number }; }

const NIVEL_UI: Record<SeoNivel, { icone: string; classe: string; ordem: number }> = {
  erro: { icone: "✕", classe: "border-bad-500/30 bg-bad-500/[0.06] text-bad-400", ordem: 0 },
  aviso: { icone: "!", classe: "border-warn-500/30 bg-warn-500/[0.06] text-warn-400", ordem: 1 },
  ok: { icone: "✓", classe: "border-ok-500/25 bg-ok-500/[0.06] text-ok-400", ordem: 2 },
};

function corNota(n: number) {
  return n >= 80 ? "#34d399" : n >= 50 ? "#fbbf24" : "#f87171";
}

export function SeoTool() {
  const { url, setUrl, loading, erro, res, analisar } = useAnalise<SeoRes>("/api/seo/", 25000);
  const pontos = res ? [...res.pontos].sort((a, b) => NIVEL_UI[a.nivel].ordem - NIVEL_UI[b.nivel].ordem) : [];

  return (
    <div>
      <div className="card-surface mb-5 p-4">
        <p className="text-sm leading-relaxed text-ink-300">
          <strong className="text-ink-100">Para que serve:</strong> digite o endereço de um site e receba um
          diagnóstico de <strong>SEO técnico</strong> da página: título, descrição, H1, responsividade,
          canonical, prévia em redes, imagens sem descrição, indexação e HTTPS. Ótimo para auditar o site de
          um cliente. <strong>Nosso servidor lê apenas a página pública</strong> que você informar.
        </p>
      </div>

      <Formulario url={url} setUrl={setUrl} loading={loading} analisar={analisar} rotulo="Auditar SEO" />
      {loading && <Carregando texto="Lendo a página e avaliando o SEO…" />}
      {erro && <ErroBox erro={erro} />}

      {res && (
        <div className="mt-6">
          <div className="card-surface flex items-center gap-4 p-5">
            <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4" style={{ borderColor: corNota(res.nota) }}>
              <span className="font-display text-2xl font-black" style={{ color: corNota(res.nota) }}>{res.nota}</span>
              <span className="text-[0.6rem] text-ink-400">de 100</span>
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-bold">Nota de SEO técnico</p>
              <p className="mt-0.5 break-all text-xs text-ink-400">{res.url}</p>
              <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                <span className="text-bad-400">✕ {res.resumo.erro} erro(s)</span>
                <span className="text-warn-400">! {res.resumo.aviso} aviso(s)</span>
                <span className="text-ok-400">✓ {res.resumo.ok} ok</span>
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {pontos.map((p) => (
              <li key={p.chave} className={`rounded-lg border px-4 py-3 ${NIVEL_UI[p.nivel].classe}`}>
                <div className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-0.5 font-bold">{NIVEL_UI[p.nivel].icone}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-100">
                      {p.titulo}
                      {p.valor && <span className="ml-2 font-normal text-ink-400">— {p.valor}</span>}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-300">{p.detalhe}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {(res.resumo.erro > 0 || res.resumo.aviso > 0) && (
            <a href={waLink(`Fiz a auditoria de SEO do site ${res.url} no Hub da Consig Invest (nota ${res.nota}/100) e quero ajuda para corrigir.`)} target="_blank" rel="noopener" className="btn-primary mt-5">
              💬 Quero ajuda para corrigir o SEO
            </a>
          )}
        </div>
      )}

      <p className="mt-6 border-t border-white/10 pt-4 text-[0.72rem] leading-relaxed text-ink-400">
        Avaliamos a página inicial pelo código público. É uma verificação técnica de on-page — não substitui
        uma auditoria completa de conteúdo, autoridade e concorrência.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// #18 — Verificador de links quebrados
// ─────────────────────────────────────────────────────────────────────────────

interface LinkQuebrado { url: string; texto: string; status: number; interno: boolean; }
interface LinkSemResp { url: string; texto: string; interno: boolean; }
interface LinksRes { ok: boolean; url: string; total: number; verificados: number; truncado: boolean; quebrados: LinkQuebrado[]; semResposta: LinkSemResp[]; }

function Origem({ interno }: { interno: boolean }) {
  return <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[0.6rem] font-semibold ${interno ? "border-info-500/30 text-info-400" : "border-white/15 text-ink-400"}`}>{interno ? "interno" : "externo"}</span>;
}

export function LinksTool() {
  const { url, setUrl, loading, erro, res, analisar } = useAnalise<LinksRes>("/api/links/", 50000);

  return (
    <div>
      <div className="card-surface mb-5 p-4">
        <p className="text-sm leading-relaxed text-ink-300">
          <strong className="text-ink-100">Para que serve:</strong> digite o endereço de uma página e nós
          <strong> testamos todos os links dela</strong> para achar os que estão <strong>quebrados</strong> (erro
          404 e afins). Link quebrado prejudica a experiência e o SEO. <strong>Nosso servidor lê apenas a
          página pública</strong> que você informar.
        </p>
      </div>

      <Formulario url={url} setUrl={setUrl} loading={loading} analisar={analisar} rotulo="Verificar links" />
      {loading && <Carregando texto="Lendo a página e testando cada link… (pode levar alguns segundos)" />}
      {erro && <ErroBox erro={erro} />}

      {res && (
        <div className="mt-6">
          <div className="card-surface p-4">
            <p className="font-display text-sm font-bold">
              {res.quebrados.length === 0
                ? "✅ Nenhum link quebrado encontrado"
                : `🔗 ${res.quebrados.length} link${res.quebrados.length === 1 ? "" : "s"} quebrado${res.quebrados.length === 1 ? "" : "s"}`}
            </p>
            <p className="mt-0.5 text-xs text-ink-400">
              {res.verificados} de {res.total} links verificados{res.truncado ? " (limitamos a checagem para não sobrecarregar o site)" : ""}. <span className="break-all">{res.url}</span>
            </p>
          </div>

          {res.quebrados.length > 0 && (
            <ul className="mt-4 space-y-2">
              {res.quebrados.map((l) => (
                <li key={l.url} className="rounded-lg border border-bad-500/30 bg-bad-500/[0.06] px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="mono shrink-0 rounded bg-bad-500/20 px-1.5 py-0.5 text-[0.68rem] font-bold text-bad-400">{l.status}</span>
                    <Origem interno={l.interno} />
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-200">{l.texto || "(sem texto)"}</span>
                  </div>
                  <a href={l.url} target="_blank" rel="noopener nofollow" className="mono mt-1 block break-all text-[0.72rem] text-info-400 hover:underline">{l.url}</a>
                </li>
              ))}
            </ul>
          )}

          {res.semResposta.length > 0 && (
            <details className="mt-4 rounded-lg border border-white/10 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-ink-200">
                {res.semResposta.length} link(s) não responderam — pode ser bloqueio a robôs, não necessariamente quebra
              </summary>
              <ul className="mt-3 space-y-1.5">
                {res.semResposta.map((l) => (
                  <li key={l.url} className="flex items-center gap-2 text-xs">
                    <Origem interno={l.interno} />
                    <a href={l.url} target="_blank" rel="noopener nofollow" className="mono min-w-0 flex-1 truncate text-ink-400 hover:text-info-400">{l.url}</a>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {res.quebrados.length > 0 && (
            <a href={waLink(`Encontrei ${res.quebrados.length} link(s) quebrado(s) no site ${res.url} usando o Hub da Consig Invest e quero ajuda para corrigir.`)} target="_blank" rel="noopener" className="btn-primary mt-5">
              💬 Quero ajuda para corrigir os links
            </a>
          )}
        </div>
      )}

      <p className="mt-6 border-t border-white/10 pt-4 text-[0.72rem] leading-relaxed text-ink-400">
        Verificamos os links da página informada. Alguns sites bloqueiam robôs e podem aparecer como “não
        responderam” mesmo estando no ar — por isso separamos esses dos realmente quebrados.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// #01 — Auditoria 360 (tags + SEO + links num relatório só)
// ─────────────────────────────────────────────────────────────────────────────

interface Auditoria {
  ok: boolean;
  url: string;
  tags: { encontrados: { nome: string; categoria: string; id: string | null }[]; faltandoEssenciais: string[]; total: number };
  seo: { pontos: SeoAchado[]; nota: number; resumo: { ok: number; aviso: number; erro: number } };
  links: { total: number; verificados: number; truncado: boolean; quebrados: LinkQuebrado[] };
}

export function Auditoria360() {
  const { url, setUrl, loading, erro, res, analisar } = useAnalise<Auditoria>("/api/auditoria/", 50000);
  const problemasSeo = res ? res.seo.pontos.filter((p) => p.nivel !== "ok").sort((a, b) => NIVEL_UI[a.nivel].ordem - NIVEL_UI[b.nivel].ordem) : [];

  return (
    <div>
      <div className="card-surface mb-5 p-4">
        <p className="text-sm leading-relaxed text-ink-300">
          <strong className="text-ink-100">Para que serve:</strong> um raio-X completo do site num relatório
          só — <strong>tags e pixels</strong> instalados, <strong>SEO técnico</strong> e <strong>links
          quebrados</strong>. Ideal para diagnóstico inicial de um cliente novo.
          <strong> Nosso servidor lê apenas a página pública</strong> que você informar.
        </p>
      </div>

      <Formulario url={url} setUrl={setUrl} loading={loading} analisar={analisar} rotulo="Auditar site" />
      {loading && <Carregando texto="Fazendo o raio-X do site (tags, SEO e links)… pode levar alguns segundos" />}
      {erro && <ErroBox erro={erro} />}

      {res && (
        <div className="mt-6 space-y-5">
          <p className="break-all text-xs text-ink-400">Relatório de <strong className="text-ink-200">{res.url}</strong></p>

          {/* SEO */}
          <section className="card-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-sm font-bold">🔍 SEO técnico</h3>
              <span className="font-display text-lg font-black" style={{ color: corNota(res.seo.nota) }}>{res.seo.nota}/100</span>
            </div>
            <p className="mt-1 flex flex-wrap gap-x-3 text-xs">
              <span className="text-bad-400">✕ {res.seo.resumo.erro}</span>
              <span className="text-warn-400">! {res.seo.resumo.aviso}</span>
              <span className="text-ok-400">✓ {res.seo.resumo.ok}</span>
            </p>
            {problemasSeo.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {problemasSeo.slice(0, 6).map((p) => (
                  <li key={p.chave} className="flex items-start gap-2 text-xs">
                    <span className={p.nivel === "erro" ? "text-bad-400" : "text-warn-400"}>{NIVEL_UI[p.nivel].icone}</span>
                    <span className="text-ink-300"><strong className="text-ink-200">{p.titulo}</strong> — {p.detalhe}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-ok-400">Nenhum problema de SEO on-page encontrado. 🎉</p>
            )}
          </section>

          {/* Tags */}
          <section className="card-surface p-5">
            <h3 className="font-display text-sm font-bold">🏷️ Tags e pixels ({res.tags.total})</h3>
            {res.tags.total > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {res.tags.encontrados.map((t) => (
                  <li key={t.nome} className="rounded-full border border-ok-500/25 bg-ok-500/[0.06] px-2.5 py-1 text-xs text-ink-200">✓ {t.nome}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-warn-400">Nenhuma tag de marketing/medição encontrada.</p>
            )}
            {res.tags.faltandoEssenciais.length > 0 && (
              <p className="mt-3 text-xs text-ink-300">
                <strong className="text-warn-400">Faltando (recomendado):</strong> {res.tags.faltandoEssenciais.join(", ")}.
              </p>
            )}
          </section>

          {/* Links */}
          <section className="card-surface p-5">
            <h3 className="font-display text-sm font-bold">🔗 Links quebrados ({res.links.quebrados.length})</h3>
            <p className="mt-1 text-xs text-ink-400">{res.links.verificados} de {res.links.total} links verificados{res.links.truncado ? " (amostra)" : ""}.</p>
            {res.links.quebrados.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {res.links.quebrados.slice(0, 8).map((l) => (
                  <li key={l.url} className="flex items-center gap-2 text-xs">
                    <span className="mono shrink-0 rounded bg-bad-500/20 px-1.5 py-0.5 font-bold text-bad-400">{l.status}</span>
                    <a href={l.url} target="_blank" rel="noopener nofollow" className="mono min-w-0 flex-1 truncate text-info-400 hover:underline">{l.url}</a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-ok-400">Nenhum link quebrado na amostra verificada. 🎉</p>
            )}
          </section>

          <a href={waLink(`Fiz a Auditoria 360 do site ${res.url} no Hub da Consig Invest (SEO ${res.seo.nota}/100, ${res.tags.total} tags, ${res.links.quebrados.length} links quebrados) e quero um diagnóstico completo.`)} target="_blank" rel="noopener" className="btn-primary">
            💬 Quero um diagnóstico completo com especialista
          </a>
        </div>
      )}

      <p className="mt-6 border-t border-white/10 pt-4 text-[0.72rem] leading-relaxed text-ink-400">
        Diagnóstico automático da página inicial pelo código público. É um ponto de partida — a análise
        completa de conteúdo, concorrência e conversão é feita com um especialista.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// #06 — Analisador de Landing Page (converte ou não?)
// ─────────────────────────────────────────────────────────────────────────────

export function LandingTool() {
  const { url, setUrl, loading, erro, res, analisar } = useAnalise<SeoRes>("/api/landing/", 25000);
  const pontos = res ? [...res.pontos].sort((a, b) => NIVEL_UI[a.nivel].ordem - NIVEL_UI[b.nivel].ordem) : [];

  return (
    <div>
      <div className="card-surface mb-5 p-4">
        <p className="text-sm leading-relaxed text-ink-300">
          <strong className="text-ink-100">Para que serve:</strong> cole o endereço de uma página de vendas
          (landing page) e veja se ela está <strong>preparada para converter</strong> visitante em contato:
          proposta clara, botão de ação, formulário, WhatsApp, prova social, celular, segurança e medição.
          <strong> Nosso servidor lê apenas a página pública</strong> que você informar.
        </p>
      </div>

      <Formulario url={url} setUrl={setUrl} loading={loading} analisar={analisar} rotulo="Analisar página" />
      {loading && <Carregando texto="Lendo a página e avaliando a conversão…" />}
      {erro && <ErroBox erro={erro} />}

      {res && (
        <div className="mt-6">
          <div className="card-surface flex items-center gap-4 p-5">
            <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4" style={{ borderColor: corNota(res.nota) }}>
              <span className="font-display text-2xl font-black" style={{ color: corNota(res.nota) }}>{res.nota}</span>
              <span className="text-[0.6rem] text-ink-400">de 100</span>
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-bold">Prontidão para converter</p>
              <p className="mt-0.5 break-all text-xs text-ink-400">{res.url}</p>
              <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                <span className="text-bad-400">✕ {res.resumo.erro} crítico(s)</span>
                <span className="text-warn-400">! {res.resumo.aviso} a melhorar</span>
                <span className="text-ok-400">✓ {res.resumo.ok} ok</span>
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {pontos.map((p) => (
              <li key={p.chave} className={`rounded-lg border px-4 py-3 ${NIVEL_UI[p.nivel].classe}`}>
                <div className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-0.5 font-bold">{NIVEL_UI[p.nivel].icone}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-100">
                      {p.titulo}
                      {p.valor && <span className="ml-2 font-normal text-ink-400">— {p.valor}</span>}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-300">{p.detalhe}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {(res.resumo.erro > 0 || res.resumo.aviso > 0) && (
            <a href={waLink(`Analisei a landing page ${res.url} no Hub da Consig Invest (nota ${res.nota}/100 de conversão) e quero ajuda para melhorar.`)} target="_blank" rel="noopener" className="btn-primary mt-5">
              💬 Quero ajuda para a página converter mais
            </a>
          )}
        </div>
      )}

      <p className="mt-6 border-t border-white/10 pt-4 text-[0.72rem] leading-relaxed text-ink-400">
        Avaliamos os elementos de conversão presentes no código público da página. É uma checagem inicial —
        o teste real de conversão envolve texto, oferta, público e testes A/B, feitos com um especialista.
      </p>
    </div>
  );
}
