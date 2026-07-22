"use client";

import { useEffect, useMemo, useState } from "react";
import type { ToolOutput } from "@/lib/tools/runtime";

/** Painel de resultado padronizado: downloads, texto copiável e nota. */
export function ResultPanel({ output, hidePreview = false }: { output: ToolOutput; hidePreview?: boolean }) {
  const [copied, setCopied] = useState(false);

  const urls = useMemo(
    () => (output.files ?? []).map((f) => ({ ...f, url: URL.createObjectURL(f.blob) })),
    [output]
  );

  useEffect(() => {
    return () => urls.forEach((u) => URL.revokeObjectURL(u.url));
  }, [urls]);

  const copy = async () => {
    if (!output.text) return;
    try {
      await navigator.clipboard.writeText(output.text.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="card-surface mt-5 border-ok-500/30 p-5" role="status" aria-live="polite">
      <p className="font-display text-sm font-bold text-ok-400">✅ Pronto!</p>
      {output.note && <p className="mt-1 text-xs text-ink-400">{output.note}</p>}

      {output.text && (
        <div className="mt-4">
          <textarea
            readOnly
            value={output.text.value}
            rows={5}
            className="input-base mono resize-y text-xs"
            aria-label="Resultado"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={copy} className="btn-primary text-sm">
              {copied ? "Copiado ✓" : "📋 Copiar"}
            </button>
            {output.text.filename && (
              <a
                href={URL.createObjectURL(new Blob([output.text.value], { type: "text/plain;charset=utf-8" }))}
                download={output.text.filename}
                className="btn-ghost"
              >
                ⬇️ Baixar como arquivo
              </a>
            )}
          </div>
        </div>
      )}

      {urls.length > 0 && (
        <div className="mt-4 space-y-3">
          {!hidePreview && urls.some((u) => u.preview) && (
            <div className="flex flex-wrap gap-3">
              {urls.filter((u) => u.preview).map((u) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={u.url} src={u.url} alt="Prévia do resultado" className="max-h-52 rounded-lg bg-white p-2" />
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {urls.map((u) => (
              <a key={u.url} href={u.url} download={u.filename} className="btn-primary text-sm">
                ⬇️ {u.label || u.filename}
              </a>
            ))}
          </div>
        </div>
      )}

      {output.html && (
        <div className="mt-4" dangerouslySetInnerHTML={{ __html: output.html }} />
      )}
    </div>
  );
}
