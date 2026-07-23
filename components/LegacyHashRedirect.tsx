"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TOOLS } from "@/lib/registry";

/**
 * Compatibilidade com a versão anterior do Hub (PROMPT 06: "Mantenha
 * aliases/redirects/anchors antigos").
 *
 * A v1 era uma SPA com rotas por hash: #velocidade, #roi, #conversores/pdf-para-word…
 * Qualquer link já compartilhado continua funcionando: o hash é traduzido para a
 * nova URL real e o usuário é redirecionado sem ver erro.
 */
const LEGACY_MAP: Record<string, string> = (() => {
  // Só entradas que NÃO derivam de uma ferramenta. `conversores` (sem hash de
  // ferramenta) apontava para a página de CATEGORIA na v1. As demais (velocidade,
  // roi, google-meu-negocio) já vêm do loop abaixo via `tool.legacyHash`.
  const map: Record<string, string> = {
    conversores: "/ferramentas/categoria/conversores/",
  };
  for (const tool of TOOLS) {
    if (tool.legacyHash) map[tool.legacyHash] = `/ferramentas/${tool.slug}/`;
  }
  return map;
})();

export function LegacyHashRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirect = () => {
      const raw = window.location.hash.replace(/^#\/?/, "");
      if (!raw) return;
      const key = decodeURIComponent(raw);
      const dest = LEGACY_MAP[key];
      if (dest) {
        history.replaceState(null, "", window.location.pathname);
        router.replace(dest);
      }
    };
    redirect();
    window.addEventListener("hashchange", redirect);
    return () => window.removeEventListener("hashchange", redirect);
  }, [router]);

  return null;
}
