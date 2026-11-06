// Génération de fichiers iCalendar (RFC 5545) : CRLF + lignes pliées à 75 octets.

const esc = (s) =>
  String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

function fold(line) {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const out = [];
  let cur = "";
  let curBytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch, "utf8");
    const limit = out.length === 0 ? 75 : 74; // la ligne de continuation commence par un espace
    if (curBytes + b > limit) {
      out.push(cur);
      cur = "";
      curBytes = 0;
    }
    cur += ch;
    curBytes += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}

const ymd = (d) => String(d).slice(0, 10).replace(/-/g, "");
function nextDay(d) {
  const x = new Date(String(d).slice(0, 10) + "T12:00:00Z");
  x.setUTCDate(x.getUTCDate() + 1);
  return x.toISOString().slice(0, 10).replace(/-/g, "");
}
const stamp = (d = new Date()) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function vevent(ev, site) {
  const url = new URL(`agenda/#${ev.id}`, site.url).href;
  const desc = [ev.summary, ev.practical ? `Infos pratiques : ${ev.practical}` : "", `Organisation : ${ev.organizers}`, `Plus d'infos : ${url}`]
    .filter(Boolean)
    .join("\n\n");
  return [
    "BEGIN:VEVENT",
    `UID:${ev.id}@${new URL(site.url).host}`,
    `DTSTAMP:${stamp()}`,
    `DTSTART;VALUE=DATE:${ymd(ev.date)}`,
    `DTEND;VALUE=DATE:${nextDay(ev.date)}`,
    `SUMMARY:${esc(ev.title + " — " + ev.place)}`,
    `LOCATION:${esc(ev.place + ", Belgique")}`,
    `DESCRIPTION:${esc(desc)}`,
    `URL:${url}`,
    `CATEGORIES:${esc(ev.kind)}`,
    "STATUS:CONFIRMED",
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
  ];
}

export function calendar(events, site, name = "Mobilisation · novembre 2026") {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mobilisation novembre 2026//Agenda citoyen//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(name)}`,
    "X-WR-TIMEZONE:Europe/Brussels",
    "X-PUBLISHED-TTL:PT6H",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    ...events.flatMap((ev) => vevent(ev, site)),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
