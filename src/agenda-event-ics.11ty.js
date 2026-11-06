// Un fichier .ics par événement : /agenda/<id>.ics
import { calendar } from "./_lib/ics.js";

export const data = {
  pagination: { data: "events", size: 1, alias: "ev" },
  permalink: (data) => `/agenda/${data.ev.id}.ics`,
  eleventyExcludeFromCollections: true,
};

export function render({ ev, site }) {
  return calendar([ev], site, ev.title);
}
