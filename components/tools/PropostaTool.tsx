"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PropostaDoc, PROPOSTA_CSS } from "./PropostaDoc";
import {
  CATALOGO,
  COR_PADRAO,
  ESTADO_INICIAL,
  OBJETIVOS,
  PRAZOS,
  SEGMENTOS,
  calcularInvestimento,
  desserializar,
  excluirRascunho,
  fmtBRL,
  lerRascunhos,
  salvarRascunho,
  serializar,
  textoWhatsApp,
  type ItemCatalogo,
  type Objetivo,
  type PropostaEstado,
  type Rascunho,
  type Servico,
} from "@/lib/tools/proposta";

/**
 * Gerador de proposta comercial — §23.
 *
 * Uma tela só: escolher os serviços, dizer para quem é, exportar. A
 * pré-visualização é o documento final, no padrão visual da agência.
 *
 * Nada é enviado para servidor: os dados ficam no estado do React, no
 * localStorage (rascunhos) e, se a pessoa pedir, no link que ela mesma copia.
 */

const novoId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const LOGO_TIPOS = ["image/png", "image/jpeg", "image/svg+xml"];
const LOGO_MAX = 2 * 1024 * 1024;

const GRUPOS = [...new Set(CATALOGO.map((c) => c.grupo))];

export function PropostaTool() {
  const [e, setE] = useState<PropostaEstado>(ESTADO_INICIAL);
  const [erros, setErros] = useState<string[]>([]);
  const [aviso, setAviso] = useState("");
  const [rascunhos, setRascunhos] = useState<Rascunho[]>([]);
  const [rascunhoId, setRascunhoId] = useState<string>(novoId);
  const [montado, setMontado] = useState(false);
  const [linkGerado, setLinkGerado] = useState("");

  const uid = useId();

  const set = <K extends keyof PropostaEstado>(chave: K, valor: PropostaEstado[K]) =>
    setE((p) => ({ ...p, [chave]: valor }));

  /* Abertura: link compartilhado (?p=) e lista de rascunhos. */
  useEffect(() => {
    setMontado(true);
    setRascunhos(lerRascunhos());
    const p = new URLSearchParams(window.location.search).get("p");
    if (p) {
      const carregado = desserializar(p);
      if (carregado) {
        setE(carregado);
        setAviso("Proposta carregada a partir do link.");
      } else {
        setAviso("O link recebido está incompleto ou foi truncado. Comece uma proposta nova.");
      }
    }
  }, []);

  const inv = useMemo(() => calcularInvestimento(e), [e]);
  const selecionados = useMemo(() => new Set(e.servicos.map((s) => s.nome)), [e.servicos]);

  /* ── Serviços ──────────────────────────────────────────── */

  const alternar = (item: ItemCatalogo) =>
    setE((p) =>
      p.servicos.some((s) => s.nome === item.nome)
        ? { ...p, servicos: p.servicos.filter((s) => s.nome !== item.nome) }
        : {
            ...p,
            servicos: [...p.servicos, { ...item, entregas: [...item.entregas], id: novoId() }],
          }
    );

  const addPersonalizado = () =>
    setE((p) => ({
      ...p,
      servicos: [
        ...p.servicos,
        { id: novoId(), nome: "", descricao: "", tipo: "mensal", valor: "", entregas: [] },
      ],
    }));

  const upServico = <K extends keyof Servico>(id: string, campo: K, valor: Servico[K]) =>
    setE((p) => ({
      ...p,
      servicos: p.servicos.map((s) => (s.id === id ? { ...s, [campo]: valor } : s)),
    }));

  const delServico = (id: string) =>
    setE((p) => ({ ...p, servicos: p.servicos.filter((s) => s.id !== id) }));

  /* ── Logo ──────────────────────────────────────────────── */

  const lerLogo = (arquivo: File | undefined) => {
    if (!arquivo) return;
    if (!LOGO_TIPOS.includes(arquivo.type)) {
      setErros(["A logo precisa ser PNG, JPG ou SVG."]);
      return;
    }
    if (arquivo.size > LOGO_MAX) {
      setErros(["A logo precisa ter no máximo 2 MB."]);
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => {
      set("agenciaLogo", String(leitor.result || ""));
      setErros([]);
      setAviso("Logo carregada. Ela fica só neste navegador — não é enviada a lugar nenhum.");
    };
    leitor.onerror = () => setErros(["Não foi possível ler este arquivo de imagem."]);
    leitor.readAsDataURL(arquivo);
  };

  /* ── Ações ─────────────────────────────────────────────── */

  const copiar = async (texto: string, ok: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setAviso(ok);
    } catch {
      setAviso("O navegador bloqueou a cópia automática. Selecione o texto e copie manualmente.");
    }
  };

  const exportar = () => {
    const problemas: string[] = [];
    if (!e.clienteEmpresa.trim()) problemas.push("Informe o nome da empresa cliente.");
    if (e.servicos.length === 0) problemas.push("Escolha pelo menos um serviço.");
    setErros(problemas);
    if (problemas.length) return;
    window.print();
  };

  const salvar = () => {
    const r = salvarRascunho(rascunhoId, e);
    if (r.ok) {
      setRascunhos(lerRascunhos());
      setAviso("Rascunho salvo neste navegador.");
      setErros([]);
    } else {
      setErros([r.erro ?? "Não foi possível salvar o rascunho."]);
    }
  };

  const retomar = (r: Rascunho) => {
    setE(r.estado);
    setRascunhoId(r.id);
    setErros([]);
    setAviso(`Rascunho "${r.nome}" carregado.`);
  };

  const apagar = (id: string) => {
    excluirRascunho(id);
    setRascunhos(lerRascunhos());
    setAviso("Rascunho excluído.");
  };

  const gerarLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?p=${serializar(e)}`;
    setLinkGerado(url);
    await copiar(
      url,
      "Link copiado. Qualquer pessoa com este link vê a proposta preenchida — mande só para quem deve ver."
    );
  };

  const novaProposta = () => {
    setE({ ...ESTADO_INICIAL });
    setRascunhoId(novoId());
    setErros([]);
    setLinkGerado("");
    setAviso("Proposta em branco.");
  };

  /* ── Interface ─────────────────────────────────────────── */

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PROPOSTA_CSS + PREVIEW_CSS }} />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap"
      />

      <div aria-live="assertive" role="alert" className="empty:hidden">
        {erros.length > 0 && (
          <ul className="mb-4 space-y-1 rounded-lg border border-bad-500/50 bg-bad-500/10 p-3 text-sm text-bad-400">
            {erros.map((x) => (
              <li key={x}>⚠️ {x}</li>
            ))}
          </ul>
        )}
      </div>
      <div aria-live="polite" className="empty:hidden">
        {aviso && (
          <p className="mb-4 rounded-lg border border-info-500/40 bg-info-500/10 p-3 text-sm text-info-400">
            {aviso}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-8">
        {/* ═══ Formulário ═══ */}
        <div className="flex flex-col gap-4">
          {/* 1. Cliente */}
          <Bloco n={1} titulo="Para quem é a proposta">
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo
                id={`${uid}-emp`}
                label="Empresa cliente"
                value={e.clienteEmpresa}
                onChange={(v) => set("clienteEmpresa", v)}
                obrigatorio
              />
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-300" htmlFor={`${uid}-seg`}>
                Segmento
                <input
                  id={`${uid}-seg`}
                  list={`${uid}-seg-lista`}
                  className="input-base"
                  value={e.clienteSegmento}
                  onChange={(ev) => set("clienteSegmento", ev.target.value)}
                  placeholder="Escolha ou digite"
                />
                <datalist id={`${uid}-seg-lista`}>
                  {SEGMENTOS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </label>
              <div className="sm:col-span-2">
                <Campo
                  id={`${uid}-ct`}
                  label="Quem vai ler (opcional)"
                  value={e.clienteContato}
                  onChange={(v) => set("clienteContato", v)}
                />
              </div>
            </div>
          </Bloco>

          {/* 2. Diagnóstico */}
          <Bloco n={2} titulo="O que o cliente falou">
            <Area
              id={`${uid}-prob`}
              label="O problema, com as palavras dele (opcional)"
              value={e.problema}
              onChange={(v) => set("problema", v)}
              rows={3}
              dica="É isto que abre a proposta, antes de qualquer serviço."
            />
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-semibold text-ink-300">Objetivo principal</p>
              <div className="flex flex-wrap gap-1.5">
                {OBJETIVOS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => set("objetivo", o.key as Objetivo)}
                    aria-pressed={e.objetivo === o.key}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      e.objetivo === o.key
                        ? "border-action-500 bg-action-500 text-white"
                        : "border-white/15 bg-navy-700 text-ink-300 hover:border-info-500/50"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </Bloco>

          {/* 3. Serviços */}
          <Bloco n={3} titulo="Serviços e valores">
            <p className="mb-3 text-[0.72rem] text-ink-400">
              Clique para incluir. Os valores vêm da tabela e podem ser ajustados por proposta.
            </p>
            {GRUPOS.map((grupo) => (
              <div key={grupo} className="mb-3">
                <p className="mb-1.5 font-display text-[0.7rem] font-bold uppercase tracking-wide text-info-400">
                  {grupo}
                </p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {CATALOGO.filter((c) => c.grupo === grupo).map((item) => {
                    const on = selecionados.has(item.nome);
                    return (
                      <button
                        key={item.nome}
                        type="button"
                        onClick={() => alternar(item)}
                        aria-pressed={on}
                        className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 text-left transition ${
                          on
                            ? "border-ok-500/60 bg-ok-500/10"
                            : "border-white/10 bg-navy-900/60 hover:border-info-500/40"
                        }`}
                      >
                        <span className="text-[0.78rem] font-semibold leading-tight">
                          {on ? "✓ " : ""}
                          {item.nome}
                        </span>
                        <span className="mono shrink-0 text-[0.72rem] font-bold text-info-400">
                          {fmtBRL.format(Number(item.valor.replace(/\./g, "").replace(",", ".")))}
                          <span className="font-normal text-ink-400">
                            {item.tipo === "mensal" ? "/mês" : ""}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button type="button" onClick={addPersonalizado} className="btn-ghost mt-1 text-xs">
              + Serviço personalizado
            </button>

            {e.servicos.length > 0 && (
              <div className="mt-4 border-t border-white/10 pt-3">
                <p className="mb-2 text-xs font-semibold text-ink-300">
                  Na proposta ({e.servicos.length}) — ajuste o valor se precisar
                </p>
                <ul className="space-y-2">
                  {e.servicos.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-2">
                      <input
                        aria-label="Nome do serviço"
                        className="input-base flex-1 py-1.5 text-sm"
                        value={s.nome}
                        placeholder="Nome do serviço"
                        onChange={(ev) => upServico(s.id, "nome", ev.target.value)}
                      />
                      <input
                        aria-label={`Valor de ${s.nome || "serviço"}`}
                        inputMode="decimal"
                        className="input-base mono w-28 py-1.5 text-sm"
                        value={s.valor}
                        placeholder="0,00"
                        onChange={(ev) => upServico(s.id, "valor", ev.target.value)}
                      />
                      <select
                        aria-label={`Tipo de cobrança de ${s.nome || "serviço"}`}
                        className="input-base w-28 py-1.5 text-sm"
                        value={s.tipo}
                        onChange={(ev) =>
                          upServico(s.id, "tipo", ev.target.value === "unico" ? "unico" : "mensal")
                        }
                      >
                        <option value="mensal">Mensal</option>
                        <option value="unico">Único</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => delServico(s.id)}
                        aria-label={`Remover ${s.nome || "serviço"}`}
                        className="text-xs font-semibold text-bad-400 hover:underline"
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Bloco>

          {/* 4. Contrato */}
          <Bloco n={4} titulo="Verba, prazo e pagamento">
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo
                id={`${uid}-verba`}
                label="Verba de mídia sugerida (R$/mês)"
                value={e.verbaMidia}
                onChange={(v) => set("verbaMidia", v)}
                placeholder="0,00"
                mono
                inputMode="decimal"
                dica="Paga direto a Google e Meta. Nunca entra no total de honorários."
              />
              <div>
                <p className="mb-1.5 text-xs font-semibold text-ink-300">Prazo do contrato</p>
                <div className="flex flex-wrap items-center gap-2">
                  {PRAZOS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set("meses", m)}
                      aria-pressed={e.meses === m}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        e.meses === m
                          ? "border-action-500 bg-action-500 text-white"
                          : "border-white/15 bg-navy-700 text-ink-300 hover:border-info-500/50"
                      }`}
                    >
                      {m} meses
                    </button>
                  ))}
                  <input
                    aria-label="Prazo personalizado em meses"
                    type="number"
                    min={1}
                    max={60}
                    className="input-base mono w-20 py-1.5 text-sm"
                    value={e.meses}
                    onChange={(ev) => set("meses", Math.max(1, Number(ev.target.value) || 1))}
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <Campo
                  id={`${uid}-pag`}
                  label="Condição de pagamento (opcional)"
                  value={e.pagamento}
                  onChange={(v) => set("pagamento", v)}
                  placeholder="Implantação em 2x, mensalidade todo dia 10"
                />
              </div>
            </div>

            <dl className="mono mt-4 grid gap-1 border-t border-white/10 pt-3 text-[0.72rem] text-ink-300">
              <Linha rotulo="Honorários mensais" valor={`${fmtBRL.format(inv.subtotalMensal)}/mês`} />
              <Linha rotulo="Valor único" valor={fmtBRL.format(inv.subtotalUnico)} />
              <Linha rotulo="Primeiro mês" valor={fmtBRL.format(inv.primeiroMes)} forte />
              <Linha
                rotulo={`Total do contrato (${inv.meses} meses)`}
                valor={fmtBRL.format(inv.totalContrato)}
                forte
              />
              <Linha
                rotulo="Verba de mídia (fora dos honorários)"
                valor={`${fmtBRL.format(inv.verbaMidia)}/mês`}
              />
            </dl>
          </Bloco>

          {/* Ajustes */}
          <details className="card-surface p-4">
            <summary className="cursor-pointer font-display text-sm font-bold text-info-400">
              Meus dados, logo e cor
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Campo id={`${uid}-ag`} label="Agência" value={e.agenciaNome} onChange={(v) => set("agenciaNome", v)} />
              <Campo id={`${uid}-ag2`} label="Linha de apoio" value={e.agenciaLinha2} onChange={(v) => set("agenciaLinha2", v)} />
              <Campo id={`${uid}-wa`} label="WhatsApp" value={e.agenciaWhatsapp} onChange={(v) => set("agenciaWhatsapp", v)} />
              <Campo id={`${uid}-mail`} label="E-mail" value={e.agenciaEmail} onChange={(v) => set("agenciaEmail", v)} />
              <Campo id={`${uid}-site`} label="Site" value={e.agenciaSite} onChange={(v) => set("agenciaSite", v)} />
              <Campo
                id={`${uid}-val`}
                label="Validade (dias)"
                type="number"
                value={String(e.validadeDias)}
                onChange={(v) => set("validadeDias", Math.max(1, Number(v) || 1))}
                mono
              />
              <div className="flex flex-col gap-1.5 text-xs font-semibold text-ink-300">
                <label htmlFor={`${uid}-logo`}>Trocar logo (PNG, JPG ou SVG, até 2 MB)</label>
                <input
                  id={`${uid}-logo`}
                  type="file"
                  accept={LOGO_TIPOS.join(",")}
                  onChange={(ev) => lerLogo(ev.target.files?.[0])}
                  className="input-base file:mr-3 file:rounded-md file:border-0 file:bg-action-500 file:px-3 file:py-1 file:text-white"
                />
              </div>
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-300" htmlFor={`${uid}-cor`}>
                Cor da marca
                <span className="flex items-center gap-2">
                  <input
                    id={`${uid}-cor`}
                    type="color"
                    value={e.cor}
                    onChange={(ev) => set("cor", ev.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-md border border-white/15 bg-navy-900 p-1"
                  />
                  <input
                    aria-label="Cor em hexadecimal"
                    className="input-base mono py-1.5 text-sm"
                    value={e.cor}
                    onChange={(ev) => set("cor", ev.target.value)}
                  />
                  <button type="button" onClick={() => set("cor", COR_PADRAO)} className="btn-ghost shrink-0 text-xs">
                    Padrão
                  </button>
                </span>
              </label>
              <div className="sm:col-span-2 border-t border-white/10 pt-3">
                <label className="flex items-center gap-2 text-sm text-ink-200">
                  <input
                    type="checkbox"
                    checked={e.incluirInstitucional}
                    onChange={(ev) => set("incluirInstitucional", ev.target.checked)}
                    className="h-4 w-4 accent-[var(--color-action-500)]"
                  />
                  Incluir as páginas &ldquo;Sobre a agência&rdquo; e &ldquo;Missão &amp; Valores&rdquo;
                </label>
              </div>
              {e.incluirInstitucional && (
                <>
                  <div className="sm:col-span-2">
                    <Area id={`${uid}-sobre`} label="Sobre a agência" value={e.sobreAgencia} onChange={(v) => set("sobreAgencia", v)} rows={4} />
                  </div>
                  <div className="sm:col-span-2">
                    <Area id={`${uid}-perfil`} label="Perfil da empresa" value={e.perfilEmpresa} onChange={(v) => set("perfilEmpresa", v)} rows={3} />
                  </div>
                  <div className="sm:col-span-2">
                    <Area id={`${uid}-missao`} label="Missão" value={e.missao} onChange={(v) => set("missao", v)} rows={3} />
                  </div>
                  <div className="sm:col-span-2">
                    <Area id={`${uid}-valores`} label="Valores" value={e.valores} onChange={(v) => set("valores", v)} rows={4} />
                  </div>
                </>
              )}
              <div className="sm:col-span-2">
                <Area
                  id={`${uid}-obs`}
                  label="Observações finais (opcional)"
                  value={e.observacoes}
                  onChange={(v) => set("observacoes", v)}
                  rows={2}
                />
              </div>
            </div>
          </details>

          {/* Rascunhos */}
          <details className="card-surface p-4">
            <summary className="cursor-pointer font-display text-sm font-bold text-info-400">
              Rascunhos salvos ({rascunhos.length})
            </summary>
            {rascunhos.length === 0 ? (
              <p className="mt-2 text-xs text-ink-400">
                Nenhum rascunho ainda. Use &ldquo;Salvar&rdquo; para guardar e continuar depois.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {rascunhos.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-1.5">
                    <span className="text-sm">
                      {r.nome}{" "}
                      <span className="text-[0.7rem] text-ink-400">
                        · {new Date(r.atualizadoEm).toLocaleString("pt-BR")}
                      </span>
                    </span>
                    <span className="flex gap-2">
                      <button type="button" onClick={() => retomar(r)} className="text-xs font-semibold text-info-400 hover:underline">
                        Retomar
                      </button>
                      <button type="button" onClick={() => apagar(r.id)} className="text-xs font-semibold text-bad-400 hover:underline">
                        Excluir
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </details>
        </div>

        {/* ═══ Pré-visualização (abaixo do formulário, largura toda) ═══ */}
        <div>
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <button type="button" onClick={exportar} className="btn-primary text-sm">
                🖨️ Exportar PDF
              </button>
              <button
                type="button"
                onClick={() => copiar(textoWhatsApp(e), "Texto copiado — é só colar no WhatsApp.")}
                className="btn-ghost text-sm"
              >
                💬 Copiar texto
              </button>
              <button type="button" onClick={salvar} className="btn-ghost text-sm">
                💾 Salvar
              </button>
              <button type="button" onClick={gerarLink} className="btn-ghost text-sm">
                🔗 Link
              </button>
              <button type="button" onClick={novaProposta} className="btn-ghost text-sm">
                🧹 Nova
              </button>
            </div>

            {linkGerado && (
              <div className="mb-3 rounded-lg border border-warn-500/40 bg-warn-500/[0.07] p-3">
                <p className="text-[0.72rem] leading-relaxed text-warn-400">
                  Este link carrega a proposta preenchida:{" "}
                  <strong>qualquer pessoa com ele vê os valores</strong>.
                </p>
                <input
                  readOnly
                  aria-label="Link da proposta"
                  value={linkGerado}
                  onFocus={(ev) => ev.currentTarget.select()}
                  className="input-base mono mt-2 text-[0.7rem]"
                />
              </div>
            )}

            <p className="mb-2 text-xs text-ink-400">
              Pré-visualização — é exatamente isto que sai no PDF.
            </p>
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-navy-900 p-3">
              <div className="pp-preview">
                <PropostaDoc e={e} />
              </div>
            </div>

            <p className="mt-3 text-[0.72rem] leading-relaxed text-ink-400">
              Em &ldquo;Exportar PDF&rdquo;, escolha <strong>Salvar como PDF</strong>, deixe as margens
              em <strong>Nenhuma</strong> e marque <strong>Gráficos de plano de fundo</strong> para as
              ondas saírem impressas.
            </p>
          </div>
        </div>
      </div>

      {/* Cópia do documento fora da árvore do site: é ela que vai para o papel. */}
      {montado &&
        createPortal(
          <div id="proposta-impressao">
            <PropostaDoc e={e} />
          </div>,
          document.body
        )}
    </div>
  );
}

/** A pré-visualização é o documento A4 reduzido para caber na coluna. */
const PREVIEW_CSS = `
.pp-preview { zoom: 0.4; }
@media (min-width: 420px) { .pp-preview { zoom: 0.48; } }
@media (min-width: 640px) { .pp-preview { zoom: 0.74; } }
@media (min-width: 900px) { .pp-preview { zoom: 0.96; } }
`;

/* ── Peças de formulário ─────────────────────────────────── */

function Bloco({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  return (
    <section className="card-surface p-4 sm:p-5" aria-label={titulo}>
      <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-bold">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-action-500 text-[0.7rem] text-white">
          {n}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Linha({ rotulo, valor, forte }: { rotulo: string; valor: string; forte?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt>{rotulo}</dt>
      <dd className={forte ? "font-bold text-info-400" : ""}>{valor}</dd>
    </div>
  );
}

function Campo({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  mono,
  inputMode,
  obrigatorio,
  dica,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
  inputMode?: "decimal" | "text";
  obrigatorio?: boolean;
  dica?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-300" htmlFor={id}>
      {label}
      {obrigatorio && <span className="sr-only"> (obrigatório)</span>}
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        required={obrigatorio}
        aria-required={obrigatorio || undefined}
        className={`input-base ${mono ? "mono" : ""}`}
        value={value}
        placeholder={placeholder}
        onChange={(ev) => onChange(ev.target.value)}
      />
      {dica && <span className="font-normal text-[0.7rem] text-ink-400">{dica}</span>}
    </label>
  );
}

function Area({
  id,
  label,
  value,
  onChange,
  rows = 3,
  dica,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  dica?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-300" htmlFor={id}>
      {label}
      <textarea
        id={id}
        rows={rows}
        className="input-base resize-y"
        value={value}
        onChange={(ev) => onChange(ev.target.value)}
      />
      {dica && <span className="font-normal text-[0.7rem] text-ink-400">{dica}</span>}
    </label>
  );
}
