"use client";

import { useMemo, useState } from "react";

/**
 * Gerador de título e descrição para o Google (SEO). Ferramenta LOCAL: monta
 * opções de <title> (até ~60 caracteres) e meta description (até ~155) a partir
 * do que a pessoa oferece + marca + cidade + diferencial, com contador de
 * caracteres e prévia de como fica no resultado de busca. Nada sai do navegador.
 */

const LIM_TITULO = 60;
const LIM_DESC = 155;

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function gerarTitulos(oferta: string, marca: string, cidade: string, dif: string): string[] {
  const o = cap(oferta);
  const cands = [
    cidade && `${o} em ${cidade} | ${marca}`,
    dif && `${o} ${dif} | ${marca}`,
    `${o} | ${marca}`,
    `${marca} — ${o}`,
    cidade && dif && `${o} em ${cidade} ${dif}`,
  ].filter(Boolean) as string[];
  return [...new Set(cands)];
}

function gerarDescricoes(oferta: string, marca: string, cidade: string, dif: string): string[] {
  const o = oferta.toLowerCase();
  const local = cidade ? ` em ${cidade}` : "";
  const difFrase = dif ? ` ${dif}` : "";
  const cands = [
    `${cap(o)}${difFrase}${local}. A ${marca} cuida de tudo: estratégia, execução e resultado. Fale com um especialista e peça seu orçamento.`,
    `Precisa de ${o}${local}? A ${marca} entrega${dif ? ` ${dif}` : " com método claro e sem enrolação"}. Solicite uma proposta agora pelo WhatsApp.`,
    `${cap(o)} com quem entende${local}: ${marca}. Atendimento rápido e foco em gerar clientes${difFrase}. Comece hoje mesmo.`,
  ];
  return [...new Set(cands)].filter((s) => s.length >= 60);
}

function Contador({ texto, limite }: { texto: string; limite: number }) {
  const n = texto.length;
  const cor = n > limite ? "text-bad-400" : n > limite * 0.85 ? "text-warn-400" : "text-ok-400";
  return <span className={`mono text-[0.68rem] ${cor}`}>{n}/{limite}{n > limite ? " (o Google vai cortar)" : ""}</span>;
}

function Opcao({ texto, limite }: { texto: string; limite: number }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 1500); } catch { /* ignore */ }
  };
  return (
    <li className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-ink-100">{texto}</p>
        <button type="button" onClick={copiar} className="shrink-0 rounded-md border border-white/15 px-2 py-1 text-[0.7rem] font-semibold text-info-400 hover:border-info-500/50">
          {copiado ? "✓ copiado" : "copiar"}
        </button>
      </div>
      <div className="mt-1.5"><Contador texto={texto} limite={limite} /></div>
    </li>
  );
}

export function GeradorSeo() {
  const [oferta, setOferta] = useState("");
  const [marca, setMarca] = useState("");
  const [cidade, setCidade] = useState("");
  const [dif, setDif] = useState("");

  const pronto = oferta.trim().length >= 3 && marca.trim().length >= 2;

  const titulos = useMemo(() => (pronto ? gerarTitulos(oferta.trim(), marca.trim(), cidade.trim(), dif.trim()) : []), [oferta, marca, cidade, dif, pronto]);
  const descricoes = useMemo(() => (pronto ? gerarDescricoes(oferta.trim(), marca.trim(), cidade.trim(), dif.trim()) : []), [oferta, marca, cidade, dif, pronto]);

  const previaTitulo = titulos.find((t) => t.length <= LIM_TITULO) || titulos[0] || "";
  const previaDesc = descricoes.find((t) => t.length <= LIM_DESC) || descricoes[0] || "";

  return (
    <div>
      <div className="card-surface mb-5 p-4">
        <p className="text-sm leading-relaxed text-ink-300">
          <strong className="text-ink-100">Para que serve:</strong> preencha o que a página oferece e a gente
          monta <strong>opções de título e descrição</strong> prontas pro Google — já no tamanho certo, com
          contador e prévia de como aparece na busca. Copie a que gostar. <strong>Tudo no seu navegador.</strong>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-300">O que a página oferece <span className="text-bad-400">*</span></span>
          <input type="text" value={oferta} onChange={(e) => setOferta(e.target.value)} placeholder="Ex.: gestão de tráfego pago" className="input-base w-full" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-300">Nome da empresa/marca <span className="text-bad-400">*</span></span>
          <input type="text" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ex.: Consig Invest" className="input-base w-full" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-300">Cidade <span className="text-ink-400">(opcional)</span></span>
          <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex.: Porto Alegre" className="input-base w-full" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-300">Diferencial <span className="text-ink-400">(opcional)</span></span>
          <input type="text" value={dif} onChange={(e) => setDif(e.target.value)} placeholder="Ex.: com previsibilidade" className="input-base w-full" />
        </label>
      </div>

      {!pronto && (
        <p className="mt-4 text-sm text-ink-400">Preencha pelo menos <strong>o que a página oferece</strong> e o <strong>nome da empresa</strong> para gerar as opções.</p>
      )}

      {pronto && (
        <div className="mt-6 space-y-6">
          {/* Prévia no Google */}
          <div className="rounded-xl border border-white/10 bg-white p-4">
            <p className="mb-2 text-[0.62rem] font-semibold uppercase tracking-wide text-slate-400">Prévia no Google</p>
            <p className="truncate text-[0.78rem] text-[#202124]">{marca.trim().toLowerCase().replace(/\s+/g, "")}.com.br › ...</p>
            <p className="text-[1.05rem] leading-tight text-[#1a0dab]">{previaTitulo}</p>
            <p className="mt-0.5 text-[0.82rem] leading-snug text-[#4d5156]">{previaDesc}</p>
          </div>

          <section>
            <h3 className="mb-2 font-display text-sm font-bold text-info-400">Opções de título</h3>
            <ul className="space-y-2">
              {titulos.map((t) => <Opcao key={t} texto={t} limite={LIM_TITULO} />)}
            </ul>
          </section>

          <section>
            <h3 className="mb-2 font-display text-sm font-bold text-info-400">Opções de descrição</h3>
            <ul className="space-y-2">
              {descricoes.map((d) => <Opcao key={d} texto={d} limite={LIM_DESC} />)}
            </ul>
          </section>
        </div>
      )}

      <p className="mt-6 border-t border-white/10 pt-4 text-[0.72rem] leading-relaxed text-ink-400">
        As opções são um ponto de partida — revise para ficar natural e verdadeiro. Título ideal até ~60
        caracteres e descrição até ~155, senão o Google corta o final.
      </p>
    </div>
  );
}
