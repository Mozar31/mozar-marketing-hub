"use client";

import { useMemo, useState } from "react";
import { loadImageFile } from "@/lib/tools/runtime";

/* ═══════════ Conversor de cores e contraste ═══════════ */

const toHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

/** HSL (h em graus, s/l em 0–1) → HEX. Usado nas harmonias de cor. */
function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] :
    h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return toHex((r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255);
}

/**
 * Extrai as cores dominantes de uma imagem, localmente (canvas).
 * Reduz a imagem, agrupa cores parecidas e devolve as mais frequentes e distintas.
 */
async function extrairPaleta(file: File, quantas = 6): Promise<string[]> {
  const img = await loadImageFile(file);
  const size = 80;
  const canvas = document.createElement("canvas");
  const escala = Math.min(size / img.naturalWidth, size / img.naturalHeight, 1);
  canvas.width = Math.max(1, Math.round(img.naturalWidth * escala));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * escala));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // agrupa por cor arredondada (reduz espaço de cor) e conta frequência
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! < 200) continue; // ignora transparente
    const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!;
    const key = `${r >> 5},${g >> 5},${b >> 5}`;
    const cur = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    cur.r += r; cur.g += g; cur.b += b; cur.n++;
    buckets.set(key, cur);
  }
  const ordenadas = [...buckets.values()]
    .map((c) => ({ r: c.r / c.n, g: c.g / c.n, b: c.b / c.n, n: c.n }))
    .sort((a, b) => b.n - a.n);

  // escolhe cores suficientemente diferentes entre si
  const escolhidas: { r: number; g: number; b: number }[] = [];
  for (const c of ordenadas) {
    const longe = escolhidas.every(
      (e) => Math.abs(e.r - c.r) + Math.abs(e.g - c.g) + Math.abs(e.b - c.b) > 60
    );
    if (longe) escolhidas.push(c);
    if (escolhidas.length >= quantas) break;
  }
  return escolhidas.map((c) => toHex(c.r, c.g, c.b));
}


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
  const [paleta, setPaleta] = useState<string[] | null>(null);
  const [paletaErro, setPaletaErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const rgb = parseColor(input);

  const copiar = async (texto: string, marca: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(marca);
      setTimeout(() => setCopiado(null), 1600);
    } catch { /* clipboard indisponível */ }
  };

  const enviarImagem = async (file?: File) => {
    if (!file) return;
    setPaletaErro(null);
    if (!file.type.startsWith("image/")) {
      setPaletaErro("Envie um arquivo de imagem (JPG, PNG, WebP).");
      return;
    }
    try {
      setPaleta(await extrairPaleta(file));
    } catch {
      setPaletaErro("Não foi possível ler as cores desta imagem.");
    }
  };

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
    // h já está em graus (0–360) pelo cálculo acima
    const harmonias = [
      { nome: "Complementar", cor: hslToHex(h + 180, sat, l) },
      { nome: "Análoga −30°", cor: hslToHex(h - 30, sat, l) },
      { nome: "Análoga +30°", cor: hslToHex(h + 30, sat, l) },
      { nome: "Tríade +120°", cor: hslToHex(h + 120, sat, l) },
      { nome: "Tríade +240°", cor: hslToHex(h + 240, sat, l) },
    ];
    return {
      hex, r, g, b,
      hsl: `hsl(${Math.round(h)}, ${Math.round(sat * 100)}%, ${Math.round(l * 100)}%)`,
      cmyk: cmyk.join("%, ") + "%",
      cWhite, cBlack,
      variations: [shade(0.4), shade(0.7), hex, tint(0.35), tint(0.7)],
      harmonias,
    };
  }, [rgb]);

  return (
    <div>
      <div className="mb-4 space-y-2 text-sm text-ink-400">
        <p>
          <strong className="text-ink-200">Para que serve:</strong> toda cor tem um “código” que designers e
          sites usam para reproduzir exatamente o mesmo tom. Aqui você descobre esse código da cor da sua
          marca, gera versões mais claras e escuras, e vê quais cores combinam com ela.
        </p>
        <p className="text-xs">
          <strong className="text-ink-300">HEX</strong> (ex.: #2563EB) é o código usado em sites e no Canva.{" "}
          <strong className="text-ink-300">RGB</strong> é o mesmo tom em tela. <strong className="text-ink-300">CMYK</strong>{" "}
          é para gráfica/impressão. O <strong className="text-ink-300">contraste</strong> mostra se um texto por cima
          da cor vai ficar legível.
        </p>
      </div>

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

      {/* Extrair paleta de uma imagem */}
      <div className="card-surface mt-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-ink-300">Tirar cores de uma imagem</p>
          <label className="btn-ghost cursor-pointer text-xs">
            Enviar imagem
            <input
              type="file" hidden accept="image/*"
              onChange={(e) => enviarImagem(e.target.files?.[0])}
            />
          </label>
        </div>
        <p className="mt-1 text-[0.68rem] text-ink-400">
          Envie um logo ou foto e extraia as cores principais — nada sai do navegador.
        </p>
        {paletaErro && <p className="mt-2 text-xs text-warn-400" role="alert">⚠️ {paletaErro}</p>}
        {paleta && paleta.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {paleta.map((cor) => (
              <button
                key={cor} type="button" title={`Usar ${cor}`}
                onClick={() => setInput(cor)}
                className="flex flex-col items-center gap-1"
                aria-label={`Usar a cor ${cor}`}
              >
                <span className="h-10 w-14 rounded-lg border border-white/15 transition hover:scale-105" style={{ background: cor }} />
                <span className="mono text-[0.6rem] text-ink-400">{cor}</span>
              </button>
            ))}
          </div>
        )}
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

          <p className="mt-5 text-xs font-semibold text-ink-300">
            Variações (clique para usar) <span className="font-normal text-ink-400">— do mais escuro ao mais claro</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.variations.map((v, i) => (
              <button
                key={v + i} type="button" title={`Usar ${v}`}
                onClick={() => setInput(v)}
                className="flex flex-col items-center gap-1"
                aria-label={`Usar a cor ${v}`}
              >
                <span className="h-12 w-16 rounded-lg border border-white/15 transition hover:scale-105" style={{ background: v }} />
                <span className="mono text-[0.6rem] text-ink-400">{v}</span>
              </button>
            ))}
          </div>

          <p className="mt-5 text-xs font-semibold text-ink-300">
            Cores que combinam <span className="font-normal text-ink-400">(clique para usar)</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.harmonias.map((har) => (
              <button
                key={har.nome} type="button" title={`${har.nome} — ${har.cor}`}
                onClick={() => setInput(har.cor)}
                className="flex flex-col items-center gap-1"
                aria-label={`Usar ${har.nome} ${har.cor}`}
              >
                <span className="h-12 w-16 rounded-lg border border-white/15 transition hover:scale-105" style={{ background: har.cor }} />
                <span className="text-[0.58rem] text-ink-400">{har.nome}</span>
              </button>
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

          {/* Exportar tokens (CSS + JSON) a partir da escala de variações */}
          {(() => {
            const escala = [900, 700, 500, 300, 100];
            const pares = data.variations.map((v, i) => [escala[i]!, v] as const);
            const css = `:root {\n${pares.map(([k, v]) => `  --brand-${k}: ${v};`).join("\n")}\n}`;
            const jsonTokens = JSON.stringify(
              { brand: Object.fromEntries(pares.map(([k, v]) => [String(k), v])) },
              null, 2
            );
            return (
              <div className="card-surface mt-5 p-5">
                <p className="font-display text-sm font-bold">Exportar como tokens</p>
                <p className="mt-1 text-xs text-ink-400">
                  A cor e suas variações em escala 100–900, prontas para colar no seu projeto.
                </p>
                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[0.7rem] font-semibold text-ink-300">CSS variables</span>
                      <button type="button" onClick={() => copiar(css, "css")} className="text-[0.68rem] font-semibold text-info-400 hover:underline">
                        {copiado === "css" ? "Copiado ✓" : "Copiar"}
                      </button>
                    </div>
                    <textarea readOnly value={css} rows={7} className="input-base mono resize-y text-[0.68rem]" aria-label="CSS variables" />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[0.7rem] font-semibold text-ink-300">JSON design tokens</span>
                      <button type="button" onClick={() => copiar(jsonTokens, "json")} className="text-[0.68rem] font-semibold text-info-400 hover:underline">
                        {copiado === "json" ? "Copiado ✓" : "Copiar"}
                      </button>
                    </div>
                    <textarea readOnly value={jsonTokens} rows={7} className="input-base mono resize-y text-[0.68rem]" aria-label="JSON design tokens" />
                  </div>
                </div>
              </div>
            );
          })()}
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
