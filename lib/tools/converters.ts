/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Conversores local-first — portados da v1 com paridade de comportamento
 * (PROMPT 06). Cada função recebe os arquivos e as opções e devolve ToolOutput.
 */

import { LIB } from "@/lib/config";
import {
  loadScript,
  ensurePdfjs,
  loadPdfDoc,
  parsePageSpec,
  pageItemsToParagraphs,
  loadImageFile,
  canvasFromImage,
  canvasToBlob,
  isJpeg,
  baseName,
  escapeHTML,
  type ToolOutput,
  type ProgressFn,
} from "./runtime";

export type Opts = Record<string, string>;

export interface FileToolDef {
  accept: string;
  multiple?: boolean;
  dropText: string;
  /** Campos de opção renderizados acima da zona de arquivo. */
  fields?: {
    id: string;
    label: string;
    type: "select" | "number" | "text" | "range";
    options?: { value: string; label: string }[];
    placeholder?: string;
    default?: string;
    min?: number;
    max?: number;
    hint?: string;
  }[];
  run: (files: File[], opts: Opts, progress: ProgressFn) => Promise<ToolOutput>;
}

const PDF_ACCEPT = "application/pdf,.pdf";
const IMG_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

/**
 * Processa várias imagens com a mesma operação e devolve um ZIP.
 * Usado quando o usuário envia mais de um arquivo (o caso de 1 arquivo
 * continua tratado por cada conversor, com preview e nota própria).
 */
async function loteImagensZip(
  files: File[],
  progress: ProgressFn,
  zipBase: string,
  processarUma: (file: File) => Promise<{ blob: Blob; filename: string }>,
  mostrarEconomia = false
): Promise<ToolOutput> {
  await loadScript(LIB.jszip);
  const zip = new window.JSZip();
  const usados = new Set<string>();
  let totalIn = 0, totalOut = 0, feito = 0;
  for (const file of files) {
    progress(`Processando ${++feito} de ${files.length}…`);
    const { blob, filename } = await processarUma(file);
    // garante nomes únicos dentro do ZIP
    let nome = filename, i = 2;
    while (usados.has(nome)) { nome = filename.replace(/(\.[^.]+)$/, `-${i}$1`); i++; }
    usados.add(nome);
    totalIn += file.size;
    totalOut += blob.size;
    zip.file(nome, blob);
  }
  progress("Gerando ZIP…");
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  const economia = totalIn > 0 ? Math.max(0, Math.round((1 - totalOut / totalIn) * 100)) : 0;
  return {
    files: [{ blob, filename: `${zipBase}.zip`, label: `Baixar ${files.length} imagens (ZIP)` }],
    note: mostrarEconomia
      ? `${files.length} imagens · ${(totalIn / 1024).toFixed(0)} KB → ${(totalOut / 1024).toFixed(0)} KB (${economia}% menor)`
      : `${files.length} imagens processadas.`,
  };
}

export const FILE_TOOLS: Record<string, FileToolDef> = {
  /* ═══════════ PDF ═══════════ */
  "pdf-para-word": {
    accept: PDF_ACCEPT,
    dropText: "Arraste o PDF aqui ou clique para selecionar",
    async run(files, _o, progress) {
      const file = files[0]!;
      progress("Carregando leitor de PDF…");
      await ensurePdfjs();
      progress("Lendo arquivo…");
      const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      let body = "";
      let chars = 0;
      for (let p = 1; p <= pdf.numPages; p++) {
        progress(`Convertendo página ${p} de ${pdf.numPages}…`);
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        pageItemsToParagraphs(content.items).forEach((para) => {
          chars += para.length;
          body += "<p>" + escapeHTML(para) + "</p>\n";
        });
        if (p < pdf.numPages) body += '<br clear="all" style="page-break-before:always">\n';
      }
      if (chars < 20)
        throw new Error(
          "Este PDF parece ser digitalizado (imagem): não há texto para extrair. Seria necessário OCR."
        );
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${escapeHTML(baseName(file.name))}</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.4}p{margin:0 0 10pt}</style></head><body>${body}</body></html>`;
      return {
        files: [
          {
            blob: new Blob(["﻿", html], { type: "application/msword" }),
            filename: baseName(file.name) + ".doc",
            label: "Baixar Word (.doc)",
          },
        ],
      };
    },
  },

  "pdf-para-jpg": {
    accept: PDF_ACCEPT,
    dropText: "Arraste o PDF aqui ou clique para selecionar",
    async run(files, _o, progress) {
      const file = files[0]!;
      progress("Carregando leitor de PDF…");
      await ensurePdfjs();
      const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      const max = Math.min(pdf.numPages, 30);
      const out: ToolOutput["files"] = [];
      for (let p = 1; p <= max; p++) {
        progress(`Renderizando página ${p} de ${max}…`);
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        // intent "print" evita travar quando a aba está em segundo plano
        await page.render({ canvasContext: canvas.getContext("2d"), viewport, intent: "print" }).promise;
        out.push({
          blob: await canvasToBlob(canvas, "image/jpeg", 0.9),
          filename: `${baseName(file.name)}-pagina-${p}.jpg`,
          label: `Página ${p}`,
        });
      }
      return { files: out, note: pdf.numPages > 30 ? "Limite de 30 páginas por vez." : undefined };
    },
  },

  "pdf-para-texto": {
    accept: PDF_ACCEPT,
    dropText: "Arraste o PDF aqui ou clique para selecionar",
    async run(files, _o, progress) {
      const file = files[0]!;
      progress("Carregando leitor de PDF…");
      await ensurePdfjs();
      const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      let text = "";
      for (let p = 1; p <= pdf.numPages; p++) {
        progress(`Extraindo página ${p} de ${pdf.numPages}…`);
        const page = await pdf.getPage(p);
        text += pageItemsToParagraphs((await page.getTextContent()).items).join("\n\n") + "\n\n";
      }
      if (text.trim().length < 20)
        throw new Error("Este PDF parece ser digitalizado (imagem): não há texto para extrair.");
      return {
        files: [
          {
            blob: new Blob(["﻿" + text], { type: "text/plain;charset=utf-8" }),
            filename: baseName(file.name) + ".txt",
            label: "Baixar texto (.txt)",
          },
        ],
      };
    },
  },

  "juntar-pdf": {
    accept: PDF_ACCEPT,
    multiple: true,
    dropText: "Arraste 2 ou mais PDFs (a ordem de seleção é a ordem final)",
    async run(files, _o, progress) {
      const pdfs = files.filter((f) => /\.pdf$/i.test(f.name) || f.type === "application/pdf");
      if (pdfs.length < 2) throw new Error("Selecione pelo menos 2 PDFs para juntar.");
      await loadScript(LIB.pdflib);
      const merged = await window.PDFLib.PDFDocument.create();
      for (let i = 0; i < pdfs.length; i++) {
        progress(`Juntando arquivo ${i + 1} de ${pdfs.length}…`);
        let src;
        try {
          src = await window.PDFLib.PDFDocument.load(await pdfs[i]!.arrayBuffer());
        } catch {
          throw new Error(`O arquivo "${pdfs[i]!.name}" está protegido ou corrompido.`);
        }
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((p: any) => merged.addPage(p));
      }
      return {
        files: [
          {
            blob: new Blob([await merged.save()], { type: "application/pdf" }),
            filename: "unido.pdf",
            label: "Baixar PDF unido",
          },
        ],
      };
    },
  },

  "dividir-pdf": {
    accept: PDF_ACCEPT,
    dropText: "Arraste o PDF aqui ou clique para selecionar",
    fields: [
      { id: "from", label: "Da página", type: "number", default: "1", min: 1 },
      { id: "to", label: "Até a página", type: "number", default: "1", min: 1 },
    ],
    async run(files, opts, progress) {
      const src = await loadPdfDoc(files[0]!);
      const total = src.getPageCount();
      const from = Math.max(1, parseInt(opts.from || "1", 10) || 1);
      const to = Math.min(total, parseInt(opts.to || String(total), 10) || total);
      if (from > to) throw new Error(`Intervalo inválido. O PDF tem ${total} página(s).`);
      progress(`Extraindo páginas ${from} a ${to} de ${total}…`);
      const out = await window.PDFLib.PDFDocument.create();
      const idx: number[] = [];
      for (let i = from - 1; i <= to - 1; i++) idx.push(i);
      (await out.copyPages(src, idx)).forEach((p: any) => out.addPage(p));
      return {
        files: [
          {
            blob: new Blob([await out.save()], { type: "application/pdf" }),
            filename: `${baseName(files[0]!.name)}-pag-${from}-a-${to}.pdf`,
            label: `Baixar páginas ${from}–${to}`,
          },
        ],
      };
    },
  },

  "extrair-paginas-pdf": {
    accept: PDF_ACCEPT,
    dropText: "Arraste o PDF aqui ou clique para selecionar",
    fields: [
      { id: "pages", label: "Páginas", type: "text", placeholder: "1, 3-5, 8", hint: "Separe por vírgula; use hífen para intervalos." },
    ],
    async run(files, opts, progress) {
      const src = await loadPdfDoc(files[0]!);
      const total = src.getPageCount();
      const idx = parsePageSpec(opts.pages || "", total);
      if (!idx.length) throw new Error(`Informe as páginas (ex.: 1, 3-5). O PDF tem ${total} página(s).`);
      progress(`Extraindo ${idx.length} página(s)…`);
      const out = await window.PDFLib.PDFDocument.create();
      (await out.copyPages(src, idx)).forEach((p: any) => out.addPage(p));
      return {
        files: [
          {
            blob: new Blob([await out.save()], { type: "application/pdf" }),
            filename: `${baseName(files[0]!.name)}-paginas.pdf`,
            label: `Baixar ${idx.length} página(s)`,
          },
        ],
      };
    },
  },

  "remover-paginas-pdf": {
    accept: PDF_ACCEPT,
    dropText: "Arraste o PDF aqui ou clique para selecionar",
    fields: [
      { id: "pages", label: "Páginas a remover", type: "text", placeholder: "2, 4-6", hint: "As demais páginas são mantidas." },
    ],
    async run(files, opts, progress) {
      const src = await loadPdfDoc(files[0]!);
      const total = src.getPageCount();
      const remove = new Set(parsePageSpec(opts.pages || "", total));
      if (!remove.size) throw new Error(`Informe as páginas a remover (ex.: 2, 4-6). O PDF tem ${total} página(s).`);
      const keep: number[] = [];
      for (let i = 0; i < total; i++) if (!remove.has(i)) keep.push(i);
      if (!keep.length) throw new Error("Isso removeria todas as páginas — sobraria um PDF vazio.");
      progress(`Removendo ${remove.size} página(s)…`);
      const out = await window.PDFLib.PDFDocument.create();
      (await out.copyPages(src, keep)).forEach((p: any) => out.addPage(p));
      return {
        files: [
          {
            blob: new Blob([await out.save()], { type: "application/pdf" }),
            filename: `${baseName(files[0]!.name)}-sem-paginas.pdf`,
            label: `Baixar PDF (${keep.length} páginas)`,
          },
        ],
      };
    },
  },

  "girar-pdf": {
    accept: PDF_ACCEPT,
    dropText: "Arraste o PDF aqui ou clique para selecionar",
    fields: [
      {
        id: "deg",
        label: "Girar",
        type: "select",
        default: "90",
        options: [
          { value: "90", label: "90° (sentido horário)" },
          { value: "180", label: "180°" },
          { value: "270", label: "270° (anti-horário)" },
        ],
      },
    ],
    async run(files, opts, progress) {
      const src = await loadPdfDoc(files[0]!);
      const deg = parseInt(opts.deg || "90", 10);
      progress("Girando páginas…");
      src.getPages().forEach((page: any) => {
        page.setRotation(window.PDFLib.degrees((page.getRotation().angle + deg) % 360));
      });
      return {
        files: [
          {
            blob: new Blob([await src.save()], { type: "application/pdf" }),
            filename: `${baseName(files[0]!.name)}-girado.pdf`,
            label: "Baixar PDF girado",
          },
        ],
      };
    },
  },

  "inverter-ordem-pdf": {
    accept: PDF_ACCEPT,
    dropText: "Arraste o PDF aqui ou clique para selecionar",
    async run(files, _o, progress) {
      const src = await loadPdfDoc(files[0]!);
      const total = src.getPageCount();
      progress("Invertendo a ordem das páginas…");
      const idx: number[] = [];
      for (let i = total - 1; i >= 0; i--) idx.push(i);
      const out = await window.PDFLib.PDFDocument.create();
      (await out.copyPages(src, idx)).forEach((p: any) => out.addPage(p));
      return {
        files: [
          {
            blob: new Blob([await out.save()], { type: "application/pdf" }),
            filename: `${baseName(files[0]!.name)}-invertido.pdf`,
            label: "Baixar PDF invertido",
          },
        ],
      };
    },
  },

  "word-para-pdf": {
    accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    dropText: "Arraste o arquivo .docx aqui",
    async run(files, _o, progress) {
      const file = files[0]!;
      if (!/\.docx$/i.test(file.name))
        throw new Error("Escolha um arquivo .docx. Arquivos .doc antigos não são suportados.");
      progress("Carregando conversor…");
      await loadScript(LIB.mammoth);
      await loadScript(LIB.html2pdf);
      progress("Lendo documento…");
      const result = await window.mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
      const html = (result.value || "").trim();
      if (!html) throw new Error("Não foi possível extrair o conteúdo deste documento.");
      progress("Gerando PDF…");
      const container = document.createElement("div");
      container.innerHTML = html;
      Object.assign(container.style, {
        position: "fixed", left: "-10000px", top: "0", width: "700px",
        background: "#fff", color: "#111", fontFamily: "Arial, sans-serif",
        fontSize: "13px", lineHeight: "1.5", padding: "20px",
      });
      container.querySelectorAll("img").forEach((img) => { img.style.maxWidth = "100%"; });
      document.body.appendChild(container);
      try {
        const blob = await window.html2pdf()
          .set({
            margin: 12,
            image: { type: "jpeg", quality: 0.95 },
            html2canvas: { scale: 2, backgroundColor: "#ffffff" },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            pagebreak: { mode: ["avoid-all", "css", "legacy"] },
          })
          .from(container)
          .outputPdf("blob");
        return {
          files: [{ blob, filename: baseName(file.name) + ".pdf", label: "Baixar PDF" }],
        };
      } finally {
        container.remove();
      }
    },
  },

  "imagem-para-pdf": {
    accept: IMG_ACCEPT,
    multiple: true,
    dropText: "Arraste as imagens aqui (pode escolher várias)",
    async run(files, _o, progress) {
      const imgs = files.filter((f) => /image\/(jpeg|png|webp)/.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name));
      if (!imgs.length) throw new Error("Escolha imagens JPG, PNG ou WebP.");
      progress("Carregando gerador de PDF…");
      await loadScript(LIB.pdflib);
      const doc = await window.PDFLib.PDFDocument.create();
      for (let i = 0; i < imgs.length; i++) {
        progress(`Adicionando imagem ${i + 1} de ${imgs.length}…`);
        const f = imgs[i]!;
        let embedded;
        if (f.type === "image/webp" || /\.webp$/i.test(f.name)) {
          const img = await loadImageFile(f);
          const blob = await canvasToBlob(canvasFromImage(img, true), "image/jpeg", 0.92);
          embedded = await doc.embedJpg(await blob.arrayBuffer());
        } else if (f.type === "image/png" || /\.png$/i.test(f.name)) {
          embedded = await doc.embedPng(await f.arrayBuffer());
        } else {
          embedded = await doc.embedJpg(await f.arrayBuffer());
        }
        const page = doc.addPage([embedded.width, embedded.height]);
        page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
      }
      return {
        files: [
          {
            blob: new Blob([await doc.save()], { type: "application/pdf" }),
            filename: imgs.length === 1 ? baseName(imgs[0]!.name) + ".pdf" : "imagens.pdf",
            label: "Baixar PDF",
          },
        ],
      };
    },
  },

  /* ═══════════ Imagens ═══════════ */
  "converter-imagem": {
    accept: IMG_ACCEPT,
    multiple: true,
    dropText: "Arraste uma ou várias imagens aqui",
    fields: [
      {
        id: "format",
        label: "Converter para",
        type: "select",
        default: "image/png",
        options: [
          { value: "image/png", label: "PNG" },
          { value: "image/jpeg", label: "JPG" },
          { value: "image/webp", label: "WebP" },
        ],
      },
    ],
    async run(files, opts, progress) {
      const format = opts.format || "image/png";
      const ext = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[format] || "png";
      const uma = async (file: File) => {
        const img = await loadImageFile(file);
        const blob = await canvasToBlob(canvasFromImage(img, format === "image/jpeg"), format, 0.92);
        return { blob, filename: `${baseName(file.name)}.${ext}` };
      };
      if (files.length > 1) return loteImagensZip(files, progress, `imagens-${ext}`, uma);
      progress("Convertendo…");
      const { blob, filename } = await uma(files[0]!);
      return { files: [{ blob, filename, label: `Baixar .${ext.toUpperCase()}`, preview: true }] };
    },
  },

  "comprimir-imagem": {
    accept: IMG_ACCEPT,
    multiple: true,
    dropText: "Arraste uma ou várias imagens aqui",
    fields: [
      { id: "quality", label: "Qualidade", type: "range", default: "70", min: 30, max: 95, hint: "Menor qualidade = arquivo mais leve." },
    ],
    async run(files, opts, progress) {
      const q = (parseInt(opts.quality || "70", 10) || 70) / 100;
      const uma = async (file: File) => {
        const img = await loadImageFile(file);
        const blob = await canvasToBlob(canvasFromImage(img, true), "image/jpeg", q);
        return { blob, filename: `${baseName(file.name)}-comprimida.jpg` };
      };
      if (files.length > 1) return loteImagensZip(files, progress, "imagens-comprimidas", uma, true);
      progress("Comprimindo…");
      const file = files[0]!;
      const { blob, filename } = await uma(file);
      const saved = file.size > 0 ? Math.max(0, Math.round((1 - blob.size / file.size) * 100)) : 0;
      return {
        files: [{ blob, filename, label: "Baixar imagem comprimida", preview: true }],
        note: `${(file.size / 1024).toFixed(0)} KB → ${(blob.size / 1024).toFixed(0)} KB (${saved}% menor)`,
      };
    },
  },

  "redimensionar-imagem": {
    accept: IMG_ACCEPT,
    multiple: true,
    dropText: "Arraste uma ou várias imagens aqui",
    fields: [
      { id: "width", label: "Largura (px)", type: "number", placeholder: "ex.: 1080", min: 1 },
      { id: "height", label: "Altura (px)", type: "number", placeholder: "automática", min: 1, hint: "Deixe vazio para manter a proporção." },
    ],
    async run(files, opts, progress) {
      const w = parseInt(opts.width || "0", 10) || 0;
      const h = parseInt(opts.height || "0", 10) || 0;
      if (!w && !h) throw new Error("Informe a largura ou a altura desejada.");
      const uma = async (file: File) => {
        const img = await loadImageFile(file);
        const ratio = img.naturalWidth / img.naturalHeight;
        const outW = w || Math.round(h * ratio);
        const outH = h || Math.round(w / ratio);
        const canvas = document.createElement("canvas");
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingQuality = "high";
        const jpg = isJpeg(file);
        if (jpg) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, outW, outH); }
        ctx.drawImage(img, 0, 0, outW, outH);
        const blob = await canvasToBlob(canvas, jpg ? "image/jpeg" : "image/png", 0.92);
        return { blob, filename: `${baseName(file.name)}-${outW}x${outH}.${jpg ? "jpg" : "png"}`, outW, outH };
      };
      if (files.length > 1) {
        return loteImagensZip(files, progress, "imagens-redimensionadas", async (f) => {
          const { blob, filename } = await uma(f);
          return { blob, filename };
        });
      }
      progress("Redimensionando…");
      const { blob, filename, outW, outH } = await uma(files[0]!);
      return { files: [{ blob, filename, label: `Baixar ${outW}×${outH}`, preview: true }] };
    },
  },

  "girar-imagem": {
    accept: IMG_ACCEPT,
    dropText: "Arraste a imagem aqui ou clique para selecionar",
    fields: [
      {
        id: "deg", label: "Girar", type: "select", default: "90",
        options: [
          { value: "90", label: "90° (sentido horário)" },
          { value: "180", label: "180°" },
          { value: "270", label: "270° (anti-horário)" },
        ],
      },
    ],
    async run(files, opts, progress) {
      const file = files[0]!;
      const deg = parseInt(opts.deg || "90", 10);
      progress("Girando…");
      const img = await loadImageFile(file);
      const swap = deg === 90 || deg === 270;
      const canvas = document.createElement("canvas");
      canvas.width = swap ? img.naturalHeight : img.naturalWidth;
      canvas.height = swap ? img.naturalWidth : img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((deg * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      const jpg = isJpeg(file);
      const blob = await canvasToBlob(canvas, jpg ? "image/jpeg" : "image/png", 0.92);
      return { files: [{ blob, filename: `${baseName(file.name)}-girada.${jpg ? "jpg" : "png"}`, label: "Baixar imagem girada", preview: true }] };
    },
  },

  "espelhar-imagem": {
    accept: IMG_ACCEPT,
    dropText: "Arraste a imagem aqui ou clique para selecionar",
    fields: [
      {
        id: "dir", label: "Direção", type: "select", default: "h",
        options: [
          { value: "h", label: "Horizontal" },
          { value: "v", label: "Vertical" },
        ],
      },
    ],
    async run(files, opts, progress) {
      const file = files[0]!;
      progress("Espelhando…");
      const img = await loadImageFile(file);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      if ((opts.dir || "h") === "h") { ctx.scale(-1, 1); ctx.drawImage(img, -canvas.width, 0); }
      else { ctx.scale(1, -1); ctx.drawImage(img, 0, -canvas.height); }
      const jpg = isJpeg(file);
      const blob = await canvasToBlob(canvas, jpg ? "image/jpeg" : "image/png", 0.92);
      return { files: [{ blob, filename: `${baseName(file.name)}-espelhada.${jpg ? "jpg" : "png"}`, label: "Baixar imagem espelhada", preview: true }] };
    },
  },

  "imagem-preto-e-branco": {
    accept: IMG_ACCEPT,
    dropText: "Arraste a imagem aqui ou clique para selecionar",
    fields: [
      {
        id: "mode", label: "Estilo", type: "select", default: "gray",
        options: [
          { value: "gray", label: "Escala de cinza" },
          { value: "bw", label: "Preto e branco puro" },
        ],
      },
    ],
    async run(files, opts, progress) {
      const file = files[0]!;
      const mode = opts.mode || "gray";
      progress("Convertendo cores…");
      const img = await loadImageFile(file);
      const canvas = canvasFromImage(img, true);
      const ctx = canvas.getContext("2d")!;
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        let v = Math.round(0.299 * px[i]! + 0.587 * px[i + 1]! + 0.114 * px[i + 2]!);
        if (mode === "bw") v = v >= 128 ? 255 : 0;
        px[i] = px[i + 1] = px[i + 2] = v;
      }
      ctx.putImageData(data, 0, 0);
      const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
      return { files: [{ blob, filename: `${baseName(file.name)}-${mode === "bw" ? "pb" : "cinza"}.jpg`, label: "Baixar imagem", preview: true }] };
    },
  },

  "juntar-imagens": {
    accept: IMG_ACCEPT,
    multiple: true,
    dropText: "Arraste 2 ou mais imagens (a ordem de seleção é a ordem final)",
    fields: [
      {
        id: "dir", label: "Direção", type: "select", default: "v",
        options: [
          { value: "v", label: "Empilhadas (uma embaixo da outra)" },
          { value: "h", label: "Lado a lado" },
        ],
      },
    ],
    async run(files, opts, progress) {
      const imgs = files.filter((f) => /image\/(jpeg|png|webp)/.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name));
      if (imgs.length < 2) throw new Error("Selecione pelo menos 2 imagens para juntar.");
      const dir = opts.dir || "v";
      progress("Carregando imagens…");
      const loaded: HTMLImageElement[] = [];
      for (const f of imgs) loaded.push(await loadImageFile(f));
      const canvas = document.createElement("canvas");
      if (dir === "v") {
        canvas.width = Math.max(...loaded.map((i) => i.naturalWidth));
        canvas.height = loaded.reduce((s, i) => s + i.naturalHeight, 0);
      } else {
        canvas.width = loaded.reduce((s, i) => s + i.naturalWidth, 0);
        canvas.height = Math.max(...loaded.map((i) => i.naturalHeight));
      }
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      let off = 0;
      loaded.forEach((i) => {
        if (dir === "v") { ctx.drawImage(i, 0, off); off += i.naturalHeight; }
        else { ctx.drawImage(i, off, 0); off += i.naturalWidth; }
      });
      progress("Gerando arquivo…");
      return {
        files: [{ blob: await canvasToBlob(canvas, "image/jpeg", 0.92), filename: "imagens-juntas.jpg", label: "Baixar imagem combinada", preview: true }],
      };
    },
  },

  "heic-para-jpg": {
    accept: ".heic,.heif,image/heic,image/heif",
    dropText: "Arraste a foto .heic do iPhone aqui",
    async run(files, _o, progress) {
      const file = files[0]!;
      if (!/\.(heic|heif)$/i.test(file.name) && !/heic|heif/.test(file.type))
        throw new Error("Escolha uma foto .heic ou .heif (formato do iPhone).");
      progress("Carregando conversor HEIC…");
      await loadScript(LIB.heic2any);
      progress("Convertendo (fotos grandes podem demorar)…");
      let out: any;
      try {
        out = await window.heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
      } catch {
        throw new Error("Não foi possível converter esta foto. Confirme que é um HEIC válido do iPhone.");
      }
      const blob: Blob = Array.isArray(out) ? out[0] : out;
      return { files: [{ blob, filename: baseName(file.name) + ".jpg", label: "Baixar JPG", preview: true }] };
    },
  },

  "remover-dados-da-foto": {
    accept: "image/jpeg,image/png,.jpg,.jpeg,.png",
    dropText: "Arraste a imagem aqui ou clique para selecionar",
    async run(files, _o, progress) {
      const file = files[0]!;
      progress("Removendo metadados…");
      const img = await loadImageFile(file);
      const jpg = isJpeg(file);
      const blob = await canvasToBlob(canvasFromImage(img, jpg), jpg ? "image/jpeg" : "image/png", 0.95);
      return {
        files: [{ blob, filename: `${baseName(file.name)}-limpa.${jpg ? "jpg" : "png"}`, label: "Baixar imagem sem metadados", preview: true }],
        note: "Localização GPS, modelo da câmera e demais dados EXIF foram removidos.",
      };
    },
  },

  "imagem-para-base64": {
    accept: "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif",
    dropText: "Arraste a imagem aqui ou clique para selecionar",
    async run(files, _o, progress) {
      const file = files[0]!;
      progress("Gerando código…");
      const dataUri = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
        fr.readAsDataURL(file);
      });
      return {
        text: { value: dataUri, filename: baseName(file.name) + "-base64.txt" },
        note: `${Math.round(dataUri.length / 1024)} KB de texto`,
      };
    },
  },

  /* ═══════════ Compactados ═══════════ */
  "criar-zip": {
    accept: "*/*",
    multiple: true,
    dropText: "Arraste os arquivos que quer compactar (qualquer tipo)",
    async run(files, _o, progress) {
      progress("Carregando compactador…");
      await loadScript(LIB.jszip);
      const zip = new window.JSZip();
      files.forEach((f) => zip.file(f.name, f));
      progress(`Compactando ${files.length} arquivo(s)…`);
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
      const before = files.reduce((s, f) => s + f.size, 0);
      const saved = before > 0 ? Math.max(0, Math.round((1 - blob.size / before) * 100)) : 0;
      return {
        files: [{ blob, filename: "arquivos.zip", label: "Baixar ZIP" }],
        note: `${files.length} arquivo(s) · ${saved}% menor que o total original`,
      };
    },
  },

  "extrair-zip": {
    accept: ".zip,application/zip,application/x-zip-compressed",
    dropText: "Arraste o arquivo .zip aqui",
    async run(files, _o, progress) {
      const file = files[0]!;
      if (!/\.zip$/i.test(file.name) && !/zip/.test(file.type)) throw new Error("Escolha um arquivo .zip.");
      progress("Carregando compactador…");
      await loadScript(LIB.jszip);
      let zip: any;
      try {
        zip = await window.JSZip.loadAsync(await file.arrayBuffer());
      } catch {
        throw new Error("Este ZIP está corrompido ou protegido por senha.");
      }
      const entries = Object.values(zip.files).filter((e: any) => !e.dir) as any[];
      if (!entries.length) throw new Error("Este ZIP está vazio.");
      const MAX = 40;
      const shown = entries.slice(0, MAX);
      progress(`Extraindo ${shown.length} arquivo(s)…`);
      const out: ToolOutput["files"] = [];
      for (const e of shown) {
        const blob = await e.async("blob");
        out.push({
          blob,
          filename: String(e.name).split("/").pop() || "arquivo",
          label: `${e.name} (${(blob.size / 1024).toFixed(0)} KB)`,
        });
      }
      return {
        files: out,
        note: entries.length > MAX ? `Mostrando ${MAX} de ${entries.length} arquivos.` : `${entries.length} arquivo(s)`,
      };
    },
  },

  /* ═══════════ Planilhas e dados ═══════════ */
  "excel-csv": {
    accept: ".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv",
    dropText: "Arraste a planilha (.xlsx, .xls) ou o .csv aqui",
    async run(files, _o, progress) {
      const file = files[0]!;
      const isCsv = /\.csv$/i.test(file.name);
      const isExcel = /\.(xlsx|xls)$/i.test(file.name);
      if (!isCsv && !isExcel) throw new Error("Escolha um arquivo .xlsx, .xls ou .csv.");
      progress("Carregando conversor de planilhas…");
      await loadScript(LIB.xlsx);
      progress("Convertendo…");
      if (isExcel) {
        const wb = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
        const out = wb.SheetNames.map((sheet: string) => {
          const csv = window.XLSX.utils.sheet_to_csv(wb.Sheets[sheet], { FS: ";" });
          const suffix = wb.SheetNames.length > 1 ? "-" + sheet : "";
          return {
            blob: new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }),
            filename: baseName(file.name) + suffix + ".csv",
            label: wb.SheetNames.length > 1 ? `CSV da aba "${sheet}"` : "Baixar CSV",
          };
        });
        return { files: out };
      }
      const text = await file.text();
      const wb = window.XLSX.read(text, { type: "string", FS: text.includes(";") ? ";" : "," });
      const out = window.XLSX.write(wb, { bookType: "xlsx", type: "array" });
      return {
        files: [
          {
            blob: new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
            filename: baseName(file.name) + ".xlsx",
            label: "Baixar Excel (.xlsx)",
          },
        ],
      };
    },
  },

  "json-csv": {
    accept: ".json,.csv,application/json,text/csv",
    dropText: "Arraste o arquivo .json ou .csv aqui",
    async run(files, _o, progress) {
      const file = files[0]!;
      const isJson = /\.json$/i.test(file.name);
      const isCsv = /\.csv$/i.test(file.name);
      if (!isJson && !isCsv) throw new Error("Escolha um arquivo .json ou .csv.");
      progress("Carregando conversor…");
      await loadScript(LIB.xlsx);
      const text = await file.text();
      if (isJson) {
        let data: any;
        try { data = JSON.parse(text); } catch { throw new Error("Este JSON é inválido — confira o conteúdo."); }
        if (!Array.isArray(data)) data = [data];
        if (!data.length || typeof data[0] !== "object")
          throw new Error("O JSON precisa ser uma lista de objetos para virar tabela.");
        const ws = window.XLSX.utils.json_to_sheet(data);
        const csv = window.XLSX.utils.sheet_to_csv(ws, { FS: ";" });
        return {
          files: [{ blob: new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), filename: baseName(file.name) + ".csv", label: "Baixar CSV" }],
        };
      }
      const wb = window.XLSX.read(text, { type: "string", FS: text.includes(";") ? ";" : "," });
      const json = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      return {
        files: [{ blob: new Blob([JSON.stringify(json, null, 2)], { type: "application/json" }), filename: baseName(file.name) + ".json", label: "Baixar JSON" }],
      };
    },
  },

  "separador-csv": {
    accept: ".csv,text/csv",
    dropText: "Arraste o arquivo .csv aqui",
    async run(files, _o, progress) {
      const file = files[0]!;
      if (!/\.csv$/i.test(file.name)) throw new Error("Escolha um arquivo .csv.");
      progress("Analisando separador…");
      await loadScript(LIB.xlsx);
      const text = await file.text();
      const firstLine = text.split(/\r?\n/)[0] || "";
      const semis = (firstLine.match(/;/g) || []).length;
      const commas = (firstLine.match(/,/g) || []).length;
      const from = semis >= commas ? ";" : ",";
      const to = from === ";" ? "," : ";";
      const wb = window.XLSX.read(text, { type: "string", FS: from });
      const csv = window.XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]], { FS: to });
      return {
        files: [{ blob: new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), filename: baseName(file.name) + "-convertido.csv", label: "Baixar CSV" }],
        note: `Separador trocado de "${from}" para "${to}".`,
      };
    },
  },

  "hash-de-arquivo": {
    accept: "*/*",
    dropText: "Arraste qualquer arquivo para calcular o hash",
    fields: [
      {
        id: "algo", label: "Algoritmo", type: "select", default: "SHA-256",
        options: [
          { value: "SHA-256", label: "SHA-256 (padrão)" },
          { value: "SHA-1", label: "SHA-1" },
          { value: "SHA-512", label: "SHA-512" },
        ],
      },
    ],
    async run(files, opts, progress) {
      const file = files[0]!;
      const algo = opts.algo || "SHA-256";
      progress(`Calculando ${algo}…`);
      const digest = await crypto.subtle.digest(algo, await file.arrayBuffer());
      const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
      return {
        text: { value: hex, filename: `${baseName(file.name)}-${algo.toLowerCase().replace("-", "")}.txt` },
        note: `${algo} de "${file.name}"`,
      };
    },
  },
};

export const getFileTool = (slug: string): FileToolDef | undefined => FILE_TOOLS[slug];
