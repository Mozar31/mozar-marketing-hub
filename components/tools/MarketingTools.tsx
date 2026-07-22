"use client";

import { useMemo, useState } from "react";
import { fmtBRL, fmtNum, fmtDec, loadScript, canvasToBlob } from "@/lib/tools/runtime";
import { readShareParams, copyShareLink } from "@/lib/tools/share";
import { LIB } from "@/lib/config";

/* ════════════════════════════════════════════════════════════
   Calculadora universal de métricas de mídia (P0)
   Preenche o que falta a partir do que você tem.
   ════════════════════════════════════════════════════════════ */
export function MediaCalculator() {
  const [init] = useState(readShareParams);
  const [invest, setInvest] = useState(init.invest ?? "1000");
  const [impr, setImpr] = useState(init.impr ?? "100000");
  const [cliques, setCliques] = useState(init.cliques ?? "1500");
  const [conv, setConv] = useState(init.conv ?? "45");
  const [receita, setReceita] = useState(init.receita ?? "9000");
  const [copiado, setCopiado] = useState(false);

  const copiarLink = async () => {
    if (await copyShareLink({ invest, impr, cliques, conv, receita })) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const num = (v: string) => {
    const x = parseFloat(v.replace(",", "."));
    return Number.isFinite(x) && x > 0 ? x : 0;
  };

  const m = useMemo(() => {
    const i = num(invest), im = num(impr), cl = num(cliques), cv = num(conv), rc = num(receita);
    return {
      cpm: im > 0 ? (i / im) * 1000 : 0,
      cpc: cl > 0 ? i / cl : 0,
      ctr: im > 0 ? (cl / im) * 100 : 0,
      cpa: cv > 0 ? i / cv : 0,
      txConv: cl > 0 ? (cv / cl) * 100 : 0,
      roas: i > 0 ? rc / i : 0,
      ticket: cv > 0 ? rc / cv : 0,
      lucro: rc - i,
    };
  }, [invest, impr, cliques, conv, receita]);

  const limpar = () => {
    setInvest(""); setImpr(""); setCliques(""); setConv(""); setReceita("");
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-400">
          Preencha os números que você tem — as métricas derivadas são calculadas automaticamente.
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={copiarLink} className="btn-ghost text-xs" title="Copia um link com estes números para compartilhar">
            {copiado ? "✓ Link copiado!" : "🔗 Copiar link"}
          </button>
          <button type="button" onClick={limpar} className="btn-ghost text-xs">
            🧹 Limpar
          </button>
        </div>
      </div>
      <div className="card-surface grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <NumField label="Investimento (R$)" value={invest} onChange={setInvest} />
        <NumField label="Impressões" value={impr} onChange={setImpr} />
        <NumField label="Cliques" value={cliques} onChange={setCliques} />
        <NumField label="Conversões / vendas" value={conv} onChange={setConv} />
        <NumField label="Receita gerada (R$)" value={receita} onChange={setReceita} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="CPM" value={fmtBRL.format(m.cpm)} formula="investimento ÷ impressões × 1000" />
        <Metric label="CPC" value={fmtBRL.format(m.cpc)} formula="investimento ÷ cliques" />
        <Metric label="CTR" value={fmtDec.format(m.ctr) + "%"} formula="cliques ÷ impressões" />
        <Metric label="Taxa de conversão" value={fmtDec.format(m.txConv) + "%"} formula="conversões ÷ cliques" />
        <Metric label="CPA" value={fmtBRL.format(m.cpa)} formula="investimento ÷ conversões" />
        <Metric label="Ticket médio" value={fmtBRL.format(m.ticket)} formula="receita ÷ conversões" />
        <Metric
          label="ROAS" value={fmtDec.format(m.roas) + "x"} formula="receita ÷ investimento"
          valueClass={m.roas >= 3 ? "text-ok-400" : m.roas >= 1.5 ? "text-warn-400" : "text-bad-400"}
        />
        <Metric
          label="Resultado" value={fmtBRL.format(m.lucro)} formula="receita − investimento"
          valueClass={m.lucro > 0 ? "text-ok-400" : "text-bad-400"}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Break-even ROAS, CAC e LTV (P0)
   ════════════════════════════════════════════════════════════ */
export function BreakEvenTool() {
  const [init] = useState(readShareParams);
  const [ticket, setTicket] = useState(init.ticket ?? "500");
  const [margem, setMargem] = useState(init.margem ?? "40");
  const [compras, setCompras] = useState(init.compras ?? "2");
  const [meses, setMeses] = useState(init.meses ?? "12");
  const [cacAtual, setCacAtual] = useState(init.cacAtual ?? "80");
  const [copiado, setCopiado] = useState(false);

  const copiarLink = async () => {
    if (await copyShareLink({ ticket, margem, compras, meses, cacAtual })) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const num = (v: string) => {
    const x = parseFloat(v.replace(",", "."));
    return Number.isFinite(x) && x >= 0 ? x : 0;
  };

  const r = useMemo(() => {
    const tk = num(ticket);
    const mg = num(margem) / 100;
    const freq = num(compras);
    const lucroPorVenda = tk * mg;
    const ltv = lucroPorVenda * freq;
    const roasBreakEven = mg > 0 ? 1 / mg : 0;
    const cacMax = ltv;
    const cacMaxPrimeira = lucroPorVenda;
    const cac = num(cacAtual);
    const razao = cac > 0 ? ltv / cac : 0;
    const payback = lucroPorVenda > 0 ? cac / lucroPorVenda : 0;
    return { lucroPorVenda, ltv, roasBreakEven, cacMax, cacMaxPrimeira, razao, payback, cac };
  }, [ticket, margem, compras, cacAtual]);

  const saudavel = r.razao >= 3;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <p className="max-w-xl text-sm text-ink-400">
          Descubra o mínimo que sua campanha precisa entregar para não dar prejuízo — e até quanto vale
          a pena pagar por um cliente novo.
        </p>
        <button type="button" onClick={copiarLink} className="btn-ghost shrink-0 text-xs" title="Copia um link com estes números para compartilhar">
          {copiado ? "✓ Link copiado!" : "🔗 Copiar link"}
        </button>
      </div>
      <div className="card-surface grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <NumField label="Ticket médio (R$)" value={ticket} onChange={setTicket} />
        <NumField label="Margem de lucro (%)" value={margem} onChange={setMargem} hint="Quanto sobra depois dos custos" />
        <NumField label="Compras por cliente" value={compras} onChange={setCompras} hint="Quantas vezes ele compra no período" />
        <NumField label="Período considerado (meses)" value={meses} onChange={setMeses} />
        <NumField label="Seu CAC atual (R$)" value={cacAtual} onChange={setCacAtual} hint="Quanto você gasta hoje para conquistar um cliente" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Lucro por venda" value={fmtBRL.format(r.lucroPorVenda)} formula="ticket × margem" />
        <Metric label="LTV (valor do cliente)" value={fmtBRL.format(r.ltv)} formula="lucro por venda × nº de compras" highlight />
        <Metric label="ROAS de equilíbrio" value={fmtDec.format(r.roasBreakEven) + "x"} formula="1 ÷ margem" highlight />
        <Metric label="CAC máximo (com recompra)" value={fmtBRL.format(r.cacMax)} formula="= LTV" />
        <Metric label="CAC máx. na 1ª venda" value={fmtBRL.format(r.cacMaxPrimeira)} formula="= lucro por venda" />
        <Metric
          label="Relação LTV : CAC" value={fmtDec.format(r.razao) + " : 1"}
          formula="LTV ÷ CAC" valueClass={saudavel ? "text-ok-400" : r.razao >= 1 ? "text-warn-400" : "text-bad-400"} highlight
        />
        <Metric label="Vendas para pagar o CAC" value={fmtDec.format(r.payback)} formula="CAC ÷ lucro por venda" />
      </div>

      <div className="mt-5 rounded-xl border border-info-500/20 bg-info-500/[0.05] p-5">
        <h2 className="font-display text-sm font-bold">O que esses números dizem</h2>
        <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink-300">
          <li>
            Com margem de <strong className="text-ink-100">{num(margem)}%</strong>, cada real investido
            precisa retornar pelo menos{" "}
            <strong className="text-ink-100">{fmtDec.format(r.roasBreakEven)}x</strong> em faturamento só
            para empatar. Abaixo disso, a campanha dá prejuízo mesmo vendendo.
          </li>
          <li>
            Considerando {num(compras)} compra(s) por cliente em {num(meses)} meses, você pode pagar até{" "}
            <strong className="text-ink-100">{fmtBRL.format(r.cacMax)}</strong> por cliente novo — mas
            precisa de caixa para esperar o retorno.
          </li>
          <li>
            {saudavel
              ? `Sua relação LTV : CAC de ${fmtDec.format(r.razao)} : 1 está no patamar considerado saudável no mercado (referência usual de 3:1).`
              : r.razao >= 1
                ? `Sua relação LTV : CAC de ${fmtDec.format(r.razao)} : 1 está positiva, mas com folga pequena. A referência usual de mercado é 3:1.`
                : `Atenção: seu CAC atual é maior que o valor do cliente. Cada aquisição está custando mais do que retorna.`}
          </li>
        </ul>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Construtor de UTM (P0)
   ════════════════════════════════════════════════════════════ */
const SOURCE_PRESETS = [
  { source: "google", medium: "cpc", label: "Google Ads" },
  { source: "facebook", medium: "paid_social", label: "Facebook Ads" },
  { source: "instagram", medium: "paid_social", label: "Instagram Ads" },
  { source: "whatsapp", medium: "referral", label: "WhatsApp" },
  { source: "email", medium: "email", label: "E-mail marketing" },
  { source: "linkedin", medium: "social", label: "LinkedIn" },
  { source: "instagram", medium: "bio", label: "Link da bio" },
];

const slugify = (s: string) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function UtmBuilder() {
  const [url, setUrl] = useState("");
  const [source, setSource] = useState("google");
  const [medium, setMedium] = useState("cpc");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [term, setTerm] = useState("");
  const [copied, setCopied] = useState(false);

  const built = useMemo(() => {
    const base = url.trim();
    if (!base) return { link: "", error: null as string | null };
    let normalized = base;
    if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;
    let u: URL;
    try {
      u = new URL(normalized);
    } catch {
      return { link: "", error: "Endereço inválido. Confira o link de destino." };
    }
    if (!u.hostname.includes(".")) return { link: "", error: "Endereço inválido. Confira o link de destino." };
    const params: [string, string][] = [
      ["utm_source", slugify(source)],
      ["utm_medium", slugify(medium)],
      ["utm_campaign", slugify(campaign)],
      ["utm_content", slugify(content)],
      ["utm_term", slugify(term)],
    ];
    params.forEach(([k, v]) => {
      if (v) u.searchParams.set(k, v);
      else u.searchParams.delete(k);
    });
    return { link: u.toString(), error: null };
  }, [url, source, medium, campaign, content, term]);

  const missing = !slugify(source) || !slugify(medium) || !slugify(campaign);

  const copy = async () => {
    if (!built.link) return;
    try {
      await navigator.clipboard.writeText(built.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard indisponível */ }
  };

  return (
    <div>
      <div className="mb-4 space-y-2 text-sm text-ink-400">
        <p>
          <strong className="text-ink-200">Para que serve:</strong> quando você divulga um link (num anúncio,
          num post, num e-mail), por padrão você não sabe de onde veio cada pessoa que clicou. A UTM é uma
          “etiqueta” que você cola no fim do link para saber exatamente isso.
        </p>
        <p>
          <strong className="text-ink-200">O que é rastreamento (trackeamento):</strong> é acompanhar de onde
          vem cada visitante e o que ele faz no seu site. Quem mostra esses números é o{" "}
          <strong className="text-ink-200">Google Analytics</strong> — uma ferramenta gratuita do Google que
          registra as visitas. Sem a etiqueta UTM, ele mostra “vieram do Instagram”; com ela, mostra
          “vieram do <em>anúncio de julho</em> no Instagram”.
        </p>
        <p className="text-xs">
          Dica: escreva sempre em minúsculas e sem acento — o Analytics trata “Julho” e “julho” como coisas
          diferentes.
        </p>
      </div>

      <div className="card-surface space-y-4 p-5">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-300">
          Link de destino *
          <input
            className="input-base" placeholder="seusite.com.br/promocao"
            value={url} onChange={(e) => setUrl(e.target.value)}
          />
        </label>

        <div>
          <p className="mb-2 text-xs font-semibold text-ink-300">Atalhos comuns</p>
          <div className="flex flex-wrap gap-2">
            {SOURCE_PRESETS.map((p) => (
              <button
                key={p.label} type="button"
                onClick={() => { setSource(p.source); setMedium(p.medium); }}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  source === p.source && medium === p.medium
                    ? "border-action-500 bg-action-500/20 text-ink-100"
                    : "border-white/15 text-ink-300 hover:border-info-500/50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField label="Origem (utm_source) *" value={source} onChange={setSource} placeholder="google" hint="De onde vem o tráfego" />
          <TextField label="Mídia (utm_medium) *" value={medium} onChange={setMedium} placeholder="cpc" hint="Tipo: cpc, email, social…" />
          <TextField label="Campanha (utm_campaign) *" value={campaign} onChange={setCampaign} placeholder="black-friday-2026" hint="Nome da ação" />
          <TextField label="Conteúdo (utm_content)" value={content} onChange={setContent} placeholder="banner-azul" hint="Para testes A/B" />
          <TextField label="Termo (utm_term)" value={term} onChange={setTerm} placeholder="palavra-chave" hint="Usado em busca paga" />
        </div>
      </div>

      {built.error && (
        <p className="mt-4 rounded-lg border border-warn-500/50 bg-warn-500/10 p-3 text-sm text-warn-400" role="alert">
          ⚠️ {built.error}
        </p>
      )}

      {missing && url.trim() && !built.error && (
        <p className="mt-4 rounded-lg border border-warn-500/40 bg-warn-500/[0.07] p-3 text-xs text-warn-400">
          Origem, mídia e campanha são os três campos que o Google Analytics realmente usa para
          agrupar. Preencha os três para o relatório sair certo.
        </p>
      )}

      {built.link && (
        <div className="card-surface mt-4 border-ok-500/30 p-5">
          <p className="font-display text-sm font-bold text-ok-400">Link pronto</p>
          <textarea readOnly value={built.link} rows={3} className="input-base mono mt-3 resize-y text-xs" aria-label="Link com UTM" />
          <button type="button" onClick={copy} className="btn-primary mt-3 text-sm">
            {copied ? "Copiado ✓" : "📋 Copiar link"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Gerador de link e QR do WhatsApp (P0) — sem função de pagamento
   ════════════════════════════════════════════════════════════ */
export function WhatsappTool() {
  const [numero, setNumero] = useState("");
  const [msg, setMsg] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [gerando, setGerando] = useState(false);

  const link = useMemo(() => {
    const digits = numero.replace(/\D/g, "");
    if (!digits) return "";
    const full = digits.length <= 11 && !digits.startsWith("55") ? "55" + digits : digits;
    return `https://wa.me/${full}${msg.trim() ? "?text=" + encodeURIComponent(msg.trim()) : ""}`;
  }, [numero, msg]);

  const gerarQr = async () => {
    setErro(null);
    if (!link) { setErro("Informe o número com DDD."); return; }
    setGerando(true);
    try {
      await loadScript(LIB.qrcode);
      const qrLib = (window as unknown as { qrcode: (t: number, e: string) => {
        addData: (s: string) => void; make: () => void; getModuleCount: () => number; isDark: (r: number, c: number) => boolean;
      } }).qrcode;
      const q = qrLib(0, "M");
      q.addData(link);
      q.make();
      const count = q.getModuleCount();
      const cell = 10;
      const margin = 4 * cell;
      const size = count * cell + margin * 2;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#000";
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (q.isDark(r, c)) ctx.fillRect(margin + c * cell, margin + r * cell, cell, cell);
        }
      }
      const blob = await canvasToBlob(canvas, "image/png");
      setQr(URL.createObjectURL(blob));
    } catch {
      setErro("Não foi possível gerar o QR Code. Verifique sua conexão e tente de novo.");
    } finally {
      setGerando(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard indisponível */ }
  };

  return (
    <div>
      <p className="mb-4 text-sm text-ink-400">
        Gere um link que abre a conversa no seu WhatsApp com a mensagem já digitada. Use em anúncios,
        no site, na bio ou impresso como QR Code.
      </p>

      <div className="card-surface grid gap-4 p-5 sm:grid-cols-2">
        <TextField label="Número com DDD *" value={numero} onChange={setNumero} placeholder="51999999999" hint="Só números. O 55 do Brasil é adicionado automaticamente." />
        <TextField label="Mensagem pré-preenchida" value={msg} onChange={setMsg} placeholder="Olá! Vim pelo site e quero saber mais sobre…" hint="Opcional, mas aumenta a taxa de resposta." />
      </div>

      {link && (
        <div className="card-surface mt-4 border-ok-500/30 p-5">
          <p className="font-display text-sm font-bold text-ok-400">Link pronto</p>
          <textarea readOnly value={link} rows={2} className="input-base mono mt-3 resize-y text-xs" aria-label="Link do WhatsApp" />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={copy} className="btn-primary text-sm">
              {copied ? "Copiado ✓" : "📋 Copiar link"}
            </button>
            <a href={link} target="_blank" rel="noopener" className="btn-ghost">Testar link</a>
            <button type="button" onClick={gerarQr} className="btn-ghost" disabled={gerando}>
              {gerando ? "Gerando…" : "Gerar QR Code"}
            </button>
          </div>

          {erro && <p className="mt-3 text-sm text-warn-400" role="alert">⚠️ {erro}</p>}

          {qr && (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR Code do link do WhatsApp" className="max-w-[220px] rounded-lg" />
              <a href={qr} download="qr-whatsapp.png" className="btn-primary mt-3 text-sm">
                ⬇️ Baixar QR Code (PNG)
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────── campos compartilhados ─────────────── */

function NumField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-300">
      {label}
      <input type="number" step="any" min="0" className="input-base mono" value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="font-normal text-[0.7rem] text-ink-400">{hint}</span>}
    </label>
  );
}

function TextField({ label, value, onChange, placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-300">
      {label}
      <input type="text" className="input-base" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="font-normal text-[0.7rem] text-ink-400">{hint}</span>}
    </label>
  );
}

function Metric({ label, value, formula, valueClass, highlight }: { label: string; value: string; formula?: string; valueClass?: string; highlight?: boolean }) {
  return (
    <div className={`card-surface p-4 ${highlight ? "border-info-500/40 bg-info-500/[0.05]" : ""}`}>
      <p className="text-[0.66rem] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className={`mono mt-1 text-lg font-bold ${valueClass ?? ""}`}>{value}</p>
      {formula && <p className="mono mt-1 text-[0.62rem] text-ink-400">{formula}</p>}
    </div>
  );
}

export { fmtNum };
