"use client";

import { useMemo, useState } from "react";
import { waLink, IA_ANUNCIO } from "@/lib/config";

/**
 * Gerador de anúncios do Google Ads (Responsive Search Ads) — §8 do "Arrumar hub".
 * Montador GUIADO, 100% no navegador: o usuário descreve o negócio e a ferramenta
 * sugere títulos, descrições, sitelinks, snippets e frases de destaque já dentro
 * dos limites de caractere do Google, com contadores e checklist de boas práticas.
 *
 * O botão "Gerar com IA" ficará ligado a um webhook do n8n numa etapa seguinte
 * (a chave da IA vive no n8n, nunca no site). Por ora fica como "em breve".
 */

// Limites oficiais do Google Ads (RSA).
const LIM = {
  titulo: 30,
  descricao: 90,
  caminho: 15,
  callout: 25,
  sitelinkTexto: 25,
  sitelinkDesc: 35,
  snippetValor: 25,
} as const;

interface Brief {
  produto: string;
  keyword: string;
  cidade: string;
  beneficio: string;
  diferencial: string;
  marca: string;
  cta: string;
}

const CTAS = ["Fale conosco", "Simule agora", "Peça um orçamento", "Agende uma visita", "Saiba mais", "Compre online"];

/** Deixa a primeira letra maiúscula sem mexer no resto (evita quebrar siglas). */
const cap1 = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Mantém só candidatos dentro do limite, sem duplicar, ignorando vazios. */
function dentroDoLimite(cands: (string | false | undefined | null)[], limite: number): string[] {
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const c of cands) {
    if (!c) continue;
    const s = c.trim().replace(/\s+/g, " ");
    if (!s || s.length > limite) continue;
    const chave = s.toLowerCase();
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    out.push(s);
  }
  return out;
}

function gerarTitulos(b: Brief): string[] {
  const base = cap1(b.keyword || b.produto);
  const cands = [
    base,
    b.beneficio && cap1(b.beneficio),
    b.diferencial && cap1(b.diferencial),
    b.marca && cap1(b.marca),
    b.beneficio && `${base} ${b.beneficio}`,
    b.cidade && `${base} em ${b.cidade}`,
    b.marca && `${base} | ${b.marca}`,
    b.cta && cap1(b.cta),
    b.cidade && b.beneficio && `${cap1(b.beneficio)} em ${b.cidade}`,
    b.marca && b.cta && `${cap1(b.cta)} na ${b.marca}`,
    b.diferencial && b.cidade && `${cap1(b.diferencial)} em ${b.cidade}`,
    "Atendimento Rápido",
    "Peça uma Cotação",
    b.beneficio && `${cap1(b.beneficio)} de Verdade`,
    `${base} com Qualidade`,
    "Fale com um Especialista",
  ];
  return dentroDoLimite(cands, LIM.titulo).slice(0, 15);
}

function gerarDescricoes(b: Brief): string[] {
  const base = b.keyword || b.produto;
  const cta = b.cta || "Fale conosco";
  const cands = [
    b.beneficio && b.diferencial && `${cap1(b.beneficio)} e ${b.diferencial}. ${cap1(cta)} agora mesmo.`,
    b.beneficio && `${cap1(base)} com ${b.beneficio}. ${cap1(cta)} e receba um atendimento personalizado.`,
    b.diferencial && `${cap1(b.diferencial)}. Atendimento rápido e sem complicação. ${cap1(cta)}.`,
    b.cidade && `${cap1(base)} em ${b.cidade} com quem entende do assunto. ${cap1(cta)} hoje.`,
    b.marca && `${b.marca}: ${b.beneficio || "qualidade"} e confiança. ${cap1(cta)} e tire suas dúvidas.`,
    `Peça um orçamento sem compromisso. ${cap1(base)} com condições especiais para você.`,
  ];
  return dentroDoLimite(cands, LIM.descricao).slice(0, 4);
}

function gerarCallouts(b: Brief): string[] {
  const cands = [
    b.beneficio && cap1(b.beneficio),
    b.diferencial && cap1(b.diferencial),
    "Atendimento Rápido",
    "Orçamento Sem Compromisso",
    b.cidade && `Atende ${b.cidade}`,
    "Especialistas no Assunto",
    "Condições Especiais",
  ];
  return dentroDoLimite(cands, LIM.callout).slice(0, 6);
}

function gerarCaminho(b: Brief): [string, string] {
  const p1 = dentroDoLimite([b.keyword, b.produto], LIM.caminho)[0] || "";
  const p2 = dentroDoLimite([b.cidade, b.beneficio, "Oferta"], LIM.caminho)[0] || "";
  return [p1.replace(/\s+/g, "-"), p2.replace(/\s+/g, "-")];
}

// ── Sub-componentes ──────────────────────────────────────────────

function Counter({ value, limit }: { value: string; limit: number }) {
  const n = value.length;
  const cor = n === 0 ? "text-ink-400" : n > limit ? "text-bad-400" : n > limit - 4 ? "text-warn-400" : "text-ok-400";
  return (
    <span className={`mono shrink-0 text-[0.7rem] tabular-nums ${cor}`}>
      {n}/{limit}
    </span>
  );
}

/** Campo de texto editável com contador ao lado. */
function CampoContado({
  value,
  limit,
  onChange,
  onRemove,
  placeholder,
}: {
  value: string;
  limit: number;
  onChange: (v: string) => void;
  onRemove?: () => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={limit + 20}
        className={`input-base flex-1 text-sm ${value.length > limit ? "border-bad-500/70" : ""}`}
      />
      <Counter value={value} limit={limit} />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-ink-400 hover:text-bad-400"
          aria-label="Remover"
          title="Remover"
        >
          ✕
        </button>
      )}
    </div>
  );
}

/** Lista editável de campos (títulos, descrições, etc.). */
function ListaEditavel({
  titulo,
  dica,
  itens,
  limite,
  max,
  onChange,
  placeholder,
}: {
  titulo: string;
  dica: string;
  itens: string[];
  limite: number;
  max: number;
  onChange: (itens: string[]) => void;
  placeholder?: string;
}) {
  const set = (i: number, v: string) => onChange(itens.map((x, idx) => (idx === i ? v : x)));
  const remove = (i: number) => onChange(itens.filter((_, idx) => idx !== i));
  const add = () => onChange([...itens, ""]);
  const validos = itens.filter((x) => x.trim() && x.length <= limite).length;

  return (
    <section className="card-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-sm font-bold">{titulo}</h3>
        <span className="mono text-[0.7rem] text-ink-400">
          {validos} válido{validos === 1 ? "" : "s"} · máx. {max}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-ink-400">{dica}</p>
      <div className="mt-3 space-y-2">
        {itens.map((it, i) => (
          <CampoContado
            key={i}
            value={it}
            limit={limite}
            placeholder={placeholder}
            onChange={(v) => set(i, v)}
            onRemove={itens.length > 1 ? () => remove(i) : undefined}
          />
        ))}
      </div>
      {itens.length < max && (
        <button type="button" onClick={add} className="mt-2.5 text-xs font-semibold text-info-400 hover:text-info-300">
          + Adicionar
        </button>
      )}
    </section>
  );
}

// ── Componente principal ─────────────────────────────────────────

export function GoogleAdsTool() {
  const [brief, setBrief] = useState<Brief>({
    produto: "",
    keyword: "",
    cidade: "",
    beneficio: "",
    diferencial: "",
    marca: "",
    cta: "Fale conosco",
  });
  const [titulos, setTitulos] = useState<string[]>([]);
  const [descricoes, setDescricoes] = useState<string[]>([]);
  const [callouts, setCallouts] = useState<string[]>([]);
  const [caminho, setCaminho] = useState<[string, string]>(["", ""]);
  const [gerado, setGerado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaErro, setIaErro] = useState("");

  const set = (k: keyof Brief) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setBrief((b) => ({ ...b, [k]: e.target.value }));

  const podeGerar = brief.produto.trim().length >= 3 || brief.keyword.trim().length >= 3;

  const gerar = () => {
    setTitulos(gerarTitulos(brief));
    setDescricoes(gerarDescricoes(brief));
    setCallouts(gerarCallouts(brief));
    setCaminho(gerarCaminho(brief));
    setGerado(true);
    setCopiado(false);
  };

  /**
   * Gera os textos com IA via webhook do n8n (a chave da OpenAI fica no n8n).
   * Se a IA falhar, mostra aviso e o usuário pode usar o montador guiado normal.
   */
  const asArray = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);
  const gerarComIA = async () => {
    if (!podeGerar || iaLoading) return;
    setIaErro("");
    setIaLoading(true);
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 30000);
      const res = await fetch(IA_ANUNCIO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brief),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error("http");
      const data = await res.json();
      const tits = asArray(data.titulos).slice(0, 15);
      const descs = asArray(data.descricoes).slice(0, 4);
      if (data.erro || (!tits.length && !descs.length)) throw new Error("ia");
      setTitulos(tits.length ? tits : gerarTitulos(brief));
      setDescricoes(descs.length ? descs : gerarDescricoes(brief));
      setCallouts(asArray(data.callouts).slice(0, 6));
      setCaminho(gerarCaminho(brief));
      setGerado(true);
      setCopiado(false);
    } catch {
      setIaErro("A IA não respondeu agora. Tente de novo em instantes ou use o botão “Gerar anúncio”.");
    } finally {
      setIaLoading(false);
    }
  };

  // Checklist de boas práticas do Google (mín. de itens, palavra-chave nos títulos).
  const checklist = useMemo(() => {
    const t = titulos.filter((x) => x.trim() && x.length <= LIM.titulo);
    const d = descricoes.filter((x) => x.trim() && x.length <= LIM.descricao);
    const kw = (brief.keyword || brief.produto).trim().toLowerCase();
    const comKw = kw ? t.filter((x) => x.toLowerCase().includes(kw)).length : 0;
    return [
      { ok: t.length >= 5, txt: `Pelo menos 5 títulos (você tem ${t.length})` },
      { ok: t.length >= 8, txt: `Ideal: 8 a 15 títulos para o Google testar combinações (${t.length})` },
      { ok: d.length >= 2, txt: `Pelo menos 2 descrições (você tem ${d.length})` },
      { ok: !kw || comKw >= 2, txt: `A palavra-chave aparece em pelo menos 2 títulos (${comKw})` },
      { ok: callouts.filter((x) => x.trim() && x.length <= LIM.callout).length >= 2, txt: "2+ frases de destaque (callouts)" },
    ];
  }, [titulos, descricoes, callouts, brief.keyword, brief.produto]);

  const textoFinal = useMemo(() => {
    const t = titulos.filter((x) => x.trim());
    const d = descricoes.filter((x) => x.trim());
    const c = callouts.filter((x) => x.trim());
    const linhas: string[] = [];
    linhas.push("=== ANÚNCIO GOOGLE ADS (Rede de Pesquisa) ===\n");
    linhas.push("TÍTULOS (máx. 30 caracteres cada):");
    t.forEach((x, i) => linhas.push(`  ${i + 1}. ${x}`));
    linhas.push("\nDESCRIÇÕES (máx. 90 caracteres cada):");
    d.forEach((x, i) => linhas.push(`  ${i + 1}. ${x}`));
    if (caminho[0] || caminho[1]) linhas.push(`\nCAMINHO DE EXIBIÇÃO: /${caminho[0]}/${caminho[1]}`);
    if (c.length) {
      linhas.push("\nFRASES DE DESTAQUE (callouts):");
      c.forEach((x) => linhas.push(`  • ${x}`));
    }
    return linhas.join("\n");
  }, [titulos, descricoes, callouts, caminho]);

  const copiarTudo = async () => {
    try {
      await navigator.clipboard.writeText(textoFinal);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard indisponível — ignora */
    }
  };

  return (
    <div>
      {/* Introdução para leigo */}
      <div className="card-surface mb-5 p-4">
        <p className="text-sm leading-relaxed text-ink-300">
          <strong className="text-ink-100">Para que serve:</strong> monta um anúncio completo do Google Ads —
          os <strong>títulos</strong> e <strong>descrições</strong> que aparecem no topo da busca do Google. Você
          descreve o negócio abaixo e a ferramenta sugere tudo já dentro dos limites de caracteres do Google.
          Depois é só copiar e colar na sua conta do Google Ads. Você pode editar cada texto.
        </p>
      </div>

      {/* Briefing guiado */}
      <section className="card-surface p-5">
        <h2 className="font-display text-sm font-bold">1. Conte sobre o que você anuncia</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-ink-300">
            Produto ou serviço *
            <input type="text" value={brief.produto} onChange={set("produto")} placeholder="Ex.: Consórcio de imóveis" className="input-base mt-1 font-normal" />
          </label>
          <label className="text-xs font-semibold text-ink-300">
            Palavra-chave principal
            <input type="text" value={brief.keyword} onChange={set("keyword")} placeholder="Ex.: consórcio imóvel" className="input-base mt-1 font-normal" />
          </label>
          <label className="text-xs font-semibold text-ink-300">
            Cidade / região <span className="text-ink-400">(opcional)</span>
            <input type="text" value={brief.cidade} onChange={set("cidade")} placeholder="Ex.: Porto Alegre" className="input-base mt-1 font-normal" />
          </label>
          <label className="text-xs font-semibold text-ink-300">
            Marca / empresa <span className="text-ink-400">(opcional)</span>
            <input type="text" value={brief.marca} onChange={set("marca")} placeholder="Ex.: Consig Invest" className="input-base mt-1 font-normal" />
          </label>
          <label className="text-xs font-semibold text-ink-300">
            Principal benefício
            <input type="text" value={brief.beneficio} onChange={set("beneficio")} placeholder="Ex.: Sem juros" className="input-base mt-1 font-normal" />
          </label>
          <label className="text-xs font-semibold text-ink-300">
            Diferencial
            <input type="text" value={brief.diferencial} onChange={set("diferencial")} placeholder="Ex.: Aprovação em 24h" className="input-base mt-1 font-normal" />
          </label>
          <label className="text-xs font-semibold text-ink-300 sm:col-span-2">
            Chamada para ação (CTA)
            <select value={brief.cta} onChange={set("cta")} className="input-base mt-1 font-normal">
              {CTAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={gerar} disabled={!podeGerar} className="btn-primary">
            {gerado ? "🔄 Gerar de novo" : "✨ Gerar anúncio"}
          </button>
          <button
            type="button"
            onClick={gerarComIA}
            disabled={!podeGerar || iaLoading}
            title="Gera os textos com inteligência artificial"
            className="btn-ghost disabled:cursor-not-allowed disabled:opacity-60"
          >
            {iaLoading ? "🤖 Gerando…" : "🤖 Gerar com IA"}
          </button>
          {!podeGerar && <span className="text-xs text-ink-400">Preencha ao menos o produto ou a palavra-chave.</span>}
        </div>
        {iaErro && (
          <p className="mt-3 rounded-lg border border-warn-500/50 bg-warn-500/10 p-2.5 text-xs text-warn-400" role="alert">
            ⚠️ {iaErro}
          </p>
        )}
      </section>

      {gerado && (
        <div className="mt-5 space-y-4">
          <p className="text-xs text-ink-400">
            2. Revise e ajuste. O contador fica <span className="text-ok-400">verde</span> quando está dentro do limite e{" "}
            <span className="text-bad-400">vermelho</span> quando passou.
          </p>

          <ListaEditavel
            titulo="Títulos"
            dica="Aparecem no topo do anúncio. O Google combina vários automaticamente — quanto mais, melhor."
            itens={titulos}
            limite={LIM.titulo}
            max={15}
            onChange={setTitulos}
            placeholder="Título do anúncio"
          />
          <ListaEditavel
            titulo="Descrições"
            dica="As linhas de texto abaixo dos títulos. Reforce benefício + chamada para ação."
            itens={descricoes}
            limite={LIM.descricao}
            max={4}
            onChange={setDescricoes}
            placeholder="Descrição do anúncio"
          />
          <ListaEditavel
            titulo="Frases de destaque (callouts)"
            dica="Pequenos textos extras que reforçam vantagens (ex.: 'Atendimento rápido')."
            itens={callouts}
            limite={LIM.callout}
            max={6}
            onChange={setCallouts}
            placeholder="Frase de destaque"
          />

          <section className="card-surface p-4">
            <h3 className="font-display text-sm font-bold">Caminho de exibição</h3>
            <p className="mt-0.5 text-xs text-ink-400">
              O endereço “bonito” que aparece no anúncio: <span className="mono">seusite.com.br/{caminho[0] || "caminho1"}/{caminho[1] || "caminho2"}</span>
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <CampoContado value={caminho[0]} limit={LIM.caminho} onChange={(v) => setCaminho([v, caminho[1]])} placeholder="Ex.: Consorcio" />
              <CampoContado value={caminho[1]} limit={LIM.caminho} onChange={(v) => setCaminho([caminho[0], v])} placeholder="Ex.: Imoveis" />
            </div>
          </section>

          {/* Checklist boas práticas */}
          <section className="rounded-xl border border-info-500/25 bg-info-500/[0.06] p-4">
            <h3 className="font-display text-sm font-bold text-info-300">✅ Boas práticas do Google</h3>
            <ul className="mt-2.5 space-y-1.5">
              {checklist.map((c) => (
                <li key={c.txt} className={`flex items-start gap-2 text-xs ${c.ok ? "text-ink-300" : "text-warn-400"}`}>
                  <span className="shrink-0">{c.ok ? "✓" : "○"}</span>
                  <span>{c.txt}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Saída */}
          <section className="card-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-sm font-bold">Anúncio pronto para copiar</h3>
              <button type="button" onClick={copiarTudo} className="btn-ghost">
                {copiado ? "✓ Copiado!" : "📋 Copiar tudo"}
              </button>
            </div>
            <pre className="mono mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-navy-900 p-3 text-[0.72rem] leading-relaxed text-ink-300">
              {textoFinal}
            </pre>
          </section>

          <a
            href={waLink("Olá! Montei um anúncio no gerador do Hub da Consig Invest e quero ajuda para colocar minha campanha no ar.")}
            target="_blank"
            rel="noopener"
            className="btn-primary"
          >
            💬 Quero ajuda para publicar essa campanha
          </a>
        </div>
      )}
    </div>
  );
}
