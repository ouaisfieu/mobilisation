// Configuration Eleventy — site « Mobilisation novembre 2026 »
// Principe : tout le HTML est généré au build (JAMstack), les liens internes
// sont réécrits en chemins RELATIFS. Le site fonctionne donc tel quel sous
// https://ouaisfieu.github.io/mobilisation/ comme sous n'importe quel sous-dossier.

import { readFileSync } from "node:fs";
import { charts } from "./src/_lib/charts.js";

const TZ = "Europe/Brussels";
const LOCALE = "fr-BE";

const fmt = (d, opts) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, ...opts }).format(new Date(d));

/** Chemin relatif vers la racine du site depuis une URL de page Eleventy. */
export function relRoot(url = "/") {
  const segs = url.split("/").filter(Boolean);
  const depth = url.endsWith("/") ? segs.length : Math.max(segs.length - 1, 0);
  return depth === 0 ? "./" : "../".repeat(depth);
}

const slug = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function (eleventyConfig) {
  // ——— Fichiers statiques ———
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/static": "/" });
  eleventyConfig.addWatchTarget("src/assets/");
  eleventyConfig.addWatchTarget("src/_lib/");

  // ——— Données des sources (registre central) ———
  const sources = JSON.parse(readFileSync("src/_data/sources.json", "utf8"));

  // ——— Filtres de dates (heure de Bruxelles) ———
  eleventyConfig.addFilter("dateLong", (d) =>
    fmt(d, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  );
  eleventyConfig.addFilter("dateShort", (d) =>
    fmt(d, { day: "numeric", month: "long", year: "numeric" })
  );
  eleventyConfig.addFilter("dateNum", (d) =>
    fmt(d, { day: "2-digit", month: "2-digit", year: "numeric" })
  );
  eleventyConfig.addFilter("dayMonth", (d) => fmt(d, { day: "numeric", month: "long" }));
  eleventyConfig.addFilter("weekday", (d) => fmt(d, { weekday: "long" }));
  eleventyConfig.addFilter("dayNum", (d) => fmt(d, { day: "numeric" }));
  eleventyConfig.addFilter("monthShort", (d) => fmt(d, { month: "short" }).replace(".", ""));
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString());
  eleventyConfig.addFilter("ymd", (d) => new Date(d).toISOString().slice(0, 10));

  // ——— Nombres ———
  eleventyConfig.addFilter("num", (n, digits = 0) =>
    new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(Number(n))
  );
  eleventyConfig.addFilter("eur", (n, digits = 0) =>
    new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(Number(n))
  );

  // ——— Utilitaires ———
  eleventyConfig.addFilter("relRoot", relRoot);
  eleventyConfig.addFilter("urlPath", (u) => new URL(u).pathname);
  eleventyConfig.addFilter("pad2", (n) => String(n).padStart(2, "0"));
  eleventyConfig.addFilter("slug", slug);
  eleventyConfig.addFilter("absUrl", (path, base) => new URL(String(path).replace(/^\//, ""), base).href);
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));
  eleventyConfig.addFilter("where", (arr, key, val) => (arr || []).filter((x) => x[key] === val));
  eleventyConfig.addFilter("whereNot", (arr, key, val) => (arr || []).filter((x) => x[key] !== val));
  eleventyConfig.addFilter("sortBy", (arr, key, dir = "asc") =>
    [...(arr || [])].sort((a, b) => {
      const r = a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0;
      return dir === "desc" ? -r : r;
    })
  );
  eleventyConfig.addFilter("indexOfUrl", (arr, url) => (arr || []).findIndex((x) => x.url === url));
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("sumBy", (arr, key) => (arr || []).reduce((s, x) => s + Number(x[key] || 0), 0));
  eleventyConfig.addFilter("readingTime", (content) => {
    const words = String(content || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  });
  eleventyConfig.addFilter("source", (id) => sources[id]);
  // Sommaire : extrait les <h2 id="…"> du contenu rendu
  eleventyConfig.addFilter("toc", (html) => {
    const out = [];
    const re = /<h2[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g;
    let m;
    while ((m = re.exec(String(html || "")))) out.push({ id: m[1], text: m[2].replace(/<[^>]+>/g, "").trim() });
    return out;
  });
  // Points du graphique « combien étions-nous ? » à partir de actions.json
  eleventyConfig.addFilter("manifPoints", (actions) =>
    [...(actions || [])]
      .filter((a) => a.type === "manif" && a.police && a.chart !== false)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((a) => ({
        label: fmt(a.date, { day: "numeric", month: "short", year: "numeric" }),
        sub: a.title,
        a: a.police,
        b: a.orgs,
      }))
  );
  eleventyConfig.addFilter("stripTags", (s) => String(s || "").replace(/<[^>]+>/g, ""));
  eleventyConfig.addFilter("escapeXml", (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
  );
  eleventyConfig.addFilter("icsText", (s) =>
    String(s || "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;")
  );
  eleventyConfig.addFilter("icsDate", (d) =>
    new Date(d).toISOString().slice(0, 10).replace(/-/g, "")
  );
  eleventyConfig.addFilter("icsNextDay", (d) => {
    const x = new Date(new Date(d).toISOString().slice(0, 10) + "T12:00:00Z");
    x.setUTCDate(x.getUTCDate() + 1);
    return x.toISOString().slice(0, 10).replace(/-/g, "");
  });

  // ——— Shortcodes ———
  // Lien vers une source : {% src "id" %}
  eleventyConfig.addShortcode("src", (id, label) => {
    const s = sources[id];
    if (!s) throw new Error(`Source inconnue : ${id}`);
    const txt = label || `${s.publisher}${s.date ? ", " + fmt(s.date, { day: "numeric", month: "short", year: "numeric" }) : ""}`;
    return `<a class="src" href="${s.url}" rel="noopener" target="_blank" title="${s.title.replace(/"/g, "&quot;")}">${txt}</a>`;
  });
  // Plusieurs sources : {% srcs "a,b,c" %}
  eleventyConfig.addShortcode("srcs", (ids) => {
    const list = String(ids).split(",").map((x) => x.trim()).filter(Boolean);
    return `<span class="srcs">Sources : ${list
      .map((id) => {
        const s = sources[id];
        if (!s) throw new Error(`Source inconnue : ${id}`);
        return `<a class="src" href="${s.url}" rel="noopener" target="_blank" title="${s.title.replace(/"/g, "&quot;")}">${s.publisher}</a>`;
      })
      .join(", ")}</span>`;
  });
  eleventyConfig.addShortcode("year", () => String(new Date().getFullYear()));

  // Graphiques SVG générés au build (aucune bibliothèque côté client)
  for (const [name, fn] of Object.entries(charts)) {
    eleventyConfig.addShortcode(name, fn);
  }

  // Icônes SVG inline
  const icons = JSON.parse(readFileSync("src/_data/icons.json", "utf8"));
  eleventyConfig.addShortcode("icon", (name, cls = "") => {
    const p = icons[name];
    if (!p) throw new Error(`Icône inconnue : ${name}`);
    return `<svg class="icon ${cls}" aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  });

  // Encadré : {% callout "titre" %}...{% endcallout %}
  eleventyConfig.addPairedShortcode("callout", (content, title = "", kind = "info") =>
    `<aside class="callout callout--${kind}">${title ? `<p class="callout__title">${title}</p>` : ""}${content}</aside>`
  );

  // ——— Markdown : ancres automatiques sur les titres ———
  eleventyConfig.amendLibrary("md", (md) => {
    md.set({ typographer: true, quotes: "«  »‹  ›" });
    md.core.ruler.push("heading_ids", (state) => {
      const seen = new Map();
      const tokens = state.tokens;
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.type !== "heading_open" || !["h2", "h3"].includes(t.tag)) continue;
        if (t.attrGet("id")) continue;
        const text = tokens[i + 1]?.children?.map((c) => c.content).join("") || "";
        let id = slug(text) || "section";
        const n = seen.get(id) || 0;
        seen.set(id, n + 1);
        if (n) id = `${id}-${n + 1}`;
        t.attrSet("id", id);
      }
    });
  });

  // ——— Collections ———
  eleventyConfig.addCollection("analyses", (api) =>
    api.getFilteredByGlob("src/analyses/*.md").sort((a, b) => (a.data.order || 99) - (b.data.order || 99))
  );
  eleventyConfig.addCollection("sitemap", (api) =>
    api.getAll().filter((p) => p.url && p.url.endsWith("/") && !p.data.excludeFromSitemap)
  );

  // ——— Transformation : typographie française (espaces insécables) ———
  const fixText = (t) => {
    let s = t
      .replace(/« /g, "«\u00a0")
      .replace(/ »/g, "\u00a0»")
      .replace(/(\S) ([:;!?%€])/g, "$1\u00a0$2");
    for (let k = 0; k < 2; k++) s = s.replace(/(\d) (\d{3})(?!\d)/g, "$1\u00a0$2");
    return s.replace(/\u202f/g, "\u00a0");
  };
  eleventyConfig.addTransform("typo-fr", function (content) {
    const out = this.page.outputPath || "";
    if (!out.endsWith(".html") || /^\/(nl|en)\//.test(this.page.url)) return content;
    const parts = content.split(/(<(script|style|pre|code|textarea)\b[\s\S]*?<\/\2>)/i);
    let html = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i % 3 === 1) { html += part; continue; } // bloc protégé
      if (i % 3 === 2) continue; // nom de balise capturé
      html += part.replace(/>([^<]+)</g, (_m, text) => ">" + fixText(text) + "<");
    }
    return html;
  });

  // ——— Transformation : liens internes absolus → relatifs ———
  eleventyConfig.addTransform("liens-relatifs", function (content) {
    const out = this.page.outputPath || "";
    if (!out.endsWith(".html")) return content;
    const root = relRoot(this.page.url);
    return content.replace(
      /(\s(?:href|src|action|poster|data-src|data-href|data-json|data-base))="\/(?!\/)([^"]*)"/g,
      (_m, attr, rest) => `${attr}="${root}${rest}"`
    );
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "md", "11ty.js"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
