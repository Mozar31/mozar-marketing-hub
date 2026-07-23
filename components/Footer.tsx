import Link from "next/link";
import { CATEGORIES } from "@/lib/registry";

export function Footer() {
  const year = 2026;
  return (
    <footer className="mt-20 border-t border-white/10 bg-navy-900/80">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="font-display text-sm font-extrabold">
            CONSIG INVEST <span className="text-info-400">|</span> MARKETING HUB
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink-400">
            Ferramentas para quem trabalha com marketing digital no Brasil. Em português, com
            metodologia clara e sem enrolação.
          </p>
        </div>

        <nav className="md:col-span-2" aria-label="Ferramentas por categoria">
          <p className="mb-3 font-display text-xs font-bold uppercase tracking-wide text-info-400">
            Ferramentas
          </p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/ferramentas/categoria/${c.slug}/`} className="inline-flex min-h-[44px] items-center py-1.5 text-xs text-ink-300 hover:text-ink-100">
                  {c.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/ferramentas/" className="inline-flex min-h-[44px] items-center py-1.5 text-xs font-semibold text-info-400 hover:underline">
                Ver todas
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="mb-3 font-display text-xs font-bold uppercase tracking-wide text-info-400">
            Consig Invest
          </p>
          <ul className="space-y-2">
            <li>
              <a href="https://www.consiginvest.com/" target="_blank" rel="noopener" className="inline-flex min-h-[44px] items-center py-1.5 text-xs text-ink-300 hover:text-ink-100">
                Site da agência
              </a>
            </li>
            <li>
              <Link href="/sobre/" className="inline-flex min-h-[44px] items-center py-1.5 text-xs text-ink-300 hover:text-ink-100">
                Como funciona o Hub
              </Link>
            </li>
            <li>
              <Link href="/privacidade/" className="inline-flex min-h-[44px] items-center py-1.5 text-xs text-ink-300 hover:text-ink-100">
                Privacidade e dados
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/[0.07] px-4 py-5">
        <p className="mx-auto max-w-7xl text-center text-[0.7rem] text-ink-400">
          © {year} Consig Invest Marketing Digital · São Leopoldo/RS ·{" "}
          <span className="text-ok-400">A maioria das ferramentas processa seus arquivos no próprio navegador</span>
        </p>
      </div>
    </footer>
  );
}
