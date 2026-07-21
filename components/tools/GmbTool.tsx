"use client";

import { useState } from "react";
import { GMB_ANALYZE, waLink } from "@/lib/config";

/**
 * Analisador de Google Business Profile — §23.
 * PROMPT 06: "remova ou cite claims quantitativos sem fonte".
 * Toda afirmação numérica sem fonte pública foi retirada nesta versão.
 */

interface Ficha {
  place_id: string;
  nome: string | null;
  categoria: string | null;
  endereco: string | null;
  telefone: string | null;
  site: string | null;
  horarios_cadastrados: boolean;
  dias_com_horario: number;
  nota: number | null;
  total_avaliacoes: number;
  qtd_fotos: number;
  status_negocio: string;
}

const isMapsLink = (raw: string) =>
  /(?:google\.[a-z.]+\/(?:maps|search)|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.|share\.google)/i.test(raw);

/**
 * Link vindo da BUSCA do Google (share.google, /search, kgmid) — carrega só o
 * nome, não o place_id da filial. Para empresas com unidades de mesmo nome,
 * pode trazer a matriz em vez da unidade escolhida. O link do Google MAPS
 * (maps.app.goo.gl / /maps/place) carrega o place_id exato.
 */
const isBuscaLink = (raw: string) =>
  /share\.google|google\.[a-z.]+\/search|[?&]kgmid=/i.test(raw) && !/\/maps\/place\//i.test(raw);

const fmtNota = (n: number) => String(n).replace(".", ",");

export function GmbTool() {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ msg: string; cta: boolean } | null>(null);
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [semFicha, setSemFicha] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFicha(null);
    setSemFicha(false);

    const raw = link.trim();
    if (!isMapsLink(raw)) {
      setError({
        msg: "Esse link não parece ser do Google Maps. Abra sua empresa no Maps → Compartilhar → Copiar link.",
        cta: false,
      });
      return;
    }

    setLoading(true);
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(GMB_ANALYZE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: raw }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error("http");
      const data = await res.json();

      if (data.error === "link_invalido")
        setError({ msg: "Esse link não parece ser do Google Maps. Abra sua empresa no Maps → Compartilhar → Copiar link.", cta: false });
      else if (data.error === "ficha_nao_encontrada" && isBuscaLink(raw))
        setError({
          msg: "Esse link veio da busca do Google e não identifica a unidade exata. Abra sua empresa no aplicativo do Google Maps → Compartilhar → Copiar link, e cole aqui.",
          cta: false,
        });
      else if (data.error === "ficha_nao_encontrada")
        setError({ msg: "Não encontramos essa ficha. Confira o link ou fale com um especialista.", cta: true });
      else if (data.error === "limite_diario")
        setError({ msg: "Alta demanda hoje! Tente amanhã ou fale direto com um especialista.", cta: true });
      else if (data.error) setError({ msg: "Ferramenta indisponível no momento.", cta: true });
      else if (data.nome || data.place_id) setFicha(data as Ficha);
      else setError({ msg: "Ferramenta indisponível no momento.", cta: true });
    } catch {
      setError({ msg: "Ferramenta indisponível no momento.", cta: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Cole o link da sua empresa no Google Maps"
          className="input-base flex-1 min-w-[16rem]"
          aria-label="Link da empresa no Google Maps"
          required
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Analisando…" : "Analisar ficha"}
        </button>
      </form>
      <p className="mt-2 text-xs leading-relaxed text-ink-400">
        📱 Como pegar o link: abra sua empresa no <strong>aplicativo do Google Maps</strong> →{" "}
        <strong>Compartilhar</strong> → <strong>Copiar link</strong>.{" "}
        <strong className="text-ink-300">Se você tem mais de uma unidade com o mesmo nome, use sempre o link do Maps</strong>{" "}
        — ele aponta a filial exata. O link da busca do Google traz a unidade principal.
      </p>
      {isBuscaLink(link.trim()) && (
        <p className="mt-2 rounded-lg border border-warn-500/40 bg-warn-500/10 p-2.5 text-xs text-warn-400">
          ⚠️ Esse link parece vir da <strong>busca</strong> do Google. Se sua empresa tem filiais de mesmo
          nome, ele pode trazer a errada. Prefira o link do <strong>Google Maps</strong> (Compartilhar → Copiar link).
        </p>
      )}
      <button
        type="button"
        onClick={() => { setSemFicha(true); setFicha(null); setError(null); }}
        className="mt-2 text-xs text-info-400 underline underline-offset-2 hover:text-info-300"
      >
        Minha empresa ainda não tem ficha no Google →
      </button>

      {loading && (
        <p className="mono mt-5 flex items-center gap-2 text-sm text-info-400" role="status" aria-live="polite">
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-info-400/30 border-t-info-400" />
          Consultando a ficha no Google…
        </p>
      )}

      {error && (
        <div className="mt-5 rounded-lg border border-warn-500/50 bg-warn-500/10 p-4" role="alert">
          <p className="text-sm text-warn-400">⚠️ {error.msg}</p>
          {error.cta && (
            <a
              href={waLink("Olá, vim através do Hub da Consig Invest! Tentei analisar minha ficha do Google e gostaria de ajuda.")}
              target="_blank"
              rel="noopener"
              className="btn-primary mt-3 text-sm"
            >
              💬 Falar com especialista
            </a>
          )}
        </div>
      )}

      {semFicha && <SemFicha />}
      {ficha && <Diagnostico d={ficha} />}
    </div>
  );
}

function SemFicha() {
  return (
    <div className="mt-6">
      <div className="card-surface border-warn-500/40 p-5">
        <p className="font-display text-lg font-bold">🚨 Ficha inexistente</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-300">
          Sua empresa não aparece no Google Maps. Quando alguém procura pelo seu serviço na sua
          cidade, quem aparece — e recebe o contato — são os concorrentes que têm ficha cadastrada.
          Criar o perfil é gratuito e é o primeiro passo do SEO local.
        </p>
      </div>
      <a
        href={waLink("Olá, vim através do Hub da Consig Invest! Minha empresa ainda não tem ficha no Google e quero criar e otimizar a minha.")}
        target="_blank"
        rel="noopener"
        className="btn-primary mt-4"
      >
        💬 Quero criar minha ficha
      </a>
    </div>
  );
}

/** Nota 0–100 por dimensão (Módulo 24: completude, reputação, atividade, conversão). */
function dimensoes(d: Ficha) {
  // Completude — dados básicos preenchidos
  const basicos = [d.telefone, d.site, d.endereco, d.categoria, d.dias_com_horario >= 7];
  const completude = Math.round((basicos.filter(Boolean).length / basicos.length) * 100);

  // Reputação — nota × volume de avaliações
  let reputacao = 0;
  if (d.total_avaliacoes > 0 && d.nota !== null) {
    const notaPct = Math.max(0, Math.min(1, (d.nota - 3) / 2)); // 3,0 → 0 ; 5,0 → 100
    const volPct = Math.min(1, d.total_avaliacoes / 50); // 50+ avaliações satura
    reputacao = Math.round((notaPct * 0.6 + volPct * 0.4) * 100);
  }

  // Atividade — fotos como sinal de ficha viva (é o que os dados públicos permitem)
  const atividade = Math.round(Math.min(1, d.qtd_fotos / 15) * 100);

  // Conversão — canais para o cliente agir agora
  const canais = [d.telefone, d.site, d.status_negocio === "OPERATIONAL"];
  const conversao = Math.round((canais.filter(Boolean).length / canais.length) * 100);

  return [
    { key: "completude", label: "Completude", score: completude, dica: "Telefone, site, endereço, categoria e horários preenchidos." },
    { key: "reputacao", label: "Reputação", score: reputacao, dica: "Nota e quantidade de avaliações." },
    { key: "atividade", label: "Atividade", score: atividade, dica: "Fotos publicadas — sinal de ficha cuidada." },
    { key: "conversao", label: "Conversão", score: conversao, dica: "Canais para o cliente ligar, visitar o site e ver que está aberto." },
  ];
}

function corNota(s: number) {
  return s >= 70 ? "#34d399" : s >= 40 ? "#fbbf24" : "#f87171";
}

function Dimensoes({ d }: { d: Ficha }) {
  const dims = dimensoes(d);
  return (
    <section className="card-surface mt-4 p-5">
      <h2 className="mb-3 font-display text-sm font-bold">Notas por área da ficha</h2>
      <div className="space-y-3">
        {dims.map((dim) => (
          <div key={dim.key}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-200" title={dim.dica}>{dim.label}</span>
              <span className="mono font-bold" style={{ color: corNota(dim.score) }}>{dim.score}/100</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full transition-all" style={{ width: `${dim.score}%`, background: corNota(dim.score) }} />
            </div>
            <p className="mt-1 text-[0.68rem] text-ink-400">{dim.dica}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Diagnostico({ d }: { d: Ficha }) {
  const problemas: { t: string; i: string }[] = [];

  if (d.status_negocio && d.status_negocio !== "OPERATIONAL") {
    problemas.push({
      t: `Ficha marcada como ${d.status_negocio === "CLOSED_PERMANENTLY" ? "fechada permanentemente" : "fechada temporariamente"}`,
      i: "Para o Google, a empresa não está operando — isso interrompe a exibição nas buscas. Corrigir é prioridade.",
    });
  }
  if (!d.telefone) problemas.push({ t: "Sem telefone cadastrado", i: "Quem quer ligar na hora não encontra o contato e procura o próximo resultado." });
  if (!d.site) problemas.push({ t: "Sem site vinculado", i: "O site é um dos sinais que o Google usa para entender e confiar no seu negócio." });
  if (!d.horarios_cadastrados || d.dias_com_horario < 7) {
    problemas.push({
      t: d.horarios_cadastrados ? `Horários em apenas ${d.dias_com_horario} dia(s) da semana` : "Sem horários cadastrados",
      i: "Sem horário completo, a ficha não mostra o selo “Aberto agora” — filtro muito usado por quem procura atendimento imediato.",
    });
  }
  if (d.qtd_fotos < 10) {
    problemas.push({
      t: d.qtd_fotos === 0 ? "Nenhuma foto publicada" : `Poucas fotos (${d.qtd_fotos})`,
      i: "Fotos são o que o cliente olha antes de decidir. Fichas visualmente vazias passam impressão de abandono.",
    });
  }
  if (d.total_avaliacoes < 20) {
    problemas.push({
      t: d.total_avaliacoes === 0 ? "Nenhuma avaliação" : `Poucas avaliações (${d.total_avaliacoes})`,
      i: "Quantidade e recência de avaliações são fatores conhecidos de ranqueamento local e de confiança do cliente.",
    });
  }
  if (d.nota !== null && d.nota < 4.0) {
    problemas.push({ t: `Nota ${fmtNota(d.nota)}`, i: "Nota abaixo de 4 costuma afastar o cliente antes mesmo do primeiro contato." });
  } else if (d.nota !== null && d.nota < 4.5) {
    problemas.push({ t: `Nota ${fmtNota(d.nota)}`, i: "Nota boa, mas em busca local a comparação é direta com quem está acima de 4,5." });
  }

  const fortes: string[] = [];
  if (d.nota !== null && d.nota >= 4.5 && d.total_avaliacoes >= 20)
    fortes.push(`Nota ${fmtNota(d.nota)} com ${d.total_avaliacoes} avaliações`);
  if (d.telefone) fortes.push("Telefone cadastrado");
  if (d.site) fortes.push("Site vinculado à ficha");
  if (d.dias_com_horario >= 7) fortes.push("Horários completos nos 7 dias");
  if (d.qtd_fotos >= 10) fortes.push(`${d.qtd_fotos} fotos publicadas`);
  const topFortes = fortes.slice(0, 3);
  if (!topFortes.length) topFortes.push("Sua ficha existe — esse é o primeiro passo");

  let titulo: string, detalhe: string;
  if (problemas.length >= 5) {
    titulo = "🚨 Ficha extremamente incompleta";
    detalhe = "Com esse nível de cadastro, o Google tem pouca informação para exibir sua empresa nas buscas locais — e quem está mais completo aparece primeiro.";
  } else if (problemas.length >= 2) {
    titulo = "⚠️ Parcialmente cadastrada";
    detalhe = "Sua ficha existe, mas está longe do potencial. O Google prioriza perfis completos e ativos nas buscas locais.";
  } else {
    titulo = "⚠️ Boa base — falta acelerar";
    detalhe = "Sua ficha está bem cadastrada. Mas ficha sozinha não segura posição: SEO local e Google Ads são o próximo nível para aparecer à frente dos concorrentes.";
  }

  return (
    <div className="mt-7">
      <div className="card-surface p-5">
        <p className="font-display text-lg font-bold">{titulo}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-300">{detalhe}</p>
      </div>

      <div className="card-surface mt-4 p-4">
        <p className="font-display text-sm font-bold">{d.nome || "Sua empresa"}</p>
        <p className="mt-0.5 text-xs text-ink-400">
          {d.categoria ? d.categoria : ""}
          {d.categoria && d.endereco ? " · " : ""}
          {d.endereco}
        </p>
      </div>

      <Dimensoes d={d} />

      <section className="mt-4 rounded-xl border border-ok-500/30 bg-ok-500/[0.06] p-5">
        <h2 className="font-display text-sm font-bold text-ok-400">✅ Pontos fortes</h2>
        <ul className="mt-2.5 space-y-1.5">
          {topFortes.map((f) => (
            <li key={f} className="pl-4 text-sm text-ink-300 before:mr-2 before:text-ok-400 before:content-['✓'] before:-ml-4">{f}</li>
          ))}
        </ul>
      </section>

      {problemas.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-2.5 font-display text-sm font-bold text-warn-400">📉 O que está atrapalhando</h2>
          <ul className="space-y-2">
            {problemas.map((p) => (
              <li key={p.t} className="rounded-lg border-l-[3px] border-l-warn-500 bg-warn-500/[0.07] px-4 py-3">
                <p className="text-sm font-semibold text-ink-100">{p.t}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-400">{p.i}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-5 text-xs leading-relaxed text-ink-400">
        Esta análise usa apenas dados públicos da ficha. Posts, descrição, menu de serviços e
        perguntas/respostas não são visíveis por aqui — avaliamos esses pontos no diagnóstico
        completo com especialista.
      </p>

      <a
        href={waLink(`Analisei a ficha da ${d.nome || "minha empresa"} no Hub e quero melhorar meu posicionamento no Google`)}
        target="_blank"
        rel="noopener"
        className="btn-primary mt-4"
      >
        💬 Quero melhorar meu posicionamento
      </a>
    </div>
  );
}
