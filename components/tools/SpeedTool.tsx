"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { PAGESPEED_KEY } from "@/lib/config";

/**
 * Auditoria de velocidade e Core Web Vitals — §23.
 * Separa explicitamente LABORATÓRIO (Lighthouse) de dado real, mostra fonte,
 * data, dispositivo e ausência de dados, conforme exigido pelo PROMPT 06.
 */

interface DeviceResult {
  categories: { key: string; label: string; score: number }[];
  metrics: { id: string; label: string; value: string; rating: "good" | "mid" | "bad" }[];
  opportunities: { title: string; savingsMs: number }[];
}

/** Dados REAIS de campo (CrUX): experiência dos visitantes nos últimos 28 dias. */
interface FieldResult {
  overall: "good" | "mid" | "bad" | null;
  scope: "url" | "origin";
  metrics: { id: string; label: string; value: string; rating: "good" | "mid" | "bad"; explica: string }[];
}

const crux = (cat?: string): "good" | "mid" | "bad" | null =>
  cat === "FAST" ? "good" : cat === "AVERAGE" ? "mid" : cat === "SLOW" ? "bad" : null;

/**
 * Lê loadingExperience (dados de campo do CrUX) da resposta do PageSpeed.
 * É diferente do Lighthouse: aqui são medições de gente de verdade acessando
 * o site, não uma simulação. O Google usa ISTO no sinal de Experiência da Página.
 */
function parseField(le: any): FieldResult | null {
  const m = le?.metrics;
  if (!m) return null;
  const defs = [
    { key: "LARGEST_CONTENTFUL_PAINT_MS", id: "lcp", label: "Conteúdo principal (LCP)",
      fmt: (v: number) => (v / 1000).toFixed(1).replace(".", ",") + " s",
      explica: "Tempo real até o visitante ver a parte principal. Ideal: até 2,5 s." },
    { key: "INTERACTION_TO_NEXT_PAINT", id: "inp", label: "Resposta ao toque (INP)",
      fmt: (v: number) => Math.round(v) + " ms",
      explica: "Quanto o site demora a reagir quando a pessoa toca ou clica. Ideal: até 200 ms." },
    { key: "CUMULATIVE_LAYOUT_SHIFT_SCORE", id: "cls", label: "Estabilidade visual (CLS)",
      fmt: (v: number) => (v / 100).toFixed(2).replace(".", ","),
      explica: "Se os elementos pulam de lugar enquanto carrega. Ideal: abaixo de 0,10." },
  ];
  const metrics = defs
    .filter((d) => m[d.key] && crux(m[d.key].category) != null)
    .map((d) => ({
      id: d.id,
      label: d.label,
      value: d.fmt(m[d.key].percentile),
      rating: crux(m[d.key].category)!,
      explica: d.explica,
    }));
  if (!metrics.length) return null;
  return { overall: crux(le.overall_category), scope: le.origin_fallback ? "origin" : "url", metrics };
}

const CATS = [
  { key: "performance", label: "Desempenho" },
  { key: "accessibility", label: "Acessibilidade" },
  { key: "best-practices", label: "Práticas recomendadas" },
  { key: "seo", label: "SEO" },
];

const LIMITS: Record<string, [number, number]> = { lcp: [2500, 4000], cls: [0.1, 0.25], tbt: [200, 600] };

function rate(id: string, v: number): "good" | "mid" | "bad" {
  const lim = LIMITS[id];
  if (!lim) return "good";
  return v <= lim[0] ? "good" : v <= lim[1] ? "mid" : "bad";
}

function parse(lh: any): DeviceResult {
  const categories = CATS.map((c) => ({
    key: c.key,
    label: c.label,
    score: Math.round((lh.categories?.[c.key]?.score ?? 0) * 100),
  })).filter((c) => lh.categories?.[c.key] != null);

  const defs = [
    { id: "lcp", audit: "largest-contentful-paint", label: "Conteúdo principal aparece em" },
    { id: "cls", audit: "cumulative-layout-shift", label: "Estabilidade visual" },
    { id: "tbt", audit: "total-blocking-time", label: "Tempo travado" },
  ];
  const metrics = defs
    .filter((d) => lh.audits?.[d.audit])
    .map((d) => ({
      id: d.id,
      label: d.label,
      value: lh.audits[d.audit].displayValue || "—",
      rating: rate(d.id, lh.audits[d.audit].numericValue),
    }));

  const opportunities = Object.values(lh.audits ?? {})
    .filter((a: any) => a?.details?.type === "opportunity" && (a.details.overallSavingsMs || 0) > 0)
    .sort((a: any, b: any) => b.details.overallSavingsMs - a.details.overallSavingsMs)
    .slice(0, 4)
    .map((a: any) => ({ title: a.title, savingsMs: a.details.overallSavingsMs }));

  return { categories, metrics, opportunities };
}

function normalizeUrl(raw: string): string | null {
  let u = raw.trim().replace(/\s+/g, "");
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    const parsed = new URL(u);
    if (!parsed.hostname.includes(".")) return null;
    // Bloqueia alvos internos mesmo sendo chamada client-side (§14)
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[?::1)/i.test(parsed.hostname)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

async function runPageSpeed(url: string, strategy: "mobile" | "desktop"): Promise<any> {
  const api =
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=" +
    encodeURIComponent(url) +
    `&strategy=${strategy}` +
    "&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO&locale=pt_BR" +
    (PAGESPEED_KEY ? "&key=" + PAGESPEED_KEY : "");
  const res = await fetch(api);
  if (res.status === 429) throw new Error("RATE");
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error("API:" + (body?.error?.message ?? ""));
  }
  return res.json();
}

export function SpeedTool() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobile, setMobile] = useState<DeviceResult | null>(null);
  const [desktop, setDesktop] = useState<DeviceResult | null>(null);
  const [field, setField] = useState<FieldResult | null>(null);
  const [hasField, setHasField] = useState(false);
  const [analyzed, setAnalyzed] = useState<{ host: string; at: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = normalizeUrl(url);
    setError(null);
    if (!target) {
      setError("Endereço inválido. Digite algo como: seusite.com.br");
      return;
    }
    setLoading(true);
    setMobile(null);
    setDesktop(null);
    setField(null);
    try {
      const [m, d] = await Promise.all([
        runPageSpeed(target, "mobile"),
        runPageSpeed(target, "desktop").catch(() => null),
      ]);
      if (!m?.lighthouseResult) throw new Error("API:sem resultado");
      setMobile(parse(m.lighthouseResult));
      if (d?.lighthouseResult) setDesktop(parse(d.lighthouseResult));
      // Dados de campo (CrUX): tenta a página específica; se não houver, o site inteiro.
      const fUrl = parseField(m.loadingExperience);
      const fOrigin = parseField(m.originLoadingExperience);
      setField(fUrl ?? (fOrigin ? { ...fOrigin, scope: "origin" as const } : null));
      setHasField(true);
      setAnalyzed({
        host: new URL(target).hostname.replace(/^www\./, ""),
        at: new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
      });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === "RATE") setError("O Google está com fila de análises agora. Tente novamente em 1 minuto.");
      else if (msg.startsWith("API:")) setError("Não foi possível analisar este endereço. Verifique se o site está no ar e acessível publicamente.");
      else setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="seusite.com.br (com ou sem www)"
          className="input-base flex-1 min-w-[16rem]"
          aria-label="Endereço do site"
          required
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Analisando…" : "Analisar site"}
        </button>
      </form>
      <p className="mt-2 text-xs text-ink-400">
        A análise consulta o Google PageSpeed e pode levar até 60 segundos (celular + computador).
      </p>

      {loading && (
        <p className="mono mt-5 flex items-center gap-2 text-sm text-info-400" role="status" aria-live="polite">
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-info-400/30 border-t-info-400" />
          Consultando o Google… isso leva alguns segundos.
        </p>
      )}

      {error && (
        <p className="mt-5 rounded-lg border border-warn-500/50 bg-warn-500/10 p-4 text-sm text-warn-400" role="alert">
          ⚠️ {error}
        </p>
      )}

      {mobile && analyzed && (
        <div className="mt-8">
          <p className="mb-6 rounded-lg border border-white/10 bg-navy-800 p-3 text-xs text-ink-400">
            Resultado de <strong className="text-ink-200">{analyzed.host}</strong> · análise feita em{" "}
            {analyzed.at} · fonte: Google PageSpeed Insights.
          </p>

          {/* ── DADOS REAIS (campo/CrUX) — o que o Google usa no ranqueamento ── */}
          {hasField && <FieldSection field={field} scopeHost={analyzed.host} />}

          {/* ── LABORATÓRIO (Lighthouse) — simulação ── */}
          <div className="mb-4 mt-8 flex items-center gap-2">
            <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-ink-300">
              Laboratório
            </span>
            <p className="text-xs text-ink-400">
              Simulação em ambiente controlado — útil para diagnóstico, mas <strong className="text-ink-300">não</strong> é a experiência real dos visitantes.
            </p>
          </div>

          <DeviceBlock title="📱 No celular" subtitle="É esta a nota que o Google usa para ranquear" data={mobile} />
          {desktop ? (
            <DeviceBlock title="💻 No computador" data={desktop} />
          ) : (
            <p className="mt-6 text-xs text-ink-400">
              Não foi possível obter a análise de computador desta vez.
            </p>
          )}

          <Summary mobile={mobile} desktop={desktop} host={analyzed.host} />

          {mobile.opportunities.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 font-display text-base font-bold text-info-400">
                Principais oportunidades (celular)
              </h2>
              <ul className="space-y-2">
                {mobile.opportunities.map((o) => (
                  <li key={o.title} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 border-l-[3px] border-l-warn-500 bg-navy-800 px-4 py-3 text-sm">
                    <span>{o.title}</span>
                    <span className="mono whitespace-nowrap text-xs font-bold text-warn-400">
                      economia ~{(o.savingsMs / 1000).toFixed(1).replace(".", ",")}s
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function scoreColor(s: number) {
  return s >= 90 ? "#34d399" : s >= 50 ? "#fbbf24" : "#f87171";
}

const RATING_COLOR = { good: "#34d399", mid: "#fbbf24", bad: "#f87171" } as const;
const RATING_TXT = { good: "Bom", mid: "Precisa melhorar", bad: "Ruim" } as const;

/** Dados reais de campo (CrUX). Vem primeiro porque é o que importa para o Google. */
function FieldSection({ field, scopeHost }: { field: FieldResult | null; scopeHost: string }) {
  if (!field) {
    return (
      <section className="rounded-xl border border-white/10 bg-navy-800 p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full border border-info-500/40 bg-info-500/15 px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-info-400">
            Dados reais
          </span>
          <h2 className="font-display text-base font-bold">Experiência dos visitantes</h2>
        </div>
        <p className="text-sm leading-relaxed text-ink-300">
          O Google ainda <strong className="text-ink-100">não tem dados reais suficientes</strong> sobre{" "}
          {scopeHost} para mostrar aqui — isso acontece quando o site recebe pouco tráfego. Não quer dizer
          que o site é rápido nem lento: apenas que faltam medições de visitantes reais. Use o laboratório
          abaixo como diagnóstico enquanto isso.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-info-500/25 bg-info-500/[0.06] p-5">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-info-500/40 bg-info-500/15 px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-info-400">
          Dados reais
        </span>
        <h2 className="font-display text-base font-bold">Experiência dos visitantes (últimos 28 dias)</h2>
        {field.overall && (
          <span className="mono text-xs font-bold" style={{ color: RATING_COLOR[field.overall] }}>
            · {RATING_TXT[field.overall]}
          </span>
        )}
      </div>
      <p className="mb-4 text-xs text-ink-400">
        Medições de gente de verdade acessando {field.scope === "origin" ? "o site inteiro" : "esta página"}.
        {" "}<strong className="text-ink-300">É isto que o Google usa no ranqueamento</strong>, não a nota de laboratório.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {field.metrics.map((m) => (
          <div key={m.id} className="card-surface p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-ink-400">{m.label}</p>
            <p className="mono mt-1 text-lg font-bold" style={{ color: RATING_COLOR[m.rating] }}>
              {m.value} <span className="text-[0.7rem] font-normal">· {RATING_TXT[m.rating]}</span>
            </p>
            <p className="mt-1.5 text-[0.7rem] leading-relaxed text-ink-400">{m.explica}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DeviceBlock({ title, subtitle, data }: { title: string; subtitle?: string; data: DeviceResult }) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-base font-bold">
        {title}{" "}
        {subtitle && <span className="text-xs font-normal text-ink-400">({subtitle})</span>}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {data.categories.map((c) => (
          <div key={c.key} className="card-surface flex flex-col items-center gap-2 p-4">
            <Gauge score={c.score} />
            <span className="text-center text-[0.72rem] font-semibold text-ink-400">{c.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {data.metrics.map((m) => (
          <div key={m.id} className="card-surface p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-ink-400">{m.label}</p>
            <p
              className="mono mt-1 text-lg font-bold"
              style={{ color: m.rating === "good" ? "#34d399" : m.rating === "mid" ? "#fbbf24" : "#f87171" }}
            >
              {m.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Gauge({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  const color = scoreColor(score);
  return (
    <svg width="86" height="86" viewBox="0 0 86 86" role="img" aria-label={`Nota ${score} de 100`}>
      <circle cx="43" cy="43" r={r} fill="none" stroke="rgba(169,184,216,0.15)" strokeWidth="7" />
      <circle
        cx="43" cy="43" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${filled} ${c}`} transform="rotate(-90 43 43)"
      />
      <text x="43" y="50" textAnchor="middle" fill={color} fontFamily="var(--font-mono)" fontSize="21" fontWeight="700">
        {score}
      </text>
    </svg>
  );
}

/** Resumo em linguagem simples — mantido da v1 por ser diferencial validado. */
function Summary({ mobile, desktop, host }: { mobile: DeviceResult; desktop: DeviceResult | null; host: string }) {
  const perf = mobile.categories.find((c) => c.key === "performance")?.score ?? 0;
  const perfDesk = desktop?.categories.find((c) => c.key === "performance")?.score;
  const seo = mobile.categories.find((c) => c.key === "seo")?.score ?? 0;
  const acc = mobile.categories.find((c) => c.key === "accessibility")?.score;
  const bp = mobile.categories.find((c) => c.key === "best-practices")?.score;

  let head: string, text: string;
  if (perf >= 90) {
    head = "🟢 Seu site está rápido";
    text = `O ${host} carrega rápido no celular (nota ${perf} de 100). Na prática, quem clica consegue ver o conteúdo quase na hora.`;
  } else if (perf >= 70) {
    head = "🟡 Dá para melhorar";
    text = `O ${host} tem nota ${perf} de 100 no celular. Funciona, mas há uma demora perceptível — e cada segundo de espera reduz a chance de conversão.`;
  } else if (perf >= 50) {
    head = "🟠 Atenção: está lento no celular";
    text = `O ${host} tem nota ${perf} de 100. No celular, a espera é longa o bastante para parte dos visitantes desistir antes de ver qualquer coisa.`;
  } else {
    head = "🔴 Crítico: muito lento";
    text = `O ${host} tem nota ${perf} de 100 no celular. Boa parte dos visitantes desiste antes de a página abrir — se você investe em anúncios, está pagando por visitas que não chegam a ver o site.`;
  }
  if (perfDesk != null) {
    text += ` No computador a nota é ${perfDesk} — quase sempre maior, porque o processador é mais potente. Mas é a nota do celular que o Google usa para ranquear.`;
  }

  const items: string[] = [];
  mobile.metrics.forEach((m) => {
    const tag = m.rating === "good" ? "✅ bom" : m.rating === "mid" ? "⚠️ pode melhorar" : "🔴 ruim";
    if (m.id === "lcp") items.push(`**${m.label}: ${m.value} — ${tag}.** É quanto o visitante espera até ver a parte principal da página. O ideal é até 2,5 segundos.`);
    if (m.id === "cls") items.push(`**${m.label}: ${m.value} — ${tag}.** Mede se os elementos "pulam" de lugar enquanto a página carrega. O ideal é ficar abaixo de 0,1.`);
    if (m.id === "tbt") items.push(`**${m.label}: ${m.value} — ${tag}.** É quanto tempo a página fica sem responder ao toque. O ideal é abaixo de 200 ms.`);
  });
  if (acc != null) items.push(`**Acessibilidade: ${acc}/100.** Mede se qualquer pessoa consegue usar o site — inclusive quem usa leitor de tela ou navega pelo teclado.`);
  if (bp != null) items.push(`**Práticas recomendadas: ${bp}/100.** Verifica segurança da conexão, bibliotecas desatualizadas e erros escondidos.`);
  items.push(
    seo >= 90
      ? `**SEO: ${seo}/100 — estrutura técnica em ordem.** Isso significa que o Google consegue ler seu site sem barreiras. Não garante primeira posição: ranqueamento depende de conteúdo, autoridade e trabalho contínuo.`
      : `**SEO: ${seo}/100.** Há falhas técnicas atrapalhando o Google a entender suas páginas — cada uma delas é posição perdida para concorrentes mais organizados.`
  );

  return (
    <section className="mt-6 rounded-xl border border-info-500/20 bg-info-500/[0.05] p-6">
      <h2 className="font-display text-base font-bold">{head}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-300">{text}</p>
      <ul className="mt-4 space-y-2.5">
        {items.map((it, i) => (
          <li key={i} className="pl-4 text-sm leading-relaxed text-ink-300 before:mr-2 before:text-info-400 before:content-['▸'] before:-ml-4">
            <span dangerouslySetInnerHTML={{ __html: it.replace(/\*\*(.+?)\*\*/g, "<strong class='text-ink-100'>$1</strong>") }} />
          </li>
        ))}
      </ul>
    </section>
  );
}
