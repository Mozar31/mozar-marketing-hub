import Link from "next/link";
import { CATEGORIES, type Tool, type ToolBadge } from "@/lib/registry";

/** Selos honestos de estado — §6 "estados obrigatórios". */
const BADGE_STYLE: Record<ToolBadge, { label: string; className: string; title: string }> = {
  "local-only": {
    label: "seguro",
    className: "bg-ok-500/15 text-ok-400 border-ok-500/30",
    title: "Seus arquivos ficam no seu computador — não são enviados pela internet",
  },
  "usa-api": {
    label: "usa API",
    className: "bg-info-500/15 text-info-400 border-info-500/30",
    title: "Consulta uma API externa oficial; a fonte é identificada no resultado",
  },
  beta: {
    label: "beta",
    className: "bg-warn-500/15 text-warn-400 border-warn-500/30",
    title: "Em testes — pode mudar",
  },
  novo: {
    label: "novo",
    className: "bg-action-500/20 text-action-400 border-action-500/40",
    title: "Adicionado recentemente",
  },
};

export function Badge({ badge }: { badge: ToolBadge }) {
  const s = BADGE_STYLE[badge];
  return (
    <span
      title={s.title}
      className={`rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold ${s.className}`}
    >
      {s.label}
    </span>
  );
}

/**
 * Placa de ícone com leve gradiente e anel — dá um respiro visual aos cards
 * mantendo a identidade (navy + ciano/azul), sem depender de imagens externas.
 */
export function IconTile({ icon, size = "md" }: { icon?: string; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "h-14 w-14 text-2xl" : size === "md" ? "h-11 w-11 text-xl" : "h-9 w-9 text-lg";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-info-500/20 to-action-500/10 ring-1 ring-inset ring-white/10 transition group-hover:ring-info-500/40`}
    >
      {icon}
    </span>
  );
}

export function ToolCard({ tool, compact = false }: { tool: Tool; compact?: boolean }) {
  const cat = CATEGORIES.find((c) => c.slug === tool.category);
  return (
    <Link
      href={`/ferramentas/${tool.slug}/`}
      className="card-surface group flex flex-col gap-2.5 p-5 transition hover:-translate-y-0.5 hover:border-info-500/50 hover:shadow-lg hover:shadow-info-500/5"
    >
      <IconTile icon={cat?.icon} size="sm" />
      <span className="font-display text-[0.95rem] font-bold leading-snug group-hover:text-info-400">
        {tool.title}
      </span>
      {!compact && <span className="text-[0.8rem] leading-relaxed text-ink-400">{tool.tagline}</span>}
      {tool.badges.length > 0 && (
        <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {tool.badges.map((b) => (
            <Badge key={b} badge={b} />
          ))}
        </span>
      )}
    </Link>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Você está em" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-[0.75rem] text-ink-400">
        <li>
          <Link href="/" className="hover:text-ink-200 hover:underline">Início</Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span aria-hidden="true">/</span>
            {item.href ? (
              <Link href={item.href} className="hover:text-ink-200 hover:underline">{item.label}</Link>
            ) : (
              <span className="text-ink-200" aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Bloco de CTA contextual — discreto, conforme §3 ("utilidade antes da venda"). */
export function CtaBlock({
  title,
  text,
  buttonLabel,
  href,
}: {
  title: string;
  text: string;
  buttonLabel: string;
  href: string;
}) {
  return (
    <aside className="mt-12 rounded-xl border border-action-500/40 bg-gradient-to-br from-action-500/15 to-info-500/[0.06] p-6">
      <h2 className="font-display text-base font-bold">{title}</h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-300">{text}</p>
      <a href={href} target="_blank" rel="noopener" className="btn-primary mt-4">
        {buttonLabel}
      </a>
    </aside>
  );
}

/** Rodapé de metodologia — §6: sempre citar fonte e data junto do dado. */
export function SourceNote({ source, note }: { source?: { name: string; url: string }; note?: string }) {
  if (!source && !note) return null;
  return (
    <p className="mt-6 border-t border-white/10 pt-4 text-[0.72rem] leading-relaxed text-ink-400">
      {source && (
        <>
          Fonte dos dados:{" "}
          <a href={source.url} target="_blank" rel="noopener" className="text-info-400 hover:underline">
            {source.name}
          </a>
          {note ? " · " : ""}
        </>
      )}
      {note}
    </p>
  );
}
