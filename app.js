/* ===== Consig Invest | Marketing Hub — app.js ===== */

const WHATSAPP = "5551983493659";
const PAGESPEED_KEY = "AIzaSyCE2W5SN58BNxlE_q7FOqpqz89wKCRmAkY"; // chave gratuita da API PageSpeed (restrita ao domínio hub.consiginvest.com)
const GMB_RESOLVER = "https://dinastia-n8n-webhook.u9dep8.easypanel.host/webhook/gmb-resolve";

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
   FERRAMENTA 2 — ANÁLISE DA FICHA DO GOOGLE (link do Maps)
============================================================ */
const GMB_QUESTIONS = [
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

const gmbForm = document.getElementById("gmb-form");
const gmbBtn = document.getElementById("gmb-btn");
const gmbError = document.getElementById("gmb-error");
const gmbChecklist = document.getElementById("gmb-checklist");
const gmbResult = document.getElementById("gmb-result");

function parseMapsUrl(raw) {
  // extrai o nome da ficha de uma URL completa do Google Maps
  const m = raw.match(/\/maps\/place\/([^\/@?]+)/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1].replace(/\+/g, " "));
  } catch {
    return m[1].replace(/\+/g, " ");
  }
}

function isMapsLink(raw) {
  return /(?:google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.|share\.google)/i.test(raw);
}

function buildChecklist(businessName) {
  const found = document.getElementById("gmb-found");
  found.innerHTML = businessName
    ? "✅ Ficha encontrada no Google: <strong>" + escapeHTML(businessName) + "</strong>" +
      '<span class="result-detail">Ótimo — sua empresa existe no Google Maps. Agora vamos medir a força dessa ficha.</span>'
    : "✅ Link recebido!" +
      '<span class="result-detail">Agora vamos medir a força da sua ficha.</span>';

  const list = document.getElementById("gmb-questions");
  list.innerHTML = "";
  GMB_QUESTIONS.forEach((item, i) => {
    const li = el("li");
    li.appendChild(el("span", "q-text", escapeHTML(item.q)));
    const opts = el("div", "q-opts");
    opts.innerHTML = `
      <label><input type="radio" name="gmb-q${i}" value="1"> Sim</label>
      <label><input type="radio" name="gmb-q${i}" value="0"> Não</label>`;
    li.appendChild(opts);
    list.appendChild(li);
  });

  gmbResult.classList.add("hidden");
  gmbChecklist.classList.remove("hidden");
  gmbChecklist.scrollIntoView({ behavior: "smooth", block: "start" });
}

gmbForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const raw = document.getElementById("gmb-link").value.trim();
  gmbError.classList.add("hidden");

  if (!isMapsLink(raw)) {
    gmbError.innerHTML =
      "⚠️ Este não parece ser um link do Google Maps. Abra sua empresa no Maps, toque em <strong>Compartilhar → Copiar link</strong> e cole aqui.";
    gmbError.classList.remove("hidden");
    return;
  }

  // URL completa: dá pra extrair o nome sem sair do navegador
  let name = parseMapsUrl(raw);

  if (!name) {
    // link curto: resolve pelo webhook
    gmbBtn.disabled = true;
    gmbBtn.innerHTML = '<span class="spinner"></span> Verificando ficha…';
    try {
      const res = await fetch(GMB_RESOLVER + "?url=" + encodeURIComponent(raw));
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.name) name = data.name;
      }
    } catch {
      /* segue sem nome — o checklist ainda funciona */
    } finally {
      gmbBtn.disabled = false;
      gmbBtn.textContent = "Analisar ficha";
    }
  }

  buildChecklist(name);
});

document.getElementById("gmb-no-listing").addEventListener("click", () => {
  gmbChecklist.classList.add("hidden");
  const banner = document.getElementById("gmb-status");
  banner.innerHTML =
    "🚨 Ficha inexistente" +
    '<span class="result-detail">Sua empresa é <strong>invisível no Google Maps</strong>. Quando alguém procura pelo seu serviço na sua cidade, quem aparece — e recebe a ligação — é o concorrente. Cada dia sem ficha é faturamento indo embora.</span>';
  document.getElementById("gmb-missing").innerHTML = "";
  gmbResult.classList.remove("hidden");
  gmbResult.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("gmb-diagnose").addEventListener("click", () => {
  const answers = GMB_QUESTIONS.map((_, i) => {
    const checked = document.querySelector(`input[name="gmb-q${i}"]:checked`);
    return checked ? Number(checked.value) : 0;
  });
  // a ficha existe (link validado) = 1 ponto, + 9 itens do checklist
  const score = 1 + answers.reduce((s, v) => s + v, 0);

  let title, detail;
  if (score <= 4) {
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

  document.getElementById("gmb-status").innerHTML = title + '<span class="result-detail">' + detail + "</span>";

  const missingWrap = document.getElementById("gmb-missing");
  missingWrap.innerHTML = "";
  const missing = GMB_QUESTIONS.filter((_, i) => answers[i] === 0);
  if (missing.length > 0) {
    missingWrap.appendChild(el("h3", null, "O que está faltando na sua ficha:"));
    const ul = el("ul");
    missing.forEach((m) => ul.appendChild(el("li", null, escapeHTML(m.missing))));
    missingWrap.appendChild(ul);
  }

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
   CONVERSORES
============================================================ */
const CONVERTERS = [
  {
    slug: "pdf-para-word", icon: "📄", title: "PDF → Word",
    desc: "Transforme PDF em documento editável",
    accept: "application/pdf,.pdf", multiple: false,
    dropText: "Arraste o PDF aqui ou clique para selecionar",
    handler: convertPdfToWord,
  },
  {
    slug: "word-para-pdf", icon: "📝", title: "Word → PDF",
    desc: "Converta .docx em PDF pronto para enviar",
    accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document", multiple: false,
    dropText: "Arraste o arquivo .docx aqui ou clique para selecionar",
    handler: convertWordToPdf,
  },
  {
    slug: "imagem-para-pdf", icon: "🖼️", title: "Imagem → PDF",
    desc: "JPG, PNG ou WebP viram um PDF (aceita várias)",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp", multiple: true,
    dropText: "Arraste as imagens aqui ou clique para selecionar (pode escolher várias)",
    handler: convertImagesToPdf,
  },
  {
    slug: "pdf-para-imagem", icon: "🎞️", title: "PDF → JPG",
    desc: "Cada página do PDF vira uma imagem",
    accept: "application/pdf,.pdf", multiple: false,
    dropText: "Arraste o PDF aqui ou clique para selecionar",
    handler: convertPdfToImages,
  },
  {
    slug: "converter-imagem", icon: "🔁", title: "Converter imagem",
    desc: "JPG ↔ PNG ↔ WebP em um clique",
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
    slug: "comprimir-imagem", icon: "🗜️", title: "Comprimir imagem",
    desc: "Reduza o tamanho de JPG e PNG sem perder qualidade visível",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp", multiple: false,
    dropText: "Arraste a imagem aqui ou clique para selecionar",
    options: () => `
      <label>Qualidade: <span id="opt-quality-val">70%</span>
        <input type="range" id="opt-quality" min="30" max="95" value="70">
      </label>`,
    handler: compressImage,
  },
  {
    slug: "juntar-pdf", icon: "📚", title: "Juntar PDFs",
    desc: "Una vários PDFs em um único arquivo",
    accept: "application/pdf,.pdf", multiple: true,
    dropText: "Arraste 2 ou mais PDFs aqui (a ordem de seleção é a ordem final)",
    handler: mergePdfs,
  },
  {
    slug: "dividir-pdf", icon: "✂️", title: "Dividir PDF",
    desc: "Extraia um intervalo de páginas do PDF",
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
    slug: "excel-csv", icon: "📊", title: "Excel ↔ CSV",
    desc: "Converta planilhas .xlsx em CSV e vice-versa",
    accept: ".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv", multiple: false,
    dropText: "Arraste a planilha (.xlsx, .xls) ou o .csv aqui",
    handler: convertSpreadsheet,
  },
];

let activeConverter = null;

const convGrid = document.getElementById("conv-grid");
CONVERTERS.forEach((c) => {
  const card = el("button", "conv-card");
  card.type = "button";
  card.innerHTML = `<span class="c-icon">${c.icon}</span><span class="c-title">${c.title}</span><span class="c-desc">${c.desc}</span>`;
  card.addEventListener("click", () => { location.hash = "conversores/" + c.slug; });
  convGrid.appendChild(card);
});

document.getElementById("conv-back").addEventListener("click", () => { location.hash = "conversores"; });

function convReset() {
  ["conv-status", "conv-error", "conv-done"].forEach((id) => document.getElementById(id).classList.add("hidden"));
  document.getElementById("conv-done").innerHTML = "";
}

function showConverter(slug) {
  const conv = CONVERTERS.find((c) => c.slug === slug);
  activeConverter = conv || null;
  document.getElementById("conv-hub").classList.toggle("hidden", !!conv);
  document.getElementById("conv-page").classList.toggle("hidden", !conv);
  if (!conv) return;

  document.getElementById("conv-title").textContent = conv.icon + " " + conv.title;
  document.getElementById("conv-desc").textContent = conv.desc + ".";
  document.getElementById("conv-drop-text").innerHTML = "<strong>" + conv.dropText + "</strong>";

  const input = document.getElementById("conv-input");
  input.value = "";
  input.accept = conv.accept;
  input.multiple = !!conv.multiple;

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
}

function convStatus(msg) {
  const s = document.getElementById("conv-status");
  s.textContent = msg;
  s.classList.remove("hidden");
}

function convError(msg) {
  document.getElementById("conv-status").classList.add("hidden");
  const e = document.getElementById("conv-error");
  e.textContent = "⚠️ " + msg;
  e.classList.remove("hidden");
}

function convDone(links, note) {
  document.getElementById("conv-status").classList.add("hidden");
  const done = document.getElementById("conv-done");
  done.innerHTML = '<div class="done-banner">✅ Conversão concluída!' + (note ? " " + note : "") + "</div>";
  const list = el("div", "file-list");
  links.forEach(({ blob, filename, label }) => {
    const a = el("a", "btn btn-primary");
    a.textContent = label || "⬇️ Baixar " + filename;
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    list.appendChild(a);
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

async function handleConvFiles(files) {
  if (!activeConverter) return;
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

/* ============================================================
   INICIALIZAÇÃO
============================================================ */
route();
