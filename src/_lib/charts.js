// Graphiques générés au build, en HTML/CSS + SVG minimal.
// Règles suivies : barres fines (≤ 24 px), extrémité arrondie côté donnée,
// libellés en encre (jamais en couleur de série), légende dès 2 séries,
// et une vue tableau pour chaque graphique (accessibilité).

const LOCALE = "fr-BE";

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const nf = (n, d = 0) =>
  new Intl.NumberFormat(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d }).format(n).replace(/\u202f/g, "\u00a0");

/** Formate une valeur selon une unité déclarée. */
function fmtVal(v, unit, decimals) {
  if (v === null || v === undefined || v === "") return "—";
  switch (unit) {
    case "meur": // millions d'euros
      return v >= 1000 ? `${nf(v / 1000, 1)} Md€` : `${nf(v, 0)} M€`;
    case "pct":
      return `${nf(v, decimals ?? 1)} %`;
    case "pers":
      return nf(v, 0);
    default:
      return nf(v, decimals ?? 0);
  }
}

function tableView(headers, rows, caption) {
  return `<details class="chart__table"><summary>Voir les données sous forme de tableau</summary>
<div class="table-wrap"><table><caption class="sr-only">${esc(caption)}</caption><thead><tr>${headers
    .map((h) => `<th scope="col">${esc(h)}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join("")}</tr>`)
    .join("")}</tbody></table></div></details>`;
}

function frame({ id, title, subtitle, body, legend = "", table = "", source = "" }) {
  return `<figure class="chart"${id ? ` id="${esc(id)}"` : ""}>
<figcaption class="chart__head"><span class="chart__title">${esc(title)}</span>${
    subtitle ? `<span class="chart__sub">${esc(subtitle)}</span>` : ""
  }</figcaption>
${legend}
<div class="chart__plot">${body}</div>
${table}
${source ? `<p class="chart__source">${source}</p>` : ""}
</figure>`;
}

/**
 * Barres horizontales classées (une seule série → une seule couleur).
 * items : [{ label, value, note }]
 */
function barH(items, opts = {}) {
  const { title = "", subtitle = "", unit = "", decimals, source = "", id = "", sort = true, total = false } = opts;
  const data = sort ? [...items].sort((a, b) => b.value - a.value) : [...items];
  const max = Math.max(...data.map((d) => d.value));
  const rows = data
    .map((d) => {
      const w = (d.value / max) * 100;
      const val = fmtVal(d.value, unit, decimals);
      return `<li class="hbar__row">
<span class="hbar__label">${esc(d.label)}${d.note ? `<small>${esc(d.note)}</small>` : ""}</span>
<span class="hbar__track"><span class="hbar__bar" style="--w:${w.toFixed(2)}%" tabindex="0" data-tip="${esc(d.label)} : ${esc(val)}"></span><span class="hbar__val" style="--w:${w.toFixed(2)}%">${esc(val)}</span></span>
</li>`;
    })
    .join("");
  const sum = data.reduce((s, d) => s + d.value, 0);
  const body = `<ol class="hbar" aria-label="${esc(title)}">${rows}</ol>${
    total ? `<p class="hbar__total">Total : <strong>${esc(fmtVal(sum, unit, decimals))}</strong></p>` : ""
  }`;
  const table = tableView(
    ["Mesure", "Montant"],
    data.map((d) => [d.label, fmtVal(d.value, unit, decimals)]).concat(total ? [["Total", fmtVal(sum, unit, decimals)]] : []),
    title
  );
  return frame({ id, title, subtitle, body, table, source });
}

/**
 * « Haltères » : deux estimations par ligne (ex. police / organisateurs).
 * items : [{ label, sub, a, b }]  — a = série discrète (gris), b = série accent.
 */
function dumbbell(items, opts = {}) {
  const { title = "", subtitle = "", aLabel = "A", bLabel = "B", max: maxOpt, ticks = [], source = "", id = "" } = opts;
  const max = maxOpt || Math.max(...items.map((d) => Math.max(d.a || 0, d.b || 0)));
  const pct = (v) => ((v / max) * 100).toFixed(2);
  const legend = `<ul class="chart__legend" aria-label="Légende">
<li><span class="key key--dot key--a" aria-hidden="true"></span>${esc(aLabel)}</li>
<li><span class="key key--dot key--b" aria-hidden="true"></span>${esc(bLabel)}</li></ul>`;
  const axis = `<div class="db__axis" aria-hidden="true">${ticks
    .map((t) => `<span style="--x:${pct(t)}%">${t >= 1000 ? nf(t / 1000, 0) + " k" : nf(t)}</span>`)
    .join("")}</div>`;
  const rows = items
    .map((d) => {
      const hasB = d.b !== null && d.b !== undefined;
      const lo = hasB ? Math.min(d.a, d.b) : d.a;
      const hi = hasB ? Math.max(d.a, d.b) : d.a;
      return `<li class="db__row">
<span class="db__label"><strong>${esc(d.label)}</strong>${d.sub ? `<small>${esc(d.sub)}</small>` : ""}</span>
<span class="db__track">${ticks.map((t) => `<i class="db__grid" style="--x:${pct(t)}%"></i>`).join("")}
${hasB ? `<span class="db__range" style="--x1:${pct(lo)}%;--x2:${pct(hi)}%"></span>` : ""}
<span class="db__dot db__dot--a" style="--x:${pct(d.a)}%" tabindex="0" data-tip="${esc(d.label)} — ${esc(aLabel)} : ${nf(d.a)}"></span>
${hasB ? `<span class="db__dot db__dot--b" style="--x:${pct(d.b)}%" tabindex="0" data-tip="${esc(d.label)} — ${esc(bLabel)} : ${nf(d.b)}"></span>` : ""}
</span>
<span class="db__vals"><span>${nf(d.a)}</span>${hasB ? `<span class="db__sep">→</span><span>${nf(d.b)}</span>` : `<span class="db__na">n.c.</span>`}</span>
</li>`;
    })
    .join("");
  const body = `${axis}<ol class="db" aria-label="${esc(title)}">${rows}</ol>`;
  const table = tableView(
    ["Date", aLabel, bLabel],
    items.map((d) => [`${d.label}${d.sub ? " — " + d.sub : ""}`, nf(d.a), d.b == null ? "non communiqué" : nf(d.b)]),
    title
  );
  return frame({ id, title, subtitle, body, legend, table, source });
}

/**
 * Barre segmentée haute (une partie d'un tout, ≤ 6 parts).
 * parts : [{ label, value, tone }] — tone : classe de couleur (r1, r2, r3, c1, c2, c3…)
 */
function segBar(parts, opts = {}) {
  const { title = "", subtitle = "", unit = "pct", decimals = 1, source = "", id = "", minLabel = 11 } = opts;
  const total = parts.reduce((s, p) => s + p.value, 0);
  const blocks = parts
    .map((p) => {
      const share = (p.value / total) * 100;
      const val = fmtVal(p.value, unit, decimals);
      return `<span class="seg__block seg--${esc(p.tone)}" style="--w:${share.toFixed(3)}%" tabindex="0" data-tip="${esc(p.label)} : ${esc(val)}">${
        share >= minLabel ? `<span class="seg__txt">${esc(val)}</span>` : ""
      }</span>`;
    })
    .join("");
  const legend = `<ul class="chart__legend" aria-label="Légende">${parts
    .map((p) => `<li><span class="key key--sq seg--${esc(p.tone)}" aria-hidden="true"></span>${esc(p.label)}</li>`)
    .join("")}</ul>`;
  const body = `<div class="seg" role="img" aria-label="${esc(
    title + " : " + parts.map((p) => `${p.label} ${fmtVal(p.value, unit, decimals)}`).join(", ")
  )}">${blocks}</div>`;
  const table = tableView(["Groupe", "Part"], parts.map((p) => [p.label, fmtVal(p.value, unit, decimals)]), title);
  return frame({ id, title, subtitle, body: body + legend, table, source });
}

/**
 * Tuile chiffre + mini-courbe (série unique dans le temps).
 * points : [{ x, y }]
 */
function sparkTile(points, opts = {}) {
  const { label = "", unit = "pct", decimals = 2, note = "", source = "", id = "" } = opts;
  const W = 240, H = 64, P = 6;
  const ys = points.map((p) => p.y);
  const min = Math.min(...ys), max = Math.max(...ys);
  const span = max - min || 1;
  const X = (i) => P + (i * (W - 2 * P)) / (points.length - 1);
  const Y = (v) => H - P - ((v - min) / span) * (H - 2 * P);
  const path = points.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join(" ");
  const area = `${path} L${X(points.length - 1).toFixed(1)},${H - P} L${X(0).toFixed(1)},${H - P} Z`;
  const last = points[points.length - 1];
  const dots = points
    .map(
      (p, i) =>
        `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${i === points.length - 1 ? 5 : 3.5}" class="spark__dot${
          i === points.length - 1 ? " spark__dot--last" : ""
        }" tabindex="0" data-tip="${esc(p.x)} : ${esc(fmtVal(p.y, unit, decimals))}"><title>${esc(p.x)} : ${esc(
          fmtVal(p.y, unit, decimals)
        )}</title></circle>`
    )
    .join("");
  const svg = `<svg class="spark" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(
    label + " : " + points.map((p) => `${p.x} ${fmtVal(p.y, unit, decimals)}`).join(", ")
  )}"><path class="spark__area" d="${area}"/><path class="spark__line" d="${path}"/>${dots}</svg>`;
  const table = tableView(["Mois", label], points.map((p) => [p.x, fmtVal(p.y, unit, decimals)]), label);
  return `<figure class="tile"${id ? ` id="${esc(id)}"` : ""}>
<figcaption class="tile__label">${esc(label)}</figcaption>
<p class="tile__value">${esc(fmtVal(last.y, unit, decimals))}</p>
${note ? `<p class="tile__note">${note}</p>` : ""}
<div class="tile__spark">${svg}<div class="spark__axis" aria-hidden="true"><span>${esc(points[0].x)}</span><span>${esc(last.x)}</span></div></div>
${table}
${source ? `<p class="chart__source">${source}</p>` : ""}
</figure>`;
}

export const charts = { barH, dumbbell, segBar, sparkTile };
