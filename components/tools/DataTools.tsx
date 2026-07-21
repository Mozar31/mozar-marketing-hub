"use client";

import { useState } from "react";
import { loadScript, loadImageFile, canvasToBlob, baseName } from "@/lib/tools/runtime";
import { LIB } from "@/lib/config";

/* ════════════════════════════════════════════════════════════
   Limpador de listas e contatos (P0)
   ════════════════════════════════════════════════════════════ */

interface CleanReport {
  total: number;
  duplicados: number;
  telefonesCorrigidos: number;
  emailsInvalidos: number;
  restantes: number;
}

const normalizePhone = (raw: string): string | null => {
  const d = String(raw).replace(/\D/g, "");
  if (!d) return null;
  let n = d;
  if (n.startsWith("0")) n = n.replace(/^0+/, "");
  if (n.length === 13 && n.startsWith("55")) n = n.slice(2);
  if (n.length === 12 && n.startsWith("55")) n = n.slice(2);
  if (n.length === 10) {
    // fixo ou celular antigo sem o 9
    const ddd = n.slice(0, 2);
    const rest = n.slice(2);
    if (/^[6-9]/.test(rest)) n = ddd + "9" + rest;
  }
  if (n.length !== 10 && n.length !== 11) return null;
  return "55" + n;
};

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(s).trim());

export function ContactCleaner() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CleanReport | null>(null);
  const [download, setDownload] = useState<{ url: string; name: string } | null>(null);
  const [dragging, setDragging] = useState(false);

  const process = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setError(null);
    setReport(null);
    setDownload(null);
    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
      setError("Escolha um arquivo .csv, .xlsx ou .xls com sua lista de contatos.");
      return;
    }
    try {
      setStatus("Carregando leitor de planilhas…");
      await loadScript(LIB.xlsx);
      setStatus("Lendo lista…");
      const XLSX = (window as unknown as { XLSX: any }).XLSX; // eslint-disable-line @typescript-eslint/no-explicit-any
      let rows: Record<string, unknown>[];
      if (/\.csv$/i.test(file.name)) {
        const text = await file.text();
        const wb = XLSX.read(text, { type: "string", FS: text.includes(";") ? ";" : "," });
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      } else {
        const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      }
      if (!rows.length) throw new Error("A lista está vazia ou não tem cabeçalho na primeira linha.");

      setStatus("Limpando contatos…");
      const cols = Object.keys(rows[0]!);
      const phoneCol = cols.find((c) => /telefone|celular|whats|fone|phone|contato/i.test(c));
      const emailCol = cols.find((c) => /e-?mail/i.test(c));

      const seen = new Set<string>();
      let duplicados = 0, telefonesCorrigidos = 0, emailsInvalidos = 0;
      const out: Record<string, unknown>[] = [];

      for (const row of rows) {
        const copy = { ...row };
        if (phoneCol) {
          const original = String(row[phoneCol] ?? "");
          const norm = normalizePhone(original);
          if (norm) {
            if (norm !== original.replace(/\D/g, "")) telefonesCorrigidos++;
            copy[phoneCol] = norm;
          }
        }
        if (emailCol) {
          const em = String(row[emailCol] ?? "").trim();
          if (em && !isEmail(em)) {
            emailsInvalidos++;
            copy[emailCol] = "";
          } else {
            copy[emailCol] = em.toLowerCase();
          }
        }
        const key = [
          phoneCol ? String(copy[phoneCol] ?? "") : "",
          emailCol ? String(copy[emailCol] ?? "") : "",
        ].join("|");
        if (key !== "|" && seen.has(key)) {
          duplicados++;
          continue;
        }
        if (key !== "|") seen.add(key);
        out.push(copy);
      }

      const ws = XLSX.utils.json_to_sheet(out);
      const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";" });
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
      setDownload({ url: URL.createObjectURL(blob), name: baseName(file.name) + "-limpa.csv" });
      setReport({ total: rows.length, duplicados, telefonesCorrigidos, emailsInvalidos, restantes: out.length });
      setStatus(null);
    } catch (e) {
      setStatus(null);
      setError((e as Error).message || "Não foi possível processar esta lista.");
    }
  };

  return (
    <div>
      <p className="mb-4 text-sm text-ink-400">
        Envie sua lista em CSV ou Excel. A ferramenta remove contatos repetidos, padroniza telefones
        no formato brasileiro (55 + DDD + número, com o 9 quando falta) e limpa e-mails inválidos.
        A primeira linha deve conter os nomes das colunas.
      </p>

      <div
        role="button" tabIndex={0}
        onClick={() => document.getElementById("cleaner-input")?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); document.getElementById("cleaner-input")?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) void process([...e.dataTransfer.files]); }}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${
          dragging ? "border-info-400 bg-info-500/10" : "border-info-500/35 bg-info-500/[0.04] hover:border-info-400"
        }`}
      >
        <p className="text-sm font-semibold text-ink-200">Arraste a lista (.csv, .xlsx) aqui</p>
        <p className="mt-1 text-xs text-ink-400">Seus contatos ficam no seu computador</p>
        <input
          id="cleaner-input" type="file" hidden accept=".csv,.xlsx,.xls"
          onChange={(e) => { if (e.target.files?.length) void process([...e.target.files]); }}
        />
      </div>

      {status && (
        <p className="mono mt-4 text-sm text-info-400" role="status" aria-live="polite">{status}</p>
      )}
      {error && (
        <p className="mt-4 rounded-lg border border-warn-500/50 bg-warn-500/10 p-3 text-sm text-warn-400" role="alert">⚠️ {error}</p>
      )}

      {report && download && (
        <div className="card-surface mt-5 border-ok-500/30 p-5">
          <p className="font-display text-sm font-bold text-ok-400">✅ Lista limpa</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            <Stat label="Contatos originais" value={report.total} />
            <Stat label="Duplicados removidos" value={report.duplicados} />
            <Stat label="Telefones padronizados" value={report.telefonesCorrigidos} />
            <Stat label="E-mails inválidos limpos" value={report.emailsInvalidos} />
            <Stat label="Contatos na lista final" value={report.restantes} highlight />
          </ul>
          <a href={download.url} download={download.name} className="btn-primary mt-4 text-sm">
            ⬇️ Baixar lista limpa (.csv)
          </a>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <li className={`rounded-lg border border-white/10 p-3 ${highlight ? "border-info-500/40 bg-info-500/[0.06]" : ""}`}>
      <p className="text-[0.66rem] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mono mt-0.5 text-lg font-bold">{value}</p>
    </li>
  );
}

/* ════════════════════════════════════════════════════════════
   Presets de criativos (P0)
   ════════════════════════════════════════════════════════════ */

const PRESETS = [
  { group: "Instagram", items: [
    { id: "ig-feed", label: "Feed quadrado", w: 1080, h: 1080 },
    { id: "ig-retrato", label: "Feed retrato", w: 1080, h: 1350 },
    { id: "ig-stories", label: "Stories / Reels", w: 1080, h: 1920 },
  ]},
  { group: "Facebook", items: [
    { id: "fb-feed", label: "Feed", w: 1200, h: 630 },
    { id: "fb-capa", label: "Capa da página", w: 1640, h: 664 },
  ]},
  { group: "LinkedIn", items: [
    { id: "li-post", label: "Post", w: 1200, h: 627 },
    { id: "li-capa", label: "Capa da empresa", w: 1128, h: 191 },
  ]},
  { group: "YouTube", items: [
    { id: "yt-thumb", label: "Thumbnail", w: 1280, h: 720 },
  ]},
  { group: "Google Ads", items: [
    { id: "ga-quad", label: "Quadrado", w: 1200, h: 1200 },
    { id: "ga-paisagem", label: "Paisagem", w: 1200, h: 628 },
  ]},
];

export function CreativePresets() {
  const [selected, setSelected] = useState<string[]>(["ig-feed", "ig-stories"]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ url: string; name: string; label: string }[]>([]);
  const [dragging, setDragging] = useState(false);

  const all = PRESETS.flatMap((g) => g.items);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const process = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setError(null);
    setResults([]);
    if (!selected.length) {
      setError("Escolha pelo menos um formato antes de enviar a imagem.");
      return;
    }
    try {
      setStatus("Carregando imagem…");
      const img = await loadImageFile(file);
      const out: { url: string; name: string; label: string }[] = [];
      for (const id of selected) {
        const preset = all.find((p) => p.id === id);
        if (!preset) continue;
        setStatus(`Gerando ${preset.label} (${preset.w}×${preset.h})…`);
        const canvas = document.createElement("canvas");
        canvas.width = preset.w;
        canvas.height = preset.h;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, preset.w, preset.h);
        // cover: preenche o quadro cortando o excedente, sem distorcer
        const scale = Math.max(preset.w / img.naturalWidth, preset.h / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, (preset.w - w) / 2, (preset.h - h) / 2, w, h);
        const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
        out.push({
          url: URL.createObjectURL(blob),
          name: `${baseName(file.name)}-${preset.w}x${preset.h}.jpg`,
          label: `${preset.label} · ${preset.w}×${preset.h}`,
        });
      }
      setResults(out);
      setStatus(null);
    } catch (e) {
      setStatus(null);
      setError((e as Error).message || "Não foi possível processar esta imagem.");
    }
  };

  return (
    <div>
      <p className="mb-4 text-sm text-ink-400">
        Escolha os formatos e envie uma imagem: ela é recortada centralizada (sem distorcer) no
        tamanho exato de cada rede.
      </p>

      <div className="card-surface mb-4 space-y-3 p-5">
        {PRESETS.map((g) => (
          <div key={g.group}>
            <p className="mb-1.5 text-xs font-semibold text-ink-300">{g.group}</p>
            <div className="flex flex-wrap gap-2">
              {g.items.map((p) => (
                <button
                  key={p.id} type="button" onClick={() => toggle(p.id)}
                  aria-pressed={selected.includes(p.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    selected.includes(p.id)
                      ? "border-action-500 bg-action-500/20 text-ink-100"
                      : "border-white/15 text-ink-300 hover:border-info-500/50"
                  }`}
                >
                  {p.label} <span className="mono text-[0.65rem] opacity-70">{p.w}×{p.h}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <p className="mono text-[0.7rem] text-info-400">{selected.length} formato(s) selecionado(s)</p>
      </div>

      <div
        role="button" tabIndex={0}
        onClick={() => document.getElementById("preset-input")?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); document.getElementById("preset-input")?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) void process([...e.dataTransfer.files]); }}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${
          dragging ? "border-info-400 bg-info-500/10" : "border-info-500/35 bg-info-500/[0.04] hover:border-info-400"
        }`}
      >
        <p className="text-sm font-semibold text-ink-200">Arraste a imagem aqui</p>
        <p className="mt-1 text-xs text-ink-400">Suas imagens ficam no seu computador</p>
        <input
          id="preset-input" type="file" hidden accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          onChange={(e) => { if (e.target.files?.length) void process([...e.target.files]); }}
        />
      </div>

      {status && <p className="mono mt-4 text-sm text-info-400" role="status" aria-live="polite">{status}</p>}
      {error && <p className="mt-4 rounded-lg border border-warn-500/50 bg-warn-500/10 p-3 text-sm text-warn-400" role="alert">⚠️ {error}</p>}

      {results.length > 0 && (
        <div className="card-surface mt-5 border-ok-500/30 p-5">
          <p className="font-display text-sm font-bold text-ok-400">✅ {results.length} imagem(ns) gerada(s)</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <div key={r.url} className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.url} alt={r.label} className="mx-auto max-h-40 rounded-lg bg-white" />
                <p className="mt-2 text-[0.7rem] text-ink-400">{r.label}</p>
                <a href={r.url} download={r.name} className="btn-ghost mt-2 w-full text-xs">⬇️ Baixar</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
