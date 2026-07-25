"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Instrumentação de eventos para o GTM/GA4 (cap. 18 da especificação).
 * Empurra eventos para o `dataLayer` sem tocar em cada ferramenta:
 *  - tool_view  → abriu a página de uma ferramenta (slug).
 *  - lead_click → clicou em um link de WhatsApp (wa.me) — sinal de lead.
 *  - guide_view → abriu um guia editorial.
 * Nada de conteúdo/PII é enviado — só o slug e a categoria da página.
 */

type DL = Record<string, unknown>;
function push(evt: DL) {
  const w = window as unknown as { dataLayer?: DL[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(evt);
}

export function Analytics() {
  const pathname = usePathname();

  // Página vista: dispara tool_view/guide_view conforme a rota.
  useEffect(() => {
    if (!pathname) return;
    const mTool = pathname.match(/^\/ferramentas\/([^/]+)\/?$/);
    if (mTool && mTool[1] !== "categoria") {
      push({ event: "tool_view", tool_slug: mTool[1] });
      return;
    }
    const mGuia = pathname.match(/^\/guias\/([^/]+)\/?$/);
    if (mGuia) push({ event: "guide_view", guide_slug: mGuia[1] });
  }, [pathname]);

  // Clique em WhatsApp (lead) — ouvinte único e delegado para toda a página.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const alvo = (e.target as HTMLElement | null)?.closest?.('a[href*="wa.me"]') as HTMLAnchorElement | null;
      if (!alvo) return;
      const ctx =
        window.location.pathname.match(/^\/ferramentas\/([^/]+)/)?.[1] ||
        (window.location.pathname === "/" ? "home" : window.location.pathname.replace(/^\//, "").split("/")[0] || "outro");
      push({ event: "lead_click", context_module: ctx });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
