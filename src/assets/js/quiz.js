/* Quiz : correction immédiate, score, partage. */
(function () {
  "use strict";
  var quiz = document.getElementById("quiz");
  if (!quiz) return;
  var qs = Array.prototype.slice.call(quiz.querySelectorAll("[data-q]"));
  var total = qs.length, answered = 0, good = 0;
  var scoreEl = document.querySelector("[data-score]");
  var msgEl = document.querySelector("[data-score-msg]");
  var shareBtn = document.querySelector("[data-score-share]");

  function badge(ok) {
    var s = document.createElement("span");
    s.className = "res " + (ok ? "res--gagne" : "res--perdu");
    s.textContent = ok ? "✓ Bonne réponse" : "✗";
    return s;
  }

  function update() {
    if (scoreEl) scoreEl.textContent = good + " / " + total;
    if (!msgEl) return;
    if (answered < total) { msgEl.textContent = (total - answered) + " question" + (total - answered > 1 ? "s" : "") + " restante" + (total - answered > 1 ? "s" : ""); return; }
    var r = good / total;
    msgEl.textContent = r === 1 ? "Parfait ! Tu connais tes classiques : maintenant, viens les écrire le 23."
      : r >= 0.7 ? "Très bien ! L'histoire sociale n'a (presque) plus de secret pour toi."
      : r >= 0.4 ? "Pas mal ! La frise historique t'attend pour compléter."
      : "Tout ça s'apprend : jette un œil à la frise, c'est passionnant.";
    if (shareBtn) shareBtn.hidden = false;
  }

  qs.forEach(function (q) {
    var answer = Number(q.getAttribute("data-answer"));
    var opts = Array.prototype.slice.call(q.querySelectorAll("input[type=radio]"));
    opts.forEach(function (input) {
      input.addEventListener("change", function () {
        var chosen = Number(input.value);
        var ok = chosen === answer;
        answered++;
        if (ok) good++;
        opts.forEach(function (o) {
          o.disabled = true;
          var label = o.closest(".q__opt");
          if (Number(o.value) === answer) { label.classList.add("is-right"); if (!ok || o === input) label.appendChild(badge(true)); }
          else if (o === input) { label.classList.add("is-wrong"); label.appendChild(badge(false)); }
        });
        var ex = q.querySelector(".q__explain");
        if (ex) ex.hidden = false;
        update();
      });
    });
  });

  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      var url = shareBtn.getAttribute("data-url");
      var text = "J'ai eu " + good + "/" + total + " au quiz de l'histoire des luttes sociales. Et toi ? Le 23 novembre, on écrit la suite :";
      if (navigator.share) { navigator.share({ title: document.title, text: text, url: url }).catch(function () {}); }
      else if (navigator.clipboard) { navigator.clipboard.writeText(text + " " + url).then(function () { shareBtn.textContent = "Copié !"; }); }
    });
  }
  update();
})();
