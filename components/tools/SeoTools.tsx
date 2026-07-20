"use client";

import { useMemo, useState } from "react";

/* ════════════════════════════════════════════════════════════
   Prévia no Google e nas redes (P0)
   ════════════════════════════════════════════════════════════ */
const TITLE_LIMIT = 60;
const DESC_LIMIT = 160;

export function SerpPreview() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");

  const host = useMemo(() => {
    const raw = url.trim();
    if (!raw) return "seusite.com.br";
    try {
      return new URL(/^https?:\/\//i.test(raw) ? raw : "https://" + raw).hostname.replace(/^www\./, "");
    } catch {
      return "seusite.com.br";
    }
  }, [url]);

  const path = useMemo(() => {
    const raw = url.trim();
    if (!raw) return "";
    try {
      const p = new URL(/^https?:\/\//i.test(raw) ? raw : "https://" + raw).pathname;
      return p === "/" ? "" : p.split("/").filter(Boolean).join(" › ");
    } catch {
      return "";
    }
  }, [url]);

  const t = title || "Título da sua página aparece aqui";
  const d = desc || "A descrição aparece embaixo do título e é o que convence a pessoa a clicar no seu resultado em vez do concorrente.";
  const tOver = title.length > TITLE_LIMIT;
  const dOver = desc.length > DESC_LIMIT;

  return (
    <div>
      <p className="mb-4 text-sm text-ink-400">
        Escreva o título e a descrição da página e veja, antes de publicar, como o link aparece na
        busca do Google e ao ser compartilhado no WhatsApp.
      </p>

      <div className="card-surface space-y-4 p-5">
        <Field label="Endereço da página" value={url} onChange={setUrl} placeholder="seusite.com.br/servicos/consultoria" />
        <Field label="Título (title)" value={title} onChange={setTitle} placeholder="Consultoria de Marketing em Porto Alegre | Sua Empresa" counter={{ len: title.length, limit: TITLE_LIMIT }} />
        <Field label="Descrição (meta description)" value={desc} onChange={setDesc} textarea placeholder="Explique em uma frase o que a pessoa encontra na página e por que vale clicar." counter={{ len: desc.length, limit: DESC_LIMIT }} />
      </div>

      {(tOver || dOver) && (
        <p className="mt-4 rounded-lg border border-warn-500/40 bg-warn-500/[0.07] p-3 text-xs leading-relaxed text-warn-400">
          ⚠️ {tOver && `O título passou de ${TITLE_LIMIT} caracteres. `}
          {dOver && `A descrição passou de ${DESC_LIMIT} caracteres. `}
          O Google costuma cortar o texto excedente com “…”. Os limites são aproximados porque o
          Google mede em pixels, não em letras.
        </p>
      )}

      {/* Prévia Google */}
      <section className="mt-6">
        <h2 className="mb-2 font-display text-sm font-bold text-info-400">No resultado do Google</h2>
        <div className="rounded-xl bg-white p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-[0.6rem] text-gray-600">
              {host.charAt(0).toUpperCase()}
            </span>
            <span>
              <span className="block text-[0.78rem] leading-tight text-[#202124]">{host.split(".")[0]}</span>
              <span className="block text-[0.72rem] leading-tight text-[#4d5156]">
                https://{host}{path ? " › " + path : ""}
              </span>
            </span>
          </div>
          <p className="mt-1.5 truncate text-[1.15rem] leading-snug text-[#1a0dab]">{t}</p>
          <p className="mt-0.5 text-[0.82rem] leading-snug text-[#4d5156]">
            {d.length > DESC_LIMIT ? d.slice(0, DESC_LIMIT) + "…" : d}
          </p>
        </div>
      </section>

      {/* Prévia WhatsApp / redes */}
      <section className="mt-5">
        <h2 className="mb-2 font-display text-sm font-bold text-info-400">Compartilhado no WhatsApp</h2>
        <div className="max-w-sm rounded-xl bg-[#075E54] p-3">
          <div className="rounded-lg bg-[#DCF8C6] p-2.5">
            <div className="rounded bg-white/70 p-2">
              <p className="text-[0.7rem] uppercase text-gray-500">{host}</p>
              <p className="mt-0.5 line-clamp-2 text-[0.8rem] font-semibold leading-snug text-gray-900">{t}</p>
              <p className="mt-0.5 line-clamp-2 text-[0.72rem] leading-snug text-gray-600">{d}</p>
            </div>
            <p className="mt-1.5 text-[0.72rem] text-blue-700">https://{host}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-400">
          A imagem de compartilhamento (og:image) não é simulada aqui — depende do arquivo publicado
          no seu site.
        </p>
      </section>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Gerador de dados estruturados (P0)
   ════════════════════════════════════════════════════════════ */
type SchemaType =
  | "LocalBusiness"
  | "Organization"
  | "FAQPage"
  | "Product"
  | "Article"
  | "Event"
  | "BreadcrumbList"
  | "SoftwareApplication";

const SCHEMA_LABELS: Record<SchemaType, string> = {
  LocalBusiness: "Empresa local",
  Organization: "Organização",
  FAQPage: "Perguntas frequentes",
  Product: "Produto",
  Article: "Artigo",
  Event: "Evento",
  BreadcrumbList: "Caminho (breadcrumb)",
  SoftwareApplication: "Aplicativo / software",
};

export function SchemaGenerator() {
  const [type, setType] = useState<SchemaType>("LocalBusiness");
  const [f, setF] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const set = (k: string, v: string) => setF((o) => ({ ...o, [k]: v }));

  const json = useMemo(() => {
    const base: Record<string, unknown> = { "@context": "https://schema.org", "@type": type };
    if (type === "LocalBusiness") {
      Object.assign(base, {
        name: f.name || undefined,
        telephone: f.phone || undefined,
        url: f.url || undefined,
        address: (f.street || f.city)
          ? { "@type": "PostalAddress", streetAddress: f.street || undefined, addressLocality: f.city || undefined, addressRegion: f.state || undefined, postalCode: f.zip || undefined, addressCountry: "BR" }
          : undefined,
        openingHours: f.hours || undefined,
        priceRange: f.price || undefined,
      });
    } else if (type === "FAQPage") {
      const pairs: { q: string; a: string }[] = [];
      for (let i = 1; i <= 3; i++) {
        const q = f[`q${i}`];
        const a = f[`a${i}`];
        if (q && a) pairs.push({ q, a });
      }
      Object.assign(base, {
        mainEntity: pairs.map((p) => ({
          "@type": "Question",
          name: p.q,
          acceptedAnswer: { "@type": "Answer", text: p.a },
        })),
      });
    } else if (type === "Product") {
      Object.assign(base, {
        name: f.name || undefined,
        description: f.desc || undefined,
        brand: f.brand ? { "@type": "Brand", name: f.brand } : undefined,
        offers: f.price
          ? { "@type": "Offer", price: f.price, priceCurrency: "BRL", availability: "https://schema.org/InStock" }
          : undefined,
      });
    } else if (type === "Article") {
      Object.assign(base, {
        headline: f.name || undefined,
        description: f.desc || undefined,
        author: f.author ? { "@type": "Person", name: f.author } : undefined,
        datePublished: f.date || undefined,
      });
    } else if (type === "Organization") {
      Object.assign(base, {
        name: f.name || undefined,
        url: f.url || undefined,
        logo: f.logo || undefined,
        telephone: f.phone || undefined,
        // sameAs = perfis oficiais (uma URL por linha)
        sameAs: f.sameAs
          ? f.sameAs.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
          : undefined,
      });
    } else if (type === "Event") {
      Object.assign(base, {
        name: f.name || undefined,
        startDate: f.start || undefined,
        endDate: f.end || undefined,
        eventAttendanceMode: f.online
          ? "https://schema.org/OnlineEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
        location: f.online
          ? (f.url ? { "@type": "VirtualLocation", url: f.url } : undefined)
          : (f.place || f.city)
            ? { "@type": "Place", name: f.place || undefined, address: f.city || undefined }
            : undefined,
        offers: f.price
          ? { "@type": "Offer", price: f.price, priceCurrency: "BRL", url: f.url || undefined }
          : undefined,
      });
    } else if (type === "BreadcrumbList") {
      const items: { name: string; url: string }[] = [];
      for (let i = 1; i <= 4; i++) {
        const name = f[`n${i}`];
        const url = f[`u${i}`];
        if (name) items.push({ name, url: url || "" });
      }
      Object.assign(base, {
        itemListElement: items.map((it, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: it.name,
          item: it.url || undefined,
        })),
      });
    } else if (type === "SoftwareApplication") {
      Object.assign(base, {
        name: f.name || undefined,
        applicationCategory: f.category || undefined,
        operatingSystem: f.os || undefined,
        offers: {
          "@type": "Offer",
          price: f.price || "0",
          priceCurrency: "BRL",
        },
        aggregateRating: (f.rating && f.count)
          ? { "@type": "AggregateRating", ratingValue: f.rating, ratingCount: f.count }
          : undefined,
      });
    }
    const clean = JSON.parse(JSON.stringify(base, (_k, v) => (v === undefined || v === "" ? undefined : v)));
    return JSON.stringify(clean, null, 2);
  }, [type, f]);

  const snippet = `<script type="application/ld+json">\n${json}\n</script>`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard indisponível */ }
  };

  return (
    <div>
      <p className="mb-4 text-sm text-ink-400">
        Dados estruturados ajudam o Google a entender o conteúdo da página e podem habilitar
        resultados enriquecidos. Gere o código e cole dentro da tag <code className="mono">&lt;head&gt;</code> do seu site.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(SCHEMA_LABELS) as SchemaType[]).map((t) => (
          <button
            key={t} type="button" onClick={() => { setType(t); setF({}); }}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              type === t ? "border-action-500 bg-action-500/20 text-ink-100" : "border-white/15 text-ink-300 hover:border-info-500/50"
            }`}
          >
            {SCHEMA_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="card-surface grid gap-4 p-5 sm:grid-cols-2">
        {type === "LocalBusiness" && (
          <>
            <Field label="Nome da empresa" value={f.name || ""} onChange={(v) => set("name", v)} placeholder="Consig Invest" />
            <Field label="Telefone" value={f.phone || ""} onChange={(v) => set("phone", v)} placeholder="+55 51 98349-3659" />
            <Field label="Site" value={f.url || ""} onChange={(v) => set("url", v)} placeholder="https://suaempresa.com.br" />
            <Field label="Rua e número" value={f.street || ""} onChange={(v) => set("street", v)} placeholder="Av. Exemplo, 100" />
            <Field label="Cidade" value={f.city || ""} onChange={(v) => set("city", v)} placeholder="São Leopoldo" />
            <Field label="Estado (UF)" value={f.state || ""} onChange={(v) => set("state", v)} placeholder="RS" />
            <Field label="CEP" value={f.zip || ""} onChange={(v) => set("zip", v)} placeholder="93000-000" />
            <Field label="Horário" value={f.hours || ""} onChange={(v) => set("hours", v)} placeholder="Mo-Fr 09:00-18:00" hint="Formato Schema.org" />
          </>
        )}
        {type === "FAQPage" && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="contents">
                <Field label={`Pergunta ${i}`} value={f[`q${i}`] || ""} onChange={(v) => set(`q${i}`, v)} placeholder="Quanto custa o serviço?" />
                <Field label={`Resposta ${i}`} value={f[`a${i}`] || ""} onChange={(v) => set(`a${i}`, v)} textarea placeholder="O investimento varia conforme…" />
              </div>
            ))}
          </>
        )}
        {type === "Product" && (
          <>
            <Field label="Nome do produto" value={f.name || ""} onChange={(v) => set("name", v)} />
            <Field label="Marca" value={f.brand || ""} onChange={(v) => set("brand", v)} />
            <Field label="Preço (R$)" value={f.price || ""} onChange={(v) => set("price", v)} placeholder="199.90" />
            <Field label="Descrição" value={f.desc || ""} onChange={(v) => set("desc", v)} textarea />
          </>
        )}
        {type === "Article" && (
          <>
            <Field label="Título do artigo" value={f.name || ""} onChange={(v) => set("name", v)} />
            <Field label="Autor" value={f.author || ""} onChange={(v) => set("author", v)} />
            <Field label="Data de publicação" value={f.date || ""} onChange={(v) => set("date", v)} placeholder="2026-07-19" />
            <Field label="Resumo" value={f.desc || ""} onChange={(v) => set("desc", v)} textarea />
          </>
        )}
        {type === "Organization" && (
          <>
            <Field label="Nome da organização" value={f.name || ""} onChange={(v) => set("name", v)} placeholder="Consig Invest" />
            <Field label="Site" value={f.url || ""} onChange={(v) => set("url", v)} placeholder="https://consiginvest.com" />
            <Field label="Logo (URL da imagem)" value={f.logo || ""} onChange={(v) => set("logo", v)} placeholder="https://.../logo.png" />
            <Field label="Telefone" value={f.phone || ""} onChange={(v) => set("phone", v)} placeholder="+55 51 98349-3659" />
            <Field label="Perfis oficiais (um por linha)" value={f.sameAs || ""} onChange={(v) => set("sameAs", v)} textarea placeholder={"https://instagram.com/suaempresa\nhttps://linkedin.com/company/suaempresa"} hint="Instagram, LinkedIn, Facebook…" />
          </>
        )}
        {type === "Event" && (
          <>
            <Field label="Nome do evento" value={f.name || ""} onChange={(v) => set("name", v)} placeholder="Workshop de Marketing" />
            <Field label="Início" value={f.start || ""} onChange={(v) => set("start", v)} placeholder="2026-08-15T19:00" hint="Data e hora (ISO)" />
            <Field label="Fim" value={f.end || ""} onChange={(v) => set("end", v)} placeholder="2026-08-15T21:00" hint="Opcional" />
            <Field label="Preço (R$)" value={f.price || ""} onChange={(v) => set("price", v)} placeholder="0 para gratuito" />
            <label className="flex items-center gap-2 text-xs font-semibold text-ink-300 sm:col-span-2">
              <input type="checkbox" checked={!!f.online} onChange={(e) => set("online", e.target.checked ? "1" : "")} className="h-4 w-4" />
              Evento online
            </label>
            {f.online ? (
              <Field label="Link do evento online" value={f.url || ""} onChange={(v) => set("url", v)} placeholder="https://zoom.us/j/..." />
            ) : (
              <>
                <Field label="Local" value={f.place || ""} onChange={(v) => set("place", v)} placeholder="Centro de Eventos" />
                <Field label="Endereço / cidade" value={f.city || ""} onChange={(v) => set("city", v)} placeholder="São Leopoldo, RS" />
              </>
            )}
          </>
        )}
        {type === "BreadcrumbList" && (
          <>
            <p className="text-xs text-ink-400 sm:col-span-2">
              A trilha de navegação da página, do geral ao específico. Preencha ao menos 2 níveis.
            </p>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="contents">
                <Field label={`Nível ${i} — nome`} value={f[`n${i}`] || ""} onChange={(v) => set(`n${i}`, v)} placeholder={i === 1 ? "Início" : i === 2 ? "Ferramentas" : ""} />
                <Field label={`Nível ${i} — link`} value={f[`u${i}`] || ""} onChange={(v) => set(`u${i}`, v)} placeholder="https://…" hint={i === 4 ? "Último pode ficar sem link" : undefined} />
              </div>
            ))}
          </>
        )}
        {type === "SoftwareApplication" && (
          <>
            <Field label="Nome do app" value={f.name || ""} onChange={(v) => set("name", v)} placeholder="Meu Aplicativo" />
            <Field label="Categoria" value={f.category || ""} onChange={(v) => set("category", v)} placeholder="BusinessApplication" hint="Ex.: BusinessApplication, GameApplication" />
            <Field label="Sistema" value={f.os || ""} onChange={(v) => set("os", v)} placeholder="Android, iOS, Web" />
            <Field label="Preço (R$)" value={f.price || ""} onChange={(v) => set("price", v)} placeholder="0 para gratuito" />
            <Field label="Nota média" value={f.rating || ""} onChange={(v) => set("rating", v)} placeholder="4.8" hint="Opcional — só se for real" />
            <Field label="Nº de avaliações" value={f.count || ""} onChange={(v) => set("count", v)} placeholder="120" hint="Opcional" />
          </>
        )}
      </div>

      <div className="card-surface mt-4 p-5">
        <p className="font-display text-sm font-bold text-info-400">Código gerado</p>
        <textarea readOnly value={snippet} rows={10} className="input-base mono mt-3 resize-y text-[0.7rem]" aria-label="Código JSON-LD" />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={copy} className="btn-primary text-sm">
            {copied ? "Copiado ✓" : "📋 Copiar código"}
          </button>
          <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener" className="btn-ghost">
            Testar no Google ↗
          </a>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-400">
          Marcação estruturada não garante resultado enriquecido — o Google decide quando exibir.
          Preencha somente informações verdadeiras sobre a página.
        </p>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, hint, textarea, counter,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; textarea?: boolean;
  counter?: { len: number; limit: number };
}) {
  const over = counter ? counter.len > counter.limit : false;
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-300">
      <span className="flex items-center justify-between">
        {label}
        {counter && (
          <span className={`mono text-[0.68rem] font-normal ${over ? "font-bold text-warn-400" : "text-ink-400"}`}>
            {counter.len}/{counter.limit}
          </span>
        )}
      </span>
      {textarea ? (
        <textarea className="input-base resize-y" rows={3} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" className="input-base" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <span className="font-normal text-[0.7rem] text-ink-400">{hint}</span>}
    </label>
  );
}
