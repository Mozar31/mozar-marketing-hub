"use client";

import type { CSSProperties } from "react";
import {
  AVISO_VERBA,
  AVISO_VERBA_CURTO,
  METODO,
  avisoConselho,
  calcularInvestimento,
  dataHoje,
  dataValidade,
  fmtBRL,
  parseBRL,
  textoDiagnostico,
  type PropostaEstado,
} from "@/lib/tools/proposta";

/**
 * O documento da proposta. O mesmo componente serve à pré-visualização na tela
 * e à impressão em PDF (via window.print), por isso ele é sempre "papel":
 * fundo branco e texto escuro, independentemente do tema do site.
 */

export function PropostaDoc({ e }: { e: PropostaEstado }) {
  const inv = calcularInvestimento(e);
  const diagnostico = textoDiagnostico(e);
  const aviso = avisoConselho(e.clienteSegmento);
  const cases = e.cases.slice(0, 3).filter((c) => c.nicho.trim() || c.resultado.trim());
  const empresa = e.clienteEmpresa.trim();
  const agencia = e.agenciaNome.trim();
  const contatos = [e.agenciaWhatsapp, e.agenciaEmail, e.agenciaSite]
    .map((c) => c.trim())
    .filter(Boolean);

  return (
    <article className="pp-doc" style={{ "--pp-cor": e.cor } as CSSProperties} lang="pt-BR">
      {/* Cabeçalho repetido em toda página impressa */}
      <div className="pp-running" aria-hidden="true">
        <span>{empresa || "Proposta comercial"}</span>
        <span>{agencia}</span>
      </div>

      {/* ── Capa ── */}
      <header className="pp-capa pp-bloco">
        {e.agenciaLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.agenciaLogo} alt={agencia ? `Logo de ${agencia}` : "Logo"} className="pp-logo" />
        ) : null}
        <p className="pp-kicker">Proposta comercial</p>
        <h1 className="pp-h1">{empresa || "Nome da empresa cliente"}</h1>
        {(e.clienteContato.trim() || e.clienteCargo.trim()) && (
          <p className="pp-para">
            Aos cuidados de {e.clienteContato.trim() || "—"}
            {e.clienteCargo.trim() ? `, ${e.clienteCargo.trim()}` : ""}
          </p>
        )}
        <dl className="pp-meta">
          {agencia && (
            <div>
              <dt>Enviada por</dt>
              <dd>{agencia}</dd>
            </div>
          )}
          {e.clienteSegmento.trim() && (
            <div>
              <dt>Segmento</dt>
              <dd>{e.clienteSegmento.trim()}</dd>
            </div>
          )}
          {e.clienteCidade.trim() && (
            <div>
              <dt>Atendimento</dt>
              <dd>{e.clienteCidade.trim()}</dd>
            </div>
          )}
          <div>
            <dt>Data</dt>
            <dd>{dataHoje()}</dd>
          </div>
          <div>
            <dt>Válida até</dt>
            <dd>{dataValidade(e)}</dd>
          </div>
        </dl>
      </header>

      {/* ── Diagnóstico (vem antes de qualquer serviço) ── */}
      <section className="pp-bloco">
        <h2 className="pp-h2">O ponto de partida</h2>
        {diagnostico.map((p, i) => (
          <p key={i} className="pp-para">
            {p}
          </p>
        ))}
        {aviso && <p className="pp-nota">{aviso}</p>}
      </section>

      {/* ── Escopo ── */}
      {e.servicos.length > 0 && (
        <section className="pp-bloco">
          <h2 className="pp-h2">O que propomos fazer</h2>
          {e.servicos.map((s) => (
            <div key={s.id} className="pp-servico">
              <div className="pp-servico-topo">
                <h3 className="pp-h3">{s.nome.trim() || "Serviço"}</h3>
                <span className="pp-preco">
                  {fmtBRL.format(parseBRL(s.valor))}
                  <small>{s.tipo === "mensal" ? "/mês" : " valor único"}</small>
                </span>
              </div>
              {s.descricao.trim() && <p className="pp-para">{s.descricao.trim()}</p>}
              {s.entregas.filter((x) => x.trim()).length > 0 && (
                <ul className="pp-lista">
                  {s.entregas
                    .filter((x) => x.trim())
                    .map((en, i) => (
                      <li key={i}>{en}</li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ── Investimento ── */}
      <section className="pp-bloco">
        <h2 className="pp-h2">Investimento</h2>
        <div className="pp-tabela-wrap">
          <table className="pp-tabela">
            <caption className="pp-caption">
              Honorários de {agencia || "agência"} — contrato de {inv.meses}{" "}
              {inv.meses === 1 ? "mês" : "meses"}. {AVISO_VERBA_CURTO}
            </caption>
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Cobrança</th>
                <th scope="col" className="pp-num">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {e.servicos.length === 0 && (
                <tr>
                  <td colSpan={3} className="pp-vazio">
                    Nenhum serviço adicionado ainda.
                  </td>
                </tr>
              )}
              {e.servicos.map((s) => (
                <tr key={s.id}>
                  <td>{s.nome.trim() || "Serviço"}</td>
                  <td>{s.tipo === "mensal" ? "Mensal" : "Valor único"}</td>
                  <td className="pp-num">
                    {fmtBRL.format(parseBRL(s.valor))}
                    {s.tipo === "mensal" ? "/mês" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {inv.subtotalMensal > 0 && (
                <tr>
                  <th scope="row" colSpan={2}>
                    Subtotal de honorários mensais
                  </th>
                  <td className="pp-num">{fmtBRL.format(inv.subtotalMensal)}/mês</td>
                </tr>
              )}
              {inv.subtotalUnico > 0 && (
                <tr>
                  <th scope="row" colSpan={2}>
                    Subtotal de valores únicos
                  </th>
                  <td className="pp-num">{fmtBRL.format(inv.subtotalUnico)}</td>
                </tr>
              )}
              <tr className="pp-destaque">
                <th scope="row" colSpan={2}>
                  Total do primeiro mês
                </th>
                <td className="pp-num">{fmtBRL.format(inv.primeiroMes)}</td>
              </tr>
              <tr className="pp-destaque">
                <th scope="row" colSpan={2}>
                  Total do contrato ({inv.meses} {inv.meses === 1 ? "mês" : "meses"})
                </th>
                <td className="pp-num">{fmtBRL.format(inv.totalContrato)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Verba de mídia: linha própria, fora de qualquer subtotal acima. */}
        <div className="pp-verba">
          <div className="pp-verba-topo">
            <span>Verba de mídia sugerida</span>
            <strong>{fmtBRL.format(inv.verbaMidia)}/mês</strong>
          </div>
          <p className="pp-para">
            {AVISO_VERBA} Ao longo dos {inv.meses} {inv.meses === 1 ? "mês" : "meses"} de contrato,
            isso representa {fmtBRL.format(inv.verbaMidiaContrato)} pagos às plataformas — valor que
            não está somado em nenhum total desta tabela.
          </p>
        </div>

        {e.pagamento.trim() && (
          <p className="pp-para">
            <strong>Condição de pagamento:</strong> {e.pagamento.trim()}
          </p>
        )}
      </section>

      {/* ── Método ── */}
      <section className="pp-bloco">
        <h2 className="pp-h2">Como o trabalho começa</h2>
        <ol className="pp-metodo">
          {METODO.map((m) => (
            <li key={m.n}>
              <span className="pp-passo">{m.n}</span>
              <div>
                <h3 className="pp-h3">{m.titulo}</h3>
                <p className="pp-para">{m.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Cases ── */}
      {cases.length > 0 && (
        <section className="pp-bloco">
          <h2 className="pp-h2">O que já fizemos</h2>
          <div className="pp-cases">
            {cases.map((c) => (
              <div key={c.id} className="pp-case">
                {c.nicho.trim() && <p className="pp-case-nicho">{c.nicho.trim()}</p>}
                {c.resultado.trim() && <p className="pp-case-res">{c.resultado.trim()}</p>}
                {c.contexto.trim() && <p className="pp-para">{c.contexto.trim()}</p>}
              </div>
            ))}
          </div>
          <p className="pp-nota">
            Resultados obtidos em outros projetos, em contextos próprios de cada cliente. Servem como
            referência de trabalho, não como projeção para {empresa || "esta empresa"}.
          </p>
        </section>
      )}

      {/* ── Observações ── */}
      {e.observacoes.trim() && (
        <section className="pp-bloco">
          <h2 className="pp-h2">Observações</h2>
          <p className="pp-para">{e.observacoes.trim()}</p>
        </section>
      )}

      {/* ── Próximo passo ── */}
      <section className="pp-bloco pp-cta">
        <h2 className="pp-h2">Próximo passo</h2>
        <p className="pp-para">
          Uma reunião de 30 minutos para revisar este escopo com você, ajustar o que não fizer
          sentido para {empresa || "a empresa"} e definir a data de início. Se preferir, responda
          esta proposta com as dúvidas antes da reunião.
        </p>
        {contatos.length > 0 && <p className="pp-contatos">{contatos.join(" · ")}</p>}
      </section>

      <footer className="pp-rodape">
        <span>
          {agencia || "Agência"}
          {contatos.length ? ` · ${contatos.join(" · ")}` : ""}
        </span>
        <span>
          Proposta válida até {dataValidade(e)} ({e.validadeDias} dias). Honorários e verba de mídia
          são cobranças separadas.
        </span>
      </footer>
    </article>
  );
}

/**
 * Folha de estilo do documento + regras de impressão.
 * Fica aqui (e não no globals.css) para não vazar nada para o resto do site:
 * só a página desta ferramenta injeta este CSS.
 */
export const PROPOSTA_CSS = `
/* O documento clonado para impressão fica fora da tela até alguém imprimir. */
#proposta-impressao { display: none; }

.pp-doc {
  --pp-tinta: #111827;
  --pp-tinta-2: #4b5563;
  --pp-linha: #e5e7eb;
  background: #fff;
  color: var(--pp-tinta);
  font-family: var(--font-sans, system-ui, sans-serif);
  font-size: 13px;
  line-height: 1.6;
  padding: 26px 24px 20px;
  border-radius: 10px;
}
.pp-doc * { box-sizing: border-box; }
.pp-running { display: none; }

.pp-capa { border-bottom: 3px solid var(--pp-cor); padding-bottom: 16px; }
.pp-logo { max-height: 56px; max-width: 190px; width: auto; margin-bottom: 12px; display: block; }
.pp-kicker {
  font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--pp-cor); margin: 0 0 4px;
}
.pp-h1 {
  font-family: var(--font-display, inherit);
  font-size: 26px; line-height: 1.15; font-weight: 800; margin: 0 0 6px; color: var(--pp-tinta);
}
.pp-h2 {
  font-family: var(--font-display, inherit);
  font-size: 16px; font-weight: 700; margin: 0 0 10px; color: var(--pp-cor);
  padding-bottom: 6px; border-bottom: 1px solid var(--pp-linha);
}
.pp-h3 { font-family: var(--font-display, inherit); font-size: 13.5px; font-weight: 700; margin: 0; }
.pp-para { margin: 0 0 9px; color: var(--pp-tinta-2); }
.pp-para strong { color: var(--pp-tinta); }
.pp-nota {
  margin: 10px 0 0; padding: 9px 11px; border-left: 3px solid var(--pp-cor);
  background: #f8fafc; font-size: 11.5px; color: var(--pp-tinta-2);
}
.pp-bloco { margin-bottom: 24px; break-inside: avoid; page-break-inside: avoid; }

.pp-meta { display: flex; flex-wrap: wrap; gap: 14px 26px; margin: 14px 0 0; }
.pp-meta dt { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; }
.pp-meta dd { margin: 1px 0 0; font-weight: 600; font-size: 12.5px; }

.pp-servico { border: 1px solid var(--pp-linha); border-radius: 8px; padding: 13px 14px; margin-bottom: 11px; break-inside: avoid; page-break-inside: avoid; }
.pp-servico-topo { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px; margin-bottom: 6px; }
.pp-preco { font-weight: 800; color: var(--pp-cor); white-space: nowrap; }
.pp-preco small { font-weight: 600; font-size: 10.5px; color: var(--pp-tinta-2); }
.pp-lista { margin: 6px 0 0; padding-left: 17px; color: var(--pp-tinta-2); }
.pp-lista li { margin-bottom: 2px; }

.pp-tabela-wrap { overflow-x: auto; }
.pp-tabela { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.pp-caption { caption-side: bottom; text-align: left; font-size: 11px; color: #6b7280; padding-top: 8px; }
.pp-tabela th, .pp-tabela td { padding: 7px 8px; border-bottom: 1px solid var(--pp-linha); text-align: left; }
.pp-tabela thead th { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.07em; color: #6b7280; border-bottom: 2px solid var(--pp-linha); }
.pp-tabela .pp-num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.pp-tabela tfoot th { font-weight: 600; }
.pp-tabela tfoot .pp-destaque th, .pp-tabela tfoot .pp-destaque td { font-weight: 800; color: var(--pp-cor); border-bottom: none; }
.pp-vazio { color: #9ca3af; font-style: italic; }

.pp-verba { margin-top: 14px; border: 1px dashed var(--pp-cor); border-radius: 8px; padding: 12px 13px; background: #f8fafc; break-inside: avoid; page-break-inside: avoid; }
.pp-verba-topo { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px; margin-bottom: 7px; font-weight: 700; }
.pp-verba-topo strong { color: var(--pp-cor); white-space: nowrap; }

.pp-metodo { list-style: none; margin: 0; padding: 0; display: grid; gap: 11px; }
.pp-metodo li { display: flex; gap: 11px; break-inside: avoid; page-break-inside: avoid; }
.pp-passo {
  flex: 0 0 26px; height: 26px; border-radius: 50%; background: var(--pp-cor); color: #fff;
  display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px;
}

.pp-cases { display: grid; gap: 10px; }
.pp-case { border-left: 3px solid var(--pp-cor); padding: 2px 0 2px 11px; break-inside: avoid; page-break-inside: avoid; }
.pp-case-nicho { margin: 0; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; }
.pp-case-res { margin: 1px 0 4px; font-weight: 700; font-size: 14px; color: var(--pp-tinta); }

.pp-cta { border: 1px solid var(--pp-cor); border-radius: 8px; padding: 15px 16px; background: #f8fafc; }
.pp-contatos { margin: 0; font-weight: 700; color: var(--pp-cor); }
.pp-rodape {
  display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px;
  border-top: 1px solid var(--pp-linha); padding-top: 10px; margin-top: 6px;
  font-size: 10.5px; color: #6b7280;
}

@media (min-width: 640px) {
  .pp-doc { padding: 34px 32px 24px; font-size: 13.5px; }
  .pp-h1 { font-size: 30px; }
}

/* ── Impressão: só o documento vai para o papel ───────────── */
@media print {
  /* O documento impresso é um irmão direto do <body> (portal), então some
     com o site inteiro e mantém apenas ele. */
  body > *:not(#proposta-impressao) { display: none !important; }
  #proposta-impressao { display: block !important; }

  html, body {
    background: #fff !important;
    background-image: none !important;
    color: #111827 !important;
  }

  @page { size: A4; margin: 20mm 14mm 14mm; }

  .pp-doc { padding: 0; border-radius: 0; font-size: 10.5pt; line-height: 1.5; }
  .pp-doc a { color: inherit; text-decoration: none; }

  .pp-running {
    display: flex !important;
    justify-content: space-between;
    gap: 10px;
    position: fixed;
    top: -13mm; left: 0; right: 0;
    font-size: 8pt;
    color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 3px;
  }

  .pp-h1 { font-size: 22pt; }
  .pp-h2 { font-size: 13pt; }
  .pp-h3 { font-size: 11pt; }
  .pp-capa { padding-bottom: 10mm; }

  .pp-bloco, .pp-servico, .pp-verba, .pp-case, .pp-metodo li, .pp-cta {
    break-inside: avoid; page-break-inside: avoid;
  }
  .pp-h2, .pp-h3 { break-after: avoid; page-break-after: avoid; }
  .pp-tabela { break-inside: auto; }
  .pp-tabela thead { display: table-header-group; }
  .pp-tabela tfoot { display: table-row-group; break-inside: avoid; }
  .pp-tabela tr { break-inside: avoid; page-break-inside: avoid; }
  .pp-tabela-wrap { overflow: visible; }

  .pp-nota, .pp-verba, .pp-cta { background: #f8fafc !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;
