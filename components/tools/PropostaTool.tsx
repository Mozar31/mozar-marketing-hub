"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PropostaDoc, PROPOSTA_CSS } from "./PropostaDoc";
import {
  COR_PADRAO,
  ESTADO_INICIAL,
  MODELOS_SERVICO,
  OBJETIVOS,
  PRAZOS,
  SEGMENTOS,
  SITUACOES,
  calcularInvestimento,
  desserializar,
  excluirRascunho,
  fmtBRL,
  lerRascunhos,
  parseBRL,
  salvarRascunho,
  serializar,
  textoWhatsApp,
  type CaseProva,
  type Objetivo,
  type PropostaEstado,
  type Rascunho,
  type Servico,
  type TipoCobranca,
  type Situacao,
} from "@/lib/tools/proposta";

/**
 * Gerador de proposta comercial — §23.
 *
 * Ferramenta pública e genérica: quem usa preenche os próprios serviços e
 * valores. Nenhuma tabela de preços vive neste código (ver `CatalogPreset` em
 * lib/tools/proposta.ts para a porta de entrada de um catálogo, que só pode
 * chegar em tempo de execução por rota autenticada).
 *
 * Nada é enviado para servidor: os dados ficam no estado do React, no
 * localStorage (rascunhos) e, se a pessoa pedir, no link que ela mesma copia.
 */

const ETAPAS = [
  { titulo: "Quem recebe", resumo: "A empresa que vai ler a proposta" },
  { titulo: "Quem envia", resumo: "Sua agência, sua marca" },
  { titulo: "Diagnóstico", resumo: "O problema e o objetivo" },
  { titulo: "Escopo e investimento", resumo: "Serviços, valores e prazo" },
  { titulo: "Provas e fechamento", resumo: "Cases, validade e observações" },
];

const novoId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const LOGO_TIPOS = ["image/png", "image/jpeg", "image/svg+xml"];
const LOGO_MAX = 2 * 1024 * 1024;

export function PropostaTool() {
  const [e, setE] = useState<PropostaEstado>(ESTADO_INICIAL);
  const [etapa, setEtapa] = useState(0);
  const [erros, setErros] = useState<string[]>([]);
  const [aviso, setAviso] = useState("");
  const [rascunhos, setRascunhos] = useState<Rascunho[]>([]);
  const [rascunhoId, setRascunhoId] = useState<string>(novoId);
  const [montado, setMontado] = useState(false);
  const [linkGerado, setLinkGerado] = useState("");

  const topoRef = useRef<HTMLDivElement>(null);
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
        setAviso("Proposta carregada a partir do link. A logo não viaja no link — reenvie se precisar.");
      } else {
        setAviso("O link recebido está incompleto ou foi truncado. Comece uma proposta nova.");
      }
    }
  }, []);

  const inv = useMemo(() => calcularInvestimento(e), [e]);

  /* ── Validação por etapa ───────────────────────────────── */

  function validar(indice: number): string[] {
    const problemas: string[] = [];
    if (indice === 0 && !e.clienteEmpresa.trim()) {
      problemas.push("Informe o nome da empresa que vai receber a proposta.");
    }
    if (indice === 1 && !e.agenciaNome.trim()) {
      problemas.push("Informe o nome da agência ou do profissional que envia.");
    }
    if (indice === 3) {
      if (e.servicos.length === 0) problemas.push("Adicione pelo menos um serviço ao escopo.");
      if (e.servicos.some((s) => !s.nome.trim())) problemas.push("Todo serviço precisa de um nome.");
      if (parseBRL(e.verbaMidia) <= 0) {
        problemas.push("Informe a verba de mídia mensal sugerida — ela é obrigatória e aparece separada dos honorários.");
      }
    }
    return problemas;
  }

  const avancar = () => {
    const problemas = validar(etapa);
    setErros(problemas);
    if (problemas.length) return;
    setEtapa((n) => Math.min(ETAPAS.length - 1, n + 1));
    topoRef.current?.focus();
  };

  const voltar = () => {
    setErros([]);
    setEtapa((n) => Math.max(0, n - 1));
    topoRef.current?.focus();
  };

  const irPara = (i: number) => {
    // Só exige validação para avançar; voltar é sempre livre.
    if (i > etapa) {
      const problemas = validar(etapa);
      setErros(problemas);
      if (problemas.length) return;
    } else {
      setErros([]);
    }
    setEtapa(i);
  };

  /* ── Serviços ──────────────────────────────────────────── */

  const addServico = (modelo?: (typeof MODELOS_SERVICO)[number]) =>
    setE((p) => ({
      ...p,
      servicos: [
        ...p.servicos,
        modelo
          ? { ...modelo, entregas: [...modelo.entregas], id: novoId() }
          : { id: novoId(), nome: "", descricao: "", tipo: "mensal", valor: "", entregas: [] },
      ],
    }));

  const upServico = <K extends keyof Servico>(id: string, campo: K, valor: Servico[K]) =>
    setE((p) => ({
      ...p,
      servicos: p.servicos.map((s) => (s.id === id ? { ...s, [campo]: valor } : s)),
    }));

  const delServico = (id: string) =>
    setE((p) => ({ ...p, servicos: p.servicos.filter((s) => s.id !== id) }));

  /* ── Cases ─────────────────────────────────────────────── */

  const addCase = () =>
    setE((p) =>
      p.cases.length >= 3
        ? p
        : { ...p, cases: [...p.cases, { id: novoId(), nicho: "", resultado: "", contexto: "" }] }
    );

  const upCase = <K extends keyof CaseProva>(id: string, campo: K, valor: CaseProva[K]) =>
    setE((p) => ({ ...p, cases: p.cases.map((c) => (c.id === id ? { ...c, [campo]: valor } : c)) }));

  const delCase = (id: string) =>
    setE((p) => ({ ...p, cases: p.cases.filter((c) => c.id !== id) }));

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
    setEtapa(0);
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
    setE(ESTADO_INICIAL);
    setRascunhoId(novoId());
    setEtapa(0);
    setErros([]);
    setLinkGerado("");
    setAviso("Proposta em branco.");
  };

  /* ── Interface ─────────────────────────────────────────── */

  const progresso = Math.round(((etapa + 1) / ETAPAS.length) * 100);
  const etapaAtual = ETAPAS[etapa] ?? ETAPAS[0]!;

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PROPOSTA_CSS }} />

      {/* Barra de progresso + navegação direta pelas etapas */}
      <div
        ref={topoRef}
        tabIndex={-1}
        className="mb-4 outline-none"
        aria-label={`Etapa ${etapa + 1} de ${ETAPAS.length}: ${etapaAtual.titulo}`}
      >
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="font-display text-sm font-bold">
            Etapa {etapa + 1} de {ETAPAS.length} — {etapaAtual.titulo}
          </p>
          <p className="text-xs text-ink-400">{etapaAtual.resumo}</p>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-navy-700"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={ETAPAS.length}
          aria-valuenow={etapa + 1}
          aria-valuetext={`Etapa ${etapa + 1} de ${ETAPAS.length}`}
        >
          <div
            className="h-full rounded-full bg-action-500 transition-all"
            style={{ width: `${progresso}%` }}
          />
        </div>
        <ol className="mt-3 flex flex-wrap gap-1.5">
          {ETAPAS.map((et, i) => (
            <li key={et.titulo}>
              <button
                type="button"
                onClick={() => irPara(i)}
                aria-current={i === etapa ? "step" : undefined}
                className={`rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold transition ${
                  i === etapa
                    ? "border-action-500 bg-action-500 text-white"
                    : i < etapa
                      ? "border-ok-500/40 bg-ok-500/10 text-ok-400"
                      : "border-white/15 bg-navy-700 text-ink-400 hover:border-info-500/50"
                }`}
              >
                {i + 1}. {et.titulo}
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* Mensagens: erro e confirmação */}
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ═══ Formulário ═══ */}
        <div>
          <div className="card-surface p-4 sm:p-5">
            {etapa === 0 && (
              <Fieldset legenda="Quem recebe a proposta">
                <Campo
                  id={`${uid}-emp`}
                  label="Nome da empresa cliente"
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
                    placeholder="Escolha ou digite o segmento"
                  />
                  <datalist id={`${uid}-seg-lista`}>
                    {SEGMENTOS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  <span className="font-normal text-[0.7rem] text-ink-400">
                    Advocacia e saúde adicionam automaticamente o aviso do conselho de classe.
                  </span>
                </label>
                <Campo
                  id={`${uid}-cid`}
                  label="Cidade ou região de atendimento"
                  value={e.clienteCidade}
                  onChange={(v) => set("clienteCidade", v)}
                />
                <Campo
                  id={`${uid}-ct`}
                  label="Nome de quem vai ler"
                  value={e.clienteContato}
                  onChange={(v) => set("clienteContato", v)}
                />
                <Campo
                  id={`${uid}-cg`}
                  label="Cargo de quem vai ler"
                  value={e.clienteCargo}
                  onChange={(v) => set("clienteCargo", v)}
                />
              </Fieldset>
            )}

            {etapa === 1 && (
              <Fieldset legenda="Quem envia">
                <Campo
                  id={`${uid}-ag`}
                  label="Nome da agência ou profissional"
                  value={e.agenciaNome}
                  onChange={(v) => set("agenciaNome", v)}
                  obrigatorio
                />
                <Campo
                  id={`${uid}-site`}
                  label="Site"
                  value={e.agenciaSite}
                  onChange={(v) => set("agenciaSite", v)}
                  placeholder="www.suaagencia.com.br"
                />
                <Campo
                  id={`${uid}-wa`}
                  label="WhatsApp"
                  value={e.agenciaWhatsapp}
                  onChange={(v) => set("agenciaWhatsapp", v)}
                  placeholder="(51) 99999-9999"
                />
                <Campo
                  id={`${uid}-mail`}
                  label="E-mail"
                  type="email"
                  value={e.agenciaEmail}
                  onChange={(v) => set("agenciaEmail", v)}
                />

                <div className="flex flex-col gap-1.5 text-xs font-semibold text-ink-300">
                  <label htmlFor={`${uid}-logo`}>Logo (PNG, JPG ou SVG, até 2 MB)</label>
                  <input
                    id={`${uid}-logo`}
                    type="file"
                    accept={LOGO_TIPOS.join(",")}
                    onChange={(ev) => lerLogo(ev.target.files?.[0])}
                    className="input-base file:mr-3 file:rounded-md file:border-0 file:bg-action-500 file:px-3 file:py-1 file:text-white"
                  />
                  <span className="font-normal text-[0.7rem] text-ink-400">
                    A imagem fica no seu navegador — não é enviada para nenhum servidor e não entra no link compartilhável.
                  </span>
                  {e.agenciaLogo && (
                    <button type="button" onClick={() => set("agenciaLogo", "")} className="btn-ghost mt-1 self-start text-xs">
                      Remover logo
                    </button>
                  )}
                </div>

                <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-300" htmlFor={`${uid}-cor`}>
                  Cor principal da marca
                  <span className="flex items-center gap-2">
                    <input
                      id={`${uid}-cor`}
                      type="color"
                      value={e.cor}
                      onChange={(ev) => set("cor", ev.target.value)}
                      className="h-10 w-14 cursor-pointer rounded-md border border-white/15 bg-navy-900 p-1"
                    />
                    <input
                      aria-label="Cor em hexadecimal"
                      className="input-base mono"
                      value={e.cor}
                      onChange={(ev) => set("cor", ev.target.value)}
                    />
                    <button type="button" onClick={() => set("cor", COR_PADRAO)} className="btn-ghost shrink-0 text-xs">
                      Padrão
                    </button>
                  </span>
                </label>
              </Fieldset>
            )}

            {etapa === 2 && (
              <Fieldset legenda="Diagnóstico">
                <Area
                  id={`${uid}-prob`}
                  label="O problema que o cliente relatou"
                  value={e.problema}
                  onChange={(v) => set("problema", v)}
                  dica="Escreva com as palavras dele. É isto que abre a proposta, antes de qualquer serviço."
                  rows={4}
                />

                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1 text-xs font-semibold text-ink-300">Objetivo principal</legend>
                  {OBJETIVOS.map((o) => (
                    <label key={o.key} className="flex items-center gap-2 text-sm text-ink-200">
                      <input
                        type="radio"
                        name={`${uid}-obj`}
                        value={o.key}
                        checked={e.objetivo === o.key}
                        onChange={() => set("objetivo", o.key as Objetivo)}
                        className="h-4 w-4 accent-[var(--color-action-500)]"
                      />
                      {o.label}
                    </label>
                  ))}
                </fieldset>

                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1 text-xs font-semibold text-ink-300">Situação atual</legend>
                  {SITUACOES.map((s) => (
                    <label key={s.key} className="flex items-center gap-2 text-sm text-ink-200">
                      <input
                        type="checkbox"
                        checked={e.situacao.includes(s.key)}
                        onChange={(ev) =>
                          set(
                            "situacao",
                            ev.target.checked
                              ? [...e.situacao, s.key as Situacao]
                              : e.situacao.filter((x) => x !== s.key)
                          )
                        }
                        className="h-4 w-4 accent-[var(--color-action-500)]"
                      />
                      {s.label}
                    </label>
                  ))}
                </fieldset>
              </Fieldset>
            )}

            {etapa === 3 && (
              <Fieldset legenda="Escopo e investimento">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-ink-300">Adicionar serviço</p>
                  <div className="flex flex-wrap gap-1.5">
                    {MODELOS_SERVICO.map((m) => (
                      <button
                        key={m.nome}
                        type="button"
                        onClick={() => addServico(m)}
                        className="btn-ghost text-xs"
                        title={`Adiciona "${m.nome}" com as entregas já estruturadas e o valor em branco`}
                      >
                        + {m.nome}
                      </button>
                    ))}
                    <button type="button" onClick={() => addServico()} className="btn-ghost text-xs">
                      + Em branco
                    </button>
                  </div>
                  <p className="text-[0.7rem] text-ink-400">
                    Os modelos vêm com a descrição e as entregas prontas e <strong>sem valor</strong> — quem
                    define o preço é você.
                  </p>
                </div>

                {e.servicos.map((s, i) => (
                  <div key={s.id} className="rounded-lg border border-white/10 bg-navy-900/60 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="font-display text-xs font-bold text-info-400">Serviço {i + 1}</p>
                      <button
                        type="button"
                        onClick={() => delServico(s.id)}
                        className="text-xs font-semibold text-bad-400 hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Campo
                        id={`${uid}-sv-${s.id}`}
                        label="Nome do serviço"
                        value={s.nome}
                        onChange={(v) => upServico(s.id, "nome", v)}
                      />
                      <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-300" htmlFor={`${uid}-tp-${s.id}`}>
                        Tipo de cobrança
                        <select
                          id={`${uid}-tp-${s.id}`}
                          className="input-base"
                          value={s.tipo}
                          onChange={(ev) => upServico(s.id, "tipo", ev.target.value as TipoCobranca)}
                        >
                          <option value="mensal">Mensal</option>
                          <option value="unico">Valor único</option>
                        </select>
                      </label>
                      <Campo
                        id={`${uid}-vl-${s.id}`}
                        label={`Valor (R$)${s.tipo === "mensal" ? " por mês" : ""}`}
                        value={s.valor}
                        onChange={(v) => upServico(s.id, "valor", v)}
                        placeholder="0,00"
                        mono
                        inputMode="decimal"
                        dica="Pode digitar com ou sem separador de milhar."
                      />
                      <div className="sm:col-span-2">
                        <Area
                          id={`${uid}-ds-${s.id}`}
                          label="Descrição"
                          value={s.descricao}
                          onChange={(v) => upServico(s.id, "descricao", v)}
                          rows={2}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Area
                          id={`${uid}-en-${s.id}`}
                          label="Entregas (uma por linha)"
                          value={s.entregas.join("\n")}
                          onChange={(v) => upServico(s.id, "entregas", v.split("\n"))}
                          rows={4}
                          dica="Cada linha vira um item da lista no documento."
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="rounded-lg border border-warn-500/40 bg-warn-500/[0.07] p-3">
                  <Campo
                    id={`${uid}-verba`}
                    label="Verba de mídia mensal sugerida (R$)"
                    value={e.verbaMidia}
                    onChange={(v) => set("verbaMidia", v)}
                    placeholder="0,00"
                    mono
                    inputMode="decimal"
                    obrigatorio
                  />
                  <p className="mt-2 text-[0.72rem] leading-relaxed text-warn-400">
                    ⚠️ A verba é paga pelo cliente direto a Google e Meta. Ela aparece em linha própria no
                    documento e <strong>nunca</strong> é somada ao subtotal de honorários.
                  </p>
                </div>

                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1 text-xs font-semibold text-ink-300">Prazo do contrato</legend>
                  <div className="flex flex-wrap items-center gap-2">
                    {PRAZOS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => set("meses", m)}
                        aria-pressed={e.meses === m}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                          e.meses === m
                            ? "border-action-500 bg-action-500 text-white"
                            : "border-white/15 bg-navy-700 text-ink-300 hover:border-info-500/50"
                        }`}
                      >
                        {m} meses
                      </button>
                    ))}
                    <label className="flex items-center gap-2 text-xs font-semibold text-ink-300" htmlFor={`${uid}-meses`}>
                      Personalizado
                      <input
                        id={`${uid}-meses`}
                        type="number"
                        min={1}
                        max={60}
                        className="input-base mono w-20"
                        value={e.meses}
                        onChange={(ev) => set("meses", Math.max(1, Number(ev.target.value) || 1))}
                      />
                    </label>
                  </div>
                </fieldset>

                <Area
                  id={`${uid}-pag`}
                  label="Condição de pagamento"
                  value={e.pagamento}
                  onChange={(v) => set("pagamento", v)}
                  rows={2}
                  dica="Ex.: implantação em 2x, mensalidade todo dia 10 via boleto ou Pix."
                />
              </Fieldset>
            )}

            {etapa === 4 && (
              <Fieldset legenda="Provas e fechamento">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-ink-300">Cases (até 3)</p>
                  <button
                    type="button"
                    onClick={addCase}
                    disabled={e.cases.length >= 3}
                    className="btn-ghost self-start text-xs disabled:opacity-50"
                  >
                    + Adicionar case
                  </button>
                  <p className="text-[0.7rem] text-ink-400">
                    Use resultados que você realmente entregou e consegue comprovar. O documento já traz a
                    ressalva de que são casos de outros clientes, não projeção para este.
                  </p>
                </div>

                {e.cases.map((c, i) => (
                  <div key={c.id} className="rounded-lg border border-white/10 bg-navy-900/60 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="font-display text-xs font-bold text-info-400">Case {i + 1}</p>
                      <button
                        type="button"
                        onClick={() => delCase(c.id)}
                        className="text-xs font-semibold text-bad-400 hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                    <div className="grid gap-3">
                      <Campo
                        id={`${uid}-cn-${c.id}`}
                        label="Nicho"
                        value={c.nicho}
                        onChange={(v) => upCase(c.id, "nicho", v)}
                        placeholder="Clínica odontológica"
                      />
                      <Campo
                        id={`${uid}-cr-${c.id}`}
                        label="Resultado"
                        value={c.resultado}
                        onChange={(v) => upCase(c.id, "resultado", v)}
                        placeholder="Custo por lead de R$ 42 na rede de pesquisa"
                      />
                      <Area
                        id={`${uid}-cc-${c.id}`}
                        label="Contexto"
                        value={c.contexto}
                        onChange={(v) => upCase(c.id, "contexto", v)}
                        rows={2}
                      />
                    </div>
                  </div>
                ))}

                <Campo
                  id={`${uid}-val`}
                  label="Validade da proposta (dias)"
                  type="number"
                  value={String(e.validadeDias)}
                  onChange={(v) => set("validadeDias", Math.max(1, Number(v) || 1))}
                  mono
                />

                <Area
                  id={`${uid}-obs`}
                  label="Observações finais"
                  value={e.observacoes}
                  onChange={(v) => set("observacoes", v)}
                  rows={3}
                />
              </Fieldset>
            )}

            {/* Navegação entre etapas */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={voltar}
                disabled={etapa === 0}
                className="btn-ghost text-sm disabled:opacity-40"
              >
                ← Voltar
              </button>
              {etapa < ETAPAS.length - 1 ? (
                <button type="button" onClick={avancar} className="btn-primary text-sm">
                  Avançar →
                </button>
              ) : (
                <span className="text-xs text-ink-400">Última etapa — use as ações ao lado.</span>
              )}
            </div>
          </div>

          {/* Memória de cálculo, no padrão das outras calculadoras do hub */}
          <details className="card-surface mt-4 p-4">
            <summary className="cursor-pointer font-display text-sm font-bold text-info-400">
              Ver memória de cálculo (como cada total foi obtido)
            </summary>
            <ul className="mono mt-3 space-y-1.5 text-[0.72rem] leading-relaxed text-ink-300">
              <li>subtotal mensal = soma dos serviços mensais = {fmtBRL.format(inv.subtotalMensal)}</li>
              <li>subtotal único = soma dos serviços de valor único = {fmtBRL.format(inv.subtotalUnico)}</li>
              <li>
                primeiro mês = subtotal mensal + subtotal único = {fmtBRL.format(inv.subtotalMensal)} +{" "}
                {fmtBRL.format(inv.subtotalUnico)} = {fmtBRL.format(inv.primeiroMes)}
              </li>
              <li>
                total do contrato = (subtotal mensal × {inv.meses}) + subtotal único ={" "}
                {fmtBRL.format(inv.subtotalMensal * inv.meses)} + {fmtBRL.format(inv.subtotalUnico)} ={" "}
                {fmtBRL.format(inv.totalContrato)}
              </li>
              <li>
                verba de mídia = {fmtBRL.format(inv.verbaMidia)}/mês — campo próprio, NUNCA somado aos
                honorários
              </li>
            </ul>
          </details>

          {/* Rascunhos */}
          <section className="card-surface mt-4 p-4" aria-labelledby={`${uid}-rasc`}>
            <h2 id={`${uid}-rasc`} className="mb-2 font-display text-sm font-bold">
              Rascunhos salvos neste navegador
            </h2>
            {rascunhos.length === 0 ? (
              <p className="text-xs text-ink-400">
                Nenhum rascunho ainda. Use &ldquo;Salvar rascunho&rdquo; para guardar e continuar depois.
              </p>
            ) : (
              <ul className="space-y-1.5">
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
          </section>
        </div>

        {/* ═══ Pré-visualização ═══ */}
        <div>
          <div className="lg:sticky lg:top-4">
            <div className="mb-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => window.print()} className="btn-primary text-sm">
                🖨️ Exportar PDF
              </button>
              <button
                type="button"
                onClick={() => copiar(textoWhatsApp(e), "Texto copiado — é só colar no WhatsApp.")}
                className="btn-ghost text-sm"
              >
                💬 Copiar como texto
              </button>
              <button type="button" onClick={salvar} className="btn-ghost text-sm">
                💾 Salvar rascunho
              </button>
              <button type="button" onClick={gerarLink} className="btn-ghost text-sm">
                🔗 Gerar link
              </button>
              <button type="button" onClick={novaProposta} className="btn-ghost text-sm">
                🧹 Nova proposta
              </button>
            </div>

            {linkGerado && (
              <div className="mb-3 rounded-lg border border-warn-500/40 bg-warn-500/[0.07] p-3">
                <p className="text-[0.72rem] leading-relaxed text-warn-400">
                  Este link carrega a proposta preenchida: <strong>qualquer pessoa com ele vê os valores</strong>.
                  A logo não vai junto (ela estouraria o limite de tamanho da URL).
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
            <div className="overflow-hidden rounded-xl border border-white/10 lg:max-h-[75vh] lg:overflow-y-auto">
              <PropostaDoc e={e} />
            </div>

            <p className="mt-3 text-[0.72rem] leading-relaxed text-ink-400">
              Em &ldquo;Exportar PDF&rdquo;, escolha <strong>Salvar como PDF</strong> na janela de impressão. O
              texto sai selecionável e pesquisável, porque o PDF é gerado pelo próprio navegador — nada é
              transformado em imagem.
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

/* ── Peças de formulário ─────────────────────────────────── */

function Fieldset({ legenda, children }: { legenda: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="sr-only">{legenda}</legend>
      {children}
    </fieldset>
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
      {obrigatorio && (
        <span className="sr-only"> (obrigatório)</span>
      )}
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
