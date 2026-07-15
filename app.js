/* ===== Mozar Marketing Hub — app.js ===== */

const WHATSAPP = "5551999999999"; // troque pelo seu número (formato: 55 + DDD + número)

/* ============================================================
   NAVEGAÇÃO POR ABAS
============================================================ */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

/* ============================================================
   LINKS DE WHATSAPP (CTA por ferramenta + botão do header)
============================================================ */
function waLink(msg) {
  return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(msg);
}

document.querySelectorAll(".cta-whats").forEach((a) => {
  a.href = waLink(a.dataset.msg);
});
document.getElementById("header-whats").href = waLink(
  "Olá! Estou no Mozar Marketing Hub e quero falar com um especialista em marketing digital."
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

/* ============================================================
   FERRAMENTA 1 — ANÁLISE DE VELOCIDADE & SEO (PageSpeed Insights)
============================================================ */
const speedForm = document.getElementById("speed-form");
const speedBtn = document.getElementById("speed-btn");
const speedError = document.getElementById("speed-error");
const speedResults = document.getElementById("speed-results");

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
  // limites do Lighthouse (mobile)
  const limits = {
    lcp: [2500, 4000],
    cls: [0.1, 0.25],
    tbt: [200, 600],
  };
  const [good, mid] = limits[id];
  if (numericValue <= good) return "good";
  if (numericValue <= mid) return "mid";
  return "bad";
}

speedForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const url = document.getElementById("speed-url").value.trim();

  speedError.classList.add("hidden");
  speedResults.classList.add("hidden");
  speedBtn.disabled = true;
  speedBtn.innerHTML = '<span class="spinner"></span> Analisando… (até 40s)';

  try {
    const api =
      "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=" +
      encodeURIComponent(url) +
      "&strategy=mobile&category=performance&category=seo&locale=pt_BR";

    const res = await fetch(api);

    if (res.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const msg = body && body.error && body.error.message ? body.error.message : "";
      throw new Error("API_ERROR:" + msg);
    }

    const data = await res.json();
    const lh = data.lighthouseResult;
    if (!lh) throw new Error("API_ERROR:Resposta sem resultado Lighthouse.");

    const perf = Math.round((lh.categories.performance?.score ?? 0) * 100);
    const seo = Math.round((lh.categories.seo?.score ?? 0) * 100);

    document.getElementById("gauge-perf").innerHTML = gaugeSVG(perf);
    document.getElementById("gauge-seo").innerHTML = gaugeSVG(seo);

    // Métricas principais
    const audits = lh.audits;
    const metricsWrap = document.getElementById("speed-metrics");
    metricsWrap.innerHTML = "";
    const metricDefs = [
      { id: "lcp", audit: "largest-contentful-paint", label: "LCP — Maior elemento" },
      { id: "cls", audit: "cumulative-layout-shift", label: "CLS — Estabilidade visual" },
      { id: "tbt", audit: "total-blocking-time", label: "TBT — Tempo de bloqueio" },
    ];
    metricDefs.forEach((m) => {
      const a = audits[m.audit];
      if (!a) return;
      const card = el("div", "metric-card");
      card.appendChild(el("div", "m-label", m.label));
      const cls = metricClass(m.id, a.numericValue);
      card.appendChild(el("div", "m-value " + cls, a.displayValue || "—"));
      metricsWrap.appendChild(card);
    });

    // Top 4 oportunidades
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
        li.appendChild(el("span", null, o.title));
        const secs = (o.details.overallSavingsMs / 1000).toFixed(1).replace(".", ",");
        li.appendChild(el("span", "savings", "economia ~" + secs + "s"));
        oppsList.appendChild(li);
      });
    }

    speedResults.classList.remove("hidden");
  } catch (err) {
    let msg;
    if (err.message === "RATE_LIMIT") {
      msg = "⏳ Limite atingido, aguarde 1 minuto e tente novamente.";
    } else if (err.message.startsWith("API_ERROR")) {
      const detail = err.message.split(":").slice(1).join(":");
      msg =
        "Não foi possível analisar este endereço. Verifique se a URL está correta e acessível publicamente." +
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
   FERRAMENTA 2 — DIAGNÓSTICO GOOGLE MEU NEGÓCIO
============================================================ */
const GMB_QUESTIONS = [
  { q: "Sua empresa tem uma ficha no Google (aparece no Google Maps)?", missing: "Criar a ficha da empresa no Google" },
  { q: "A ficha foi reivindicada e você tem acesso de administrador?", missing: "Reivindicar a propriedade da ficha" },
  { q: "O telefone cadastrado está correto e atende?", missing: "Corrigir o telefone de contato" },
  { q: "Os horários de funcionamento estão preenchidos e atualizados?", missing: "Atualizar os horários de funcionamento" },
  { q: "A ficha tem 10 ou mais fotos reais do negócio?", missing: "Adicionar pelo menos 10 fotos reais" },
  { q: "Existe uma descrição completa da empresa na ficha?", missing: "Escrever a descrição da empresa" },
  { q: "Os serviços estão cadastrados no menu de serviços?", missing: "Cadastrar o menu de serviços" },
  { q: "Você publica posts ou novidades pelo menos 1x por mês?", missing: "Publicar posts mensais na ficha" },
  { q: "Você responde às avaliações dos clientes?", missing: "Responder às avaliações recebidas" },
  { q: "A ficha tem o link do seu site cadastrado?", missing: "Adicionar o link do site na ficha" },
];

const gmbList = document.getElementById("gmb-questions");
GMB_QUESTIONS.forEach((item, i) => {
  const li = el("li");
  li.appendChild(el("span", "q-text", item.q));
  const opts = el("div", "q-opts");
  opts.innerHTML = `
    <label><input type="radio" name="gmb-q${i}" value="1" required> Sim</label>
    <label><input type="radio" name="gmb-q${i}" value="0"> Não</label>`;
  li.appendChild(opts);
  gmbList.appendChild(li);
});

document.getElementById("gmb-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const answers = GMB_QUESTIONS.map((_, i) => {
    const checked = document.querySelector(`input[name="gmb-q${i}"]:checked`);
    return checked ? Number(checked.value) : 0;
  });
  const score = answers.reduce((s, v) => s + v, 0);

  let title, detail;
  if (answers[0] === 0) {
    title = "🚨 Ficha inexistente";
    detail =
      "Sua empresa é <strong>invisível no Google Maps</strong>. Quando alguém procura pelo seu serviço na sua cidade, quem aparece — e recebe a ligação — é o concorrente. Cada dia sem ficha é faturamento indo embora.";
  } else if (score <= 4) {
    title = "🚨 Ficha extremamente incompleta";
    detail =
      "Com esse nível de cadastro, o Google quase não mostra sua empresa. Você <strong>não está aparecendo</strong> nas buscas locais e está perdendo ligações, clientes e faturamento para concorrentes com fichas completas.";
  } else if (score <= 8) {
    title = "⚠️ Parcialmente cadastrada";
    detail =
      "Sua ficha existe, mas está longe do potencial. O Google prioriza fichas completas e ativas — na prática, você <strong>ainda não está aparecendo</strong> nas primeiras posições e os clientes que procuram seu serviço estão ligando para o concorrente.";
  } else {
    title = "⚠️ Boa base — falta acelerar";
    detail =
      "Sua ficha está bem cadastrada, mas <strong>ficha sozinha não basta</strong> para dominar as buscas locais: seus concorrentes investem em SEO local e Google Ads para aparecer antes de você. Sem essa aceleração, parte das ligações e do faturamento continua indo para eles.";
  }

  const banner = document.getElementById("gmb-status");
  banner.innerHTML = title + '<span class="result-detail">' + detail + "</span>";

  const missingWrap = document.getElementById("gmb-missing");
  missingWrap.innerHTML = "";
  const missing = GMB_QUESTIONS.filter((_, i) => answers[i] === 0);
  if (missing.length > 0) {
    missingWrap.appendChild(el("h3", null, "O que está faltando na sua ficha:"));
    const ul = el("ul");
    missing.forEach((m) => ul.appendChild(el("li", null, m.missing)));
    missingWrap.appendChild(ul);
  }

  const result = document.getElementById("gmb-result");
  result.classList.remove("hidden");
  result.scrollIntoView({ behavior: "smooth", block: "start" });
});

/* ============================================================
   FERRAMENTA 3 — SIMULADOR DE ROI DE TRÁFEGO PAGO
============================================================ */
document.getElementById("roi-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const invest = parseFloat(document.getElementById("roi-invest").value);
  const cpc = parseFloat(document.getElementById("roi-cpc").value);
  const conv = parseFloat(document.getElementById("roi-conv").value) / 100;
  const close = parseFloat(document.getElementById("roi-close").value) / 100;
  const ticket = parseFloat(document.getElementById("roi-ticket").value);

  const clicks = invest / cpc;
  const leads = clicks * conv;
  const sales = leads * close;
  const revenue = sales * ticket;
  const cpa = sales > 0 ? invest / sales : 0;
  const roas = invest > 0 ? revenue / invest : 0;

  let roasClass = "bad";
  if (roas >= 3) roasClass = "good";
  else if (roas >= 1.5) roasClass = "mid";

  const cards = [
    { label: "Cliques / mês", value: fmtNum.format(Math.round(clicks)) },
    { label: "Leads / mês", value: fmtNum.format(Math.round(leads)) },
    { label: "Vendas / mês", value: fmtNum.format(Math.round(sales)) },
    { label: "Faturamento projetado", value: fmtBRL.format(revenue) },
    { label: "Custo por venda (CPA)", value: fmtBRL.format(cpa) },
    { label: "ROAS", value: fmtDec.format(roas) + "x", cls: roasClass },
  ];

  const wrap = document.getElementById("roi-results");
  wrap.innerHTML = "";
  cards.forEach((c) => {
    const card = el("div", "metric-card");
    card.appendChild(el("div", "m-label", c.label));
    card.appendChild(el("div", "m-value" + (c.cls ? " " + c.cls : ""), c.value));
    wrap.appendChild(card);
  });

  wrap.classList.remove("hidden");
  document.getElementById("roi-disclaimer").classList.remove("hidden");
});

/* ============================================================
   FERRAMENTA 4 — GERADOR DE TÍTULO E META DESCRIPTION SEO
============================================================ */
const TITLE_LIMIT = 60;
const DESC_LIMIT = 160;

function genItem(text, limit, container) {
  const item = el("div", "gen-item");
  const over = text.length > limit;
  if (over) item.classList.add("over-limit");

  item.appendChild(el("span", "gen-text", text.replace(/</g, "&lt;")));

  const meta = el("div", "gen-meta");
  meta.appendChild(
    el("span", "char-count" + (over ? " over" : ""), text.length + "/" + limit)
  );
  const btn = el("button", "btn-copy", "Copiar");
  btn.type = "button";
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "Copiado ✓";
      setTimeout(() => (btn.textContent = "Copiar"), 2000);
    } catch {
      btn.textContent = "Erro :(";
      setTimeout(() => (btn.textContent = "Copiar"), 2000);
    }
  });
  meta.appendChild(btn);
  item.appendChild(meta);

  if (over) {
    item.appendChild(
      el("span", "gen-warning", "⚠️ Acima do limite ideal — o Google pode cortar o texto nos resultados.")
    );
  }
  container.appendChild(item);
}

document.getElementById("seo-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("seo-name").value.trim();
  const service = document.getElementById("seo-service").value.trim();
  const city = document.getElementById("seo-city").value.trim();
  const diff = document.getElementById("seo-diff").value.trim();

  const titles = [
    `${service} em ${city} | ${name}`,
    `${name} — ${service} em ${city}`,
    diff
      ? `${service} em ${city}: ${diff} | ${name}`
      : `${service} em ${city} com quem entende | ${name}`,
  ];

  const descs = [
    `Procurando ${service.toLowerCase()} em ${city}? A ${name} oferece atendimento especializado${diff ? " com " + diff.toLowerCase() : ""}. Peça já seu orçamento!`,
    `${name}: referência em ${service.toLowerCase()} em ${city}. ${diff ? diff + ". " : ""}Atendimento rápido e personalizado. Fale com a gente!`,
    `Precisa de ${service.toLowerCase()}? Atendemos ${city} e região${diff ? " — " + diff.toLowerCase() : ""}. Conheça a ${name} e peça uma avaliação.`,
  ];

  const titlesWrap = document.getElementById("seo-titles");
  const descsWrap = document.getElementById("seo-descs");
  titlesWrap.innerHTML = "";
  descsWrap.innerHTML = "";
  titles.forEach((t) => genItem(t, TITLE_LIMIT, titlesWrap));
  descs.forEach((d) => genItem(d, DESC_LIMIT, descsWrap));

  const results = document.getElementById("seo-results");
  results.classList.remove("hidden");
  results.scrollIntoView({ behavior: "smooth", block: "start" });
});

/* ============================================================
   FERRAMENTA 5 — CONVERSOR PDF → WORD (100% client-side)
============================================================ */
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

const dropzone = document.getElementById("pdf-drop");
const pdfInput = document.getElementById("pdf-input");
const pdfStatus = document.getElementById("pdf-status");
const pdfError = document.getElementById("pdf-error");
const pdfDone = document.getElementById("pdf-done");

dropzone.addEventListener("click", () => pdfInput.click());
dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") pdfInput.click();
});
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  if (e.dataTransfer.files.length) handlePDF(e.dataTransfer.files[0]);
});
pdfInput.addEventListener("change", () => {
  if (pdfInput.files.length) handlePDF(pdfInput.files[0]);
});

function escapeHTML(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Agrupa os itens de texto de uma página por coordenada Y (linhas)
 * e junta linhas próximas em parágrafos.
 */
function pageItemsToParagraphs(items) {
  // agrupa por Y (com tolerância de 3pt)
  const lines = [];
  items.forEach((item) => {
    if (!item.str) return;
    const y = item.transform[5];
    const x = item.transform[4];
    let line = lines.find((l) => Math.abs(l.y - y) < 3);
    if (!line) {
      line = { y, parts: [] };
      lines.push(line);
    }
    line.parts.push({ x, str: item.str });
  });

  // ordena linhas de cima para baixo e itens da esquerda para a direita
  lines.sort((a, b) => b.y - a.y);
  lines.forEach((l) => l.parts.sort((a, b) => a.x - b.x));

  // agrupa linhas em parágrafos pela distância vertical
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

async function handlePDF(file) {
  pdfError.classList.add("hidden");
  pdfDone.classList.add("hidden");
  pdfStatus.classList.remove("hidden");

  if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    showPDFError("O arquivo selecionado não é um PDF. Escolha um arquivo .pdf.");
    return;
  }
  if (!window.pdfjsLib) {
    showPDFError("A biblioteca de leitura de PDF não carregou. Verifique sua conexão e recarregue a página.");
    return;
  }

  try {
    pdfStatus.textContent = "Lendo arquivo…";
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    let bodyHTML = "";
    let totalChars = 0;

    for (let p = 1; p <= pdf.numPages; p++) {
      pdfStatus.textContent = `Convertendo página ${p} de ${pdf.numPages}…`;
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const paragraphs = pageItemsToParagraphs(content.items);

      paragraphs.forEach((para) => {
        totalChars += para.length;
        bodyHTML += "<p>" + escapeHTML(para) + "</p>\n";
      });

      if (p < pdf.numPages) {
        bodyHTML += '<br clear="all" style="page-break-before:always">\n';
      }
    }

    if (totalChars < 20) {
      showPDFError(
        "Este PDF parece ser escaneado (imagem): não há texto extraível nele. Para converter, seria necessário OCR — fale com a gente que ajudamos!"
      );
      return;
    }

    const docHTML = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${escapeHTML(file.name.replace(/\.pdf$/i, ""))}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.4}p{margin:0 0 10pt}</style>
</head><body>
${bodyHTML}
</body></html>`;

    const blob = new Blob(["﻿", docHTML], { type: "application/msword" });
    const link = document.getElementById("pdf-download");
    if (link.href && link.href.startsWith("blob:")) URL.revokeObjectURL(link.href);
    link.href = URL.createObjectURL(blob);
    link.download = file.name.replace(/\.pdf$/i, "") + ".doc";

    pdfStatus.classList.add("hidden");
    pdfDone.classList.remove("hidden");
  } catch (err) {
    if (err && err.name === "PasswordException") {
      showPDFError("Este PDF está protegido por senha. Remova a senha do arquivo e tente novamente.");
    } else if (err && err.name === "InvalidPDFException") {
      showPDFError("Este arquivo está corrompido ou não é um PDF válido.");
    } else {
      showPDFError("Não foi possível converter este PDF. Tente outro arquivo.");
    }
  }
}

function showPDFError(msg) {
  pdfStatus.classList.add("hidden");
  pdfError.textContent = "⚠️ " + msg;
  pdfError.classList.remove("hidden");
}
