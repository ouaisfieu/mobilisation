#!/usr/bin/env node
/*
 * Génère les visuels du site : icônes, images de partage (Open Graph),
 * affiches, tract, pancartes (PDF) et visuels pour les réseaux sociaux (PNG).
 *
 * Outil de développement, à lancer seulement si tu modifies les visuels :
 *   npm i -D playwright qrcode && npx playwright install chromium
 *   node scripts/make-visuals.cjs
 * Les fichiers générés sont versionnés dans src/assets : le site n'a pas
 * besoin de ce script pour être construit.
 */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
let QR = null;
try { QR = require("qrcode"); } catch (e) { console.warn("qrcode non installé : affiches sans QR code."); }

const ROOT = path.resolve(__dirname, "..");
const FONTS = path.join(ROOT, "src/assets/fonts");
const OUT_IMG = path.join(ROOT, "src/assets/img");
const OUT_OG = path.join(ROOT, "src/assets/og");
const OUT_KIT = path.join(ROOT, "src/assets/kit");
for (const d of [OUT_IMG, OUT_OG, OUT_KIT]) fs.mkdirSync(d, { recursive: true });

const SITE = process.env.SITE_URL || "https://ouaisfieu.github.io/mobilisation/";
const SITE_SHORT = SITE.replace(/^https?:\/\//, "").replace(/\/$/, "");

const b64 = (f) => fs.readFileSync(path.join(FONTS, f)).toString("base64");
const FONT_CSS = `
@font-face{font-family:"Archivo";src:url(data:font/woff2;base64,${b64("archivo-var.woff2")}) format("woff2");font-weight:100 900;font-stretch:62% 125%}
@font-face{font-family:"Atkinson";src:url(data:font/woff2;base64,${b64("atkinson-next-var.woff2")}) format("woff2");font-weight:200 800}
@font-face{font-family:"Plex";src:url(data:font/woff2;base64,${b64("plex-mono-500.woff2")}) format("woff2");font-weight:500}
`;

const BASE_CSS = `
${FONT_CSS}
:root{--paper:#f4efe6;--paper2:#ebe3d4;--ink:#16130f;--muted:#5d564b;--red:#d1281a;--hot:#ff4f30;--r:#d6261c;--g:#12893f;--b:#1c5fc9}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:transparent}
body{font-family:"Atkinson",system-ui,sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased}
.d{font-family:"Archivo";font-weight:900;font-stretch:62%;line-height:.84;text-transform:uppercase;letter-spacing:-.01em}
.mono{font-family:"Plex";text-transform:uppercase;letter-spacing:.08em}
.stripe{display:flex;width:100%}.stripe i{flex:1}.stripe i:nth-child(1){background:var(--r)}.stripe i:nth-child(2){background:var(--g)}.stripe i:nth-child(3){background:var(--b)}
.mark rect:nth-child(1){fill:var(--r)}.mark rect:nth-child(2){fill:var(--g)}.mark rect:nth-child(3){fill:var(--b)}
`;

const MARK = `<svg class="mark" viewBox="0 0 32 32"><rect x="5" y="14" width="6" height="13" rx="1.5"/><rect x="13" y="9" width="6" height="18" rx="1.5"/><rect x="21" y="4" width="6" height="23" rx="1.5"/></svg>`;
const STRIPE = `<div class="stripe"><i></i><i></i><i></i></div>`;

async function qr(url, dark = "#16130f") {
  if (!QR) return "";
  return QR.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark, light: "#0000" } });
}

const doc = (css, body, extra = "") => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${BASE_CSS}${css}</style>${extra}</head><body>${body}</body></html>`;

/* ===================== Icônes ===================== */
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#16130f"/><rect x="6" y="15" width="5.5" height="12" rx="1.4" fill="#ff4f30"/><rect x="13.25" y="10" width="5.5" height="17" rx="1.4" fill="#22b35a"/><rect x="20.5" y="5" width="5.5" height="22" rx="1.4" fill="#4d8dff"/></svg>`;
const MASKABLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#16130f"/><g transform="translate(6.4 6.4) scale(.6)"><rect x="6" y="15" width="5.5" height="12" rx="1.4" fill="#ff4f30"/><rect x="13.25" y="10" width="5.5" height="17" rx="1.4" fill="#22b35a"/><rect x="20.5" y="5" width="5.5" height="22" rx="1.4" fill="#4d8dff"/></g></svg>`;

/* ===================== Images de partage 1200×630 ===================== */
const OG_CSS = `
.og{width:1200px;height:630px;display:grid;grid-template-columns:1fr 430px;background:var(--paper);position:relative;overflow:hidden}
.og .l{padding:56px 40px 0 64px;display:flex;flex-direction:column}
.og .kick{font-size:20px;color:var(--red);margin-bottom:22px}
.og h1{font-family:"Archivo";font-weight:900;font-stretch:66%;font-size:92px;line-height:.9;text-transform:none;letter-spacing:-.01em}
.og h1 em{font-style:normal;background:linear-gradient(180deg,transparent 56%,rgba(209,40,26,.25) 56%,rgba(209,40,26,.25) 92%,transparent 92%)}
.og .sub{margin-top:22px;font-size:27px;line-height:1.3;color:var(--muted);max-width:640px}
.og .foot{margin-top:auto;padding-bottom:40px;display:flex;align-items:center;gap:14px;font-size:21px}
.og .foot svg{width:40px;height:40px}
.og .foot b{font-family:"Archivo";font-weight:850;font-stretch:72%;font-size:30px;text-transform:uppercase}
.og .r{background:var(--ink);color:var(--paper);display:flex;flex-direction:column;justify-content:center;padding:0 46px}
.og .r .day{font-size:44px;color:#ffb4a3;font-stretch:75%;font-weight:800}
.og .r .num{font-size:330px;color:var(--hot);margin:6px 0 0 -8px}
.og .r .month{font-size:76px;font-stretch:68%}
.og .r .city{font-size:46px;font-stretch:80%;font-weight:800;margin-top:10px}
.og .stripe{position:absolute;left:0;right:0;bottom:0;height:14px}
.og .figs{display:grid;grid-template-columns:1fr 1fr;gap:18px 26px;margin-top:26px}
.og .fig b{display:block;font-family:"Archivo";font-weight:900;font-stretch:68%;font-size:62px;line-height:.95;color:var(--red)}
.og .fig span{font-size:20px;color:var(--muted);line-height:1.25}
.og .years{display:flex;gap:16px;flex-wrap:wrap;margin-top:24px}
.og .years span{font-family:"Archivo";font-weight:900;font-stretch:65%;font-size:58px;color:var(--red);line-height:1}
.og .dates{display:flex;flex-direction:column;gap:16px}
.og .dates div{display:flex;align-items:baseline;gap:16px}
.og .dates b{font-family:"Archivo";font-weight:900;font-stretch:62%;font-size:120px;line-height:.85;color:var(--hot)}
.og .dates span{font-size:26px;line-height:1.15;color:var(--paper)}
`;

function ogPage({ kick, title, sub, right, extra = "" }) {
  return doc(
    OG_CSS,
    `<div class="og"><div class="l"><p class="mono kick">${kick}</p><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ""}${extra}
<div class="foot">${MARK}<b>Mobilisation</b><span>${SITE_SHORT}</span></div></div>
<div class="r">${right}</div>${STRIPE}</div>`
  );
}
const RIGHT_23 = `<p class="d day">Lundi</p><p class="d num">23</p><p class="d month">novembre</p><p class="d city">Bruxelles</p>`;

const OGS = {
  "og-default.png": ogPage({
    kick: "Manifestation nationale · front commun",
    title: "Lundi 23 novembre, <em>on remplit Bruxelles.</em>",
    sub: "Salaires, pensions, chômage, écoles : le budget se décide maintenant. CSC · FGTB · Synova.",
    right: RIGHT_23,
  }),
  "og-agenda.png": ogPage({
    kick: "Agenda de la mobilisation",
    title: "Trois dates, <em>un même combat.</em>",
    sub: "Enseignement le 17, services publics locaux à Namur le 18, manifestation nationale à Bruxelles le 23 novembre.",
    right: `<div class="dates"><div><b>17</b><span>Enseignement<br>et étudiant·es</span></div><div><b>18</b><span>Namur<br>pouvoirs locaux</span></div><div><b>23</b><span>Bruxelles<br>nationale</span></div></div>`,
  }),
  "og-enjeux.png": ogPage({
    kick: "Ce qui se joue",
    title: "Ton salaire, ta pension, <em>nos services.</em>",
    extra: `<div class="figs"><div class="fig"><b>5,26 %</b><span>d'inflation en octobre 2026</span></div><div class="fig"><b>−25 %</b><span>de pension : le malus, à vie</span></div><div class="fig"><b>168 063</b><span>personnes exclues du chômage</span></div><div class="fig"><b>4 000 €</b><span>au-delà : index raboté</span></div></div>`,
    right: RIGHT_23,
  }),
  "og-alternatives.png": ogPage({
    kick: "L'argent existe",
    title: "21,2 milliards <em>d'alternatives.</em>",
    sub: "Les syndicats ont chiffré comment assainir le budget sans toucher à nos salaires ni à nos pensions. Les 10 % les plus riches détiennent 54,9 % du patrimoine.",
    right: RIGHT_23,
  }),
  "og-histoire.png": ogPage({
    kick: "150 ans de luttes",
    title: "Ce que la rue a gagné, <em>la rue le défend.</em>",
    extra: `<div class="years"><span>1893</span><span>1921</span><span>1936</span><span>1944</span><span>1966</span></div><p class="sub">Droit de vote, 8 heures, congés payés, sécu, égalité salariale : rien n'a été offert.</p>`,
    right: RIGHT_23,
  }),
  "og-agir.png": ogPage({
    kick: "Rejoindre la mobilisation",
    title: "Tu as 5 minutes ? <em>Une heure ? Une journée ?</em>",
    sub: "Le guide pour convaincre tes collègues, t'organiser et venir à Bruxelles le 23 novembre.",
    right: RIGHT_23,
  }),
};

/* ===================== Supports imprimables (unité --u) ===================== */
const PRINT_CSS = `
@page{margin:0}
.sheet{width:calc(100*var(--u));height:calc(141.42*var(--u));background:var(--paper);position:relative;overflow:hidden;display:flex;flex-direction:column;padding:calc(7*var(--u)) calc(7*var(--u)) 0;page-break-after:always;break-after:page}
.sheet:last-child{page-break-after:auto;break-after:auto}
.sheet .stripe{position:absolute;left:0;right:0;bottom:0;height:calc(2.2*var(--u))}
.top{display:flex;justify-content:space-between;gap:calc(3*var(--u));font-size:calc(2.3*var(--u));color:var(--red);line-height:1.3}
.top .mark{width:calc(7*var(--u));height:calc(7*var(--u))}
.p23 .day{font-size:calc(8.5*var(--u));font-weight:800;font-stretch:75%;margin-top:calc(3*var(--u))}
.p23 .num{font-size:calc(57*var(--u));color:var(--red);margin:calc(1*var(--u)) 0 0 calc(-1.3*var(--u))}
.p23 .month{font-size:calc(17*var(--u));font-stretch:66%}
.p23 .city{font-size:calc(10.5*var(--u));font-stretch:76%;font-weight:850;margin-top:calc(1.5*var(--u))}
.claim{font-size:calc(3.1*var(--u));line-height:1.3;margin-top:calc(3*var(--u));max-width:calc(86*var(--u))}
.claim strong{font-weight:800}
.bottom{margin-top:auto;margin-bottom:calc(5.5*var(--u));display:flex;gap:calc(4*var(--u));align-items:center}
.qr{width:calc(15*var(--u));height:calc(15*var(--u));flex:none;background:#fff;padding:calc(1.2*var(--u));border-radius:calc(.8*var(--u))}
.qr svg{width:100%;height:100%;display:block}
.info .mono{font-size:calc(2*var(--u));color:var(--muted)}
.info .url{font-family:"Archivo";font-weight:850;font-stretch:78%;font-size:calc(4.6*var(--u));line-height:1.05;margin:calc(.6*var(--u)) 0}
.info .small{font-size:calc(1.9*var(--u));color:var(--muted);line-height:1.35}
.pq h1{font-family:"Archivo";font-weight:900;font-stretch:64%;font-size:calc(9.6*var(--u));line-height:.94;text-transform:uppercase;margin-top:calc(3*var(--u))}
.pq h1 em{font-style:normal;color:var(--red)}
.grid4{display:grid;grid-template-columns:1fr 1fr;gap:calc(3*var(--u)) calc(4*var(--u));margin-top:calc(4*var(--u))}
.grid4 b{display:block;font-family:"Archivo";font-weight:900;font-stretch:64%;font-size:calc(10*var(--u));line-height:.9;color:var(--red)}
.grid4 p{font-size:calc(2.6*var(--u));line-height:1.28;margin-top:calc(.8*var(--u))}
.when{margin-top:calc(4*var(--u));padding:calc(2.2*var(--u)) calc(3*var(--u));background:var(--ink);color:var(--paper);border-radius:calc(1*var(--u))}
.when b{font-family:"Archivo";font-weight:900;font-stretch:66%;font-size:calc(5.6*var(--u));text-transform:uppercase;line-height:1;display:block;white-space:nowrap}
.when span{font-size:calc(2.6*var(--u))}
.srcline{font-size:calc(1.6*var(--u));color:var(--muted);margin-top:calc(2*var(--u))}
.verso h2{font-family:"Archivo";font-weight:900;font-stretch:66%;font-size:calc(8*var(--u));text-transform:uppercase;line-height:.95;margin:calc(1*var(--u)) 0 calc(3*var(--u))}
.verso ol{list-style:none;display:grid;gap:calc(2.2*var(--u))}
.verso li{display:grid;grid-template-columns:calc(7*var(--u)) 1fr;gap:calc(2*var(--u));align-items:start}
.verso li b{font-family:"Archivo";font-weight:900;font-stretch:64%;font-size:calc(7*var(--u));color:var(--red);line-height:.9}
.verso li strong{display:block;font-family:"Archivo";font-weight:850;font-stretch:80%;font-size:calc(3.5*var(--u));text-transform:uppercase;line-height:1.05}
.verso li span{font-size:calc(2.6*var(--u));line-height:1.3}
.verso .rights{margin-top:calc(3.5*var(--u));padding:calc(2*var(--u)) calc(2.5*var(--u));background:var(--paper2);border-radius:calc(1*var(--u));font-size:calc(2.4*var(--u));line-height:1.35}
.verso .rights b{display:block;font-family:"Archivo";font-weight:850;font-stretch:80%;font-size:calc(3*var(--u));text-transform:uppercase;margin-bottom:calc(.5*var(--u))}
.verso .hist{margin-top:calc(4*var(--u));padding-top:calc(3*var(--u));border-top:calc(.3*var(--u)) solid var(--ink);font-size:calc(2.5*var(--u));line-height:1.35}
.verso .hist b{color:var(--red);font-family:"Archivo";font-weight:900;font-stretch:70%;font-size:calc(3.4*var(--u))}
.sign{justify-content:center}
.sign .txt{font-family:"Archivo";font-weight:900;font-stretch:62%;text-transform:uppercase;line-height:.95;letter-spacing:-.01em}
.sign .txt em{font-style:normal;color:var(--red)}
.sign .foot{position:absolute;left:calc(7*var(--u));right:calc(7*var(--u));bottom:calc(5*var(--u));display:flex;justify-content:space-between;font-size:calc(2.4*var(--u));color:var(--muted)}
`;

function poster23(qrSvg) {
  return `<section class="sheet p23">
<div class="top"><p class="mono">Manifestation nationale<br>en front commun</p>${MARK}</div>
<p class="d day">Lundi</p><p class="d num">23</p><p class="d month">novembre</p><p class="d city">Bruxelles</p>
<p class="claim">Salaires, pensions, chômage, écoles, services publics : <strong>le budget se décide maintenant. Pas sur notre dos.</strong></p>
<div class="bottom">${qrSvg ? `<div class="qr">${qrSvg}</div>` : ""}<div class="info"><p class="mono">Raisons, droits, agenda, départs</p><p class="url">${SITE_SHORT}</p><p class="small">À l'appel de la CSC, de la FGTB et de Synova. Heure et lieu de départ : sites des syndicats.<br>Affiche réalisée par un site citoyen indépendant.</p></div></div>
${STRIPE}</section>`;
}

function posterWhy(qrSvg) {
  return `<section class="sheet pq">
<div class="top"><p class="mono">Pourquoi on y va</p>${MARK}</div>
<h1>Le 23 novembre, <em>on va à Bruxelles</em> parce que…</h1>
<div class="grid4">
<div><b>5,26 %</b><p>d'inflation en octobre 2026. Et l'index est raboté pour les salaires au-dessus de 4 000 € brut.</p></div>
<div><b>−25 %</b><p>de pension, à vie : le malus pour un départ anticipé sans 35 années « pleines ».</p></div>
<div><b>168 063</b><p>personnes en fin de droits au chômage en février 2026.</p></div>
<div><b>21,2 Md€</b><p>d'alternatives chiffrées par les syndicats. L'argent existe : il est ailleurs.</p></div>
</div>
<div class="when"><b>Lundi 23 novembre · Bruxelles</b><span>Manifestation nationale en front commun — CSC · FGTB · Synova</span></div>
<div class="bottom">${qrSvg ? `<div class="qr">${qrSvg}</div>` : ""}<div class="info"><p class="mono">Tout comprendre, simuler, agir</p><p class="url">${SITE_SHORT}</p><p class="small">Sources : Statbel, CSC, ONEM, front commun syndical. Détail et liens sur le site.</p></div></div>
${STRIPE}</section>`;
}

function flyer(qrSvg) {
  const recto = `<section class="sheet p23">
<div class="top"><p class="mono">Manifestation nationale<br>en front commun</p>${MARK}</div>
<p class="d day">Lundi</p><p class="d num">23</p><p class="d month">novembre</p><p class="d city">Bruxelles</p>
<p class="claim"><strong>Ce que la rue a gagné, la rue le défend.</strong><br>CSC · FGTB · Synova appellent toute la société à les rejoindre.</p>
<div class="bottom">${qrSvg ? `<div class="qr">${qrSvg}</div>` : ""}<div class="info"><p class="mono">Infos et départs</p><p class="url">${SITE_SHORT}</p><p class="small">Tourne la page : 5 raisons d'y aller.</p></div></div>
${STRIPE}</section>`;
  const verso = `<section class="sheet verso">
<div class="top"><p class="mono">Lundi 23 novembre · Bruxelles</p>${MARK}</div>
<h2>5 raisons d'y aller</h2>
<ol>
<li><b>1</b><div><strong>Ton salaire</strong><span>Index raboté en 2026 et 2028 au-dessus de 4 000 € brut, gel complet d'un an mis sur la table. Inflation : 5,26 %.</span></div></li>
<li><b>2</b><div><strong>Ta pension</strong><span>Malus jusqu'à 25 % dès 2027 sans 35 années de 156 jours. Les temps partiels et les femmes en première ligne.</span></div></li>
<li><b>3</b><div><strong>Ton filet de sécurité</strong><span>Allocations de chômage limitées à deux ans : 168 063 personnes en fin de droits.</span></div></li>
<li><b>4</b><div><strong>Nos services publics</strong><span>Écoles, soins de santé, communes : moins de moyens, plus de pression.</span></div></li>
<li><b>5</b><div><strong>L'argent existe</strong><span>21,2 milliards d'alternatives chiffrées. Les 10 % les plus riches détiennent 54,9 % du patrimoine.</span></div></li>
</ol>
<p class="rights"><b>Tes droits</b> La grève est un droit pour tous, syndiqué·e ou non. Les affilié·es reçoivent une indemnité de grève. Arrestation administrative : 12 h maximum.</p>
<p class="hist">Ils l'ont gagné avant nous : <b>1893</b> le droit de vote · <b>1921</b> les 8 heures · <b>1936</b> les congés payés · <b>1944</b> la sécu. Par la grève.</p>
<p class="srcline">Sources détaillées sur ${SITE_SHORT} · Tract réalisé par un site citoyen indépendant · Ne pas jeter sur la voie publique.</p>
${STRIPE}</section>`;
  return recto + verso;
}

const SLOGANS = [
  { t: "Touche pas <em>à mon index</em>", s: 19 },
  { t: "Les épaules les plus larges, <em>c’est pas nous</em>", s: 15.5 },
  { t: "Nos pensions ne sont pas <em>un malus</em>", s: 17 },
  { t: "Taxez les fortunes, <em>pas les factures</em>", s: 16.5 },
  { t: "Ce que la rue a gagné, <em>la rue le défend</em>", s: 15.5 },
  { t: "1893<br>1936<br>1944<br><em>2026</em>", s: 25 },
];
function signs() {
  return SLOGANS.map((x) => `<section class="sheet sign"><p class="txt" style="font-size:calc(${x.s}*var(--u))">${x.t}</p><div class="foot"><span class="mono">23.11 · Bruxelles</span><span class="mono">Front commun</span></div>${STRIPE}</section>`).join("");
}

/* ===================== Réseaux sociaux ===================== */
const SOC_CSS = `
.soc{position:relative;overflow:hidden;display:flex;flex-direction:column}
.dark{background:var(--ink);color:var(--paper)}
.light{background:var(--paper);color:var(--ink)}
.soc .stripe{position:absolute;left:0;right:0;bottom:0}
.soc .kick{color:#ffb4a3}
.light .kick{color:var(--red)}
.soc .url{font-family:"Archivo";font-weight:850;font-stretch:78%}
.big{line-height:.96}.big em{font-style:normal;color:var(--red)}
.dark .big em{color:var(--hot)}
`;

function square23() {
  return `<div class="soc dark" style="width:1080px;height:1080px;padding:84px 84px 0">
<div style="display:flex;justify-content:space-between;align-items:flex-start"><p class="mono kick" style="font-size:28px;line-height:1.35">Manifestation nationale<br>en front commun</p><div style="width:76px;height:76px">${MARK}</div></div>
<p class="d" style="font-size:96px;font-weight:800;font-stretch:75%;color:#ffb4a3;margin-top:40px">Lundi</p>
<p class="d" style="font-size:470px;color:var(--hot);margin:4px 0 0 -14px">23</p>
<p class="d" style="font-size:150px;font-stretch:66%">novembre</p>
<p class="d" style="font-size:86px;font-stretch:78%;font-weight:850;margin-top:12px">Bruxelles</p>
<p style="margin-top:auto;margin-bottom:64px;font-size:34px"><span class="url" style="font-size:40px">${SITE_SHORT}</span><br><span style="color:#c7bdab">CSC · FGTB · Synova</span></p>
<div class="stripe" style="height:22px"><i></i><i></i><i></i></div></div>`;
}
function story23() {
  return `<div class="soc dark" style="width:1080px;height:1920px;padding:120px 90px 0">
<div style="display:flex;justify-content:space-between;align-items:flex-start"><p class="mono kick" style="font-size:32px;line-height:1.4">Manifestation nationale<br>en front commun</p><div style="width:90px;height:90px">${MARK}</div></div>
<p class="d" style="font-size:120px;font-weight:800;font-stretch:75%;color:#ffb4a3;margin-top:150px">Lundi</p>
<p class="d" style="font-size:640px;color:var(--hot);margin:10px 0 0 -20px">23</p>
<p class="d" style="font-size:190px;font-stretch:64%">novembre</p>
<p class="d" style="font-size:120px;font-stretch:78%;font-weight:850;margin-top:20px">Bruxelles</p>
<p style="font-size:46px;line-height:1.3;margin-top:90px;max-width:860px">Salaires, pensions, chômage, écoles : <strong>le budget se décide maintenant.</strong></p>
<p style="margin-top:auto;margin-bottom:140px;font-size:38px"><span class="url" style="font-size:50px">${SITE_SHORT}</span><br><span style="color:#c7bdab">CSC · FGTB · Synova</span></p>
<div class="stripe" style="height:28px"><i></i><i></i><i></i></div></div>`;
}
function squareMsg({ kick, big, size, text }) {
  return `<div class="soc light" style="width:1080px;height:1080px;padding:90px 90px 0">
<div style="display:flex;justify-content:space-between;align-items:flex-start"><p class="mono kick" style="font-size:28px">${kick}</p><div style="width:76px;height:76px">${MARK}</div></div>
<p class="d big" style="font-size:${size}px;margin-top:70px">${big}</p>
<p style="font-size:42px;line-height:1.3;margin-top:44px;max-width:880px">${text}</p>
<div style="margin-top:auto;margin-bottom:70px;display:flex;justify-content:space-between;align-items:flex-end;gap:30px">
<p class="d" style="font-size:52px;font-stretch:70%;background:var(--ink);color:var(--paper);padding:14px 22px 10px;border-radius:10px;white-space:nowrap">Lundi 23.11 · Bruxelles</p>
<p class="url" style="font-size:30px;text-align:right">${SITE_SHORT}</p></div>
<div class="stripe" style="height:22px"><i></i><i></i><i></i></div></div>`;
}
function banner() {
  return `<div class="soc dark" style="width:1500px;height:500px;padding:56px 70px 0;flex-direction:row;align-items:center;gap:60px">
<p class="d" style="font-size:360px;color:var(--hot);margin-top:20px">23</p>
<div><p class="mono kick" style="font-size:24px">Lundi · manifestation nationale en front commun</p>
<p class="d" style="font-size:118px;font-stretch:64%;margin-top:14px">Novembre · Bruxelles</p>
<p style="font-size:34px;margin-top:22px;color:#e9e2d4">Ce que la rue a gagné, la rue le défend.</p>
<p class="url" style="font-size:30px;margin-top:18px;color:#ffb4a3">${SITE_SHORT}</p></div>
<div class="stripe" style="height:18px"><i></i><i></i><i></i></div></div>`;
}

/* ===================== Rendu ===================== */
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  async function shot(html, file, w, h) {
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width: w, height: h }, omitBackground: false });
    console.log("✓", path.relative(ROOT, file));
  }
  async function pdf(html, file, format) {
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: file, format, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, preferCSSPageSize: true });
    console.log("✓", path.relative(ROOT, file));
  }
  const U = { A3: "2.97mm", A4: "2.1mm", A5: "1.48mm", PNG: "8.4px" };
  const printDoc = (u, size, body) => doc(PRINT_CSS + `:root{--u:${u}}@page{size:${size}}`, body);

  // Icônes
  fs.writeFileSync(path.join(OUT_IMG, "favicon.svg"), FAVICON_SVG);
  console.log("✓ src/assets/img/favicon.svg");
  const iconHtml = (svg, s) => `<!doctype html><html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg width="${s}" height="${s}" `)}</body></html>`;
  for (const [name, s, svg] of [["favicon-32.png", 32, FAVICON_SVG], ["apple-touch-icon.png", 180, MASKABLE_SVG], ["icon-192.png", 192, FAVICON_SVG], ["icon-512.png", 512, FAVICON_SVG], ["icon-maskable-512.png", 512, MASKABLE_SVG]]) {
    await page.setViewportSize({ width: s, height: s });
    await page.setContent(iconHtml(svg, s));
    await page.screenshot({ path: path.join(OUT_IMG, name), clip: { x: 0, y: 0, width: s, height: s }, omitBackground: true });
    console.log("✓ src/assets/img/" + name);
  }

  // Images de partage
  for (const [file, html] of Object.entries(OGS)) await shot(html, path.join(OUT_OG, file), 1200, 630);

  // Supports imprimables
  const qrHome = await qr(SITE);
  await pdf(printDoc(U.A3, "A3", poster23(qrHome)), path.join(OUT_KIT, "affiche-23-novembre-A3.pdf"), "A3");
  await pdf(printDoc(U.A4, "A4", poster23(qrHome)), path.join(OUT_KIT, "affiche-23-novembre-A4.pdf"), "A4");
  await pdf(printDoc(U.A4, "A4", posterWhy(qrHome)), path.join(OUT_KIT, "affiche-pourquoi-A4.pdf"), "A4");
  await pdf(printDoc(U.A5, "A5", flyer(qrHome)), path.join(OUT_KIT, "tract-A5.pdf"), "A5");
  await pdf(printDoc(U.A3, "A3", signs()), path.join(OUT_KIT, "pancartes-A3.pdf"), "A3");
  // Aperçus
  await shot(printDoc(U.PNG, "auto", poster23(qrHome)), path.join(OUT_KIT, "affiche-23-novembre.png"), 840, 1188);
  await shot(printDoc(U.PNG, "auto", posterWhy(qrHome)), path.join(OUT_KIT, "affiche-pourquoi.png"), 840, 1188);
  await shot(printDoc(U.PNG, "auto", flyer(qrHome)), path.join(OUT_KIT, "tract-A5.png"), 840, 1188);
  await shot(printDoc(U.PNG, "auto", signs()), path.join(OUT_KIT, "pancartes.png"), 840, 1188);

  // Réseaux sociaux
  const soc = (body) => doc(SOC_CSS, body);
  await shot(soc(square23()), path.join(OUT_KIT, "visuel-carre-23-novembre.png"), 1080, 1080);
  await shot(soc(story23()), path.join(OUT_KIT, "visuel-story-23-novembre.png"), 1080, 1920);
  await shot(soc(squareMsg({ kick: "Salaires · indexation", big: "Touche pas <em>à mon index</em>", size: 190, text: "Inflation à 5,26 % en octobre. Et l’indexation est rabotée au-dessus de 4 000 € brut, avec un gel complet mis sur la table." })), path.join(OUT_KIT, "visuel-index.png"), 1080, 1080);
  await shot(soc(squareMsg({ kick: "Réforme des pensions", big: "Jusqu'à <em>−25 %</em>", size: 230, text: "de pension, à vie : c'est le malus pour un départ anticipé. Les temps partiels et les femmes en première ligne." })), path.join(OUT_KIT, "visuel-pension.png"), 1080, 1080);
  await shot(soc(squareMsg({ kick: "Les alternatives", big: "21,2 <em>milliards</em>", size: 230, text: "d'alternatives chiffrées par les syndicats. L'argent existe : il est juste ailleurs." })), path.join(OUT_KIT, "visuel-alternatives.png"), 1080, 1080);
  await shot(soc(banner()), path.join(OUT_KIT, "banniere-23-novembre.png"), 1500, 500);

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
