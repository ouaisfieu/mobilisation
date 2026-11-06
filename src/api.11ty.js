// API statique (JSON) générée au build : /api/<nom>.json
// Réutilisable par d'autres sites, bots ou applications (licence CC BY-SA 4.0).

const ENDPOINTS = {
  events: { key: "events", desc: "Rendez-vous à venir (agenda)" },
  actions: { key: "actions", desc: "Chronologie des actions contre la politique du gouvernement fédéral depuis 2025" },
  timeline: { key: "timeline", desc: "Frise historique des luttes sociales (Belgique et monde)" },
  news: { key: "news", desc: "Actualités datées de la mobilisation" },
  alternatives: { key: "alternatives", desc: "Les 21,2 milliards d'alternatives budgétaires du front commun" },
  faq: { key: "faq", desc: "Questions fréquentes" },
  sources: { key: "sources", desc: "Registre de toutes les sources citées" },
};

export const data = {
  pagination: { data: "apiList", size: 1, alias: "ep" },
  apiList: [...Object.keys(ENDPOINTS), "index"],
  permalink: (data) => `/api/${data.ep}.json`,
  eleventyExcludeFromCollections: true,
};

export function render(data) {
  const { ep, site } = data;
  const meta = {
    source: site.url,
    licence: "CC BY-SA 4.0",
    generated: site.buildTime,
    updated: site.updated,
  };
  if (ep === "index") {
    return JSON.stringify(
      {
        ...meta,
        endpoints: Object.entries(ENDPOINTS).map(([name, e]) => ({
          name,
          description: e.desc,
          url: new URL(`api/${name}.json`, site.url).href,
        })),
        calendar: new URL("agenda.ics", site.url).href,
        feed: new URL("feed.xml", site.url).href,
      },
      null,
      2
    );
  }
  return JSON.stringify({ ...meta, data: data[ENDPOINTS[ep].key] }, null, 2);
}
