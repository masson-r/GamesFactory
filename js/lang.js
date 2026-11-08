// Bilingue FR / EN : affiche les éléments .fr ou .en selon <html data-lang>
(function () {
  var saved = null;
  try { saved = localStorage.getItem('gf-lang'); } catch (e) {}
  var lang = saved || ((navigator.language || 'fr').toLowerCase().indexOf('fr') === 0 ? 'fr' : 'en');

  function apply(l) {
    document.documentElement.setAttribute('data-lang', l);
    document.documentElement.setAttribute('lang', l);
    var btns = document.querySelectorAll('[data-set-lang]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-set-lang') === l);
    }
  }
  apply(lang);

  document.addEventListener('DOMContentLoaded', function () {
    apply(lang);
    var btns = document.querySelectorAll('[data-set-lang]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        lang = this.getAttribute('data-set-lang');
        try { localStorage.setItem('gf-lang', lang); } catch (e) {}
        apply(lang);
      });
    }
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  });
})();
