/* Mobilisation · novembre 2026 — comportements du site (sans dépendance).
   Le site reste lisible sans JavaScript ; ce script ajoute le confort. */
(function () {
  "use strict";

  var doc = document.documentElement;
  var ROOT = doc.getAttribute("data-root") || "./";
  var rootURL = new URL(ROOT, document.baseURI);

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val);
    } catch (e) { return null; }
  }
  function toast(msg) {
    var t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* ---------- Thème clair / sombre ---------- */
  function currentTheme() {
    var t = doc.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  $$("[data-theme-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      doc.setAttribute("data-theme", next);
      store("theme", next);
    });
  });

  /* ---------- Menu ---------- */
  var menuBtn = $("[data-menu-toggle]");
  var menu = $("[data-menu]");
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!open));
      menu.classList.toggle("is-open", !open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        menuBtn.setAttribute("aria-expanded", "false");
        menu.classList.remove("is-open");
        menuBtn.focus();
      }
    });
  }

  /* ---------- Comptes à rebours ---------- */
  var countdowns = $$("[data-countdown]");
  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function tick() {
    var now = Date.now();
    countdowns.forEach(function (el) {
      var target = new Date(el.getAttribute("data-countdown")).getTime();
      var diff = target - now;
      if (diff <= 0) {
        // Le jour même (jusqu'à minuit) : message de mobilisation, ensuite on masque.
        if (diff > -86400000) {
          el.classList.add("is-done");
          el.textContent = el.getAttribute("data-done") || "C'est aujourd'hui !";
        } else {
          el.hidden = true;
        }
        return;
      }
      var s = Math.floor(diff / 1000);
      var d = Math.floor(s / 86400); s -= d * 86400;
      var h = Math.floor(s / 3600); s -= h * 3600;
      var m = Math.floor(s / 60); s -= m * 60;
      var set = function (u, v) { var n = el.querySelector('[data-u="' + u + '"]'); if (n) n.textContent = v; };
      set("d", String(d)); set("h", pad(h)); set("m", pad(m)); set("s", pad(s));
    });
  }
  if (countdowns.length) { tick(); setInterval(tick, 1000); }

  /* ---------- Statut relatif des événements (passé / aujourd'hui / à venir) ---------- */
  var today = new Date();
  var todayKey = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate());
  $$("[data-relative]").forEach(function (el) {
    var date = el.getAttribute("data-relative");
    var card = el.closest("[data-event]");
    if (date < todayKey) {
      el.textContent = "Passé";
      if (card) card.classList.add("is-past");
    } else if (date === todayKey) {
      el.textContent = "Aujourd'hui !";
    } else {
      var days = Math.round((new Date(date + "T12:00:00") - new Date(todayKey + "T12:00:00")) / 86400000);
      el.textContent = (days === 1 ? "Demain" : "Dans " + days + " jours") + " · " + el.textContent;
    }
  });

  /* ---------- Infobulles des graphiques ---------- */
  var tip = $("#tip");
  function showTip(target, x, y) {
    if (!tip) return;
    tip.textContent = target.getAttribute("data-tip");
    tip.hidden = false;
    var r = tip.getBoundingClientRect();
    var left = Math.min(Math.max(8, x - r.width / 2), window.innerWidth - r.width - 8);
    var top = y - r.height - 12;
    if (top < 8) top = y + 16;
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }
  function hideTip() { if (tip) tip.hidden = true; }
  document.addEventListener("pointerover", function (e) {
    var t = e.target.closest && e.target.closest("[data-tip]");
    if (t) showTip(t, e.clientX, e.clientY);
  });
  document.addEventListener("pointermove", function (e) {
    var t = e.target.closest && e.target.closest("[data-tip]");
    if (t) showTip(t, e.clientX, e.clientY); else hideTip();
  });
  document.addEventListener("focusin", function (e) {
    var t = e.target.closest && e.target.closest("[data-tip]");
    if (t) { var r = t.getBoundingClientRect(); showTip(t, r.left + r.width / 2, r.top); }
  });
  document.addEventListener("focusout", hideTip);
  window.addEventListener("scroll", hideTip, { passive: true });

  /* ---------- Partage ---------- */
  $$("[data-share]").forEach(function (box) {
    var btn = $("[data-share-native]", box);
    if (btn && navigator.share) {
      btn.hidden = false;
      btn.addEventListener("click", function () {
        navigator.share({ title: document.title, text: box.getAttribute("data-text"), url: box.getAttribute("data-url") }).catch(function () {});
      });
    }
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-copy]");
    if (!b) return;
    var text = b.getAttribute("data-copy");
    var done = function () { toast("Copié ! Colle-le où tu veux."); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { window.prompt("Copie ce texte :", text); });
    } else {
      window.prompt("Copie ce texte :", text);
    }
  });

  /* ---------- Recherche (Pagefind, chargée à la demande) ---------- */
  var dialog = $("#recherche");
  var searchLoaded = false;
  function loadSearch() {
    if (searchLoaded) return;
    searchLoaded = true;
    var holder = $("#search-ui");
    var base = new URL(holder.getAttribute("data-base") || ROOT, document.baseURI).pathname;
    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = new URL("pagefind/pagefind-ui.css", rootURL).href;
    document.head.appendChild(css);
    var s = document.createElement("script");
    s.src = new URL("pagefind/pagefind-ui.js", rootURL).href;
    s.onload = function () {
      /* global PagefindUI */
      new PagefindUI({ element: "#search-ui", showSubResults: true, showImages: false, baseUrl: base, autofocus: true });
      var input = $("#search-ui input");
      if (input) input.focus();
    };
    s.onerror = function () {
      holder.innerHTML = "";
      var p = document.createElement("p");
      p.textContent = "La recherche sera disponible une fois le site construit (npm run build).";
      holder.appendChild(p);
    };
    document.body.appendChild(s);
  }
  function openSearch() {
    if (!dialog) return;
    loadSearch();
    if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
    var input = $("#search-ui input");
    if (input) setTimeout(function () { input.focus(); }, 50);
  }
  $$("[data-search-open]").forEach(function (b) { b.addEventListener("click", openSearch); });
  document.addEventListener("keydown", function (e) {
    var tag = (e.target.tagName || "").toLowerCase();
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && tag !== "input" && tag !== "textarea" && tag !== "select") {
      e.preventDefault();
      openSearch();
    }
  });
  if (dialog) {
    dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
  }

  /* ---------- Filtres génériques (frise, agenda) ---------- */
  $$("[data-filters]").forEach(function (bar) {
    var list = document.getElementById(bar.getAttribute("data-filters"));
    if (!list) return;
    var items = $$("[data-filter-item]", list);
    var countEl = $("[data-filter-count]", bar);
    var state = {};
    $$("[data-filter-key]", bar).forEach(function (b) {
      if (b.getAttribute("aria-pressed") === "true") state[b.getAttribute("data-filter-key")] = b.getAttribute("data-filter-value");
    });
    function apply() {
      var n = 0;
      items.forEach(function (it) {
        var ok = Object.keys(state).every(function (k) {
          var v = state[k];
          if (!v || v === "all") return true;
          var have = (it.getAttribute("data-" + k) || "").split(/\s+/);
          return have.indexOf(v) !== -1;
        });
        it.hidden = !ok;
        if (ok) n++;
      });
      if (countEl) countEl.textContent = n + (n > 1 ? " éléments" : " élément");
    }
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("[data-filter-key]");
      if (!b) return;
      var k = b.getAttribute("data-filter-key");
      $$('[data-filter-key="' + k + '"]', bar).forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", "true");
      state[k] = b.getAttribute("data-filter-value");
      apply();
    });
    apply();
  });

  /* ---------- Sommaire actif (analyses) ---------- */
  var tocLinks = $$(".toc a[href^='#']");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[decodeURIComponent(a.getAttribute("href").slice(1))] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          tocLinks.forEach(function (a) { a.classList.remove("is-active"); });
          map[en.target.id].classList.add("is-active");
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    Object.keys(map).forEach(function (id) { var h = document.getElementById(id); if (h) obs.observe(h); });
  }

  /* ---------- Check-lists mémorisées (mode manif) ---------- */
  $$("[data-checklist]").forEach(function (list) {
    var key = "check:" + list.getAttribute("data-checklist");
    var saved = {};
    try { saved = JSON.parse(store(key) || "{}") || {}; } catch (e) { saved = {}; }
    $$("input[type=checkbox]", list).forEach(function (cb) {
      if (saved[cb.value]) cb.checked = true;
      cb.addEventListener("change", function () {
        saved[cb.value] = cb.checked;
        store(key, JSON.stringify(saved));
      });
    });
  });
  $$("[data-checklist-reset]").forEach(function (b) {
    b.addEventListener("click", function () {
      var list = document.querySelector('[data-checklist="' + b.getAttribute("data-checklist-reset") + '"]');
      if (!list) return;
      $$("input[type=checkbox]", list).forEach(function (cb) { cb.checked = false; });
      store("check:" + b.getAttribute("data-checklist-reset"), null);
    });
  });

  /* ---------- Hors ligne : service worker ---------- */
  var swOK = "serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1");
  if (swOK) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register(new URL("sw.js", rootURL).href, { scope: rootURL.pathname }).catch(function () {});
    });
  }
  $$("[data-offline-status]").forEach(function (el) {
    if (!swOK || !("caches" in window)) { el.textContent = "Astuce : ajoute cette page à ton écran d'accueil."; return; }
    var check = function () {
      caches.match(location.href.split("#")[0], { ignoreSearch: true }).then(function (hit) {
        if (hit) { el.textContent = "✓ Cette page est disponible hors ligne"; el.classList.add("is-ready"); }
        else { el.textContent = "Chargement pour la consultation hors ligne…"; setTimeout(check, 2500); }
      });
    };
    check();
  });
})();
