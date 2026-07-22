"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { FILE_TOOLS } from "@/lib/tools/converters";
import { FileTool } from "./FileTool";

/**
 * Despachante único: recebe o slug do registry e monta a ferramenta certa.
 * Cada componente pesado entra por import dinâmico para não carregar
 * o código de 42 ferramentas em toda página (§ desempenho).
 */

const loading = () => (
  <p className="mono py-8 text-center text-sm text-ink-400" role="status" aria-live="polite">
    Carregando ferramenta…
  </p>
);

const d = (fn: () => Promise<{ default: ComponentType }>): ComponentType =>
  dynamic(fn, { ssr: false, loading });

const SpeedTool = d(() => import("./SpeedTool").then((m) => ({ default: m.SpeedTool })));
const GmbTool = d(() => import("./GmbTool").then((m) => ({ default: m.GmbTool })));
const RoiTool = d(() => import("./RoiTool").then((m) => ({ default: m.RoiTool })));

const SerpPreview = d(() => import("./SeoTools").then((m) => ({ default: m.SerpPreview })));
const SchemaGenerator = d(() => import("./SeoTools").then((m) => ({ default: m.SchemaGenerator })));

const MediaCalculator = d(() => import("./MarketingTools").then((m) => ({ default: m.MediaCalculator })));
const BreakEvenTool = d(() => import("./MarketingTools").then((m) => ({ default: m.BreakEvenTool })));
const UtmBuilder = d(() => import("./MarketingTools").then((m) => ({ default: m.UtmBuilder })));
const WhatsappTool = d(() => import("./MarketingTools").then((m) => ({ default: m.WhatsappTool })));
const GoogleAdsTool = d(() => import("./AdsTools").then((m) => ({ default: m.GoogleAdsTool })));
const TagsTool = d(() => import("./SiteTools").then((m) => ({ default: m.TagsTool })));

const ColorStudio = d(() => import("./TextTools").then((m) => ({ default: m.ColorStudio })));
const JsonTool = d(() => import("./TextTools").then((m) => ({ default: m.JsonTool })));
const Base64Tool = d(() => import("./TextTools").then((m) => ({ default: m.Base64Tool })));
const UrlEncodeTool = d(() => import("./TextTools").then((m) => ({ default: m.UrlEncodeTool })));

const ContactCleaner = d(() => import("./DataTools").then((m) => ({ default: m.ContactCleaner })));
const CreativePresets = d(() => import("./DataTools").then((m) => ({ default: m.CreativePresets })));

/** Ferramentas com interface própria. As demais caem no FileTool genérico. */
const CUSTOM: Record<string, ComponentType> = {
  "velocidade-e-seo": SpeedTool,
  "ficha-google": GmbTool,
  "verificador-tags-pixels": TagsTool,
  "previa-google-e-redes": SerpPreview,
  "dados-estruturados": SchemaGenerator,

  "simulador-roi": RoiTool,
  "calculadora-de-midia": MediaCalculator,
  "break-even-cac-ltv": BreakEvenTool,
  "construtor-utm": UtmBuilder,
  "gerador-google-ads": GoogleAdsTool,

  "link-whatsapp": WhatsappTool,
  "presets-de-criativos": CreativePresets,

  "estudio-de-cores": ColorStudio,
  "limpar-lista-de-contatos": ContactCleaner,

  "formatar-json": JsonTool,
  "texto-base64": Base64Tool,
  "url-encode": UrlEncodeTool,
};

export function ToolRunner({ slug }: { slug: string }) {
  const Custom = CUSTOM[slug];
  if (Custom) return <Custom />;

  if (FILE_TOOLS[slug]) return <FileTool slug={slug} />;

  // PROMPT 17: nada de botão vazio — se chegou aqui, é falha de registro.
  return (
    <p className="rounded-lg border border-warn-500/50 bg-warn-500/10 p-4 text-sm text-warn-400" role="alert">
      ⚠️ Esta ferramenta ainda não está disponível. Escolha outra no menu Ferramentas.
    </p>
  );
}
