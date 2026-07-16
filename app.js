/* ===== Consig Invest | Marketing Hub — app.js ===== */

const WHATSAPP = "5551983493659";
const PAGESPEED_KEY = "AIzaSyCE2W5SN58BNxlE_q7FOqpqz89wKCRmAkY"; // chave gratuita da API PageSpeed (restrita ao domínio hub.consiginvest.com)
const GMB_ANALYZE = "https://dinastia-n8n-webhook.u9dep8.easypanel.host/webhook/gmb-analyze";

/* ============================================================
   NAVEGAÇÃO (abas + rotas por hash)
============================================================ */
const TAB_BY_HASH = { "velocidade": "speed", "google-meu-negocio": "gmb", "roi": "roi", "conversores": "conv" };

function showTab(tabKey) {
  document.querySelectorAll(".tab").forEach((t) => {
    const on = t.dataset.tab === tabKey;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
  document.getElementById("panel-" + tabKey).classList.add("active");
}

function route() {
  const hash = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  const [main, sub] = hash.split("/");
  const tabKey = TAB_BY_HASH[main] || "speed";
  showTab(tabKey);
  if (tabKey === "conv") showConverter(sub || null);
  window.scrollTo({ top: 0 });
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => { location.hash = tab.dataset.hash; });
});
window.addEventListener("hashchange", route);

/* ============================================================
   LINKS DE WHATSAPP
============================================================ */
function waLink(msg) {
  return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(msg);
}
document.querySelectorAll(".cta-whats").forEach((a) => { a.href = waLink(a.dataset.msg); });
document.getElementById("header-whats").href = waLink(
  "Olá, vim através do Hub da Consig Invest e gostaria de mais informações..."
);

/* ============================================================
   HELPERS
============================================================ */
const fmtBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtNum = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const fmtDec = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function escapeHTML(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const loadedScripts = {};
function loadScript(src) {
  if (loadedScripts[src]) return loadedScripts[src];
  loadedScripts[src] = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Falha ao carregar biblioteca. Verifique sua conexão."));
    document.head.appendChild(s);
  });
  return loadedScripts[src];
}

const LIB = {
  pdfjs: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  pdfjsWorker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  pdflib: "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
  mammoth: "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.2/mammoth.browser.min.js",
  xlsx: "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
  html2pdf: "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js",
  jszip: "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
  heic2any: "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js",
};

async function ensurePdfjs() {
  await loadScript(LIB.pdfjs);
  pdfjsLib.GlobalWorkerOptions.workerSrc = LIB.pdfjsWorker;
}

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}

function baseName(name) {
  return name.replace(/\.[^.]+$/, "");
}

/* ============================================================
   FERRAMENTA 1 — VELOCIDADE & SEO (PageSpeed Insights)
============================================================ */
const speedForm = document.getElementById("speed-form");
const speedBtn = document.getElementById("speed-btn");
const speedError = document.getElementById("speed-error");
const speedResults = document.getElementById("speed-results");

function normalizeUrl(raw) {
  let u = raw.trim().replace(/\s+/g, "");
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    const parsed = new URL(u);
    if (!parsed.hostname.includes(".")) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function scoreColor(score) {
  if (score >= 90) return "#3DDC8E";
  if (score >= 50) return "#FFC24B";
  return "#FF5A6E";
}

function gaugeSVG(score) {
  const color = scoreColor(score);
  const r = 52;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  return `
    <svg width="130" height="130" viewBox="0 0 130 130" role="img" aria-label="Nota ${score} de 100">
      <circle cx="65" cy="65" r="${r}" fill="none" stroke="rgba(159,172,209,0.15)" stroke-width="10"/>
      <circle cx="65" cy="65" r="${r}" fill="none" stroke="${color}" stroke-width="10"
        stroke-linecap="round" stroke-dasharray="${filled} ${c}"
        transform="rotate(-90 65 65)"/>
      <text x="65" y="74" text-anchor="middle" fill="${color}"
        font-family="'JetBrains Mono', monospace" font-size="30" font-weight="700">${score}</text>
    </svg>`;
}

function metricClass(id, numericValue) {
  const limits = { lcp: [2500, 4000], cls: [0.1, 0.25], tbt: [200, 600] };
  const [good, mid] = limits[id];
  if (numericValue <= good) return "good";
  if (numericValue <= mid) return "mid";
  return "bad";
}

async function runPageSpeed(url, strategy, attempt) {
  const api =
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=" +
    encodeURIComponent(url) +
    "&strategy=" + strategy +
    "&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO&locale=pt_BR" +
    (PAGESPEED_KEY ? "&key=" + PAGESPEED_KEY : "");

  const res = await fetch(api);

  if (res.status === 429) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 65000));
      return runPageSpeed(url, strategy, attempt + 1);
    }
    throw new Error("RATE_LIMIT");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = body && body.error && body.error.message ? body.error.message : "";
    throw new Error("API_ERROR:" + msg);
  }
  return res.json();
}

const CATEGORY_DEFS = [
  { key: "performance", label: "Desempenho" },
  { key: "accessibility", label: "Acessibilidade" },
  { key: "best-practices", label: "Práticas recomendadas" },
  { key: "seo", label: "SEO" },
];

function catScore(lh, key) {
  const c = lh.categories[key];
  return c && c.score != null ? Math.round(c.score * 100) : null;
}

function renderDevice(lh, gaugesId, metricsId) {
  const gauges = document.getElementById(gaugesId);
  gauges.innerHTML = "";
  CATEGORY_DEFS.forEach((c) => {
    const score = catScore(lh, c.key);
    if (score === null) return;
    const card = el("div", "gauge-card");
    card.innerHTML = gaugeSVG(score) + `<span class="gauge-label">${c.label}</span>`;
    gauges.appendChild(card);
  });

  const metricsWrap = document.getElementById(metricsId);
  metricsWrap.innerHTML = "";
  const metricDefs = [
    { id: "lcp", audit: "largest-contentful-paint", label: "LCP — Conteúdo aparece em" },
    { id: "cls", audit: "cumulative-layout-shift", label: "CLS — Estabilidade visual" },
    { id: "tbt", audit: "total-blocking-time", label: "TBT — Tempo travado" },
  ];
  metricDefs.forEach((m) => {
    const a = lh.audits[m.audit];
    if (!a) return;
    const card = el("div", "metric-card");
    card.appendChild(el("div", "m-label", m.label));
    card.appendChild(el("div", "m-value " + metricClass(m.id, a.numericValue), a.displayValue || "—"));
    metricsWrap.appendChild(card);
  });
}

function plainSummary(mobileLh, desktopLh, url) {
  const host = (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "seu site"; } })();
  const perf = catScore(mobileLh, "performance") ?? 0;
  const perfDesk = desktopLh ? catScore(desktopLh, "performance") : null;
  const seo = catScore(mobileLh, "seo") ?? 0;
  const acc = catScore(mobileLh, "accessibility");
  const bp = catScore(mobileLh, "best-practices");
  const audits = mobileLh.audits;

  // veredito geral de velocidade
  let head, headText;
  if (perf >= 90) {
    head = "🟢 Seu site está rápido";
    headText = `O <strong>${escapeHTML(host)}</strong> carrega rápido no celular (nota ${perf} de 100). Na prática: quem clica no seu site consegue ver o conteúdo quase na hora, e pouquíssima gente desiste por demora. Isso é um ponto forte — a maioria dos sites brasileiros não chega nessa nota.`;
  } else if (perf >= 70) {
    head = "🟡 Seu site é razoável, mas deixa dinheiro na mesa";
    headText = `O <strong>${escapeHTML(host)}</strong> tem nota ${perf} de 100 no celular. Ele funciona, mas tem uma demora perceptível — e estudos mostram que <strong>cada segundo a mais de espera derruba as vendas em até 7%</strong>. Dá para melhorar sem reconstruir o site.`;
  } else if (perf >= 50) {
    head = "🟠 Atenção: seu site está lento no celular";
    headText = `O <strong>${escapeHTML(host)}</strong> tem nota ${perf} de 100. No celular (onde está a maioria dos seus clientes), a espera é longa o bastante para <strong>parte dos visitantes desistir antes de ver qualquer coisa</strong> — visita que você pagou para atrair (anúncio, Google) e foi embora.`;
  } else {
    head = "🔴 Crítico: seu site está muito lento";
    headText = `O <strong>${escapeHTML(host)}</strong> tem nota ${perf} de 100 no celular. Isso significa que <strong>boa parte dos visitantes desiste antes de a página abrir</strong>. Se você investe em anúncios ou depende do Google, está literalmente pagando por visitantes que vão embora sem ver seu conteúdo.`;
  }
  if (perfDesk !== null) {
    headText += ` No computador a nota é <strong>${perfDesk}</strong> — quase sempre maior que no celular, porque o processador é mais potente. Mas atenção: <strong>o Google ranqueia pelo celular</strong>, então é a nota mobile que manda.`;
  }

  // métricas em linguagem simples
  const items = [];
  const lcp = audits["largest-contentful-paint"];
  if (lcp) {
    const v = lcp.numericValue;
    const nota = v <= 2500 ? "✅ bom" : v <= 4000 ? "⚠️ pode melhorar" : "🔴 ruim";
    items.push(`<li><strong>Tempo para o conteúdo aparecer (LCP): ${lcp.displayValue} — ${nota}.</strong> É quanto o visitante espera até ver a parte principal da página. O ideal é até 2,5 segundos — acima disso, a sensação é de site "pesado".</li>`);
  }
  const cls = audits["cumulative-layout-shift"];
  if (cls) {
    const v = cls.numericValue;
    const nota = v <= 0.1 ? "✅ bom" : v <= 0.25 ? "⚠️ pode melhorar" : "🔴 ruim";
    items.push(`<li><strong>Estabilidade da página (CLS): ${cls.displayValue} — ${nota}.</strong> Mede se as coisas "pulam" de lugar enquanto a página carrega (aquele botão que muda de posição na hora que você vai clicar). O ideal é ficar abaixo de 0,1.</li>`);
  }
  const tbt = audits["total-blocking-time"];
  if (tbt) {
    const v = tbt.numericValue;
    const nota = v <= 200 ? "✅ bom" : v <= 600 ? "⚠️ pode melhorar" : "🔴 ruim";
    items.push(`<li><strong>Tempo travado (TBT): ${tbt.displayValue} — ${nota}.</strong> É quanto tempo a página fica "congelada", sem responder ao toque ou clique. O ideal é ficar abaixo de 200 ms.</li>`);
  }

  // acessibilidade e práticas recomendadas em linguagem simples
  if (acc !== null) {
    const nota = acc >= 90 ? "✅ boa" : acc >= 70 ? "⚠️ pode melhorar" : "🔴 ruim";
    items.push(`<li><strong>Acessibilidade: ${acc}/100 — ${nota}.</strong> Mede se qualquer pessoa consegue usar seu site: quem enxerga pouco, quem usa leitor de tela, quem navega só pelo teclado. Site acessível atende mais gente — e o Google valoriza sites que funcionam para todos.</li>`);
  }
  if (bp !== null) {
    const nota = bp >= 90 ? "✅ boas" : bp >= 70 ? "⚠️ podem melhorar" : "🔴 ruins";
    items.push(`<li><strong>Práticas recomendadas: ${bp}/100 — ${nota}.</strong> Verifica segurança e tecnologia: conexão protegida (cadeado HTTPS), ausência de erros escondidos e de bibliotecas desatualizadas ou vulneráveis. Nota baixa aqui é risco de segurança e de o navegador exibir avisos que espantam clientes.</li>`);
  }

  // SEO em linguagem simples
  let seoText;
  if (seo >= 90) {
    seoText = `<li><strong>Nota de SEO ${seo}/100 — ✅ estrutura pronta para o Google.</strong> Significa que o Google consegue ler e entender seu site sem barreiras técnicas. <strong>Importante:</strong> nota alta aqui NÃO garante aparecer em 1º lugar — isso é só o "básico bem feito". Posição no Google vem de conteúdo, palavras-chave, autoridade e trabalho contínuo de SEO.</li>`;
  } else if (seo >= 70) {
    seoText = `<li><strong>Nota de SEO ${seo}/100 — ⚠️ o Google encontra obstáculos.</strong> Existem falhas técnicas (títulos, descrições, links ou marcações) que dificultam o Google entender suas páginas. Cada falha dessas é posição perdida para concorrentes com site mais organizado.</li>`;
  } else {
    seoText = `<li><strong>Nota de SEO ${seo}/100 — 🔴 o Google tem dificuldade com seu site.</strong> Problemas técnicos estão impedindo o Google de ler seu site direito. Na prática, você fica invisível nas buscas — e o cliente que procura seu produto encontra o concorrente.</li>`;
  }
  items.push(seoText);

  // conclusão
  let conclusion;
  if (perf >= 90 && seo >= 90) {
    conclusion = "📌 <strong>Resumo:</strong> a parte técnica está saudável. O próximo passo para vender mais não é mexer no site — é <strong>atrair mais visitantes</strong> (tráfego pago, SEO de conteúdo) e converter melhor quem já chega.";
  } else if (perf >= 90) {
    conclusion = "📌 <strong>Resumo:</strong> velocidade ótima, mas os pontos de SEO acima estão custando posições no Google. Corrigindo, você aparece mais sem pagar mais por isso.";
  } else if (seo >= 90) {
    conclusion = "📌 <strong>Resumo:</strong> o Google entende bem seu site, mas a lentidão está espantando visitantes antes da página abrir. Velocidade é a correção com retorno mais rápido aqui.";
  } else {
    conclusion = "📌 <strong>Resumo:</strong> velocidade e SEO precisam de atenção — hoje o site espanta visitantes e ainda dificulta ser encontrado. A boa notícia: são problemas técnicos com solução conhecida.";
  }

  return `<h3>${head}</h3><p style="color:var(--text-dim);font-size:0.92rem;margin-bottom:14px">${headText}</p><ul>${items.join("")}</ul><p style="margin-top:14px;font-size:0.92rem">${conclusion}</p>`;
}

speedForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const url = normalizeUrl(document.getElementById("speed-url").value);

  speedError.classList.add("hidden");

  if (!url) {
    speedError.textContent = "⚠️ Endereço inválido. Digite algo como: seusite.com.br";
    speedError.classList.remove("hidden");
    return;
  }

  speedResults.classList.add("hidden");
  speedBtn.disabled = true;
  speedBtn.innerHTML = '<span class="spinner"></span> Analisando celular e computador… (até 60s)';

  try {
    // roda as duas análises em paralelo; se a de computador falhar, segue só com a de celular
    const [mobileData, desktopData] = await Promise.all([
      runPageSpeed(url, "mobile", 0),
      runPageSpeed(url, "desktop", 0).catch(() => null),
    ]);
    const mobileLh = mobileData.lighthouseResult;
    if (!mobileLh) throw new Error("API_ERROR:Resposta sem resultado Lighthouse.");
    const desktopLh = desktopData ? desktopData.lighthouseResult : null;

    renderDevice(mobileLh, "gauges-mobile", "metrics-mobile");
    if (desktopLh) {
      renderDevice(desktopLh, "gauges-desktop", "metrics-desktop");
    } else {
      document.getElementById("gauges-desktop").innerHTML =
        '<p class="hint">Não foi possível analisar a versão de computador desta vez.</p>';
      document.getElementById("metrics-desktop").innerHTML = "";
    }

    const audits = mobileLh.audits;

    // resumo em linguagem simples
    document.getElementById("speed-summary").innerHTML = plainSummary(mobileLh, desktopLh, url);

    const opps = Object.values(audits)
      .filter((a) => a.details && a.details.type === "opportunity" && (a.details.overallSavingsMs || 0) > 0)
      .sort((a, b) => (b.details.overallSavingsMs || 0) - (a.details.overallSavingsMs || 0))
      .slice(0, 4);

    const oppsList = document.getElementById("speed-opps");
    oppsList.innerHTML = "";
    if (opps.length === 0) {
      oppsList.appendChild(el("li", null, "Nenhuma grande oportunidade encontrada — mas sempre dá para melhorar. 😉"));
    } else {
      opps.forEach((o) => {
        const li = el("li");
        li.appendChild(el("span", null, escapeHTML(o.title)));
        const secs = (o.details.overallSavingsMs / 1000).toFixed(1).replace(".", ",");
        li.appendChild(el("span", "savings", "economia ~" + secs + "s"));
        oppsList.appendChild(li);
      });
    }

    speedResults.classList.remove("hidden");
  } catch (err) {
    let msg;
    if (err.message === "RATE_LIMIT") {
      msg = "⏳ O Google está com fila de análises agora. Tente novamente em 1 minuto — vale a pena!";
    } else if (err.message.startsWith("API_ERROR")) {
      const detail = err.message.split(":").slice(1).join(":");
      msg =
        "Não foi possível analisar este endereço. Verifique se o site está no ar e acessível." +
        (detail ? " (" + detail + ")" : "");
    } else {
      msg = "Erro de conexão. Verifique sua internet e tente novamente.";
    }
    speedError.textContent = msg;
    speedError.classList.remove("hidden");
  } finally {
    speedBtn.disabled = false;
    speedBtn.textContent = "Analisar site";
  }
});

/* ============================================================
   FERRAMENTA 2 — ANÁLISE AUTOMÁTICA DA FICHA DO GOOGLE
============================================================ */
const gmbForm = document.getElementById("gmb-form");
const gmbBtn = document.getElementById("gmb-btn");
const gmbError = document.getElementById("gmb-error");
const gmbResult = document.getElementById("gmb-result");

function isMapsLink(raw) {
  // aceita link do Maps E link da busca do Google (quando a pessoa acha a empresa pela pesquisa)
  return /(?:google\.[a-z.]+\/(?:maps|search)|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.|share\.google)/i.test(raw);
}

function gmbShowError(html, withCta) {
  gmbResult.classList.add("hidden");
  gmbError.innerHTML =
    "⚠️ " + html +
    (withCta
      ? `<br><a class="btn btn-primary" style="margin-top:12px" target="_blank" rel="noopener" href="${waLink("Olá, vim através do Hub da Consig Invest! Tentei analisar minha ficha do Google e quero falar com um especialista.")}">💬 Falar com especialista</a>`
      : "");
  gmbError.classList.remove("hidden");
}

const fmtNota = (n) => String(n).replace(".", ",");

function renderGmbDiagnosis(d) {
  // ----- problemas (com frase de impacto) -----
  const problems = [];
  if (d.status_negocio && d.status_negocio !== "OPERATIONAL") {
    problems.push({
      t: "🚨 Ficha marcada como " + (d.status_negocio === "CLOSED_PERMANENTLY" ? "FECHADA PERMANENTEMENTE" : "fechada temporariamente"),
      i: "Para o Google, sua empresa não está operando — ninguém é direcionado para você. Corrigir isso é prioridade absoluta.",
    });
  }
  if (!d.telefone) problems.push({ t: "Sem telefone cadastrado", i: "Cliente que não acha telefone liga para o concorrente." });
  if (!d.site) problems.push({ t: "Sem site vinculado", i: "O Google rebaixa fichas sem site nas buscas locais." });
  if (!d.horarios_cadastrados || d.dias_com_horario < 7) {
    problems.push({
      t: d.horarios_cadastrados ? `Horários em só ${d.dias_com_horario} dia(s) da semana` : "Sem horários cadastrados",
      i: "Ficha sem horário completo perde o selo 'Aberto agora' — filtro que muita gente usa.",
    });
  }
  if (d.qtd_fotos < 10) {
    problems.push({
      t: d.qtd_fotos === 0 ? "Nenhuma foto publicada" : `Poucas fotos (${d.qtd_fotos})`,
      i: "Fichas com 10+ fotos recebem muito mais cliques e pedidos de rota.",
    });
  }
  if (d.total_avaliacoes < 20) {
    problems.push({
      t: d.total_avaliacoes === 0 ? "Nenhuma avaliação" : `Poucas avaliações (${d.total_avaliacoes})`,
      i: "Poucas avaliações = pouca confiança; concorrente com mais avaliações aparece na frente.",
    });
  }
  if (d.nota !== null && d.nota < 4.0) {
    problems.push({ t: `Nota ${fmtNota(d.nota)}`, i: "Nota abaixo de 4 afasta clientes antes mesmo de te conhecerem." });
  } else if (d.nota !== null && d.nota < 4.5) {
    problems.push({ t: `Nota ${fmtNota(d.nota)}`, i: "Nota boa, mas em busca local 4.5+ é o corte de muitos clientes." });
  }

  // ----- pontos fortes (máx. 3) -----
  const strengths = [];
  if (d.nota !== null && d.nota >= 4.5 && d.total_avaliacoes >= 20) strengths.push(`Nota ${fmtNota(d.nota)} com ${d.total_avaliacoes} avaliações — acima da média`);
  if (d.telefone) strengths.push("Telefone cadastrado");
  if (d.site) strengths.push("Site vinculado à ficha");
  if (d.dias_com_horario >= 7) strengths.push("Horários completos");
  if (d.qtd_fotos >= 10) strengths.push(`${d.qtd_fotos}${d.qtd_fotos >= 10 ? "+" : ""} fotos publicadas`);
  const topStrengths = strengths.slice(0, 3);
  if (topStrengths.length === 0) topStrengths.push("Sua ficha existe — esse é o primeiro passo");

  // ----- status geral -----
  let title, detail;
  if (problems.length >= 5) {
    title = "🚨 Ficha extremamente incompleta";
    detail = "Com esse nível de cadastro, o Google quase não mostra sua empresa. Você <strong>não está aparecendo</strong> nas buscas locais e está perdendo ligações, clientes e faturamento para concorrentes com fichas completas.";
  } else if (problems.length >= 2) {
    title = "⚠️ Parcialmente cadastrada";
    detail = "Sua ficha existe, mas está longe do potencial. O Google prioriza fichas completas e ativas — na prática, você <strong>ainda não está aparecendo</strong> nas primeiras posições e os clientes que procuram seu serviço estão ligando para o concorrente.";
  } else {
    title = "⚠️ Boa base — falta acelerar";
    detail = "Sua ficha está bem cadastrada, mas <strong>ficha sozinha não segura posição</strong>: seus concorrentes investem em SEO local e Google Ads para aparecer antes de você. Esse é o próximo nível — sem ele, parte das ligações e do faturamento continua indo para eles.";
  }

  document.getElementById("gmb-status").innerHTML = title + '<span class="result-detail">' + detail + "</span>";

  // ----- cabeçalho da empresa -----
  const emp = document.getElementById("gmb-empresa");
  emp.innerHTML =
    `<strong>${escapeHTML(d.nome || "Sua empresa")}</strong>` +
    (d.categoria ? ` · ${escapeHTML(d.categoria)}` : "") +
    (d.endereco ? `<br><span>${escapeHTML(d.endereco)}</span>` : "");

  // ----- render pontos fortes -----
  const sList = document.getElementById("gmb-strengths-list");
  sList.innerHTML = "";
  topStrengths.forEach((s) => sList.appendChild(el("li", null, escapeHTML(s))));
  document.getElementById("gmb-strengths").classList.remove("hidden");

  // ----- render problemas -----
  const pWrap = document.getElementById("gmb-problems");
  const pList = document.getElementById("gmb-problems-list");
  pList.innerHTML = "";
  if (problems.length > 0) {
    problems.forEach((p) => {
      pList.appendChild(el("li", null, `<strong>${escapeHTML(p.t)}</strong><br><span class="p-impact">${escapeHTML(p.i)}</span>`));
    });
    pWrap.classList.remove("hidden");
  } else {
    pWrap.classList.add("hidden");
  }

  // ----- CTA com o nome da empresa -----
  document.getElementById("gmb-cta").href = waLink(
    `Analisei a ficha da ${d.nome || "minha empresa"} no Hub e quero melhorar meu posicionamento no Google`
  );

  gmbError.classList.add("hidden");
  gmbResult.classList.remove("hidden");
  gmbResult.scrollIntoView({ behavior: "smooth", block: "start" });
}

gmbForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const raw = document.getElementById("gmb-link").value.trim();
  gmbError.classList.add("hidden");

  if (!isMapsLink(raw)) {
    gmbShowError("Esse link não parece ser do Google Maps. Abra sua empresa no Maps → <strong>Compartilhar</strong> → <strong>Copiar link</strong>.", false);
    return;
  }

  gmbBtn.disabled = true;
  gmbBtn.innerHTML = '<span class="spinner"></span> Analisando ficha…';

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(GMB_ANALYZE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link: raw }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    if (data.error === "link_invalido") {
      gmbShowError("Esse link não parece ser do Google Maps. Abra sua empresa no Maps → <strong>Compartilhar</strong> → <strong>Copiar link</strong>.", false);
    } else if (data.error === "ficha_nao_encontrada") {
      gmbShowError("Não encontramos essa ficha. Confira o link ou fale com um especialista.", true);
    } else if (data.error === "limite_diario") {
      gmbShowError("<strong>Alta demanda hoje!</strong> Tente amanhã ou fale direto com um especialista.", true);
    } else if (data.error) {
      gmbShowError("Ferramenta indisponível no momento.", true);
    } else if (data.nome || data.place_id) {
      renderGmbDiagnosis(data);
    } else {
      gmbShowError("Ferramenta indisponível no momento.", true);
    }
  } catch {
    gmbShowError("Ferramenta indisponível no momento.", true);
  } finally {
    gmbBtn.disabled = false;
    gmbBtn.textContent = "Analisar ficha";
  }
});

document.getElementById("gmb-no-listing").addEventListener("click", () => {
  gmbError.classList.add("hidden");
  document.getElementById("gmb-status").innerHTML =
    "🚨 Ficha inexistente" +
    '<span class="result-detail">Sua empresa é <strong>invisível no Google Maps</strong>. Quando alguém procura pelo seu serviço na sua cidade, quem aparece — e recebe a ligação — é o concorrente. Cada dia sem ficha é faturamento indo embora.</span>';
  document.getElementById("gmb-empresa").innerHTML = "";
  document.getElementById("gmb-strengths").classList.add("hidden");
  document.getElementById("gmb-problems").classList.add("hidden");
  document.getElementById("gmb-cta").href = waLink(
    "Olá, vim através do Hub da Consig Invest! Minha empresa ainda não tem ficha no Google e quero criar e otimizar a minha."
  );
  gmbResult.classList.remove("hidden");
  gmbResult.scrollIntoView({ behavior: "smooth", block: "start" });
});

/* ============================================================
   FERRAMENTA 3 — SIMULADOR DE ROI (Google + Meta)
============================================================ */
document.querySelectorAll(".subtab").forEach((st) => {
  st.addEventListener("click", () => {
    document.querySelectorAll(".subtab").forEach((s) => s.classList.remove("active"));
    st.classList.add("active");
    document.getElementById("roi-google").classList.toggle("hidden", st.dataset.roi !== "google");
    document.getElementById("roi-meta").classList.toggle("hidden", st.dataset.roi !== "meta");
  });
});

function roasClass(roas) {
  if (roas >= 3) return "good";
  if (roas >= 1.5) return "mid";
  return "bad";
}

function renderRoiCards(wrapId, cards) {
  const wrap = document.getElementById(wrapId);
  wrap.innerHTML = "";
  cards.forEach((c) => {
    const card = el("div", "metric-card" + (c.highlight ? " highlight" : ""));
    card.appendChild(el("div", "m-label", c.label));
    card.appendChild(el("div", "m-value" + (c.cls ? " " + c.cls : ""), c.value));
    wrap.appendChild(card);
  });
  wrap.classList.remove("hidden");
  document.getElementById("roi-disclaimer").classList.remove("hidden");
}

document.getElementById("roi-form-google").addEventListener("submit", (e) => {
  e.preventDefault();
  const invest = parseFloat(document.getElementById("rg-invest").value);
  const cpc = parseFloat(document.getElementById("rg-cpc").value);
  const conv = parseFloat(document.getElementById("rg-conv").value) / 100;
  const close = parseFloat(document.getElementById("rg-close").value) / 100;
  const ticket = parseFloat(document.getElementById("rg-ticket").value);

  const clicks = invest / cpc;
  const leads = clicks * conv;
  const sales = leads * close;
  const revenue = sales * ticket;
  const cpa = sales > 0 ? invest / sales : 0;
  const roas = invest > 0 ? revenue / invest : 0;

  renderRoiCards("roi-results-google", [
    { label: "Cliques / mês", value: fmtNum.format(Math.round(clicks)) },
    { label: "Leads / mês", value: fmtNum.format(Math.round(leads)) },
    { label: "Vendas / mês", value: fmtNum.format(Math.round(sales)) },
    { label: "Faturamento projetado", value: fmtBRL.format(revenue), highlight: true },
    { label: "Custo por venda (CPA)", value: fmtBRL.format(cpa) },
    { label: "ROAS", value: fmtDec.format(roas) + "x", cls: roasClass(roas), highlight: true },
  ]);
});

document.getElementById("roi-form-meta").addEventListener("submit", (e) => {
  e.preventDefault();
  const invest = parseFloat(document.getElementById("rm-invest").value);
  const cpm = parseFloat(document.getElementById("rm-cpm").value);
  const ctr = parseFloat(document.getElementById("rm-ctr").value) / 100;
  const conv = parseFloat(document.getElementById("rm-conv").value) / 100;
  const close = parseFloat(document.getElementById("rm-close").value) / 100;
  const ticket = parseFloat(document.getElementById("rm-ticket").value);

  const impressions = (invest / cpm) * 1000;
  const clicks = impressions * ctr;
  const leads = clicks * conv;
  const sales = leads * close;
  const revenue = sales * ticket;
  const cpa = sales > 0 ? invest / sales : 0;
  const roas = invest > 0 ? revenue / invest : 0;

  renderRoiCards("roi-results-meta", [
    { label: "Impressões / mês", value: fmtNum.format(Math.round(impressions)) },
    { label: "Cliques / mês", value: fmtNum.format(Math.round(clicks)) },
    { label: "Leads / mês", value: fmtNum.format(Math.round(leads)) },
    { label: "Vendas / mês", value: fmtNum.format(Math.round(sales)) },
    { label: "Faturamento projetado", value: fmtBRL.format(revenue), highlight: true },
    { label: "Custo por venda (CPA)", value: fmtBRL.format(cpa) },
    { label: "ROAS", value: fmtDec.format(roas) + "x", cls: roasClass(roas), highlight: true },
  ]);
});

/* ============================================================
   CONVERSORES — registro central
============================================================ */
const CONV_CATS = [
  { id: "pdf", label: "📄 PDF" },
  { id: "img", label: "🖼️ Imagens" },
  { id: "doc", label: "📝 Documentos" },
  { id: "dados", label: "📊 Planilhas e Dados" },
  { id: "zip", label: "🗜️ Compactados" },
  { id: "util", label: "🧰 Texto e Utilitários" },
];

const CONVERTERS = [
  /* ---------- PDF ---------- */
  {
    slug: "pdf-para-word", cat: "pdf", icon: "📄", title: "PDF → Word",
    desc: "Transforme PDF em documento editável", kw: "doc docx editavel texto",
    accept: "application/pdf,.pdf", multiple: false,
    dropText: "Arraste o PDF aqui ou clique para selecionar",
    handler: convertPdfToWord,
  },
  {
    slug: "pdf-para-imagem", cat: "pdf", icon: "🎞️", title: "PDF → JPG",
    desc: "Cada página do PDF vira uma imagem", kw: "png foto imagem",
    accept: "application/pdf,.pdf", multiple: false,
    dropText: "Arraste o PDF aqui ou clique para selecionar",
    handler: convertPdfToImages,
  },
  {
    slug: "pdf-para-txt", cat: "pdf", icon: "🔤", title: "PDF → Texto",
    desc: "Extraia todo o texto do PDF em um .txt", kw: "txt extrair texto",
    accept: "application/pdf,.pdf", multiple: false,
    dropText: "Arraste o PDF aqui ou clique para selecionar",
    handler: convertPdfToTxt,
  },
  {
    slug: "juntar-pdf", cat: "pdf", icon: "📚", title: "Juntar PDFs",
    desc: "Una vários PDFs em um único arquivo", kw: "unir mesclar merge combinar",
    accept: "application/pdf,.pdf", multiple: true,
    dropText: "Arraste 2 ou mais PDFs aqui (a ordem de seleção é a ordem final)",
    handler: mergePdfs,
  },
  {
    slug: "dividir-pdf", cat: "pdf", icon: "✂️", title: "Dividir PDF",
    desc: "Extraia um intervalo de páginas do PDF", kw: "separar intervalo split",
    accept: "application/pdf,.pdf", multiple: false,
    dropText: "Arraste o PDF aqui ou clique para selecionar",
    options: () => `
      <label>Da página
        <input type="number" id="opt-page-from" min="1" value="1">
      </label>
      <label>Até a página
        <input type="number" id="opt-page-to" min="1" value="1">
      </label>`,
    handler: splitPdf,
  },
  {
    slug: "extrair-paginas-pdf", cat: "pdf", icon: "🎯", title: "Extrair páginas do PDF",
    desc: "Escolha páginas específicas: 1, 3-5, 8…", kw: "paginas especificas selecionar",
    accept: "application/pdf,.pdf", multiple: false,
    dropText: "Arraste o PDF aqui ou clique para selecionar",
    options: () => `
      <label>Páginas (ex.: 1, 3-5, 8)
        <input type="text" id="opt-pages" placeholder="1, 3-5, 8" style="min-width:200px">
      </label>`,
    handler: extractPdfPages,
  },
  {
    slug: "remover-paginas-pdf", cat: "pdf", icon: "🗑️", title: "Remover páginas do PDF",
    desc: "Apague páginas indesejadas: 2, 4-6…", kw: "apagar deletar excluir paginas",
    accept: "application/pdf,.pdf", multiple: false,
    dropText: "Arraste o PDF aqui ou clique para selecionar",
    options: () => `
      <label>Páginas a remover (ex.: 2, 4-6)
        <input type="text" id="opt-pages" placeholder="2, 4-6" style="min-width:200px">
      </label>`,
    handler: removePdfPages,
  },
  {
    slug: "girar-pdf", cat: "pdf", icon: "🔄", title: "Girar PDF",
    desc: "Gire todas as páginas em 90°, 180° ou 270°", kw: "rotacionar rotate orientacao",
    accept: "application/pdf,.pdf", multiple: false,
    dropText: "Arraste o PDF aqui ou clique para selecionar",
    options: () => `
      <label>Girar
        <select id="opt-rotate">
          <option value="90">90° (horário)</option>
          <option value="180">180°</option>
          <option value="270">270° (anti-horário)</option>
        </select>
      </label>`,
    handler: rotatePdf,
  },
  {
    slug: "inverter-pdf", cat: "pdf", icon: "↕️", title: "Inverter ordem do PDF",
    desc: "Última página vira a primeira", kw: "reverter ordem reverse",
    accept: "application/pdf,.pdf", multiple: false,
    dropText: "Arraste o PDF aqui ou clique para selecionar",
    handler: reversePdf,
  },
  /* ---------- Imagens ---------- */
  {
    slug: "imagem-para-pdf", cat: "img", icon: "🖼️", title: "Imagem → PDF",
    desc: "JPG, PNG ou WebP viram um PDF (aceita várias)", kw: "foto jpg png",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp", multiple: true,
    dropText: "Arraste as imagens aqui ou clique para selecionar (pode escolher várias)",
    handler: convertImagesToPdf,
  },
  {
    slug: "converter-imagem", cat: "img", icon: "🔁", title: "Converter imagem",
    desc: "JPG ↔ PNG ↔ WebP em um clique", kw: "formato foto trocar",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp", multiple: false,
    dropText: "Arraste a imagem aqui ou clique para selecionar",
    options: () => `
      <label>Converter para
        <select id="opt-img-format">
          <option value="image/png">PNG</option>
          <option value="image/jpeg">JPG</option>
          <option value="image/webp">WebP</option>
        </select>
      </label>`,
    handler: convertImageFormat,
  },
  {
    slug: "comprimir-imagem", cat: "img", icon: "🗜️", title: "Comprimir imagem",
    desc: "Reduza o tamanho sem perder qualidade visível", kw: "reduzir peso otimizar",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp", multiple: false,
    dropText: "Arraste a imagem aqui ou clique para selecionar",
    options: () => `
      <label>Qualidade: <span id="opt-quality-val">70%</span>
        <input type="range" id="opt-quality" min="30" max="95" value="70">
      </label>`,
    handler: compressImage,
  },
  {
    slug: "redimensionar-imagem", cat: "img", icon: "📐", title: "Redimensionar imagem",
    desc: "Mude largura e altura mantendo a proporção", kw: "tamanho resize largura altura",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp", multiple: false,
    dropText: "Arraste a imagem aqui ou clique para selecionar",
    options: () => `
      <label>Largura (px)
        <input type="number" id="opt-width" min="1" placeholder="ex.: 1080">
      </label>
      <label>Altura (px) — deixe vazio p/ manter proporção
        <input type="number" id="opt-height" min="1" placeholder="automática">
      </label>`,
    handler: resizeImage,
  },
  {
    slug: "girar-imagem", cat: "img", icon: "🌀", title: "Girar imagem",
    desc: "90°, 180° ou 270° em um clique", kw: "rotacionar rotate",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp", multiple: false,
    dropText: "Arraste a imagem aqui ou clique para selecionar",
    options: () => `
      <label>Girar
        <select id="opt-rotate">
          <option value="90">90° (horário)</option>
          <option value="180">180°</option>
          <option value="270">270° (anti-horário)</option>
        </select>
      </label>`,
    handler: rotateImage,
  },
  {
    slug: "espelhar-imagem", cat: "img", icon: "🪞", title: "Espelhar imagem",
    desc: "Inverta horizontal ou verticalmente", kw: "flip inverter mirror",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp", multiple: false,
    dropText: "Arraste a imagem aqui ou clique para selecionar",
    options: () => `
      <label>Direção
        <select id="opt-flip">
          <option value="h">Horizontal</option>
          <option value="v">Vertical</option>
        </select>
      </label>`,
    handler: flipImage,
  },
  {
    slug: "imagem-pb", cat: "img", icon: "⚫", title: "Imagem em preto e branco",
    desc: "Escala de cinza ou P&B puro", kw: "cinza grayscale preto branco",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp", multiple: false,
    dropText: "Arraste a imagem aqui ou clique para selecionar",
    options: () => `
      <label>Estilo
        <select id="opt-bw">
          <option value="gray">Escala de cinza</option>
          <option value="bw">Preto e branco puro</option>
        </select>
      </label>`,
    handler: grayscaleImage,
  },
  {
    slug: "juntar-imagens", cat: "img", icon: "🧩", title: "Juntar imagens",
    desc: "Combine várias imagens lado a lado ou empilhadas", kw: "unir combinar mosaico",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp", multiple: true,
    dropText: "Arraste 2 ou mais imagens (a ordem de seleção é a ordem final)",
    options: () => `
      <label>Direção
        <select id="opt-join">
          <option value="v">Empilhadas (vertical)</option>
          <option value="h">Lado a lado (horizontal)</option>
        </select>
      </label>`,
    handler: joinImages,
  },
  {
    slug: "heic-para-jpg", cat: "img", icon: "🍎", title: "HEIC → JPG",
    desc: "Fotos de iPhone viram JPG universal", kw: "iphone apple heif foto",
    accept: ".heic,.heif,image/heic,image/heif", multiple: false,
    dropText: "Arraste a foto .heic do iPhone aqui",
    handler: convertHeic,
  },
  {
    slug: "remover-exif", cat: "img", icon: "🕵️", title: "Remover dados da foto (EXIF)",
    desc: "Apague localização GPS e metadados da imagem", kw: "gps privacidade metadados localizacao",
    accept: "image/jpeg,image/png,.jpg,.jpeg,.png", multiple: false,
    dropText: "Arraste a imagem aqui ou clique para selecionar",
    handler: stripExif,
  },
  {
    slug: "imagem-para-base64", cat: "img", icon: "🔗", title: "Imagem → Base64",
    desc: "Gere o código Base64/Data URI da imagem", kw: "data uri codigo embed",
    accept: "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif", multiple: false,
    dropText: "Arraste a imagem aqui ou clique para selecionar",
    handler: imageToBase64,
  },
  /* ---------- Documentos ---------- */
  {
    slug: "word-para-pdf", cat: "doc", icon: "📝", title: "Word → PDF",
    desc: "Converta .docx em PDF pronto para enviar", kw: "docx documento",
    accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document", multiple: false,
    dropText: "Arraste o arquivo .docx aqui ou clique para selecionar",
    handler: convertWordToPdf,
  },
  /* ---------- Planilhas e Dados ---------- */
  {
    slug: "excel-csv", cat: "dados", icon: "📊", title: "Excel ↔ CSV",
    desc: "Converta planilhas .xlsx em CSV e vice-versa", kw: "planilha xlsx xls",
    accept: ".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv", multiple: false,
    dropText: "Arraste a planilha (.xlsx, .xls) ou o .csv aqui",
    handler: convertSpreadsheet,
  },
  {
    slug: "json-csv", cat: "dados", icon: "🔣", title: "JSON ↔ CSV",
    desc: "Dados JSON viram tabela CSV e vice-versa", kw: "dados api tabela",
    accept: ".json,.csv,application/json,text/csv", multiple: false,
    dropText: "Arraste o arquivo .json ou .csv aqui",
    handler: convertJsonCsv,
  },
  {
    slug: "csv-delimitador", cat: "dados", icon: "🔀", title: "Trocar separador do CSV",
    desc: "Vírgula ↔ ponto e vírgula (padrão Excel BR)", kw: "delimitador virgula excel brasileiro",
    accept: ".csv,text/csv", multiple: false,
    dropText: "Arraste o arquivo .csv aqui",
    handler: swapCsvDelimiter,
  },
  /* ---------- Compactados ---------- */
  {
    slug: "criar-zip", cat: "zip", icon: "📦", title: "Criar ZIP",
    desc: "Compacte vários arquivos em um .zip", kw: "compactar zipar comprimir arquivos",
    accept: "*/*", multiple: true,
    dropText: "Arraste os arquivos que quer compactar (qualquer tipo)",
    handler: createZip,
  },
  {
    slug: "extrair-zip", cat: "zip", icon: "📂", title: "Extrair ZIP",
    desc: "Veja e baixe os arquivos de dentro do .zip", kw: "descompactar unzip abrir",
    accept: ".zip,application/zip,application/x-zip-compressed", multiple: false,
    dropText: "Arraste o arquivo .zip aqui",
    handler: extractZip,
  },
  /* ---------- Texto e Utilitários ---------- */
  {
    slug: "conversor-cores", cat: "util", icon: "🎨", title: "Conversor de cores",
    desc: "HEX ↔ RGB ↔ HSL ↔ CMYK + variações e contraste", kw: "hex rgb hsl cmyk paleta cor",
    type: "tool", runLabel: "⚡ Converter cor",
    options: () => `
      <label>Cor (HEX ou RGB)
        <input type="text" id="opt-cor" placeholder="#1E4FD8 ou rgb(30,79,216)" style="min-width:220px">
      </label>`,
    run: runColorConvert,
  },
  {
    slug: "texto-base64", cat: "util", icon: "🔡", title: "Texto ↔ Base64",
    desc: "Codifique e decodifique textos em Base64", kw: "codificar decodificar encode decode",
    type: "tool", runLabel: "⚡ Converter",
    options: () => `
      <label>Operação
        <select id="opt-b64-op">
          <option value="enc">Texto → Base64</option>
          <option value="dec">Base64 → Texto</option>
        </select>
      </label>
      <label style="flex:1 1 100%">Conteúdo
        <textarea id="opt-b64-text" rows="4" style="width:100%;background:var(--navy);color:var(--text);border:1px solid rgba(159,172,209,0.25);border-radius:10px;padding:10px;font-family:var(--font-mono);font-size:0.8rem" placeholder="Cole o texto aqui…"></textarea>
      </label>`,
    run: runBase64Text,
  },
  {
    slug: "url-encode", cat: "util", icon: "🌐", title: "URL Encode / Decode",
    desc: "Converta textos para o formato de URL e de volta", kw: "percent encoding link parametro",
    type: "tool", runLabel: "⚡ Converter",
    options: () => `
      <label>Operação
        <select id="opt-url-op">
          <option value="enc">Texto → URL Encode</option>
          <option value="dec">URL Encode → Texto</option>
        </select>
      </label>
      <label style="flex:1 1 100%">Conteúdo
        <textarea id="opt-url-text" rows="4" style="width:100%;background:var(--navy);color:var(--text);border:1px solid rgba(159,172,209,0.25);border-radius:10px;padding:10px;font-family:var(--font-mono);font-size:0.8rem" placeholder="Cole o texto aqui…"></textarea>
      </label>`,
    run: runUrlEncode,
  },
  {
    slug: "formatar-json", cat: "util", icon: "🧾", title: "Formatar e validar JSON",
    desc: "Formate, minifique e encontre erros no JSON", kw: "validar minificar pretty json",
    type: "tool", runLabel: "⚡ Processar JSON",
    options: () => `
      <label>Operação
        <select id="opt-json-op">
          <option value="fmt">Formatar (bonito)</option>
          <option value="min">Minificar (uma linha)</option>
          <option value="val">Só validar</option>
        </select>
      </label>
      <label style="flex:1 1 100%">JSON
        <textarea id="opt-json-text" rows="6" style="width:100%;background:var(--navy);color:var(--text);border:1px solid rgba(159,172,209,0.25);border-radius:10px;padding:10px;font-family:var(--font-mono);font-size:0.8rem" placeholder='{"exemplo": true}'></textarea>
      </label>`,
    run: runJsonTool,
  },
  {
    slug: "hash-arquivo", cat: "util", icon: "🔐", title: "Hash de arquivo",
    desc: "Calcule SHA-256, SHA-1 ou SHA-512 de qualquer arquivo", kw: "checksum sha md5 integridade verificar",
    accept: "*/*", multiple: false,
    dropText: "Arraste qualquer arquivo para calcular o hash",
    options: () => `
      <label>Algoritmo
        <select id="opt-hash-algo">
          <option value="SHA-256">SHA-256 (padrão)</option>
          <option value="SHA-1">SHA-1</option>
          <option value="SHA-512">SHA-512</option>
        </select>
      </label>`,
    handler: hashFile,
  },
];

let activeConverter = null;
let pendingConvFile = null;
let activeCat = "todos";

function normalizeSearch(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function renderHub() {
  const grid = document.getElementById("conv-grid");
  const q = normalizeSearch(document.getElementById("conv-search").value.trim());
  grid.innerHTML = "";

  CONV_CATS.forEach((cat) => {
    if (activeCat !== "todos" && activeCat !== cat.id) return;
    const items = CONVERTERS.filter((c) => {
      if (c.cat !== cat.id) return false;
      if (!q) return true;
      return normalizeSearch(c.title + " " + c.desc + " " + (c.kw || "") + " " + c.slug).includes(q);
    });
    if (!items.length) return;

    grid.appendChild(el("div", "conv-cat-title", cat.label));
    const section = el("div", "conv-grid");
    items.forEach((c) => {
      const card = el("button", "conv-card");
      card.type = "button";
      card.innerHTML = `<span class="c-icon">${c.icon}</span><span class="c-title">${c.title}</span><span class="c-desc">${c.desc}</span>`;
      card.addEventListener("click", () => { location.hash = "conversores/" + c.slug; });
      section.appendChild(card);
    });
    grid.appendChild(section);
  });

  if (!grid.children.length) {
    grid.appendChild(el("p", "conv-empty", 'Nenhum conversor encontrado para "' + escapeHTML(q) + '". Fale com a gente que avaliamos incluir!'));
  }
}

// filtros por categoria
const catsWrap = document.getElementById("conv-cats");
[{ id: "todos", label: "Todos" }].concat(CONV_CATS).forEach((cat) => {
  const chip = el("button", "cat-chip" + (cat.id === "todos" ? " active" : ""), cat.label);
  chip.type = "button";
  chip.dataset.cat = cat.id;
  chip.addEventListener("click", () => {
    activeCat = cat.id;
    document.querySelectorAll(".cat-chip").forEach((c) => c.classList.toggle("active", c.dataset.cat === cat.id));
    renderHub();
  });
  catsWrap.appendChild(chip);
});

document.getElementById("conv-search").addEventListener("input", renderHub);
document.getElementById("conv-back").addEventListener("click", () => { location.hash = "conversores"; });

/* --- Conversor Universal: detecta o arquivo e sugere ferramentas --- */
function convertersForFile(file) {
  const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
  return CONVERTERS.filter((c) => {
    if (!c.accept || c.accept === "*/*") return false; // ferramentas sem arquivo ou que aceitam tudo
    return c.accept.toLowerCase().split(",").some((a) => a.trim() === ext);
  });
}

const uniDrop = document.getElementById("conv-universal");
const uniInput = document.getElementById("conv-universal-input");
uniDrop.addEventListener("click", () => uniInput.click());
uniDrop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") uniInput.click(); });
uniDrop.addEventListener("dragover", (e) => { e.preventDefault(); uniDrop.classList.add("dragover"); });
uniDrop.addEventListener("dragleave", () => uniDrop.classList.remove("dragover"));
uniDrop.addEventListener("drop", (e) => {
  e.preventDefault();
  uniDrop.classList.remove("dragover");
  if (e.dataTransfer.files.length) handleUniversal(e.dataTransfer.files[0]);
});
uniInput.addEventListener("change", () => { if (uniInput.files.length) handleUniversal(uniInput.files[0]); });

function handleUniversal(file) {
  const matches = convertersForFile(file);
  const box = document.getElementById("conv-universal-result");
  box.innerHTML = `<span class="u-title">📎 ${escapeHTML(file.name)} — ${matches.length ? "o que você quer fazer?" : "formato ainda não suportado"}</span>`;
  const opts = el("div", "u-opts");
  if (matches.length) {
    matches.forEach((c) => {
      const b = el("button", null, `${c.icon} ${c.title}`);
      b.type = "button";
      b.addEventListener("click", () => {
        pendingConvFile = file;
        location.hash = "conversores/" + c.slug;
      });
      opts.appendChild(b);
    });
  } else {
    opts.appendChild(el("span", "conv-empty", "Você ainda pode compactá-lo em ZIP:"));
    const b = el("button", null, "📦 Criar ZIP");
    b.type = "button";
    b.addEventListener("click", () => { pendingConvFile = file; location.hash = "conversores/criar-zip"; });
    opts.appendChild(b);
  }
  box.appendChild(opts);
  box.classList.remove("hidden");
  uniInput.value = "";
}

function convReset() {
  ["conv-status", "conv-error", "conv-done"].forEach((id) => document.getElementById(id).classList.add("hidden"));
  document.getElementById("conv-done").innerHTML = "";
}

function showConverter(slug) {
  const conv = CONVERTERS.find((c) => c.slug === slug);
  activeConverter = conv || null;
  document.getElementById("conv-hub").classList.toggle("hidden", !!conv);
  document.getElementById("conv-page").classList.toggle("hidden", !conv);
  if (!conv) { renderHub(); return; }

  document.getElementById("conv-title").textContent = conv.icon + " " + conv.title;
  document.getElementById("conv-desc").textContent = conv.desc + ".";

  const isTool = conv.type === "tool";
  document.getElementById("conv-drop").classList.toggle("hidden", isTool);
  const runBtn = document.getElementById("conv-run");
  runBtn.classList.toggle("hidden", !isTool);
  if (isTool) runBtn.textContent = conv.runLabel || "⚡ Gerar";

  if (!isTool) {
    document.getElementById("conv-drop-text").innerHTML = "<strong>" + conv.dropText + "</strong>";
    const input = document.getElementById("conv-input");
    input.value = "";
    input.accept = conv.accept;
    input.multiple = !!conv.multiple;
  }

  const opts = document.getElementById("conv-options");
  if (conv.options) {
    opts.innerHTML = conv.options();
    opts.classList.remove("hidden");
    const q = document.getElementById("opt-quality");
    if (q) q.addEventListener("input", () => {
      document.getElementById("opt-quality-val").textContent = q.value + "%";
    });
  } else {
    opts.innerHTML = "";
    opts.classList.add("hidden");
  }
  convReset();

  // arquivo vindo do Conversor Universal: converte na hora
  if (pendingConvFile) {
    const f = pendingConvFile;
    pendingConvFile = null;
    handleConvFiles([f]);
  }
}

function convStatus(msg) {
  const s = document.getElementById("conv-status");
  s.textContent = msg;
  s.classList.remove("hidden");
}

let lastConvFiles = null;

function convError(msg) {
  document.getElementById("conv-status").classList.add("hidden");
  const e = document.getElementById("conv-error");
  e.textContent = "⚠️ " + msg;
  if (lastConvFiles && activeConverter && activeConverter.options) {
    const retry = el("button", "btn-copy", "🔁 Tentar de novo com as opções atuais");
    retry.type = "button";
    retry.style.marginLeft = "10px";
    retry.addEventListener("click", () => handleConvFiles(lastConvFiles));
    e.appendChild(retry);
  }
  e.classList.remove("hidden");
}

function convDone(links, note) {
  document.getElementById("conv-status").classList.add("hidden");
  const done = document.getElementById("conv-done");
  done.innerHTML = '<div class="done-banner">✅ Conversão concluída!' + (note ? " " + note : "") + "</div>";
  const list = el("div", "file-list");
  links.forEach((item) => {
    if (item.text !== undefined) {
      const ta = el("textarea");
      ta.value = item.text;
      ta.readOnly = true;
      Object.assign(ta.style, { width: "100%", height: "120px", background: "var(--navy)", color: "var(--text)", border: "1px solid rgba(159,172,209,0.25)", borderRadius: "10px", padding: "10px", fontFamily: "var(--font-mono)", fontSize: "0.75rem" });
      list.appendChild(ta);
      const copyBtn = el("button", "btn btn-primary", "📋 Copiar código");
      copyBtn.type = "button";
      copyBtn.addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(item.text); copyBtn.textContent = "Copiado ✓"; } catch { ta.select(); document.execCommand("copy"); copyBtn.textContent = "Copiado ✓"; }
        setTimeout(() => (copyBtn.textContent = "📋 Copiar código"), 2000);
      });
      list.appendChild(copyBtn);
      if (item.filename) {
        const a = el("a", "btn btn-primary");
        a.textContent = "⬇️ Baixar como arquivo";
        a.href = URL.createObjectURL(new Blob([item.text], { type: "text/plain;charset=utf-8" }));
        a.download = item.filename;
        list.appendChild(a);
      }
    } else {
      const url = URL.createObjectURL(item.blob);
      if (item.preview) {
        const img = el("img");
        img.src = url;
        img.alt = item.filename;
        Object.assign(img.style, { maxWidth: "260px", borderRadius: "12px", background: "#fff", padding: "12px" });
        list.appendChild(img);
      }
      const a = el("a", "btn btn-primary");
      a.textContent = item.label || "⬇️ Baixar " + item.filename;
      a.href = url;
      a.download = item.filename;
      list.appendChild(a);
    }
  });
  done.appendChild(list);
  done.classList.remove("hidden");
}

/* --- dropzone --- */
const convDrop = document.getElementById("conv-drop");
const convInput = document.getElementById("conv-input");
convDrop.addEventListener("click", () => convInput.click());
convDrop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") convInput.click(); });
convDrop.addEventListener("dragover", (e) => { e.preventDefault(); convDrop.classList.add("dragover"); });
convDrop.addEventListener("dragleave", () => convDrop.classList.remove("dragover"));
convDrop.addEventListener("drop", (e) => {
  e.preventDefault();
  convDrop.classList.remove("dragover");
  if (e.dataTransfer.files.length) handleConvFiles([...e.dataTransfer.files]);
});
convInput.addEventListener("change", () => {
  if (convInput.files.length) handleConvFiles([...convInput.files]);
});

document.getElementById("conv-run").addEventListener("click", async () => {
  if (!activeConverter || typeof activeConverter.run !== "function") return;
  convReset();
  try {
    await activeConverter.run();
  } catch (err) {
    convError(err && err.message ? err.message : "Não foi possível gerar. Confira os campos.");
  }
});

async function handleConvFiles(files) {
  if (!activeConverter) return;
  lastConvFiles = files;
  convReset();
  try {
    await activeConverter.handler(files);
  } catch (err) {
    if (err && err.name === "PasswordException") {
      convError("Este PDF está protegido por senha. Remova a senha e tente novamente.");
    } else if (err && err.name === "InvalidPDFException") {
      convError("Este arquivo está corrompido ou não é um PDF válido.");
    } else {
      convError(err && err.message ? err.message : "Não foi possível converter este arquivo. Tente outro.");
    }
  }
}

/* --- 1. PDF → Word --- */
function pageItemsToParagraphs(items) {
  const lines = [];
  items.forEach((item) => {
    if (!item.str) return;
    const y = item.transform[5];
    const x = item.transform[4];
    let line = lines.find((l) => Math.abs(l.y - y) < 3);
    if (!line) { line = { y, parts: [] }; lines.push(line); }
    line.parts.push({ x, str: item.str });
  });
  lines.sort((a, b) => b.y - a.y);
  lines.forEach((l) => l.parts.sort((a, b) => a.x - b.x));
  const paragraphs = [];
  let current = [];
  let prevY = null;
  lines.forEach((l) => {
    const text = l.parts.map((p) => p.str).join(" ").replace(/\s+/g, " ").trim();
    if (!text) return;
    if (prevY !== null && prevY - l.y > 22 && current.length) {
      paragraphs.push(current.join(" "));
      current = [];
    }
    current.push(text);
    prevY = l.y;
  });
  if (current.length) paragraphs.push(current.join(" "));
  return paragraphs;
}

async function convertPdfToWord(files) {
  const file = files[0];
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") throw new Error("Escolha um arquivo .pdf.");
  convStatus("Carregando leitor de PDF…");
  await ensurePdfjs();
  convStatus("Lendo arquivo…");
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;

  let bodyHTML = "";
  let totalChars = 0;
  for (let p = 1; p <= pdf.numPages; p++) {
    convStatus(`Convertendo página ${p} de ${pdf.numPages}…`);
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    pageItemsToParagraphs(content.items).forEach((para) => {
      totalChars += para.length;
      bodyHTML += "<p>" + escapeHTML(para) + "</p>\n";
    });
    if (p < pdf.numPages) bodyHTML += '<br clear="all" style="page-break-before:always">\n';
  }

  if (totalChars < 20) {
    throw new Error("Este PDF parece ser escaneado (imagem): não há texto extraível. Seria necessário OCR — fale com a gente que ajudamos!");
  }

  const docHTML = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${escapeHTML(baseName(file.name))}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.4}p{margin:0 0 10pt}</style>
</head><body>
${bodyHTML}
</body></html>`;

  const blob = new Blob(["﻿", docHTML], { type: "application/msword" });
  convDone([{ blob, filename: baseName(file.name) + ".doc", label: "⬇️ Baixar Word (.doc)" }]);
}

/* --- 2. Word → PDF --- */
async function convertWordToPdf(files) {
  const file = files[0];
  if (!/\.docx$/i.test(file.name)) throw new Error("Escolha um arquivo .docx (Word moderno). Arquivos .doc antigos não são suportados.");
  convStatus("Carregando conversor…");
  await loadScript(LIB.mammoth);
  await loadScript(LIB.html2pdf);
  convStatus("Lendo documento…");
  const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
  const html = (result.value || "").trim();
  if (!html) throw new Error("Não foi possível extrair o conteúdo deste documento.");

  convStatus("Gerando PDF…");
  const container = document.createElement("div");
  container.innerHTML = html;
  Object.assign(container.style, {
    position: "fixed", left: "-10000px", top: "0", width: "700px",
    background: "#fff", color: "#111", fontFamily: "Arial, sans-serif",
    fontSize: "13px", lineHeight: "1.5", padding: "20px",
  });
  container.querySelectorAll("img").forEach((img) => { img.style.maxWidth = "100%"; });
  document.body.appendChild(container);
  try {
    const blob = await html2pdf().set({
      margin: 12,
      filename: baseName(file.name) + ".pdf",
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: { scale: 2, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    }).from(container).outputPdf("blob");
    convDone([{ blob, filename: baseName(file.name) + ".pdf", label: "⬇️ Baixar PDF" }]);
  } finally {
    container.remove();
  }
}

/* --- helpers de imagem --- */
function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível ler esta imagem."));
    img.src = URL.createObjectURL(file);
  });
}

function canvasFromImage(img, fillWhite) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (fillWhite) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  ctx.drawImage(img, 0, 0);
  return canvas;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha na conversão da imagem."))), type, quality);
  });
}

/* --- 3. Imagem → PDF --- */
async function convertImagesToPdf(files) {
  const imgs = files.filter((f) => /image\/(jpeg|png|webp)/.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name));
  if (!imgs.length) throw new Error("Escolha imagens JPG, PNG ou WebP.");
  convStatus("Carregando gerador de PDF…");
  await loadScript(LIB.pdflib);
  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < imgs.length; i++) {
    convStatus(`Adicionando imagem ${i + 1} de ${imgs.length}…`);
    const f = imgs[i];
    let bytes, embedded;
    if (f.type === "image/webp" || /\.webp$/i.test(f.name)) {
      const img = await loadImageFile(f);
      const blob = await canvasToBlob(canvasFromImage(img, true), "image/jpeg", 0.92);
      bytes = await blob.arrayBuffer();
      embedded = await pdfDoc.embedJpg(bytes);
    } else if (f.type === "image/png" || /\.png$/i.test(f.name)) {
      bytes = await f.arrayBuffer();
      embedded = await pdfDoc.embedPng(bytes);
    } else {
      bytes = await f.arrayBuffer();
      embedded = await pdfDoc.embedJpg(bytes);
    }
    const page = pdfDoc.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
  }

  const out = await pdfDoc.save();
  const name = imgs.length === 1 ? baseName(imgs[0].name) + ".pdf" : "imagens.pdf";
  convDone([{ blob: new Blob([out], { type: "application/pdf" }), filename: name, label: "⬇️ Baixar PDF" }]);
}

/* --- 4. PDF → JPG --- */
async function convertPdfToImages(files) {
  const file = files[0];
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") throw new Error("Escolha um arquivo .pdf.");
  convStatus("Carregando leitor de PDF…");
  await ensurePdfjs();
  convStatus("Lendo arquivo…");
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;

  const maxPages = Math.min(pdf.numPages, 30);
  const links = [];
  for (let p = 1; p <= maxPages; p++) {
    convStatus(`Renderizando página ${p} de ${maxPages}…`);
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport, intent: "print" }).promise;
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.9);
    links.push({ blob, filename: `${baseName(file.name)}-pagina-${p}.jpg`, label: `⬇️ Página ${p} (JPG)` });
  }
  convDone(links, pdf.numPages > 30 ? "(limite de 30 páginas por vez)" : "");
}

/* --- 5. Converter imagem --- */
async function convertImageFormat(files) {
  const file = files[0];
  const format = document.getElementById("opt-img-format").value;
  const ext = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[format];
  convStatus("Convertendo…");
  const img = await loadImageFile(file);
  const blob = await canvasToBlob(canvasFromImage(img, format === "image/jpeg"), format, 0.92);
  convDone([{ blob, filename: baseName(file.name) + "." + ext, label: "⬇️ Baixar ." + ext.toUpperCase() }]);
}

/* --- 6. Comprimir imagem --- */
async function compressImage(files) {
  const file = files[0];
  const quality = parseInt(document.getElementById("opt-quality").value, 10) / 100;
  convStatus("Comprimindo…");
  const img = await loadImageFile(file);
  const blob = await canvasToBlob(canvasFromImage(img, true), "image/jpeg", quality);
  const before = (file.size / 1024).toFixed(0);
  const after = (blob.size / 1024).toFixed(0);
  const saved = file.size > 0 ? Math.max(0, Math.round((1 - blob.size / file.size) * 100)) : 0;
  convDone(
    [{ blob, filename: baseName(file.name) + "-comprimida.jpg", label: "⬇️ Baixar imagem comprimida" }],
    `${before} KB → ${after} KB (−${saved}%)`
  );
}

/* --- 7. Juntar PDFs --- */
async function mergePdfs(files) {
  const pdfs = files.filter((f) => /\.pdf$/i.test(f.name) || f.type === "application/pdf");
  if (pdfs.length < 2) throw new Error("Selecione pelo menos 2 PDFs para juntar.");
  convStatus("Carregando…");
  await loadScript(LIB.pdflib);
  const { PDFDocument } = PDFLib;
  const merged = await PDFDocument.create();
  for (let i = 0; i < pdfs.length; i++) {
    convStatus(`Juntando arquivo ${i + 1} de ${pdfs.length}…`);
    let src;
    try {
      src = await PDFDocument.load(await pdfs[i].arrayBuffer(), { ignoreEncryption: false });
    } catch {
      throw new Error(`O arquivo "${pdfs[i].name}" está protegido ou corrompido.`);
    }
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((pg) => merged.addPage(pg));
  }
  const out = await merged.save();
  convDone([{ blob: new Blob([out], { type: "application/pdf" }), filename: "unido.pdf", label: "⬇️ Baixar PDF unido" }]);
}

/* --- 8. Dividir PDF --- */
async function splitPdf(files) {
  const file = files[0];
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") throw new Error("Escolha um arquivo .pdf.");
  convStatus("Carregando…");
  await loadScript(LIB.pdflib);
  const { PDFDocument } = PDFLib;
  let src;
  try {
    src = await PDFDocument.load(await file.arrayBuffer());
  } catch {
    throw new Error("Este PDF está protegido por senha ou corrompido.");
  }
  const total = src.getPageCount();
  const from = Math.max(1, parseInt(document.getElementById("opt-page-from").value, 10) || 1);
  const to = Math.min(total, parseInt(document.getElementById("opt-page-to").value, 10) || total);
  if (from > to) throw new Error(`Intervalo inválido. O PDF tem ${total} página(s).`);

  convStatus(`Extraindo páginas ${from} a ${to} de ${total}…`);
  const outDoc = await PDFDocument.create();
  const idx = [];
  for (let i = from - 1; i <= to - 1; i++) idx.push(i);
  const pages = await outDoc.copyPages(src, idx);
  pages.forEach((pg) => outDoc.addPage(pg));
  const out = await outDoc.save();
  convDone([{
    blob: new Blob([out], { type: "application/pdf" }),
    filename: `${baseName(file.name)}-pag-${from}-a-${to}.pdf`,
    label: `⬇️ Baixar páginas ${from}–${to}`,
  }]);
}

/* --- 9. Excel ↔ CSV --- */
async function convertSpreadsheet(files) {
  const file = files[0];
  const isCsv = /\.csv$/i.test(file.name);
  const isExcel = /\.(xlsx|xls)$/i.test(file.name);
  if (!isCsv && !isExcel) throw new Error("Escolha um arquivo .xlsx, .xls ou .csv.");
  convStatus("Carregando conversor de planilhas…");
  await loadScript(LIB.xlsx);
  convStatus("Convertendo…");

  if (isExcel) {
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const links = wb.SheetNames.map((sheetName) => {
      const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName], { FS: ";" });
      const suffix = wb.SheetNames.length > 1 ? "-" + sheetName : "";
      return {
        blob: new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }),
        filename: baseName(file.name) + suffix + ".csv",
        label: "⬇️ Baixar CSV" + (wb.SheetNames.length > 1 ? ` (aba: ${sheetName})` : ""),
      };
    });
    convDone(links);
  } else {
    const text = await file.text();
    const wb = XLSX.read(text, { type: "string", FS: text.includes(";") ? ";" : "," });
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    convDone([{
      blob: new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      filename: baseName(file.name) + ".xlsx",
      label: "⬇️ Baixar Excel (.xlsx)",
    }]);
  }
}

/* --- utilidades PDF (pdf-lib) --- */
async function loadPdfLibDoc(file) {
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") throw new Error("Escolha um arquivo .pdf.");
  await loadScript(LIB.pdflib);
  try {
    return await PDFLib.PDFDocument.load(await file.arrayBuffer());
  } catch {
    throw new Error("Este PDF está protegido por senha ou corrompido.");
  }
}

function parsePageSpec(spec, total) {
  const out = new Set();
  (spec || "").split(",").map((s) => s.trim()).filter(Boolean).forEach((part) => {
    const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      for (let i = Math.min(+m[1], +m[2]); i <= Math.max(+m[1], +m[2]); i++) if (i >= 1 && i <= total) out.add(i - 1);
    } else if (/^\d+$/.test(part)) {
      const n = +part;
      if (n >= 1 && n <= total) out.add(n - 1);
    }
  });
  return [...out].sort((a, b) => a - b);
}

/* --- 10. PDF → Texto --- */
async function convertPdfToTxt(files) {
  const file = files[0];
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") throw new Error("Escolha um arquivo .pdf.");
  convStatus("Carregando leitor de PDF…");
  await ensurePdfjs();
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    convStatus(`Extraindo texto da página ${p} de ${pdf.numPages}…`);
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    text += pageItemsToParagraphs(content.items).join("\n\n") + "\n\n";
  }
  if (text.trim().length < 20) throw new Error("Este PDF parece ser escaneado (imagem): não há texto extraível.");
  convDone([{ blob: new Blob(["﻿" + text], { type: "text/plain;charset=utf-8" }), filename: baseName(file.name) + ".txt", label: "⬇️ Baixar texto (.txt)" }]);
}

/* --- 11. Extrair páginas específicas --- */
async function extractPdfPages(files) {
  const src = await loadPdfLibDoc(files[0]);
  const total = src.getPageCount();
  const idx = parsePageSpec(document.getElementById("opt-pages").value, total);
  if (!idx.length) throw new Error(`Informe as páginas no campo acima (ex.: 1, 3-5). O PDF tem ${total} página(s).`);
  convStatus(`Extraindo ${idx.length} página(s)…`);
  const out = await PDFLib.PDFDocument.create();
  (await out.copyPages(src, idx)).forEach((p) => out.addPage(p));
  convDone([{ blob: new Blob([await out.save()], { type: "application/pdf" }), filename: baseName(files[0].name) + "-paginas.pdf", label: `⬇️ Baixar ${idx.length} página(s)` }]);
}

/* --- 12. Remover páginas --- */
async function removePdfPages(files) {
  const src = await loadPdfLibDoc(files[0]);
  const total = src.getPageCount();
  const remove = new Set(parsePageSpec(document.getElementById("opt-pages").value, total));
  if (!remove.size) throw new Error(`Informe as páginas a remover no campo acima (ex.: 2, 4-6). O PDF tem ${total} página(s).`);
  const keep = [];
  for (let i = 0; i < total; i++) if (!remove.has(i)) keep.push(i);
  if (!keep.length) throw new Error("Você removeria todas as páginas — sobraria um PDF vazio.");
  convStatus(`Removendo ${remove.size} página(s)…`);
  const out = await PDFLib.PDFDocument.create();
  (await out.copyPages(src, keep)).forEach((p) => out.addPage(p));
  convDone([{ blob: new Blob([await out.save()], { type: "application/pdf" }), filename: baseName(files[0].name) + "-sem-paginas.pdf", label: `⬇️ Baixar PDF (${keep.length} páginas)` }]);
}

/* --- 13. Girar PDF --- */
async function rotatePdf(files) {
  const src = await loadPdfLibDoc(files[0]);
  const deg = parseInt(document.getElementById("opt-rotate").value, 10);
  convStatus("Girando páginas…");
  src.getPages().forEach((page) => {
    page.setRotation(PDFLib.degrees((page.getRotation().angle + deg) % 360));
  });
  convDone([{ blob: new Blob([await src.save()], { type: "application/pdf" }), filename: baseName(files[0].name) + "-girado.pdf", label: "⬇️ Baixar PDF girado" }]);
}

/* --- 14. Inverter ordem --- */
async function reversePdf(files) {
  const src = await loadPdfLibDoc(files[0]);
  const total = src.getPageCount();
  convStatus("Invertendo ordem das páginas…");
  const idx = [];
  for (let i = total - 1; i >= 0; i--) idx.push(i);
  const out = await PDFLib.PDFDocument.create();
  (await out.copyPages(src, idx)).forEach((p) => out.addPage(p));
  convDone([{ blob: new Blob([await out.save()], { type: "application/pdf" }), filename: baseName(files[0].name) + "-invertido.pdf", label: "⬇️ Baixar PDF invertido" }]);
}

/* --- 15. Redimensionar imagem --- */
async function resizeImage(files) {
  const file = files[0];
  const w = parseInt(document.getElementById("opt-width").value, 10) || 0;
  const h = parseInt(document.getElementById("opt-height").value, 10) || 0;
  if (!w && !h) throw new Error("Informe a largura ou a altura desejada no campo acima.");
  convStatus("Redimensionando…");
  const img = await loadImageFile(file);
  const ratio = img.naturalWidth / img.naturalHeight;
  const outW = w || Math.round(h * ratio);
  const outH = h || Math.round(w / ratio);
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  const isJpg = /image\/jpeg/.test(file.type) || /\.jpe?g$/i.test(file.name);
  if (isJpg) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, outW, outH); }
  ctx.drawImage(img, 0, 0, outW, outH);
  const type = isJpg ? "image/jpeg" : "image/png";
  const blob = await canvasToBlob(canvas, type, 0.92);
  convDone([{ blob, filename: `${baseName(file.name)}-${outW}x${outH}.${isJpg ? "jpg" : "png"}`, label: `⬇️ Baixar ${outW}×${outH}` }]);
}

/* --- 16. Girar imagem --- */
async function rotateImage(files) {
  const file = files[0];
  const deg = parseInt(document.getElementById("opt-rotate").value, 10);
  convStatus("Girando…");
  const img = await loadImageFile(file);
  const swap = deg === 90 || deg === 270;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? img.naturalHeight : img.naturalWidth;
  canvas.height = swap ? img.naturalWidth : img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  const isJpg = /image\/jpeg/.test(file.type) || /\.jpe?g$/i.test(file.name);
  const blob = await canvasToBlob(canvas, isJpg ? "image/jpeg" : "image/png", 0.92);
  convDone([{ blob, filename: `${baseName(file.name)}-girada.${isJpg ? "jpg" : "png"}`, label: "⬇️ Baixar imagem girada" }]);
}

/* --- 17. Espelhar imagem --- */
async function flipImage(files) {
  const file = files[0];
  const dir = document.getElementById("opt-flip").value;
  convStatus("Espelhando…");
  const img = await loadImageFile(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (dir === "h") { ctx.scale(-1, 1); ctx.drawImage(img, -canvas.width, 0); }
  else { ctx.scale(1, -1); ctx.drawImage(img, 0, -canvas.height); }
  const isJpg = /image\/jpeg/.test(file.type) || /\.jpe?g$/i.test(file.name);
  const blob = await canvasToBlob(canvas, isJpg ? "image/jpeg" : "image/png", 0.92);
  convDone([{ blob, filename: `${baseName(file.name)}-espelhada.${isJpg ? "jpg" : "png"}`, label: "⬇️ Baixar imagem espelhada" }]);
}

/* --- 18. Preto e branco --- */
async function grayscaleImage(files) {
  const file = files[0];
  const mode = document.getElementById("opt-bw").value;
  convStatus("Convertendo cores…");
  const img = await loadImageFile(file);
  const canvas = canvasFromImage(img, true);
  const ctx = canvas.getContext("2d");
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    let v = Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
    if (mode === "bw") v = v >= 128 ? 255 : 0;
    px[i] = px[i + 1] = px[i + 2] = v;
  }
  ctx.putImageData(data, 0, 0);
  const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
  convDone([{ blob, filename: `${baseName(file.name)}-${mode === "bw" ? "pb" : "cinza"}.jpg`, label: "⬇️ Baixar imagem" }]);
}

/* --- 19. Juntar imagens --- */
async function joinImages(files) {
  const imgs = files.filter((f) => /image\/(jpeg|png|webp)/.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name));
  if (imgs.length < 2) throw new Error("Selecione pelo menos 2 imagens para juntar.");
  const dir = document.getElementById("opt-join").value;
  convStatus("Carregando imagens…");
  const loaded = [];
  for (const f of imgs) loaded.push(await loadImageFile(f));
  const canvas = document.createElement("canvas");
  if (dir === "v") {
    canvas.width = Math.max(...loaded.map((i) => i.naturalWidth));
    canvas.height = loaded.reduce((s, i) => s + i.naturalHeight, 0);
  } else {
    canvas.width = loaded.reduce((s, i) => s + i.naturalWidth, 0);
    canvas.height = Math.max(...loaded.map((i) => i.naturalHeight));
  }
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let off = 0;
  loaded.forEach((i) => {
    if (dir === "v") { ctx.drawImage(i, 0, off); off += i.naturalHeight; }
    else { ctx.drawImage(i, off, 0); off += i.naturalWidth; }
  });
  convStatus("Gerando arquivo…");
  const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
  convDone([{ blob, filename: "imagens-juntas.jpg", label: "⬇️ Baixar imagem combinada" }]);
}

/* --- 20. HEIC → JPG --- */
async function convertHeic(files) {
  const file = files[0];
  if (!/\.(heic|heif)$/i.test(file.name) && !/heic|heif/.test(file.type)) throw new Error("Escolha uma foto .heic ou .heif (formato do iPhone).");
  convStatus("Carregando conversor HEIC…");
  await loadScript(LIB.heic2any);
  convStatus("Convertendo (fotos grandes podem demorar)…");
  let out;
  try {
    out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  } catch {
    throw new Error("Não foi possível converter esta foto. Confirme que é um HEIC válido do iPhone.");
  }
  const blob = Array.isArray(out) ? out[0] : out;
  convDone([{ blob, filename: baseName(file.name) + ".jpg", label: "⬇️ Baixar JPG" }]);
}

/* --- 21. Remover EXIF --- */
async function stripExif(files) {
  const file = files[0];
  convStatus("Removendo metadados…");
  const img = await loadImageFile(file);
  const isJpg = /image\/jpeg/.test(file.type) || /\.jpe?g$/i.test(file.name);
  const canvas = canvasFromImage(img, isJpg);
  const blob = await canvasToBlob(canvas, isJpg ? "image/jpeg" : "image/png", 0.95);
  convDone(
    [{ blob, filename: `${baseName(file.name)}-limpa.${isJpg ? "jpg" : "png"}`, label: "⬇️ Baixar imagem sem metadados" }],
    "(localização GPS, câmera e demais dados EXIF removidos)"
  );
}

/* --- 22. Imagem → Base64 --- */
async function imageToBase64(files) {
  const file = files[0];
  convStatus("Gerando código…");
  const dataUri = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    fr.readAsDataURL(file);
  });
  convDone([{ text: dataUri, filename: baseName(file.name) + "-base64.txt" }], `(${Math.round(dataUri.length / 1024)} KB de texto)`);
}

/* --- 23. JSON ↔ CSV --- */
async function convertJsonCsv(files) {
  const file = files[0];
  const isJson = /\.json$/i.test(file.name);
  const isCsv = /\.csv$/i.test(file.name);
  if (!isJson && !isCsv) throw new Error("Escolha um arquivo .json ou .csv.");
  convStatus("Carregando conversor…");
  await loadScript(LIB.xlsx);
  const text = await file.text();

  if (isJson) {
    let data;
    try { data = JSON.parse(text); } catch { throw new Error("Este JSON é inválido — confira o conteúdo."); }
    if (!Array.isArray(data)) data = [data];
    if (!data.length || typeof data[0] !== "object") throw new Error("O JSON precisa ser uma lista de objetos para virar tabela.");
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";" });
    convDone([{ blob: new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), filename: baseName(file.name) + ".csv", label: "⬇️ Baixar CSV" }]);
  } else {
    const wb = XLSX.read(text, { type: "string", FS: text.includes(";") ? ";" : "," });
    const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    convDone([{ blob: new Blob([JSON.stringify(json, null, 2)], { type: "application/json" }), filename: baseName(file.name) + ".json", label: "⬇️ Baixar JSON" }]);
  }
}

/* --- 24. Trocar separador CSV --- */
async function swapCsvDelimiter(files) {
  const file = files[0];
  if (!/\.csv$/i.test(file.name)) throw new Error("Escolha um arquivo .csv.");
  convStatus("Analisando separador…");
  await loadScript(LIB.xlsx);
  const text = await file.text();
  const firstLine = text.split(/\r?\n/)[0] || "";
  const semis = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const from = semis >= commas ? ";" : ",";
  const to = from === ";" ? "," : ";";
  const wb = XLSX.read(text, { type: "string", FS: from });
  const csv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]], { FS: to });
  convDone(
    [{ blob: new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), filename: baseName(file.name) + "-convertido.csv", label: "⬇️ Baixar CSV" }],
    `(separador "${from}" → "${to}")`
  );
}

/* --- 25. Criar ZIP --- */
async function createZip(files) {
  convStatus("Carregando compactador…");
  await loadScript(LIB.jszip);
  const zip = new JSZip();
  files.forEach((f) => zip.file(f.name, f));
  convStatus(`Compactando ${files.length} arquivo(s)…`);
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  const before = files.reduce((s, f) => s + f.size, 0);
  const saved = before > 0 ? Math.max(0, Math.round((1 - blob.size / before) * 100)) : 0;
  convDone([{ blob, filename: "arquivos.zip", label: "⬇️ Baixar ZIP" }], `(${files.length} arquivo(s), −${saved}% de tamanho)`);
}

/* --- 26. Extrair ZIP --- */
async function extractZip(files) {
  const file = files[0];
  if (!/\.zip$/i.test(file.name) && !/zip/.test(file.type)) throw new Error("Escolha um arquivo .zip.");
  convStatus("Carregando compactador…");
  await loadScript(LIB.jszip);
  let zip;
  try {
    zip = await JSZip.loadAsync(await file.arrayBuffer());
  } catch {
    throw new Error("Este ZIP está corrompido ou protegido por senha.");
  }
  const entries = Object.values(zip.files).filter((e) => !e.dir);
  if (!entries.length) throw new Error("Este ZIP está vazio.");
  const MAX = 40;
  const shown = entries.slice(0, MAX);
  convStatus(`Extraindo ${shown.length} arquivo(s)…`);
  const links = [];
  for (const e of shown) {
    const blob = await e.async("blob");
    links.push({ blob, filename: e.name.split("/").pop(), label: `⬇️ ${e.name} (${(blob.size / 1024).toFixed(0)} KB)` });
  }
  convDone(links, entries.length > MAX ? `(mostrando ${MAX} de ${entries.length} arquivos)` : `(${entries.length} arquivo(s))`);
}

/* ============================================================
   FERRAMENTAS SEM ARQUIVO (QR, cores, texto)
============================================================ */

/* --- Conversor de cores --- */
function parseColor(raw) {
  raw = raw.trim().toLowerCase();
  let m = raw.match(/^#?([0-9a-f]{6})$/);
  if (m) {
    const n = parseInt(m[1], 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }
  m = raw.match(/^#?([0-9a-f]{3})$/);
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16));
  m = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return [Math.min(255, +m[1]), Math.min(255, +m[2]), Math.min(255, +m[3])];
  return null;
}

async function runColorConvert() {
  const rgb = parseColor(document.getElementById("opt-cor").value);
  if (!rgb) throw new Error('Cor inválida. Use HEX (#1E4FD8) ou RGB "rgb(30,79,216)".');
  const [r, g, b] = rgb;
  const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();

  const rf = r / 255, gf = g / 255, bf = b / 255;
  const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rf) h = ((gf - bf) / d + (gf < bf ? 6 : 0)) * 60;
    else if (max === gf) h = ((bf - rf) / d + 2) * 60;
    else h = ((rf - gf) / d + 4) * 60;
  }
  const k = 1 - Math.max(rf, gf, bf);
  const cmyk = k >= 1 ? [0, 0, 0, 100] : [(1 - rf - k) / (1 - k), (1 - gf - k) / (1 - k), (1 - bf - k) / (1 - k), k].map((v) => Math.round(v * 100));

  const lum = (c) => { const x = c / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  const contrastWhite = ((1.05) / (L + 0.05)).toFixed(2);
  const contrastBlack = ((L + 0.05) / 0.05).toFixed(2);

  const shade = (f) => "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v * f)))).map((v) => v.toString(16).padStart(2, "0")).join("");
  const tint = (f) => "#" + [r, g, b].map((v) => Math.round(v + (255 - v) * f)).map((v) => v.toString(16).padStart(2, "0")).join("");
  const variations = [shade(0.4), shade(0.7), hex, tint(0.35), tint(0.7)];

  document.getElementById("conv-status").classList.add("hidden");
  const done = document.getElementById("conv-done");
  done.innerHTML = `
    <div class="done-banner">✅ Cor convertida!</div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin:12px 0">
      <div style="width:90px;height:90px;border-radius:12px;background:${hex};border:2px solid rgba(255,255,255,0.2)"></div>
      <div style="font-family:var(--font-mono);font-size:0.85rem;line-height:2">
        <strong>HEX:</strong> ${hex}<br>
        <strong>RGB:</strong> rgb(${r}, ${g}, ${b})<br>
        <strong>HSL:</strong> hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)<br>
        <strong>CMYK:</strong> ${cmyk.join("%, ")}%
      </div>
    </div>
    <p style="font-size:0.85rem;color:var(--text-dim)">Variações (escura → clara):</p>
    <div style="display:flex;gap:6px;margin:8px 0 14px">${variations.map((v) => `<div title="${v.toUpperCase()}" style="width:52px;height:40px;border-radius:8px;background:${v};cursor:pointer" onclick="navigator.clipboard.writeText('${v.toUpperCase()}')"></div>`).join("")}</div>
    <p style="font-size:0.85rem;color:var(--text-dim)">Contraste (acessibilidade): texto branco <strong>${contrastWhite}:1</strong> ${contrastWhite >= 4.5 ? "✅" : "⚠️ abaixo de 4.5"} · texto preto <strong>${contrastBlack}:1</strong> ${contrastBlack >= 4.5 ? "✅" : "⚠️ abaixo de 4.5"}</p>`;
  done.classList.remove("hidden");
}

/* --- Base64 texto --- */
async function runBase64Text() {
  const op = document.getElementById("opt-b64-op").value;
  const text = document.getElementById("opt-b64-text").value;
  if (!text) throw new Error("Cole o conteúdo no campo acima.");
  let out;
  if (op === "enc") {
    out = btoa(String.fromCharCode(...new TextEncoder().encode(text)));
  } else {
    try {
      const bin = atob(text.trim().replace(/\s+/g, ""));
      out = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    } catch {
      throw new Error("Este conteúdo não é Base64 válido.");
    }
  }
  convDone([{ text: out, filename: op === "enc" ? "base64.txt" : "decodificado.txt" }]);
}

/* --- URL encode/decode --- */
async function runUrlEncode() {
  const op = document.getElementById("opt-url-op").value;
  const text = document.getElementById("opt-url-text").value;
  if (!text) throw new Error("Cole o conteúdo no campo acima.");
  let out;
  if (op === "enc") out = encodeURIComponent(text);
  else {
    try { out = decodeURIComponent(text.replace(/\+/g, "%20")); } catch { throw new Error("Este conteúdo não é URL-encode válido."); }
  }
  convDone([{ text: out, filename: "convertido.txt" }]);
}

/* --- Formatar/validar JSON --- */
async function runJsonTool() {
  const op = document.getElementById("opt-json-op").value;
  const text = document.getElementById("opt-json-text").value.trim();
  if (!text) throw new Error("Cole o JSON no campo acima.");
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    const m = String(e.message).match(/position (\d+)/);
    let hint = "";
    if (m) {
      const pos = +m[1];
      const linha = text.slice(0, pos).split("\n").length;
      hint = ` (por volta da linha ${linha})`;
    }
    throw new Error("JSON inválido" + hint + ": " + e.message);
  }
  if (op === "val") {
    convDone([{ text: "✅ JSON válido! " + (Array.isArray(data) ? data.length + " item(ns) na lista." : Object.keys(data || {}).length + " chave(s) no objeto."), filename: null }]);
    return;
  }
  const out = op === "fmt" ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  convDone([{ text: out, filename: op === "fmt" ? "formatado.json" : "minificado.json" }]);
}

/* --- Hash de arquivo --- */
async function hashFile(files) {
  const file = files[0];
  const algo = document.getElementById("opt-hash-algo").value;
  convStatus(`Calculando ${algo}…`);
  const digest = await crypto.subtle.digest(algo, await file.arrayBuffer());
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  convDone([{ text: hex, filename: baseName(file.name) + "-" + algo.toLowerCase().replace("-", "") + ".txt" }], `(${algo} de "${file.name}")`);
}

/* ============================================================
   INICIALIZAÇÃO
============================================================ */
route();
