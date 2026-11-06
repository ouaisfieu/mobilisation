# Mobilisation · novembre 2026

Site citoyen et indépendant de la mobilisation syndicale de novembre 2026 en Belgique, autour de la **manifestation nationale en front commun du lundi 23 novembre à Bruxelles** (CSC, FGTB, Synova).

➡️ Adresse prévue : **https://ouaisfieu.github.io/mobilisation/**

Agenda avec compte à rebours et export calendrier, enjeux chiffrés et sourcés, simulateurs (indexation, malus pension), 21,2 milliards d'alternatives, frise interactive de 150 ans de luttes, sept analyses de fond, guide pour agir, droits, mode manif hors ligne, FAQ, réponses aux arguments du gouvernement, kit d'affiches et de visuels, quiz, API JSON ouverte, résumés en néerlandais et en anglais.

> Ce site n'est affilié à aucune organisation syndicale ni à aucun parti. Il renvoie toujours vers la CSC, la FGTB et Synova pour les informations officielles (horaire, parcours, départs collectifs).

---

## 1. Mettre le site en ligne (une seule fois, environ 5 minutes)

1. **Crée le dépôt** sur GitHub : compte `ouaisfieu`, nom `mobilisation`, visibilité **Public**, sans README.
2. **Envoie le code** depuis le dossier décompressé :

   ```bash
   cd mobilisation
   git init
   git add .
   git commit -m "Site de la mobilisation de novembre 2026"
   git branch -M main
   git remote add origin https://github.com/ouaisfieu/mobilisation.git
   git push -u origin main
   ```

   Sans ligne de commande : avec [GitHub Desktop](https://desktop.github.com/) (« Add existing repository », puis « Publish »), ou par glisser-déposer dans l'interface web du dépôt (« Add file » → « Upload files », en deux fois si GitHub refuse plus de 100 fichiers d'un coup ; garde bien le dossier caché `.github`).

3. **Active GitHub Pages** : dans le dépôt, *Settings* → *Pages* → *Build and deployment* → *Source* : **GitHub Actions**.
4. C'est tout. À chaque `push` sur `main`, l'action *Déployer sur GitHub Pages* construit et publie le site (onglet *Actions* pour suivre). Compte une à deux minutes.

## 2. Mettre à jour le contenu (sans toucher au code)

Tout le contenu qui bouge est dans des fichiers de données simples, dans `src/_data/`. Modifie-les directement sur GitHub (icône crayon), valide : le site se republie tout seul.

| Pour… | Modifier | Remarque |
|---|---|---|
| Annoncer l'heure et le lieu du 23 novembre | `events.json` → champs `practical` et `status` | Mets aussi l'heure dans `site.js` → `main.date` (ex. `2026-11-23T10:30:00+01:00`) pour un compte à rebours précis |
| Ajouter un rendez-vous (action locale, départ collectif…) | `events.json` | Un fichier `.ics` est généré automatiquement pour chaque événement |
| Publier une actualité | `news.json` | La plus récente avec `"flash": true` s'affiche dans le bandeau en haut de toutes les pages |
| Compléter la chronologie du mouvement | `actions.json` | Les manifestations avec chiffres police/organisateurs alimentent le graphique |
| Corriger ou ajouter un repère historique | `timeline.json` | `result` : `gagne`, `partiel`, `differe`, `perdu` ou `en-cours` |
| FAQ, contre-arguments, quiz | `faq.json`, `arguments.json`, `quiz.json` | |
| Ajouter une source | `sources.json` | Puis l'utiliser dans les textes avec `{% src "identifiant" %}` |
| Date de mise à jour affichée | `site.js` → `updated` | |

Les pages elles-mêmes sont dans `src/*.njk` (HTML + Nunjucks) et les analyses dans `src/analyses/*.md` (Markdown).

**À faire en priorité :** le 6 novembre 2026, le Roi devait se prononcer sur la démission de Bart De Wever. Mets à jour `news.json` (et retire `"flash": true` de l'entrée devenue obsolète) dès que la décision est connue.

## 3. Travailler en local

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
npm start          # aperçu avec rechargement automatique sur http://localhost:8080/
npm run build      # construit le site final dans _site/ (avec l'index de recherche)
```

Les liens internes sont générés en **chemins relatifs** : le site fonctionne tel quel sous `/mobilisation/`, à la racine d'un domaine ou dans n'importe quel sous-dossier. Pour une autre adresse publique (domaine personnalisé…), la GitHub Action renseigne `SITE_URL` toute seule ; en local : `SITE_URL=https://exemple.org/ npm run build`.

## 4. Ce que contient le site

- **Accueil** : appel, compte à rebours, chiffres clés, enjeux, moment politique, alternatives, conquêtes historiques, agenda, FAQ.
- **Agenda** (`/agenda/`) : les dates de novembre, export `.ics` par événement, abonnement `webcal`, chronologie du mouvement depuis 2025 et graphique de participation.
- **Les enjeux** (`/enjeux/`) : salaire et indexation, pension, chômage et flexibilité, école, santé, services publics, libertés, revendications. Deux simulateurs (index en centimes, malus pension).
- **L'argent existe** (`/alternatives/`) : déficit et dette (honnêtement), 21,2 milliards d'alternatives, concentration du patrimoine, pétition.
- **Histoire** (`/histoire/`) : 32 repères de 1871 à 2026, filtrables, avec ce qui a été gagné ou perdu, et huit leçons.
- **Analyses** (`/analyses/`) : sept textes de fond (pouvoir et contestation, conditions de succès des grèves, le moment politique, la concertation sociale, les pensions des femmes, violence et légitimité, démocratie et rue).
- **Agir**, **Vos droits**, **Mode manif** (fonctionne hors ligne), **FAQ**, **Ils disent, on répond**, **Kit visuel**, **Quiz**, **Actualités**, **Ressources**, **Sources**, **À propos**, **API**.
- **Nederlands** (`/nl/`) et **English** (`/en/`) : résumés.

### Côté technique (JAMstack)

- Pages HTML générées à l'avance par [Eleventy](https://www.11ty.dev/) à partir de données JSON et de Markdown.
- Graphiques générés au build (HTML/CSS, sans bibliothèque), avec vue tableau accessible.
- Recherche plein texte côté navigateur avec [Pagefind](https://pagefind.app/).
- API statique : `/api/*.json` ; agenda iCalendar : `/agenda.ics` ; flux Atom : `/feed.xml` ; plan du site : `/sitemap.xml`.
- Application installable (manifeste + service worker) : pages essentielles disponibles hors ligne.
- Aucune dépendance externe au chargement : polices hébergées sur place, aucun traceur, aucun cookie.
- Accessibilité : contraste vérifié, navigation clavier, lien d'évitement, mode sombre, mouvement réduit, impression.

## 5. Régénérer les visuels (facultatif)

Les affiches, tracts, pancartes, visuels pour les réseaux sociaux, images de partage et icônes sont déjà dans `src/assets/`. Pour les modifier, édite `scripts/make-visuals.cjs` puis :

```bash
npm install --no-save playwright qrcode
npx playwright install chromium
node scripts/make-visuals.cjs
```

## 6. Licences

- Textes, données et visuels : [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr) — copie, imprime, adapte, en citant la source.
- Code : MIT (voir `LICENSE`).
- Polices Archivo, Atkinson Hyperlegible Next, IBM Plex Mono : SIL Open Font License (voir `src/assets/fonts/LICENCES-POLICES.txt`).
