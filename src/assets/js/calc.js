/* Simulateurs : « index en centimes » et malus pension.
   Calculs indicatifs, faits entièrement dans le navigateur (rien n'est envoyé). */
(function () {
  "use strict";

  var eur = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var eur2 = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var pct = new Intl.NumberFormat("fr-BE", { maximumFractionDigits: 1 });

  function num(el, fallback) {
    var v = parseFloat(String(el.value).replace(/[\s\u00a0\u202f]/g, "").replace(",", "."));
    return isFinite(v) ? v : fallback;
  }
  function setText(root, sel, txt) { var n = root.querySelector(sel); if (n) n.textContent = String(txt).replace(/\u202f/g, "\u00a0"); }

  /* ---------- 1. Index en centimes (2026 et 2028) ---------- */
  var idx = document.getElementById("simulateur-index");
  if (idx) {
    var f = idx.querySelector("form");
    var run = function () {
      var S = Math.max(0, num(f.salaire, 4500));
      var who = (f.querySelector("input[name=statut]:checked") || {}).value || "salarie";
      var T = who === "allocataire" ? 2000 : 4000;
      var i26 = num(f.i2026, 2.5) / 100;
      var i27 = num(f.i2027, 3) / 100;
      var i28 = num(f.i2028, 2) / 100;
      var years = Math.min(45, Math.max(1, Math.round(num(f.annees, 20))));
      var gel = f.gel.checked;
      var months = who === "allocataire" ? 12 : 13.92;

      // Augmentation plafonnée : index complet jusqu'au seuil, seulement la part > 2 % au-dessus.
      var capped = function (s, i) { return Math.min(s, T) * i + Math.max(0, s - T) * Math.max(0, i - 0.02); };

      // Trajectoire réelle (avec mesures) vs trajectoire sans mesures
      var real = S, ref = S;
      var gaps = [];
      // 2026
      real = real + capped(real, i26); ref = ref * (1 + i26); gaps.push(ref - real);
      // 2027 (index normal, ou gel complet si scénario coché)
      real = gel ? real : real * (1 + i27); ref = ref * (1 + i27); gaps.push(ref - real);
      // 2028
      real = real + capped(real, i28); ref = ref * (1 + i28); gaps.push(ref - real);
      // Années suivantes : hypothèse d'indexation de 2 % par an, l'écart se perpétue
      for (var y = 3; y < years; y++) { real *= 1.02; ref *= 1.02; gaps.push(ref - real); }
      gaps = gaps.slice(0, years);

      var first = gaps[0];
      var after28 = gaps[Math.min(2, gaps.length - 1)];
      var total = gaps.reduce(function (s, g) { return s + g * months; }, 0);

      setText(idx, "[data-out=big]", eur.format(total));
      setText(idx, "[data-out=years]", String(years));
      setText(idx, "[data-out=m26]", eur2.format(first));
      setText(idx, "[data-out=m28]", eur2.format(after28));
      setText(idx, "[data-out=y28]", eur.format(after28 * months));
      setText(idx, "[data-out=thr]", eur.format(T));
      var msg = idx.querySelector("[data-out=msg]");
      if (msg) {
        if (S <= T && !gel) {
          msg.textContent = "Sous le seuil de " + eur.format(T) + " brut, l'index en centimes ne te touche pas directement. Mais un gel complet d'un an, s'il était décidé, te toucherait : coche le scénario pour voir.";
          msg.className = "sim__msg sim__msg--ok";
        } else {
          msg.textContent = "Cette perte est définitive : l'index non versé ne se rattrape jamais, il se répercute sur toutes les années suivantes" + (who === "salarie" ? ", ainsi que sur ton pécule de vacances et ta prime de fin d'année." : ".");
          msg.className = "sim__msg";
        }
      }
    };
    f.addEventListener("input", run);
    f.addEventListener("change", run);
    f.addEventListener("submit", function (e) { e.preventDefault(); run(); });
    run();
  }

  /* ---------- 2. Malus pension ---------- */
  var mal = document.getElementById("simulateur-malus");
  if (mal) {
    var g = mal.querySelector("form");
    var runM = function () {
      var birth = Math.round(num(g.naissance, 1975));
      var age = Math.round(num(g.age, 63));
      var pension = Math.max(0, num(g.pension, 1800));
      var cond = (g.querySelector("input[name=conditions]:checked") || {}).value || "non";
      var legal = birth >= 1964 ? 67 : 66;
      var rate = birth >= 1975 ? 5 : birth >= 1966 ? 4 : birth >= 1961 ? 2 : 0;
      var early = Math.max(0, legal - age);
      var malus = 0;
      var note = "";
      if (rate === 0) {
        note = "Les personnes nées avant 1961 ne sont pas concernées par le malus.";
      } else if (early === 0) {
        note = "Tu pars à l'âge légal (" + legal + " ans) : pas de malus.";
      } else if (cond === "oui") {
        note = "Si tu remplis bien les conditions (35 années d'au moins 156 jours et 7 020 jours de travail), pas de malus. Vérifie ta carrière sur mypension.be.";
      } else {
        malus = Math.min(25, early * rate);
        note = (cond === "nsp" ? "Si tu ne remplis pas les conditions : " : "") +
          early + " année" + (early > 1 ? "s" : "") + " avant l'âge légal (" + legal + " ans) × " + rate + " % = " + pct.format(early * rate) + " %" +
          (early * rate > 25 ? ", plafonné à 25 % dans cette simulation." : ".");
      }
      var loss = pension * malus / 100;
      setText(mal, "[data-out=big]", malus ? "− " + pct.format(malus) + " %" : "0 %");
      setText(mal, "[data-out=legal]", legal + " ans");
      setText(mal, "[data-out=rate]", rate ? rate + " % par année" : "non concerné·e");
      setText(mal, "[data-out=month]", malus ? "− " + eur.format(loss) : "0 €");
      setText(mal, "[data-out=year]", malus ? "− " + eur.format(loss * 12) : "0 €");
      setText(mal, "[data-out=total]", malus ? "− " + eur.format(loss * 12 * 20) : "0 €");
      setText(mal, "[data-out=note]", note);
    };
    g.addEventListener("input", runM);
    g.addEventListener("change", runM);
    g.addEventListener("submit", function (e) { e.preventDefault(); runM(); });
    runM();
  }
})();
