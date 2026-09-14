"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  AVISO_VERBA,
  MARCA,
  METODO,
  avisoConselho,
  calcularInvestimento,
  dataValidade,
  fmtBRL,
  mesAno,
  paginarServicos,
  parseBRL,
  textoDiagnostico,
  type PropostaEstado,
} from "@/lib/tools/proposta";

/**
 * O documento da proposta, no padrão visual oficial da agência: páginas A4 com
 * as ondas no topo e no rodapé, capa, páginas de conteúdo com itens de check
 * verde, página de investimento com a pílula de valor e a página de obrigado.
 *
 * Cores e fonte foram medidas no PDF padrão (navy #0A3C90, azul #5470FE,
 * cinza #E8E8E8, título #0D2440, check #7CB342, Poppins).
 *
 * O mesmo componente serve à pré-visualização na tela e à impressão: cada
 * página é um bloco A4 fixo, e os serviços são paginados antes de renderizar
 * para nada transbordar por cima da arte.
 */

/* ── Ondas ───────────────────────────────────────────────── */

/** Faixa ondulada de espessura `t` começando em `y` (coordenadas do viewBox). */
const faixa = (y: number, t: number) =>
  `M0,${y} C200,${y + 18} 380,${y - 14} 560,${y - 2} C740,${y + 10} 880,${y + 14} 1000,${y - 6}` +
  ` L1000,${y - 6 + t} C880,${y + 14 + t} 740,${y + 10 + t} 560,${y - 2 + t}` +
  ` C380,${y - 14 + t} 200,${y + 18 + t} 0,${y + t} Z`;

/** Bloco cheio do topo até a onda em `y`. */
const topo = (y: number) =>
  `M0,0 H1000 V${y - 6} C880,${y + 14} 740,${y + 10} 560,${y - 2} C380,${y - 14} 200,${y + 18} 0,${y} Z`;

function OndasTopo({ navy }: { navy: string }) {
  return (
    <svg className="pp-ondas pp-ondas-topo" viewBox="0 0 1000 70" preserveAspectRatio="none" aria-hidden="true">
      <path d={faixa(48, 12)} fill={MARCA.azul} />
      <path d={faixa(16, 11)} fill={MARCA.cinza} />
      <path d={topo(14)} fill={navy} />
    </svg>
  );
}

function OndasRodape({ navy }: { navy: string }) {
  return (
    <svg className="pp-ondas pp-ondas-rodape" viewBox="0 0 1000 74" preserveAspectRatio="none" aria-hidden="true">
      <g transform="translate(0,74) scale(1,-1)">
        <path d={faixa(4, 16)} fill={MARCA.cinza} />
        <path d={faixa(20, 16)} fill={MARCA.azul} />
        <path d={topo(38)} fill={navy} />
      </g>
    </svg>
  );
}

/* ── Página ──────────────────────────────────────────────── */

function Pagina({
  e,
  children,
  capa = false,
}: {
  e: PropostaEstado;
  children: ReactNode;
  capa?: boolean;
}) {
  const contatos = [e.agenciaWhatsapp, e.agenciaEmail].map((c) => c.trim()).filter(Boolean);
  return (
    <section className={`pp-page${capa ? " pp-page-capa" : ""}`}>
      <OndasTopo navy={e.cor} />
      <OndasRodape navy={e.cor} />
      <div className="pp-conteudo">{children}</div>
      {contatos.length > 0 && (
        <div className="pp-barra">
          <span>{contatos[0] && `📞 ${contatos[0]}`}</span>
          <span>{contatos[1]}</span>
        </div>
      )}
    </section>
  );
}

function Marca({ e, centro = false }: { e: PropostaEstado; centro?: boolean }) {
  return (
    <div className={`pp-marca${centro ? " pp-marca-centro" : ""}`}>
      {e.agenciaLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={e.agenciaLogo} alt={`Logo de ${e.agenciaNome || "agência"}`} className="pp-logo" />
      ) : null}
      <div>
        <p className="pp-marca-nome">{e.agenciaNome || "Sua agência"}</p>
        {e.agenciaLinha2.trim() && <p className="pp-marca-sub">{e.agenciaLinha2}</p>}
      </div>
    </div>
  );
}

const Check = ({ children }: { children: ReactNode }) => (
  <li className="pp-check">
    <span className="pp-check-ic" aria-hidden="true" />
    <span>{children}</span>
  </li>
);

/* ── Documento ───────────────────────────────────────────── */

export function PropostaDoc({ e }: { e: PropostaEstado }) {
  const inv = calcularInvestimento(e);
  const aviso = avisoConselho(e.clienteSegmento);
  const empresa = e.clienteEmpresa.trim();
  const paginasEscopo = paginarServicos(e.servicos);
  const mensais = e.servicos.filter((s) => s.tipo === "mensal");
  const unicos = e.servicos.filter((s) => s.tipo === "unico");

  return (
    <div className="pp-doc" style={{ "--pp-navy": e.cor } as CSSProperties} lang="pt-BR">
      {/* ── Capa ── */}
      <Pagina e={e} capa>
        <Marca e={e} />
        <p className="pp-data">{mesAno()}</p>
        <h1 className="pp-titulo-capa">
          PROPOSTA
          <br />
          DE MARKETING
        </h1>
        <p className="pp-sub-capa">
          Proposta de assessoria de marketing elaborada pela equipe da{" "}
          <b>{e.agenciaNome || "agência"}</b> para <b>{empresa || "sua empresa"}</b>
          {e.clienteContato.trim() ? `, aos cuidados de ${e.clienteContato.trim()}` : ""}.
        </p>
        {e.servicos.length > 0 && (
          <p className="pp-sub-capa">
            <b>Serviços:</b>
            <br />
            {e.servicos.map((s) => s.nome).filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="pp-sub-capa pp-validade">Proposta válida até {dataValidade(e)}.</p>
        <div className="pp-dots" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
      </Pagina>

      {/* ── Diagnóstico ── */}
      <Pagina e={e}>
        <h2 className="pp-h1">O ponto de partida</h2>
        {textoDiagnostico(e).map((p, i) => (
          <p key={i} className="pp-para">
            {p}
          </p>
        ))}

        <h3 className="pp-h2">🛠️ Como o trabalho começa</h3>
        <ol className="pp-metodo">
          {METODO.map((m) => (
            <li key={m.n}>
              <span className="pp-passo">{String(m.n).padStart(2, "0")}</span>
              <div>
                <p className="pp-passo-titulo">{m.titulo}</p>
                <p className="pp-para">{m.texto}</p>
              </div>
            </li>
          ))}
        </ol>

        {aviso && <p className="pp-nota">⚖️ {aviso}</p>}
      </Pagina>

      {/* ── Escopo (uma ou mais páginas) ── */}
      {paginasEscopo.map((pagina, i) => (
        <Pagina e={e} key={`escopo-${i}`}>
          <h2 className="pp-h1">
            O que propomos fazer{i > 0 ? " (continuação)" : ""}
          </h2>
          {pagina.map((s) => (
            <div key={s.id} className="pp-servico">
              <div className="pp-servico-topo">
                <h3 className="pp-h2">{s.nome.trim() || "Serviço"}</h3>
                <span className="pp-preco">
                  {fmtBRL.format(parseBRL(s.valor))}
                  <small>{s.tipo === "mensal" ? " / mensal" : " valor único"}</small>
                </span>
              </div>
              {s.descricao.trim() && <p className="pp-para">{s.descricao.trim()}</p>}
              {s.entregas.filter((x) => x.trim()).length > 0 && (
                <ul className="pp-lista">
                  {s.entregas
                    .filter((x) => x.trim())
                    .map((en, k) => (
                      <Check key={k}>{en}</Check>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </Pagina>
      ))}

      {/* ── Investimento ── */}
      <Pagina e={e}>
        <h2 className="pp-h1">Investimento</h2>

        <h3 className="pp-h2">💰 O que está incluso</h3>
        <ul className="pp-lista">
          {e.servicos.length === 0 && <Check>Nenhum serviço selecionado ainda.</Check>}
          {e.servicos.map((s) => (
            <Check key={s.id}>
              {s.nome || "Serviço"}: {fmtBRL.format(parseBRL(s.valor))}
              {s.tipo === "mensal" ? "/mês" : " (valor único)"}
            </Check>
          ))}
        </ul>

        <p className="pp-para pp-aviso">📌 {AVISO_VERBA}</p>

        {inv.subtotalMensal > 0 && (
          <div className="pp-pilula">
            <div>
              <p className="pp-pilula-titulo">INVESTIMENTO MENSAL</p>
              <p className="pp-pilula-sub">
                {mensais.map((s) => s.nome).join(" + ") || "Gestão mensal"}
              </p>
              <p className="pp-pilula-valor">{fmtBRL.format(inv.subtotalMensal)} / mensal</p>
            </div>
          </div>
        )}

        {inv.subtotalUnico > 0 && (
          <div className="pp-pilula pp-pilula-clara">
            <div>
              <p className="pp-pilula-titulo">IMPLANTAÇÃO — VALOR ÚNICO</p>
              <p className="pp-pilula-sub">{unicos.map((s) => s.nome).join(" + ")}</p>
              <p className="pp-pilula-valor">{fmtBRL.format(inv.subtotalUnico)}</p>
            </div>
          </div>
        )}

        <ul className="pp-resumo">
          <li>
            <span>Total do primeiro mês</span>
            <strong>{fmtBRL.format(inv.primeiroMes)}</strong>
          </li>
          <li>
            <span>
              Total do contrato ({inv.meses} {inv.meses === 1 ? "mês" : "meses"})
            </span>
            <strong>{fmtBRL.format(inv.totalContrato)}</strong>
          </li>
          {inv.verbaMidia > 0 && (
            <li className="pp-resumo-verba">
              <span>Verba de mídia sugerida (paga direto à plataforma)</span>
              <strong>{fmtBRL.format(inv.verbaMidia)}/mês</strong>
            </li>
          )}
        </ul>

        {inv.verbaMidia > 0 && (
          <p className="pp-para pp-mini">
            A verba de mídia não está somada em nenhum total acima: ao longo dos {inv.meses}{" "}
            {inv.meses === 1 ? "mês" : "meses"} ela representa{" "}
            {fmtBRL.format(inv.verbaMidiaContrato)} pagos diretamente às plataformas.
          </p>
        )}

        {e.pagamento.trim() && (
          <p className="pp-para">
            <b>Condição de pagamento:</b> {e.pagamento.trim()}
          </p>
        )}
        {e.observacoes.trim() && (
          <p className="pp-para">
            <b>Observações:</b> {e.observacoes.trim()}
          </p>
        )}
      </Pagina>

      {/* ── Obrigado ── */}
      <Pagina e={e}>
        <div className="pp-obrigado">
          <Marca e={e} centro />
          <h2 className="pp-titulo-obrigado">OBRIGADO</h2>
          <p className="pp-para pp-centro">
            O próximo passo é uma reunião de 30 minutos para revisar este escopo com você, ajustar o
            que não fizer sentido para {empresa || "a sua empresa"} e definir a data de início. Se
            preferir, responda esta proposta com as suas dúvidas antes da reunião.
          </p>
          <p className="pp-para pp-centro pp-mini">
            Proposta válida até {dataValidade(e)} ({e.validadeDias} dias). Honorários e verba de
            mídia são cobranças separadas.
          </p>
          {e.agenciaSite.trim() && <p className="pp-site">{e.agenciaSite.trim()}</p>}
        </div>
      </Pagina>
    </div>
  );
}

/**
 * Folha de estilo do documento + regras de impressão.
 * Fica aqui (e não no globals.css) para não vazar nada para o resto do site.
 */
export const PROPOSTA_CSS = `
/* O documento clonado para impressão fica fora da tela até alguém imprimir. */
#proposta-impressao { display: none; }

.pp-doc {
  --pp-azul: ${MARCA.azul};
  --pp-cinza: ${MARCA.cinza};
  --pp-titulo: ${MARCA.titulo};
  --pp-corpo: ${MARCA.corpo};
  --pp-verde: ${MARCA.verde};
  font-family: Poppins, var(--font-sans, system-ui), sans-serif;
  color: var(--pp-corpo);
}
.pp-doc * { box-sizing: border-box; }

.pp-page {
  position: relative;
  width: 210mm;
  height: 297mm;
  background: #fff;
  overflow: hidden;
  margin: 0 auto 10mm;
  box-shadow: 0 6px 24px rgb(0 0 0 / 0.35);
}
.pp-ondas { position: absolute; left: 0; width: 100%; display: block; }
.pp-ondas-topo { top: 0; height: 24mm; }
.pp-ondas-rodape { bottom: 0; height: 26mm; }

.pp-conteudo {
  position: relative;
  z-index: 1;
  padding: 30mm 17mm 30mm;
  height: 100%;
  overflow: hidden;
}

.pp-barra {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  z-index: 2;
  height: 13mm;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12mm;
  color: #fff;
  font-size: 9pt;
}

/* ── Capa ── */
.pp-marca { display: flex; align-items: center; gap: 10px; }
.pp-marca-centro { flex-direction: column; text-align: center; gap: 8px; }
.pp-logo { width: 54px; height: 54px; object-fit: contain; border-radius: 50%; }
.pp-marca-centro .pp-logo { width: 90px; height: 90px; }
.pp-marca-nome {
  margin: 0; font-weight: 700; font-size: 13pt; letter-spacing: 0.02em;
  color: var(--pp-titulo); text-transform: uppercase;
}
.pp-marca-sub {
  margin: 0; font-size: 8.5pt; letter-spacing: 0.04em; text-transform: uppercase;
  color: var(--pp-corpo);
}
.pp-data {
  margin: 14mm 0 2mm; font-weight: 700; font-size: 15pt; letter-spacing: 0.02em;
  color: var(--pp-titulo);
}
.pp-titulo-capa {
  margin: 0 0 6mm; font-weight: 800; font-size: 34pt; line-height: 1.12;
  letter-spacing: -0.01em; color: var(--pp-titulo);
}
.pp-sub-capa {
  margin: 0 0 4mm; max-width: 105mm; text-align: justify; font-size: 11pt; line-height: 1.55;
}
.pp-validade { color: var(--pp-navy); font-weight: 600; }
.pp-dots { display: flex; gap: 7px; margin-top: 4mm; }
.pp-dots span { width: 9px; height: 9px; border-radius: 50%; background: var(--pp-navy); }
.pp-dots span:nth-child(2) { background: var(--pp-titulo); }
.pp-dots span:nth-child(3) { background: var(--pp-azul); }

/* ── Conteúdo ── */
.pp-h1 {
  margin: 0 0 6mm; font-weight: 800; font-size: 24pt; line-height: 1.15;
  color: var(--pp-titulo);
}
.pp-h2 {
  margin: 0 0 2mm; font-weight: 700; font-size: 13pt; color: var(--pp-titulo);
}
.pp-para { margin: 0 0 3.5mm; font-size: 10.5pt; line-height: 1.6; text-align: justify; }
.pp-para b { color: var(--pp-titulo); }
.pp-centro { text-align: center; }
.pp-mini { font-size: 9pt; color: #5b6880; }
.pp-aviso { border-left: 3px solid var(--pp-navy); padding-left: 4mm; }
.pp-nota {
  margin-top: 5mm; padding: 3mm 4mm; background: #f4f6fb;
  border-left: 3px solid var(--pp-azul); font-size: 9pt; line-height: 1.5;
}

.pp-lista { list-style: none; margin: 0 0 4mm; padding: 0; }
.pp-check { display: flex; gap: 7px; font-size: 10pt; line-height: 1.5; margin-bottom: 1.6mm; }
.pp-check-ic {
  flex: 0 0 13px; width: 13px; height: 13px; margin-top: 2px; border-radius: 3px;
  background: var(--pp-verde);
  background-image:
    linear-gradient(45deg, transparent 45%, #fff 45%, #fff 58%, transparent 58%),
    linear-gradient(-45deg, transparent 62%, #fff 62%, #fff 75%, transparent 75%);
}

.pp-servico { margin-bottom: 6mm; }
.pp-servico-topo {
  display: flex; align-items: baseline; justify-content: space-between; gap: 6px;
  border-bottom: 1px solid var(--pp-cinza); padding-bottom: 1.5mm; margin-bottom: 2mm;
}
.pp-preco { font-weight: 800; font-size: 12pt; color: var(--pp-navy); white-space: nowrap; }
.pp-preco small { font-weight: 600; font-size: 8.5pt; color: var(--pp-corpo); }

.pp-metodo { list-style: none; margin: 0; padding: 0; }
.pp-metodo li { display: flex; gap: 4mm; margin-bottom: 4mm; }
.pp-passo {
  flex: 0 0 11mm; height: 11mm; border-radius: 50%; background: var(--pp-navy); color: #fff;
  display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12pt;
}
.pp-passo-titulo { margin: 0 0 1mm; font-weight: 700; font-size: 11.5pt; color: var(--pp-titulo); }

/* ── Investimento ── */
.pp-pilula {
  display: flex; align-items: center; gap: 5mm;
  background: var(--pp-navy); color: #fff;
  border-radius: 999px; padding: 5mm 9mm; margin: 5mm 0;
}
.pp-pilula-clara { background: var(--pp-azul); }
.pp-pilula-titulo {
  margin: 0; font-weight: 700; font-size: 10pt; letter-spacing: 0.04em;
}
.pp-pilula-sub { margin: 0.5mm 0 1mm; font-size: 8.5pt; opacity: 0.85; }
.pp-pilula-valor { margin: 0; font-weight: 800; font-size: 17pt; line-height: 1.1; }

.pp-resumo { list-style: none; margin: 4mm 0; padding: 0; }
.pp-resumo li {
  display: flex; justify-content: space-between; gap: 6mm; align-items: baseline;
  border-bottom: 1px solid var(--pp-cinza); padding: 2mm 0; font-size: 10.5pt;
}
.pp-resumo strong { color: var(--pp-navy); font-weight: 800; white-space: nowrap; }
.pp-resumo-verba { border-bottom: none; color: #5b6880; }
.pp-resumo-verba strong { color: #5b6880; font-weight: 700; }

/* ── Obrigado ── */
.pp-obrigado {
  height: 100%; display: flex; flex-direction: column; align-items: center;
  justify-content: center; text-align: center; gap: 3mm;
}
.pp-titulo-obrigado {
  margin: 6mm 0 4mm; font-weight: 800; font-size: 32pt; letter-spacing: 0.02em;
  color: var(--pp-titulo);
}
.pp-obrigado .pp-para { max-width: 130mm; }
.pp-site { margin: 4mm 0 0; font-weight: 700; color: var(--pp-navy); }

/* ── Impressão ───────────────────────────────────────────── */
@media print {
  /* O documento impresso é um irmão direto do <body> (portal): some com o
     site inteiro e mantém apenas ele. */
  body > *:not(#proposta-impressao) { display: none !important; }
  #proposta-impressao { display: block !important; }

  html, body { background: #fff !important; background-image: none !important; }

  @page { size: A4; margin: 0; }

  .pp-doc { zoom: 1 !important; }
  .pp-page {
    margin: 0;
    box-shadow: none;
    break-after: page;
    page-break-after: always;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .pp-page:last-child { break-after: auto; page-break-after: auto; }

  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;
