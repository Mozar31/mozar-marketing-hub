"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getFileTool, type Opts } from "@/lib/tools/converters";
import type { ToolOutput } from "@/lib/tools/runtime";
import { ResultPanel } from "./ResultPanel";

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

/** Comparativo antes/depois para ferramentas de imagem (1 entra, 1 sai). */
function ImageBeforeAfter({ original, resultBlob }: { original: File; resultBlob: Blob }) {
  const [urls, setUrls] = useState<{ o: string; r: string } | null>(null);
  const [dim, setDim] = useState<{ o: string; r: string }>({ o: "…", r: "…" });

  useEffect(() => {
    const o = URL.createObjectURL(original);
    const r = URL.createObjectURL(resultBlob);
    setUrls({ o, r });
    const medir = (url: string, key: "o" | "r") => {
      const img = new Image();
      img.onload = () => setDim((d) => ({ ...d, [key]: `${img.naturalWidth}×${img.naturalHeight}` }));
      img.src = url;
    };
    medir(o, "o");
    medir(r, "r");
    return () => { URL.revokeObjectURL(o); URL.revokeObjectURL(r); };
  }, [original, resultBlob]);

  const oBytes = original.size;
  const rBytes = resultBlob.size;
  const pct = oBytes > 0 ? Math.round((1 - rBytes / oBytes) * 100) : 0;

  return (
    <div className="card-surface mt-5 p-5">
      <p className="font-display text-sm font-bold">Antes e depois</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <figure className="min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {urls && <img src={urls.o} alt="Imagem original" className="max-h-56 w-full rounded-lg bg-white object-contain p-2" />}
          <figcaption className="mt-1.5 text-xs text-ink-400">
            <span className="font-semibold text-ink-300">Antes</span> · {dim.o} · {fmtBytes(oBytes)}
          </figcaption>
        </figure>
        <figure className="min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {urls && <img src={urls.r} alt="Imagem depois" className="max-h-56 w-full rounded-lg bg-white object-contain p-2" />}
          <figcaption className="mt-1.5 text-xs text-ink-400">
            <span className="font-semibold text-ink-300">Depois</span> · {dim.r} · {fmtBytes(rBytes)}
          </figcaption>
        </figure>
      </div>
      {pct > 0 ? (
        <p className="mt-3 text-sm font-semibold text-ok-400">↓ {pct}% mais leve ({fmtBytes(oBytes - rBytes)} economizados)</p>
      ) : pct < 0 ? (
        <p className="mt-3 text-sm text-ink-400">Ficou {-pct}% maior — normal quando muda de formato ou aumenta a qualidade.</p>
      ) : null}
    </div>
  );
}

/**
 * Casca genérica das ferramentas que recebem arquivo.
 * Estados obrigatórios (§6): vazio, carregando, erro com motivo e retry, resultado.
 */
export function FileTool({ slug }: { slug: string }) {
  const def = getFileTool(slug);
  const [opts, setOpts] = useState<Opts>(() => {
    const initial: Opts = {};
    def?.fields?.forEach((f) => {
      if (f.default !== undefined) initial[f.id] = f.default;
    });
    return initial;
  });
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ToolOutput | null>(null);
  const [dragging, setDragging] = useState(false);
  const [lastFiles, setLastFiles] = useState<File[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const process = useCallback(
    async (files: File[]) => {
      if (!def || !files.length) return;
      setLastFiles(files);
      setError(null);
      setResult(null);
      setStatus("Preparando…");
      try {
        const out = await def.run(files, opts, (m) => setStatus(m));
        setResult(out);
        setStatus(null);
      } catch (err) {
        setStatus(null);
        const e = err as Error & { name?: string };
        if (e?.name === "PasswordException") setError("Este PDF está protegido por senha. Remova a senha e tente novamente.");
        else if (e?.name === "InvalidPDFException") setError("Este arquivo está corrompido ou não é um PDF válido.");
        else setError(e?.message || "Não foi possível processar este arquivo. Tente outro.");
      }
    },
    [def, opts]
  );

  if (!def) return null;

  return (
    <div>
      {/* Opções */}
      {def.fields && def.fields.length > 0 && (
        <div className="card-surface mb-4 flex flex-wrap gap-4 p-4">
          {def.fields.map((f) => (
            <label key={f.id} className="flex min-w-[10rem] flex-1 flex-col gap-1.5 text-xs font-semibold text-ink-300">
              {f.label}
              {f.type === "select" ? (
                <select
                  className="input-base"
                  value={opts[f.id] ?? f.default ?? ""}
                  onChange={(e) => setOpts((o) => ({ ...o, [f.id]: e.target.value }))}
                >
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : f.type === "range" ? (
                <span className="flex items-center gap-3">
                  <input
                    type="range"
                    min={f.min}
                    max={f.max}
                    value={opts[f.id] ?? f.default ?? "70"}
                    onChange={(e) => setOpts((o) => ({ ...o, [f.id]: e.target.value }))}
                    className="flex-1 accent-info-500"
                  />
                  <span className="mono w-12 text-right text-info-400">{opts[f.id] ?? f.default}%</span>
                </span>
              ) : (
                <input
                  type={f.type}
                  className="input-base"
                  placeholder={f.placeholder}
                  min={f.min}
                  max={f.max}
                  value={opts[f.id] ?? ""}
                  onChange={(e) => setOpts((o) => ({ ...o, [f.id]: e.target.value }))}
                />
              )}
              {f.hint && <span className="font-normal text-[0.7rem] text-ink-400">{f.hint}</span>}
            </label>
          ))}
        </div>
      )}

      {/* Zona de arquivo */}
      <div
        role="button"
        tabIndex={0}
        aria-label={def.dropText}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) void process([...e.dataTransfer.files]);
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${
          dragging ? "border-info-400 bg-info-500/10" : "border-info-500/35 bg-info-500/[0.04] hover:border-info-400 hover:bg-info-500/[0.08]"
        }`}
      >
        <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-info-400" aria-hidden="true">
          <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        </svg>
        <p className="text-sm font-semibold text-ink-200">{def.dropText}</p>
        <p className="mt-1 text-xs text-ink-400">Seus arquivos ficam no seu computador</p>
        <input
          ref={inputRef}
          type="file"
          accept={def.accept}
          multiple={def.multiple}
          hidden
          onChange={(e) => { if (e.target.files?.length) void process([...e.target.files]); }}
        />
      </div>

      {/* Estados */}
      {status && (
        <p className="mono mt-4 flex items-center gap-2 text-sm text-info-400" role="status" aria-live="polite">
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-info-400/30 border-t-info-400" />
          {status}
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-warn-500/50 bg-warn-500/10 p-4" role="alert">
          <p className="text-sm text-warn-400">⚠️ {error}</p>
          {lastFiles && (
            <button type="button" onClick={() => void process(lastFiles)} className="btn-ghost mt-3 text-xs">
              Tentar de novo
            </button>
          )}
        </div>
      )}

      {result && (() => {
        const first = result.files?.[0];
        const showBA =
          !!first?.preview &&
          result.files?.length === 1 &&
          !!lastFiles && lastFiles.length === 1 &&
          lastFiles[0]!.type.startsWith("image/");
        return (
          <>
            {showBA && <ImageBeforeAfter original={lastFiles![0]!} resultBlob={first!.blob} />}
            <ResultPanel output={result} hidePreview={showBA} />
          </>
        );
      })()}
    </div>
  );
}
