// Agenda complet au format iCalendar : /agenda.ics
import { calendar } from "./_lib/ics.js";

export const data = {
  permalink: "/agenda.ics",
  eleventyExcludeFromCollections: true,
};

export function render({ events, site }) {
  return calendar(events, site);
}
