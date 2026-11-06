// Métadonnées globales du site.
// Pour déployer ailleurs : définir la variable d'environnement SITE_URL
// (la GitHub Action la renseigne automatiquement).
const DEFAULT_URL = "https://ouaisfieu.github.io/mobilisation/";
const envUrl = process.env.SITE_URL || "";
const siteUrl = /^https?:\/\/[^/]+/.test(envUrl) ? (envUrl.endsWith("/") ? envUrl : envUrl + "/") : DEFAULT_URL;

export default {
  name: "Mobilisation",
  title: "Mobilisation · novembre 2026",
  tagline: "Nos droits sont nés dans la rue. C'est là qu'on les défend.",
  description:
    "Le site citoyen et indépendant de la mobilisation syndicale de novembre 2026 en Belgique : agenda, enjeux chiffrés, alternatives, histoire des luttes sociales, droits et guide pour agir.",
  url: siteUrl,
  repo: "https://github.com/ouaisfieu/mobilisation",
  lang: "fr-BE",
  locale: "fr_BE",
  // Date de la dernière mise à jour éditoriale (à modifier à chaque mise à jour du contenu)
  updated: "2026-11-06T06:00:00+01:00",
  buildTime: new Date().toISOString(),
  // Le rendez-vous principal : sert au compte à rebours et aux métadonnées
  main: {
    id: "manif-nationale-23-novembre",
    label: "Manifestation nationale",
    date: "2026-11-23T00:00:00+01:00",
    dateLabel: "Lundi 23 novembre 2026",
    city: "Bruxelles",
  },
  // Liens officiels (le site n'est affilié à aucune organisation)
  official: [
    { name: "CSC", url: "https://www.lacsc.be/" },
    { name: "FGTB", url: "https://fgtb.be/" },
    { name: "Synova (ex-CGSLB)", url: "https://www.synova.be/fr/nouveau-nom" },
  ],
};
