import Link from "next/link";
import { CATEGORIES, TOOLS, featuredTools, newTools } from "@/lib/registry";
import { ToolCard, CtaBlock, IconTile } from "@/components/ui";
import { waLink } from "@/lib/config";

/** Número exibido no hero — arredondado para baixo em dezena, para não "vender" número quebrado. */
const TOTAL_FERRAMENTAS = Math.floor(TOOLS.length / 10) * 10;

export default function Home() {
  const featured = featuredTools();
  const novos = newTools();

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Brilhos decorativos (sem imagem externa) — dão profundidade ao topo. */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-96 w-96 rounded-full bg-info-500/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute left-1/4 -top-10 h-72 w-72 rounded-full bg-action-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-12 md:pt-16">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-info-500/30 bg-info-500/10 px-3 py-1 text-[0.72rem] font-semibold text-info-400">
            Feito para quem trabalha com marketing digital no Brasil
          </p>
          <h1 className="max-w-3xl text-3xl font-extrabold leading-[1.15] md:text-5xl">
            O centro de ferramentas para{" "}
            <span className="bg-gradient-to-r from-info-400 to-action-400 bg-clip-text text-transparent">crescer no marketing digital</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-300 md:text-lg">
            Teste, calcule, converta e diagnostique — em português, com metodologia clara e sem
            precisar de cadastro. A maior parte das ferramentas roda direto no seu navegador, sem
            enviar arquivo para lugar nenhum.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/ferramentas/" className="btn-primary">
              Ver todas as ferramentas
            </Link>
            <Link href="/ferramentas/velocidade-e-seo/" className="btn-ghost">
              Testar velocidade do meu site
            </Link>
          </div>

          {/* Prova de tamanho — números reais do catálogo, sem inventar métrica. */}
          <dl className="mt-9 flex flex-wrap gap-x-8 gap-y-3">
            <div>
              <dt className="mono text-2xl font-bold text-ink-100">{TOTAL_FERRAMENTAS}+</dt>
              <dd className="text-xs text-ink-400">ferramentas prontas</dd>
            </div>
            <div>
              <dt className="mono text-2xl font-bold text-ink-100">{CATEGORIES.length}</dt>
              <dd className="text-xs text-ink-400">áreas de trabalho</dd>
            </div>
            <div>
              <dt className="mono text-2xl font-bold text-ink-100">0</dt>
              <dd className="text-xs text-ink-400">cadastro para usar</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ── Atalhos por função (§4: começar pela tarefa) ── */}
      <section className="mx-auto max-w-7xl px-4 py-8" aria-labelledby="por-funcao">
        <h2 id="por-funcao" className="mb-1 font-display text-lg font-bold">
          O que você faz?
        </h2>
        <p className="mb-5 text-sm text-ink-400">
          Escolha sua área e veja só as ferramentas que interessam para o seu trabalho.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/ferramentas/categoria/${cat.slug}/`}
                className="card-surface group p-5 transition hover:-translate-y-0.5 hover:border-info-500/50 hover:shadow-lg hover:shadow-info-500/5"
              >
                <IconTile icon={cat.icon} size="md" />
                <p className="mt-3 font-display text-sm font-bold group-hover:text-info-400">
                  {cat.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-400">{cat.description}</p>
                <p className="mt-3 mono text-[0.7rem] text-info-400">Ver ferramentas →</p>
              </Link>
          ))}
        </div>
      </section>

      {/* ── Destaques ── */}
      <section className="mx-auto max-w-7xl px-4 py-8" aria-labelledby="destaques">
        <h2 id="destaques" className="mb-1 font-display text-lg font-bold">
          Mais usadas
        </h2>
        <p className="mb-5 text-sm text-ink-400">As ferramentas que resolvem os pedidos mais frequentes.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      {/* ── Novidades reais (§6: sem dado falso) ── */}
      {novos.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8" aria-labelledby="novidades">
          <h2 id="novidades" className="mb-1 font-display text-lg font-bold">
            Novas no Hub
          </h2>
          <p className="mb-5 text-sm text-ink-400">
            Adicionadas na versão 2.0 do Marketing Hub.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {novos.slice(0, 8).map((tool) => (
              <ToolCard key={tool.slug} tool={tool} compact />
            ))}
          </div>
        </section>
      )}

      {/* ── Como funciona / confiança ── */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card-surface p-6">
            <p className="font-display text-sm font-bold text-ok-400">🔒 Seus arquivos ficam com você</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-300">
              Conversores de PDF, imagem e planilha processam tudo dentro do seu navegador. Nenhum
              upload, nenhuma cópia em servidor.
            </p>
          </div>
          <div className="card-surface p-6">
            <p className="font-display text-sm font-bold text-info-400">📊 Fonte sempre à vista</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-300">
              Quando o dado vem de fora — como o PageSpeed do Google — mostramos a origem, a data e o
              que aquele número significa na prática.
            </p>
          </div>
          <div className="card-surface p-6">
            <p className="font-display text-sm font-bold text-action-400">🎯 Sem cadastro para usar</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-300">
              Todas as ferramentas entregam o resultado sem login, sem e-mail e sem formulário no
              meio do caminho.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-4">
        <CtaBlock
          title="Precisa de mais do que uma ferramenta?"
          text="A Consig Invest cuida do marketing digital da sua empresa de ponta a ponta: sites, tráfego pago, SEO e automação — com foco em gerar clientes, não relatórios bonitos."
          buttonLabel="💬 Falar com um especialista"
          href={waLink("Olá, vim através do Hub da Consig Invest e gostaria de mais informações...")}
        />
      </div>
    </>
  );
}
