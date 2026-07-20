"use client";

import { useMemo, useState } from "react";

/* ═══════════ Conversor de cores e contraste ═══════════ */

function parseColor(raw: string): [number, number, number] | null {
  const s = raw.trim().toLowerCase();
  let m = s.match(/^#?([0-9a-f]{6})$/);
  if (m) {
    const n = parseInt(m[1]!, 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }
  m = s.match(/^#?([0-9a-f]{3})$/);
  if (m) return [...m[1]!].map((c) => parseInt(c + c, 16)) as [number, number, number];
  m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return [Math.min(255, +m[1]!), Math.min(255, +m[2]!), Math.min(255, +m[3]!)];
  return null;
}

const lum = (c: number) => {
  const x = c / 255;
  return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
};

export function ColorStudio() {
  const [input, setInput] = useState("#2563EB");
  const rgb = parseColor(input);

  const data = useMemo(() => {
    if (!rgb) return null;
    const [r, g, b] = rgb;
    const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
    const rf = r / 255, gf = g / 255, bf = b / 255;
    const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
    const l = (max + min) / 2;
    let h = 0, sat = 0;
    if (max !== min) {
      const d = max - min;
      sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === rf) h = ((gf - bf) / d + (gf < bf ? 6 : 0)) * 60;
      else if (max === gf) h = ((bf - rf) / d + 2) * 60;
      else h = ((rf - gf) / d + 4) * 60;
    }
    const k = 1 - Math.max(rf, gf, bf);
    const cmyk = k >= 1 ? [0, 0, 0, 100] : [(1 - rf - k) / (1 - k), (1 - gf - k) / (1 - k), (1 - bf - k) / (1 - k), k].map((v) => Math.round(v * 100));
    const L = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
    const cWhite = 1.05 / (L + 0.05);
    const cBlack = (L + 0.05) / 0.05;
    const shade = (fct: number) => "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v * fct)))).map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
    const tint = (fct: number) => "#" + [r, g, b].map((v) => Math.round(v + (255 - v) * fct)).map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
    return {
      hex, r, g, b,
      hsl: `hsl(${Math.round(h)}, ${Math.round(sat * 100)}%, ${Math.round(l * 100)}%)`,
      cmyk: cmyk.join("%, ") + "%",
      cWhite, cBlack,
      variations: [shade(0.4), shade(0.7), hex, tint(0.35), tint(0.7)],
    };
  }, [rgb]);

  return (
    <div>
      <p className="mb-4 text-sm text-ink-400">
        Converta uma cor entre os formatos usados em web e impressão e confira se o contraste atende
        às regras de acessibilidade (WCAG 2.2 AA exige no mínimo 4,5:1 para texto normal).
      </p>

      <div className="card-surface flex flex-wrap items-end gap-4 p-5">
        <label className="flex flex-1 min-w-[14rem] flex-col gap-1.5 text-xs font-semibold text-ink-300">
          Cor (HEX ou RGB)
          <input className="input-base mono" value={input} onChange={(e) => setInput(e.target.value)} placeholder="#1E4FD8 ou rgb(30,79,216)" />
        </label>
        <input
          type="color" aria-label="Seletor de cor"
          value={data?.hex ?? "#2563EB"}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          className="h-11 w-16 cursor-pointer rounded-lg border border-white/20 bg-transparent"
        />
      </div>

      {!data ? (
        <p className="mt-4 rounded-lg border border-warn-500/50 bg-warn-500/10 p-3 text-sm text-warn-400" role="alert">
          ⚠️ Cor inválida. Use HEX (#1E4FD8) ou RGB — rgb(30,79,216).
        </p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-5">
            <div className="h-24 w-24 rounded-xl border-2 border-white/20" style={{ background: data.hex }} />
            <dl className="mono grid gap-1.5 text-sm">
              <div><dt className="inline font-bold text-ink-400">HEX: </dt><dd className="inline">{data.hex}</dd></div>
              <div><dt className="inline font-bold text-ink-400">RGB: </dt><dd className="inline">rgb({data.r}, {data.g}, {data.b})</dd></div>
              <div><dt className="inline font-bold text-ink-400">HSL: </dt><dd className="inline">{data.hsl}</dd></div>
              <div><dt className="inline font-bold text-ink-400">CMYK: </dt><dd className="inline">{data.cmyk}</dd></div>
            </dl>
          </div>

          <p className="mt-5 text-xs font-semibold text-ink-300">Variações (clique para copiar)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.variations.map((v, i) => (
              <button
                key={v + i} type="button" title={v}
                onClick={() => navigator.clipboard?.writeText(v)}
                className="h-12 w-16 rounded-lg border border-white/15 transition hover:scale-105"
                style={{ background: v }}
                aria-label={`Copiar cor ${v}`}
              />
            ))}
          </div>

          <div className="card-surface mt-5 p-5">
            <p className="font-display text-sm font-bold">Contraste e acessibilidade</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg p-4" style={{ background: data.hex }}>
                <p className="text-sm font-semibold text-white">Texto branco sobre a cor</p>
                <p className="mono mt-1 text-xs text-white/90">
                  {data.cWhite.toFixed(2)}:1 {data.cWhite >= 4.5 ? "✅ aprovado" : "⚠️ abaixo de 4,5"}
                </p>
              </div>
              <div className="rounded-lg p-4" style={{ background: data.hex }}>
                <p className="text-sm font-semibold text-black">Texto preto sobre a cor</p>
                <p className="mono mt-1 text-xs text-black/80">
                  {data.cBlack.toFixed(2)}:1 {data.cBlack >= 4.5 ? "✅ aprovado" : "⚠️ abaixo de 4,5"}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════ Texto ↔ Base64 ═══════════ */
export function Base64Tool() {
  return (
    <TextTransform
      modes={[
        { id: "enc", label: "Texto → Base64" },
        { id: "dec", label: "Base64 → Texto" },
      ]}
      placeholder="Cole o texto aqui…"
      transform={(value, mode) => {
        if (mode === "enc") {
          return btoa(String.fromCharCode(...new TextEncoder().encode(value)));
        }
        try {
          const bin = atob(value.trim().replace(/\s+/g, ""));
          return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
        } catch {
          throw new Error("Este conteúdo não é Base64 válido.");
        }
      }}
    />
  );
}

/* ═══════════ URL encode / decode ═══════════ */
export function UrlEncodeTool() {
  return (
    <TextTransform
      modes={[
        { id: "enc", label: "Texto → URL encode" },
        { id: "dec", label: "URL encode → Texto" },
      ]}
      placeholder="Cole o texto ou o trecho de URL aqui…"
      transform={(value, mode) => {
        if (mode === "enc") return encodeURIComponent(value);
        try {
          return decodeURIComponent(value.replace(/\+/g, "%20"));
        } catch {
          throw new Error("Este conteúdo não é URL-encode válido.");
        }
      }}
    />
  );
}

/* ═══════════ Formatar e validar JSON ═══════════ */
export function JsonTool() {
  return (
    <TextTransform
      modes={[
        { id: "fmt", label: "Formatar (organizado)" },
        { id: "min", label: "Minificar (uma linha)" },
        { id: "val", label: "Só validar" },
      ]}
      placeholder='{"exemplo": true}'
      rows={8}
      transform={(value, mode) => {
        let data: unknown;
        try {
          data = JSON.parse(value.trim());
        } catch (e) {
          const msg = String((e as Error).message);
          const pos = msg.match(/position (\d+)/);
          let hint = "";
          if (pos) {
            const linha = value.slice(0, Number(pos[1])).split("\n").length;
            hint = ` (por volta da linha ${linha})`;
          }
          throw new Error("JSON inválido" + hint + ": " + msg);
        }
        if (mode === "val") {
          const info = Array.isArray(data)
            ? `${data.length} item(ns) na lista.`
            : `${Object.keys((data as object) ?? {}).length} chave(s) no objeto.`;
          return "✅ JSON válido! " + info;
        }
        return mode === "fmt" ? JSON.stringify(data, null, 2) : JSON.stringify(data);
      }}
    />
  );
}

/* ─────────── base compartilhada de transformação de texto ─────────── */
function TextTransform({
  modes, placeholder, transform, rows = 5,
}: {
  modes: { id: string; label: string }[];
  placeholder: string;
  transform: (value: string, mode: string) => string;
  rows?: number;
}) {
  const [mode, setMode] = useState(modes[0]!.id);
  const [value, setValue] = useState("");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!value.trim()) return { out: "", error: null as string | null };
    try {
      return { out: transform(value, mode), error: null };
    } catch (e) {
      return { out: "", error: (e as Error).message };
    }
  }, [value, mode, transform]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.out);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard indisponível */ }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {modes.map((m) => (
          <button
            key={m.id} type="button" onClick={() => setMode(m.id)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              mode === m.id ? "border-action-500 bg-action-500/20 text-ink-100" : "border-white/15 text-ink-300 hover:border-info-500/50"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-300">
        Conteúdo
        <textarea
          className="input-base mono resize-y text-xs" rows={rows}
          value={value} placeholder={placeholder} onChange={(e) => setValue(e.target.value)}
        />
      </label>

      {result.error && (
        <p className="mt-4 rounded-lg border border-warn-500/50 bg-warn-500/10 p-3 text-sm text-warn-400" role="alert">
          ⚠️ {result.error}
        </p>
      )}

      {result.out && (
        <div className="card-surface mt-4 border-ok-500/30 p-5">
          <p className="font-display text-sm font-bold text-ok-400">Resultado</p>
          <textarea readOnly value={result.out} rows={rows} className="input-base mono mt-3 resize-y text-xs" aria-label="Resultado" />
          <button type="button" onClick={copy} className="btn-primary mt-3 text-sm">
            {copied ? "Copiado ✓" : "📋 Copiar"}
          </button>
        </div>
      )}
    </div>
  );
}
