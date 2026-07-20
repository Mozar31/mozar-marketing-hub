/**
 * Runtime compartilhado das ferramentas local-first.
 * Tudo aqui roda no navegador — nenhum arquivo é enviado para servidor (§15).
 */

import { LIB } from "@/lib/config";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    pdfjsLib: any;
    PDFLib: any;
    XLSX: any;
    JSZip: any;
    mammoth: any;
    html2pdf: any;
    heic2any: any;
    qrcode: any;
  }
}

const loaded: Record<string, Promise<void>> = {};

/** Carrega uma lib pesada sob demanda (§8: heavy modules lazy por rota). */
export function loadScript(src: string): Promise<void> {
  const cached = loaded[src];
  if (cached) return cached;
  const p = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Não foi possível carregar um componente necessário. Verifique sua conexão e recarregue a página."));
    document.head.appendChild(s);
  });
  loaded[src] = p;
  return p;
}

export async function ensurePdfjs() {
  await loadScript(LIB.pdfjs);
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = LIB.pdfjsWorker;
}

export const baseName = (name: string): string => name.replace(/\.[^.]+$/, "");

export const escapeHTML = (s: string): string =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Resultado padronizado de qualquer ferramenta de arquivo. */
export interface ToolOutput {
  /** Arquivos gerados para download. */
  files?: { blob: Blob; filename: string; label?: string; preview?: boolean }[];
  /** Saída em texto (com botão copiar). */
  text?: { value: string; filename?: string };
  /** Nota complementar exibida junto do resultado. */
  note?: string;
  /** HTML de resultado rico (usado por ferramentas como cores). */
  html?: string;
}

export type ProgressFn = (message: string) => void;

/* ── Imagens ─────────────────────────────────────────────── */

export function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler esta imagem. Confira se o arquivo não está corrompido."));
    };
    img.src = url;
  });
}

export function canvasFromImage(img: HTMLImageElement, fillWhite = false): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  if (fillWhite) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao gerar a imagem."))),
      type,
      quality
    );
  });
}

export const isJpeg = (file: File): boolean =>
  /image\/jpeg/.test(file.type) || /\.jpe?g$/i.test(file.name);

/* ── PDF ─────────────────────────────────────────────────── */

export async function loadPdfDoc(file: File) {
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
    throw new Error("Escolha um arquivo .pdf.");
  }
  await loadScript(LIB.pdflib);
  try {
    return await window.PDFLib.PDFDocument.load(await file.arrayBuffer());
  } catch {
    throw new Error("Este PDF está protegido por senha ou corrompido.");
  }
}

/** Interpreta "1, 3-5, 8" devolvendo índices 0-based válidos. */
export function parsePageSpec(spec: string, total: number): number[] {
  const out = new Set<number>();
  (spec || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((part) => {
      const range = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (range) {
        const a = Number(range[1]);
        const b = Number(range[2]);
        for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
          if (i >= 1 && i <= total) out.add(i - 1);
        }
      } else if (/^\d+$/.test(part)) {
        const n = Number(part);
        if (n >= 1 && n <= total) out.add(n - 1);
      }
    });
  return [...out].sort((a, b) => a - b);
}

/** Agrupa itens de texto do pdf.js em parágrafos por coordenada Y. */
export function pageItemsToParagraphs(items: any[]): string[] {
  const lines: { y: number; parts: { x: number; str: string }[] }[] = [];
  items.forEach((item) => {
    if (!item.str) return;
    const y = item.transform[5];
    const x = item.transform[4];
    let line = lines.find((l) => Math.abs(l.y - y) < 3);
    if (!line) {
      line = { y, parts: [] };
      lines.push(line);
    }
    line.parts.push({ x, str: item.str });
  });
  lines.sort((a, b) => b.y - a.y);
  lines.forEach((l) => l.parts.sort((a, b) => a.x - b.x));

  const paragraphs: string[] = [];
  let current: string[] = [];
  let prevY: number | null = null;
  lines.forEach((l) => {
    const text = l.parts.map((p) => p.str).join(" ").replace(/\s+/g, " ").trim();
    if (!text) return;
    if (prevY !== null && prevY - l.y > 22 && current.length) {
      paragraphs.push(current.join(" "));
      current = [];
    }
    current.push(text);
    prevY = l.y;
  });
  if (current.length) paragraphs.push(current.join(" "));
  return paragraphs;
}

/* ── Formatação pt-BR ────────────────────────────────────── */

export const fmtBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const fmtNum = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
export const fmtDec = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});
export const fmtPct = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});
