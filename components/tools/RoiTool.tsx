"use client";

import { useMemo, useState } from "react";
import { fmtBRL, fmtNum, fmtDec } from "@/lib/tools/runtime";

/**
 * Simulador de ROI e ROAS 2.0 — §23.
 * PROMPT 06: "Não mude fórmula do ROI sem memória de cálculo e testes."
 * As fórmulas da v1 foram mantidas e agora ficam VISÍVEIS para o usuário.
 */

type Plat = "google" | "meta";

export function RoiTool() {
  const [plat, setPlat] = useState<Plat>("google");

  const [invest, setInvest] = useState("3000");
  const [cpc, setCpc] = useState("2.50");
  const [cpm, setCpm] = useState("25");
  const [ctr, setCtr] = useState("1.5");
  const [conv, setConv] = useState("5");
  const [close, setClose] = useState("30");
  const [ticket, setTicket] = useState("500");
  const [margem, setMargem] = useState("100");

  const n = (v: string) => {
    const x = parseFloat(v.replace(",", "."));
    return Number.isFinite(x) ? x : 0;
  };

  const r = useMemo(() => {
    const investimento = n(invest);
    const taxaConv = n(conv) / 100;
    const taxaFech = n(close) / 100;
    const tk = n(ticket);
    const mg = n(margem) / 100;

    let impressoes = 0;
    let cliques = 0;
    if (plat === "google") {
      cliques = n(cpc) > 0 ? investimento / n(cpc) : 0;
    } else {
      impressoes = n(cpm) > 0 ? (investimento / n(cpm)) * 1000 : 0;
      cliques = impressoes * (n(ctr) / 100);
    }
    const leads = cliques * taxaConv;
    const vendas = leads * taxaFech;
    const receita = vendas * tk;
    const cpa = vendas > 0 ? investimento / vendas : 0;
    const cpl = leads > 0 ? investimento / leads : 0;
    const roas = investimento > 0 ? receita / investimento : 0;
    const lucroBruto = receita * mg;
    const resultado = lucroBruto - investimento;

    return { investimento, impressoes, cliques, leads, vendas, receita, cpa, cpl, roas, lucroBruto, resultado, mg };
  }, [plat, invest, cpc, cpm, ctr, conv, close, ticket, margem]);

  const roasColor = r.roas >= 3 ? "text-ok-400" : r.roas >= 1.5 ? "text-warn-400" : "text-bad-400";
  const resColor = r.resultado > 0 ? "text-ok-400" : "text-bad-400";

  return (
    <div>
      {/* Seletor de plataforma */}
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Plataforma de anúncios">
        {(["google", "meta"] as Plat[]).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={plat === p}
            onClick={() => setPlat(p)}
            className={`rounded-full border px-5 py-2 font-display text-sm font-semibold transition ${
              plat === p
                ? "border-action-500 bg-action-500 text-white"
                : "border-white/15 bg-navy-700 text-ink-300 hover:border-info-500/50"
            }`}
          >
            {p === "google" ? "Google Ads" : "Meta Ads (Facebook/Instagram)"}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-ink-400">
        {plat === "google"
          ? "No Google Ads você paga por clique (CPC) — o cliente já está procurando pelo seu serviço."
          : "No Meta Ads você paga por mil impressões (CPM) — o anúncio desperta interesse de quem ainda não conhece você."}
      </p>

      {/* Entradas */}
      <div className="card-surface grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Investimento mensal (R$)" value={invest} onChange={setInvest} />
        {plat === "google" ? (
          <Field label="CPC médio (R$)" value={cpc} onChange={setCpc} hint="Custo por clique" />
        ) : (
          <>
            <Field label="CPM médio (R$)" value={cpm} onChange={setCpm} hint="Custo por mil impressões" />
            <Field label="CTR (%)" value={ctr} onChange={setCtr} hint="Taxa de clique" />
          </>
        )}
        <Field label="Conversão do site (%)" value={conv} onChange={setConv} hint="Visitantes que viram leads" />
        <Field label="Taxa de fechamento (%)" value={close} onChange={setClose} hint="Leads que viram vendas" />
        <Field label="Ticket médio (R$)" value={ticket} onChange={setTicket} />
        <Field label="Margem de lucro (%)" value={margem} onChange={setMargem} hint="Quanto sobra do ticket" />
      </div>

      {/* Resultados */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {plat === "meta" && <Metric label="Impressões / mês" value={fmtNum.format(Math.round(r.impressoes))} />}
        <Metric label="Cliques / mês" value={fmtNum.format(Math.round(r.cliques))} />
        <Metric label="Leads / mês" value={fmtNum.format(Math.round(r.leads))} />
        <Metric label="Vendas / mês" value={fmtNum.format(Math.round(r.vendas))} />
        <Metric label="Custo por lead" value={fmtBRL.format(r.cpl)} />
        <Metric label="Custo por venda (CPA)" value={fmtBRL.format(r.cpa)} />
        <Metric label="Faturamento projetado" value={fmtBRL.format(r.receita)} highlight />
        <Metric label="ROAS" value={fmtDec.format(r.roas) + "x"} valueClass={roasColor} highlight />
        <Metric label="Resultado (lucro − investimento)" value={fmtBRL.format(r.resultado)} valueClass={resColor} highlight />
      </div>

      {/* Memória de cálculo — exigida pela especificação */}
      <details className="card-surface mt-5 p-5">
        <summary className="cursor-pointer font-display text-sm font-bold text-info-400">
          Ver memória de cálculo (como cada número foi obtido)
        </summary>
        <ul className="mono mt-3 space-y-1.5 text-[0.72rem] leading-relaxed text-ink-300">
          {plat === "google" ? (
            <li>cliques = investimento ÷ CPC = {fmtBRL.format(r.investimento)} ÷ {fmtBRL.format(n(cpc))} = {fmtNum.format(Math.round(r.cliques))}</li>
          ) : (
            <>
              <li>impressões = (investimento ÷ CPM) × 1000 = {fmtNum.format(Math.round(r.impressoes))}</li>
              <li>cliques = impressões × CTR = {fmtNum.format(Math.round(r.impressoes))} × {n(ctr)}% = {fmtNum.format(Math.round(r.cliques))}</li>
            </>
          )}
          <li>leads = cliques × conversão = {fmtNum.format(Math.round(r.cliques))} × {n(conv)}% = {fmtNum.format(Math.round(r.leads))}</li>
          <li>vendas = leads × fechamento = {fmtNum.format(Math.round(r.leads))} × {n(close)}% = {fmtNum.format(Math.round(r.vendas))}</li>
          <li>faturamento = vendas × ticket = {fmtNum.format(Math.round(r.vendas))} × {fmtBRL.format(n(ticket))} = {fmtBRL.format(r.receita)}</li>
          <li>CPA = investimento ÷ vendas = {fmtBRL.format(r.cpa)}</li>
          <li>ROAS = faturamento ÷ investimento = {fmtDec.format(r.roas)}x</li>
          <li>lucro bruto = faturamento × margem = {fmtBRL.format(r.lucroBruto)}</li>
          <li>resultado = lucro bruto − investimento = {fmtBRL.format(r.resultado)}</li>
        </ul>
      </details>

      <p className="mt-4 text-xs leading-relaxed text-ink-400">
        Projeção baseada nos números que você informou. Não é previsão de resultado: o desempenho real
        depende de segmentação, criativos, concorrência e da qualidade da página de destino. Use como
        cenário de planejamento, não como promessa.
      </p>
    </div>
  );
}

function Field({
  label, value, onChange, hint,
}: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-300">
      {label}
      <input
        type="number"
        step="any"
        min="0"
        className="input-base mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <span className="font-normal text-[0.7rem] text-ink-400">{hint}</span>}
    </label>
  );
}

function Metric({
  label, value, valueClass, highlight,
}: { label: string; value: string; valueClass?: string; highlight?: boolean }) {
  return (
    <div className={`card-surface p-4 ${highlight ? "border-info-500/40 bg-info-500/[0.05]" : ""}`}>
      <p className="text-[0.66rem] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className={`mono mt-1 text-lg font-bold ${valueClass ?? ""}`}>{value}</p>
    </div>
  );
}
