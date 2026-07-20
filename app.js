const money = (n) => {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1000) {
    return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};

const moneyRange = (low, high) => {
  if (low == null && high == null) return "—";
  if (low === high) return money(low);
  return `${money(low)}–${money(high)}`;
};

const providerClass = (provider) => {
  const p = (provider || "").toLowerCase();
  if (p.includes("open")) return "openai";
  if (p.includes("anthropic")) return "anthropic";
  if (p.includes("xai") || p.includes("x ai")) return "xai";
  return "";
};

const sourceMap = (sources) =>
  Object.fromEntries((sources || []).map((s) => [s.id, s]));

async function loadData() {
  const res = await fetch("data/plans.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load plans.json (${res.status})`);
  return res.json();
}

function filterAndSort(plans, { provider, sort, codingOnly, measuredOnly }) {
  let rows = [...plans];
  if (codingOnly) rows = rows.filter((p) => p.codingRelevant);
  if (measuredOnly) rows = rows.filter((p) => p.sourceId === "semianalysis");
  if (provider !== "all") rows = rows.filter((p) => p.provider === provider);

  const val = (p) => p.apiEqUSD ?? -1;
  const mult = (p) => p.multiplier ?? -1;

  rows.sort((a, b) => {
    switch (sort) {
      case "apiEq":
        return val(b) - val(a);
      case "sticker":
        return a.stickerUSD - b.stickerUSD;
      case "provider":
        return a.provider.localeCompare(b.provider) || a.stickerUSD - b.stickerUSD;
      case "multiplier":
      default:
        return mult(b) - mult(a) || val(b) - val(a);
    }
  });
  return rows;
}

function renderHero(plans) {
  const measured = plans.filter((p) => p.sourceId === "semianalysis" && p.apiEqUSD != null);
  const top = measured.reduce((best, p) => (p.apiEqUSD > (best?.apiEqUSD ?? -1) ? p : best), null);
  const bestMult = measured.reduce((best, p) => (p.multiplier > (best?.multiplier ?? -1) ? p : best), null);
  const sumLoss = measured.reduce((acc, p) => acc + Math.max(0, p.apiEqUSD - p.stickerUSD), 0);

  const root = document.getElementById("hero-stats");
  root.innerHTML = `
    <article class="stat-card">
      <p class="stat-label">Highest API-eq ceiling</p>
      <p class="stat-value">${money(top?.apiEqUSD)}</p>
      <p class="stat-sub">${top ? `${top.product} ${top.planName} · pay ${money(top.stickerUSD)}` : "—"}</p>
    </article>
    <article class="stat-card">
      <p class="stat-label">Best multiplier (measured)</p>
      <p class="stat-value">${bestMult ? `${bestMult.multiplier}×` : "—"}</p>
      <p class="stat-sub">${bestMult ? `${bestMult.product} ${bestMult.planName}` : "—"}</p>
    </article>
    <article class="stat-card">
      <p class="stat-label">Σ opportunity gap</p>
      <p class="stat-value">${money(sumLoss)}</p>
      <p class="stat-sub">Sum of (API-eq − sticker) across SemiAnalysis tiers</p>
    </article>
  `;
}

function renderProviderOptions(plans) {
  const select = document.getElementById("provider-filter");
  const providers = [...new Set(plans.map((p) => p.provider))].sort();
  for (const p of providers) {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    select.appendChild(opt);
  }
}

function renderTable(rows, sources) {
  const tbody = document.getElementById("plans-body");
  tbody.innerHTML = rows
    .map((p) => {
      const src = p.sourceId ? sources[p.sourceId] : null;
      const mult =
        p.multiplier != null
          ? `<span class="multiplier">${p.multiplier}×</span>`
          : `<span class="na">—</span>`;
      const api =
        p.apiEqUSD != null
          ? `<span class="api-eq">${money(p.apiEqUSD)}</span>`
          : `<span class="na">not measured</span>`;
      const range =
        p.apiEqLowUSD != null
          ? moneyRange(p.apiEqLowUSD, p.apiEqHighUSD)
          : "—";
      const conf = p.confidence
        ? `<span class="badge ${p.confidence}">${p.confidence}</span>`
        : `<span class="na">—</span>`;
      const sourceCell = src
        ? `<a class="source-link" href="${src.url}" target="_blank" rel="noopener">${src.name}</a>`
        : `<span class="na">n/a</span>`;

      return `
        <tr>
          <td>
            <div class="plan-cell">
              <span class="plan-name">${p.product} ${p.planName}</span>
              <span class="plan-provider">${p.provider}${p.includes ? ` · ${p.includes}` : ""}</span>
            </div>
          </td>
          <td class="num sticker">${money(p.stickerUSD)}/mo</td>
          <td class="num">${api}</td>
          <td class="num range">${range}</td>
          <td class="num">${mult}</td>
          <td>${conf}</td>
          <td>${sourceCell}</td>
        </tr>
      `;
    })
    .join("");
}

function renderCards(rows, sources) {
  const root = document.getElementById("plan-cards");
  root.innerHTML = rows
    .map((p) => {
      const src = p.sourceId ? sources[p.sourceId] : null;
      return `
        <article class="plan-card">
          <h3>${p.product} ${p.planName}</h3>
          <div class="meta">${p.provider} · ${p.confidence || "unknown"} confidence</div>
          <div class="metrics">
            <div class="metric"><span>You pay</span><strong class="sticker">${money(p.stickerUSD)}</strong></div>
            <div class="metric"><span>API-eq</span><strong class="api-eq">${p.apiEqUSD != null ? money(p.apiEqUSD) : "—"}</strong></div>
            <div class="metric"><span>Range</span><strong>${moneyRange(p.apiEqLowUSD, p.apiEqHighUSD)}</strong></div>
            <div class="metric"><span>Multiplier</span><strong class="multiplier">${p.multiplier != null ? p.multiplier + "×" : "—"}</strong></div>
          </div>
          <p class="notes">${p.notes || ""}${src ? ` <a href="${src.url}" target="_blank" rel="noopener">Source</a>` : ""}</p>
        </article>
      `;
    })
    .join("");
}

function renderChart(rows) {
  const root = document.getElementById("subsidy-chart");
  const chartable = rows.filter((p) => p.apiEqUSD != null);
  const max = Math.max(...chartable.map((p) => p.apiEqUSD), 1);

  root.innerHTML = chartable
    .map((p) => {
      const pct = Math.max(0.8, (p.apiEqUSD / max) * 100);
      const stickerPct = Math.max(0.15, (p.stickerUSD / max) * 100);
      const cls = providerClass(p.provider);
      return `
        <div class="bar-row">
          <div class="bar-label">${p.product} ${p.planName}</div>
          <div class="bar-track" title="Sticker ${money(p.stickerUSD)} vs API-eq ${money(p.apiEqUSD)}">
            <div class="bar-fill ${cls}" data-width="${pct}"></div>
            <div class="bar-sticker" style="left:${stickerPct}%"></div>
          </div>
          <div class="bar-value">${money(p.apiEqUSD)}</div>
        </div>
      `;
    })
    .join("");

  requestAnimationFrame(() => {
    root.querySelectorAll(".bar-fill").forEach((el) => {
      el.style.width = `${el.dataset.width}%`;
    });
  });
}

function renderSources(sources) {
  const list = document.getElementById("sources-list");
  list.innerHTML = sources
    .map(
      (s) =>
        `<li><a href="${s.url}" target="_blank" rel="noopener">${s.name}</a> — ${s.note}</li>`
    )
    .join("");
}

function wireControls(data) {
  const state = () => ({
    provider: document.getElementById("provider-filter").value,
    sort: document.getElementById("sort-by").value,
    codingOnly: document.getElementById("coding-only").checked,
    measuredOnly: document.getElementById("measured-only").checked,
  });

  const sources = sourceMap(data.sources);
  const paint = () => {
    const rows = filterAndSort(data.plans, state());
    renderTable(rows, sources);
    renderCards(rows, sources);
    renderChart(rows);
  };

  for (const id of ["provider-filter", "sort-by", "coding-only", "measured-only"]) {
    document.getElementById(id).addEventListener("change", paint);
  }
  paint();
}

async function main() {
  try {
    const data = await loadData();
    document.getElementById("updated-label").textContent = `Data as of ${data.updatedAt}`;
    document.getElementById("methodology-text").textContent = data.methodology;
    renderHero(data.plans);
    renderProviderOptions(data.plans);
    renderSources(data.sources);
    wireControls(data);
  } catch (err) {
    document.getElementById("plans-body").innerHTML =
      `<tr><td colspan="7">Failed to load data: ${err.message}</td></tr>`;
    console.error(err);
  }
}

main();
