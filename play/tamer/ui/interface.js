// Interface de la page de test (tamer_ui.html).
// Ce script LIT l'etat du vrai moteur (joueurs, pions, main...) et habille ses elements ; il ne modifie
// jamais les regles. Les seules ecritures vers le moteur sont les clics qu'un joueur ferait lui-meme
// (choisir une famille, appuyer sur un bouton d'action).
(function () {
  "use strict";
  var Tamer = window.Tamer;

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function propre(nom) { return String(nom == null ? "" : nom).replace(/§/g, ""); }
  function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim(); }
  function U() { return Tamer.UI[Tamer.lang]; }
  function couleurJoueur(i) { return "var(--p" + (i + 1) + ")"; }

  // ---------------------------------------------------------------- etat du moteur
  function enBiomes() { return $("zone").style.display !== "none"; }
  function enFamilles() { return $("select").style.display !== "none" && !enBiomes(); }
  function enJeu() { return !enBiomes() && !enFamilles(); }
  function fini() { return typeof partieTerminee !== "undefined" && partieTerminee; }
  function engineAvance() { return (typeof phaseActuelle !== "undefined" && phaseActuelle > 0) || !enBiomes(); }

  // ---------------------------------------------------------------- accueil et navigation
  var demarree = false;
  function route() {
    var h = (location.hash || "#accueil").slice(1);
    var accueil = h !== "partie";
    $("accueil").hidden = !accueil;
    if (!accueil) demarree = true;
    $("b-reprendre").hidden = !(accueil && demarree);
    window.scrollTo(0, 0);
  }
  function rendreAccueil() {
    var mini = $("mini");
    if (!mini.childNodes.length) {
      var cl = ["b1", "", "", "b2", "", "", "", "", "", "", "", "", "b4", "", "", "b3"];
      var trous = { 1: [4], 5: [2, 7], 6: [5], 9: [8], 10: [1, 3], 11: [4], 14: [6] };
      for (var i = 0; i < 16; i++) {
        var b = document.createElement("div"); b.className = "bio " + (cl[i] || "");
        for (var j = 0; j < 9; j++) { var c = document.createElement("i"); if (trous[i] && trous[i].indexOf(j) >= 0) c.className = "v"; b.appendChild(c); }
        mini.appendChild(b);
      }
    }
    var t = U();
    $("steps").innerHTML = [[1, t.step1t, t.step1p], [2, t.step2t, t.step2p], [3, t.step3t, t.step3p]].map(function (s) {
      return "<div class=step><span class=n>0" + s[0] + "</span><h3>" + s[1] + "</h3><p>" + s[2] + "</p></div>";
    }).join("");
  }

  // ---------------------------------------------------------------- traduction des messages du moteur
  var MESSAGES = [
    [/^tour du joueur (\d+)/i, "Player $1's turn"],
    [/^debut de la partie/i, "The game begins"],
    [/^joueur ?(\d+), places tes biomes/i, "Player $1: place your biomes"],
    [/^Joueur (\d+) choisis tes familles/i, "Player $1: pick your families"],
    [/^joueur (\d+) a toi/i, "Player $1: your turn to pick"],
    [/^Depose le pion sur une case de ta base ou sur un batiment dans le noir/i, "Drop the pawn on a cell of your base, or on a dark building"],
    [/^Depose le pion sur une case de ta base/i, "Drop the pawn on a cell of your base"],
    [/^Depose un de tes pions sur une case adjacente libre/i, "Drop one of your pawns on a free adjacent cell"],
    [/^Cette case est deja occupee, choisis-en une autre/i, "That cell is taken, pick another"],
    [/^Clique sur un pion pour activer son pouvoir/i, "Click a pawn to activate its power"],
    [/^Aucun de tes pions n'a de pouvoir a activer/i, "None of your pawns has a power to activate"],
    [/^Choisis un de tes pions pour combattre/i, "Pick one of your pawns to fight"],
    [/^Choisis le pion ennemi a attaquer/i, "Pick the enemy pawn to attack"],
    [/^Aucun de tes pions ne peut combattre/i, "None of your pawns can fight"],
    [/^Aucun de tes pions ne peut se deplacer/i, "None of your pawns can move"],
    [/^Clique sur une base ennemie pour la detruire/i, "Click an enemy base to destroy it"],
    [/^Aucune base ennemie n'est a ta portee/i, "No enemy base is within reach"],
    [/^Clique sur une case pour y construire (.*)/i, "Click a cell to build $1"],
    [/^Aucune case n'a assez de pions constructeurs a proximite/i, "No cell has enough builder pawns nearby"],
    [/^(.*) construit !/i, "$1 built!"],
    [/^Clique sur un batiment pour y installer la salle/i, "Click a building to place the room"],
    [/^Aucun batiment ne peut recevoir cette salle/i, "No building can receive this room"],
    [/^(.*) installee !/i, "$1 placed!"],
    [/^Clique sur un pion pour lui donner l'objet/i, "Click a pawn to give it the item"],
    [/^Aucun pion ne peut recevoir cet objet/i, "No pawn can receive this item"],
    [/^Choisis la cible de (.*)/i, "Pick the target of $1"],
    [/^Aucune cible valide pour (.*)/i, "No valid target for $1"],
    [/^Achete un blink : (\d+) piece/i, "Buy a blink: $1 coin"],
    [/^Joueur (\d+) gagne la partie/i, "Player $1 wins the game!"],
    [/^Partie terminee : plus aucun joueur en jeu/i, "Game over: no player left"],
    [/^Elimine : (.*)/i, "Eliminated: $1"],
    [/^Que veux-tu reparer \?/i, "What do you want to repair?"],
    [/^Clique sur un de tes pions pour utiliser la salle de son batiment/i, "Click one of your pawns to use its building's room"],
    [/^Aucun de tes pions ne peut utiliser une salle/i, "None of your pawns can use a room"],
    [/^Tes salles : (.*)/i, "Your rooms: $1"],
    [/^Egalite, rien ne se passe/i, "Tie, nothing happens"],
    [/^La nuit tombe/i, "Night falls"],
    [/^tes biomes ne sont pas relies/i, "Your biomes are not linked to the previous player by a path of solid cells. Rearrange your pieces."],
    [/^Rien a reparer a portee de tes ingenieurs/i, "Nothing to repair within reach of your engineers"]
  ];
  var dernierTraduit = "";
  function traduire(fr) {
    for (var i = 0; i < MESSAGES.length; i++) {
      if (MESSAGES[i][0].test(fr)) return fr.replace(MESSAGES[i][0], MESSAGES[i][1]);
    }
    return fr;
  }
  function synchroMessage() {
    var el = $("texte"), cur = el.textContent;
    if (cur === dernierTraduit && el.dataset.fr !== undefined) return; // c'est notre propre traduction
    el.dataset.fr = cur;
    var sortie = Tamer.lang === "en" ? traduire(cur) : cur;
    dernierTraduit = (sortie !== cur) ? sortie : "";
    if (sortie !== cur) el.textContent = sortie;
  }
  function retraduireMessage() {
    var el = $("texte"); if (el.dataset.fr === undefined) return;
    var sortie = Tamer.lang === "en" ? traduire(el.dataset.fr) : el.dataset.fr;
    dernierTraduit = (sortie !== el.dataset.fr) ? sortie : "";
    el.textContent = sortie;
  }

  // ---------------------------------------------------------------- joueurs et bandeau
  var picks = [[], [], [], []];
  var FAM_ID = { "terreur nocturne": "terreur", "goblin": "goblin", "film d'horreur": "horreur", "steampunk": "steampunk", "rebelle": "rebelle", "gems": "gems",
    "mr ours": "ours", "ninja": "ninja", "magie": "magie", "maison": "maison", "la chose": "chose", "biome": "biome", "royaute": "royaute", "robot": "robot", "test": "test" };
  function nomFamille(nom) { var f = Tamer.famille(FAM_ID[nom]); return f ? f[Tamer.lang][0] : nom; }

  var memo = {};
  function maj(zone, html) { if (memo[zone] === html) return false; memo[zone] = html; return true; }

  function rendreJoueurs() {
    var t = U(), html = "", i, j, n;
    var enCours = enJeu() && !fini();
    for (i = 0; i < joueurs.length; i++) {
      j = joueurs[i];
      n = pionsDuJoueur(i).length + pionsEnfermesDuJoueur(i).length + pionsEmbarquesDuJoueur(i).length;
      var cls = "joueur" + (enCours && i === joueur_actif ? " actif" : "") + (j.elimine ? " out" : "");
      var fams = picks[i].map(nomFamille).join(", ");
      html += "<div class='" + cls + "' style='--c:" + couleurJoueur(i) + "'><h3><span>" + t.joueur + " " + (i + 1) + "</span><span class=mono>" + j.argent + " 🪙</span></h3>" +
        "<div class=meta><span>" + n + " " + t.pions + "</span><span>" + j.cartes.length + " " + t.nbCartes + "</span>" +
        "<span class='etat-base " + (j.base_destroy ? "ko" : "ok") + "'>" + (j.base_destroy ? t.baseKo : t.baseOk) + "</span>" + (j.elimine ? "<span class=etat-base ko>" + t.elimine + "</span>" : "") + "</div>" +
        (fams ? "<div class=fams>" + t.famillesT + " : " + esc(fams) + "</div>" : "") + "</div>";
    }
    if (maj("joueurs", html)) $("joueurs").innerHTML = html;
  }
  function rendreLegende() {
    var t = U();
    var html = "<h2>" + t.legendeTitre + "</h2><div class=l><span class=pastille style='--c:var(--vert)'></span>" + t.vert + " 1–5</div><div class=l><span class=pastille style='--c:var(--orange)'></span>" + t.orange + " 6–10</div><div class=l><span class=pastille style='--c:var(--rouge)'></span>" + t.rouge + " 11–15</div>" +
      "<div>" + t.leg1 + "</div><div>" + t.leg2 + "</div><div>" + t.leg3 + "</div><div>" + t.moteurFr + "</div>";
    if (maj("legende", html)) $("legende").innerHTML = html;
  }
  function rendreBandeau() {
    var t = U(), bar = $("msgbar"), lib, c;
    if (enBiomes()) { lib = t.st1 + " · " + t.joueur + " " + (phaseActuelle + 1); c = couleurJoueur(Math.min(phaseActuelle, 3)); }
    else if (enFamilles()) { lib = t.st2 + " · " + t.joueur + " " + (joueur_actif + 1); c = couleurJoueur(joueur_actif); }
    else if (fini()) { lib = t.gagneT; c = "var(--ok)"; }
    else { lib = Tamer.lang === "fr" ? t.tourDe + " " + (joueur_actif + 1) : "Player " + (joueur_actif + 1) + "'s turn"; c = couleurJoueur(joueur_actif); }
    bar.style.setProperty("--c", c);
    if (maj("tour", lib)) $("tour").textContent = lib;
    $("une").hidden = !(enJeu() && !fini());
    $("une").textContent = t.une;
    var nuit = enJeu() && typeof aEffet === "function" && aEffet("noir", "plateau");
    $("nuitban").classList.toggle("on", !!nuit); $("nuitban").textContent = t.nuitMsg;
    $("finban").classList.toggle("on", fini()); $("finban").textContent = t.gagneT + " — " + $("texte").textContent;
    $("tray").classList.toggle("on", enBiomes());
    $("detail").hidden = enBiomes();
  }

  // ---------------------------------------------------------------- pions et batiments du plateau
  var selection = null;
  function decorerPlateau() {
    var enfants = $("pions").children, i, el;
    for (i = 0; i < enfants.length; i++) {
      el = enfants[i];
      if (!el.carte) continue;
      el.dataset.j = el.dataset.joueur;
      if (!el.dataset.ui) {
        el.dataset.ui = "1";
        var img = el.querySelector("img");
        if (img) { img.alt = ""; img.addEventListener("error", function () { this.style.display = "none"; }); if (!img.getAttribute("src")) img.style.display = "none"; }
        if (el.carte.type === "batiment") {
          el.classList.add("ui-bat");
          var ab = propre(el.carte.name).split(/\s+/).map(function (m) { return m.charAt(0).toUpperCase(); }).join("").slice(0, 3);
          var sp = document.createElement("span"); sp.className = "pv"; sp.textContent = ab; el.appendChild(sp);
          el.title = propre(el.carte.name);
        } else {
          el.classList.add("ui-pion");
          var pv = document.createElement("span"); pv.className = "pv"; el.appendChild(pv);
        }
      }
      if (el.classList.contains("ui-pion")) {
        var puiss = puissanceTotale(el);
        el.querySelector(".pv").textContent = puiss;
        el.style.setProperty("--cat", "var(--" + couleurDe(el) + ")");
        el.classList.toggle("grand", estGrandPion(el));
        el.classList.toggle("sel", el === selection);
        el.title = propre(el.carte.name) + " · " + puiss;
        var bloque = etatBloquant(el);
        el.classList.toggle("etat", !!bloque);
        var etiq = el.querySelector(".etiq");
        var lib = bloque ? (aEffet("gele", "pion", el) ? "gele" : (aEffet("endormi", "pion", el) ? "endormi" : "enferme")) : "";
        if (lib) {
          var m = Tamer.motPar(lib), texte = m ? m[Tamer.lang][0] : lib;
          if (!etiq) { etiq = document.createElement("span"); etiq.className = "etiq"; el.appendChild(etiq); }
          if (etiq.textContent !== texte) etiq.textContent = texte;
        } else if (etiq) etiq.remove();
      }
    }
    // bases : couleur du joueur, grisee si detruite
    for (i = 0; i < joueurs.length; i++) {
      var be = joueurs[i].base && joueurs[i].base.element;
      if (be) { be.dataset.j = i; be.dataset.det = joueurs[i].base_destroy ? "1" : "0"; }
    }
  }
  $("pions").addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("#pions > div") : null;
    if (el && el.carte) { selection = el; rendreDetail(); decorerPlateau(); }
  });

  // ---------------------------------------------------------------- panneau de detail
  var KW = ["constructeur", "costaud", "agile", "tireur", "rapide", ["vol", "vole"], "belier", "sous_terre", "fort_esprit", "claustrophobe", "courageux", "analphabete", "peur_sang", "meute", "nyctalope", "malin", "ingenieur", "chef", "electrique", "fragile"];
  var NOMS_EFFETS = {
    bonus_puissance: { fr: "Bonus de puissance", en: "Power bonus" }, lien_amour: { fr: "Lien d'amour", en: "Love link" },
    demence: { fr: "Démence", en: "Madness" }, mot_cle: { fr: "Mot-clé donné", en: "Granted keyword" }
  };
  function bouton(id, x) {
    var m = Tamer.motPar(id); if (!m) return "";
    var nom = m[Tamer.lang][0].replace(/\s*\[x\]/, x !== undefined && x !== true ? " " + x : "");
    return "<button type=button class='kw" + (m.etat ? " etat" : "") + "' data-kw='" + id + "'>" + esc(nom) + "</button>";
  }
  function detailPion(el) {
    var t = U(), c = el.carte, cat = couleurDe(el), total = puissanceTotale(el), j = Number(el.dataset.joueur);
    var kws = KW.map(function (k) {
      var cle = Array.isArray(k) ? k[0] : k, id = Array.isArray(k) ? k[1] : k, v = motCle(el, cle);
      return v ? bouton(id, v) : "";
    }).join("");
    var objets = itemsPortes(el).map(function (it) { return "<span class=simple>" + esc(propre(it.name)) + (aEffet("casse", "item", it) ? " ✕" : "") + "</span>"; }).join("") || "<span class=vide>—</span>";
    var effets = effetsSur("pion", el).map(function (e) {
      if (["gele", "endormi", "enferme"].indexOf(e.nom) >= 0) return bouton(e.nom);
      var n = NOMS_EFFETS[e.nom]; var lib = n ? n[Tamer.lang] : e.nom;
      if (e.nom === "bonus_puissance") lib += " +" + ((e.donnees && e.donnees.valeur) || 0);
      return "<span class=simple>" + esc(lib) + "</span>";
    }).join("") || "<span class=vide>—</span>";
    var jauge = ""; for (var i = 1; i <= 15; i++) jauge += "<i style='height:6px;flex:1;border-radius:2px;background:" + (i <= total ? "var(--" + cat + ")" : "var(--surface-2)") + "'></i>";
    var passagers = (el.passagers || []).length ? "<div><div class=sous>" + t.passagers + " (" + el.passagers.length + "/2)</div><div class=chips>" + el.passagers.map(function (p) { return "<span class=simple>" + esc(propre(p.carte.name)) + "</span>"; }).join("") + "</div></div>" : "";
    return "<h2>" + esc(propre(c.name)) + "</h2><div class=sous style='color:" + couleurJoueur(j) + ";font-weight:700'>" + t.camp + " : " + t.joueur + " " + (j + 1) + (estGrandPion(el) ? " · " + empreinteDe(c).length + " cases" : "") + "</div>" +
      "<div class=puiss style='--cat:var(--" + cat + ")'><span class=gros>" + total + "</span><div style='flex:1'><div class=cat>" + t[cat] + "</div><div class=sous>" + t.puissance + " / 15 · " + c.puissance + " " + (Tamer.lang === "fr" ? "de base" : "base") + "</div><div style='display:flex;gap:2px;margin-top:4px'>" + jauge + "</div></div></div>" +
      "<div><div class=sous>" + t.mots + "</div><div class=chips>" + (kws || "<span class=vide>—</span>") + "</div></div>" +
      "<div><div class=sous>" + t.objets + "</div><div class=chips>" + objets + "</div></div>" + passagers +
      "<div><div class=sous>" + t.effets + "</div><div class=chips>" + effets + "</div></div>";
  }
  function detailBatiment(el) {
    var t = U(), c = el.carte, s = c.salle;
    var salle = s ? esc(propre(s.name)) + " (" + (s.revelee ? t.revelee : t.cachee) + ")" : t.aucuneSalle;
    var etats = [];
    if (typeof batimentEstNoir === "function" && batimentEstNoir(c)) etats.push(bouton("noir"));
    if (aEffet("casse", "batiment", c)) etats.push(bouton("casse"));
    return "<h2>" + esc(propre(c.name)) + "</h2><div class=sous>" + t.batimentT + " · " + (c.prix || 0) + " 🪙 · " + (c.cout_construction || 0) + " " + t.marteaux + "</div>" +
      "<div><div class=sous>" + t.salleT + "</div><div>" + salle + "</div></div>" +
      (c.prisonnier ? "<div><div class=sous>" + (Tamer.lang === "fr" ? "Prisonnier" : "Prisoner") + "</div><span class=simple>" + esc(propre(c.prisonnier.carte.name)) + "</span></div>" : "") +
      (etats.length ? "<div class=chips>" + etats.join("") + "</div>" : "");
  }
  function rendreDetail() {
    var d = $("detail"), html;
    if (selection && selection.carte && selection.isConnected) html = selection.carte.type === "batiment" ? detailBatiment(selection) : detailPion(selection);
    else html = "<p class=vide>" + U().aucunPion + "</p>";
    if (maj("detail", html)) d.innerHTML = html;
  }

  // ---------------------------------------------------------------- barre d'actions
  var ACTIONS = [
    { id: "passer", k: "P", lib: "passer", art: "tour" }, { id: "jouer", k: "J", lib: "jouer une carte", art: "tour" },
    { id: "acheter", k: "A", lib: "acheter des blink", art: "magasin" }, { id: "deplacer", k: "D", lib: "deplacer", art: "tour" },
    { id: "combattre", k: "C", lib: "combattre", art: "combat" }, { id: "activer", k: "V", lib: "activer une carte", art: "tour" },
    { id: "detruire", k: "B", lib: "detruire la base ennemies", art: "but" }, { id: "construire", k: "K", lib: "construire", art: "construire" },
    { id: "reparer", k: "R", lib: "reparer", art: "nuit" }, { id: "salle", k: "S", lib: "utiliser une salle", art: "construire" },
    { id: "messalles", k: "M", lib: "mes salles", art: "construire" }, { id: "fusionner", k: "F", lib: "fusionner le robot", art: "camp" }, { id: "tente", k: "T", lib: "deplacer la tente", art: "tour" }
  ];
  var PAR_LIBELLE = {}; ACTIONS.forEach(function (a) { PAR_LIBELLE[a.lib] = a; });
  var enDecoration = false;

  function etiquette(b) {
    var a = PAR_LIBELLE[b.dataset.libfr]; var texte = U().actionsT[a.id];
    b.innerHTML = "<kbd>" + a.k + "</kbd><span>" + esc(texte) + "</span>";
    b.title = U().actionsS[a.id];
  }
  function decorerActions() {
    if (enDecoration) return; enDecoration = true;
    try {
      var box = $("zone-selection"), kids = Array.prototype.slice.call(box.children);
      kids.forEach(function (b) {
        if (b.tagName !== "BUTTON" || b.classList.contains("q")) return;
        if (b.dataset.act === undefined) {
          var a = PAR_LIBELLE[norm(b.textContent)];
          if (!a) { b.dataset.act = ""; return; }
          b.dataset.act = a.id; b.dataset.libfr = a.lib; b.classList.add("act");
          var q = document.createElement("button"); q.type = "button"; q.className = "q"; q.textContent = "?";
          q.setAttribute("data-aide", a.art);
          b.parentNode.insertBefore(q, b.nextSibling);
          q.setAttribute("aria-label", U().ouvrirAide + U().actionsT[a.id]);
          etiquette(b);
        }
      });
    } finally { enDecoration = false; }
  }
  function reetiqueterActions() {
    Array.prototype.forEach.call($("zone-selection").querySelectorAll("button.act"), etiquette);
    Array.prototype.forEach.call($("zone-selection").querySelectorAll("button.q"), function (q) {
      var prec = q.previousElementSibling; if (prec && prec.dataset.act) q.setAttribute("aria-label", U().ouvrirAide + U().actionsT[prec.dataset.act]);
    });
  }
  function rendreIndispo() {
    var box = $("zone-selection"), t = U();
    var presentes = {}; Array.prototype.forEach.call(box.querySelectorAll("button.act"), function (b) { presentes[b.dataset.act] = true; });
    var html = "";
    if (presentes.passer && enJeu() && !fini()) {
      ACTIONS.forEach(function (a) {
        if (presentes[a.id]) return;
        var raison = (t.raisons2 && t.raisons2[a.id]) || (t.raisons && t.raisons[a.id]);
        if (raison) html += "<span title='" + esc(t.indispo) + "'><b>" + esc(t.actionsT[a.id]) + "</b> · " + esc(raison) + "</span>";
      });
    }
    if (maj("indispo", html)) $("indispo").innerHTML = html;
  }

  // ---------------------------------------------------------------- choix des familles
  var dernierFam = "";
  function rendreFamilles() {
    var visible = enFamilles() && typeof liste_famille !== "undefined";
    $("famsel").classList.toggle("on", visible);
    if (!visible) { dernierFam = ""; return; }
    var cle = liste_famille.map(function (f) { return f.name; }).join("|") + Tamer.lang + joueur_actif;
    if (cle === dernierFam) return; dernierFam = cle;
    var box = $("familles"); box.innerHTML = "";
    liste_famille.forEach(function (f, i) {
      var info = Tamer.famille(FAM_ID[f.name]), b = document.createElement("button");
      b.type = "button"; b.className = "fam";
      b.innerHTML = "<strong>" + esc(info ? info[Tamer.lang][0] : f.name) + "</strong><small>" + esc(info ? info[Tamer.lang][1] : "") + "</small>";
      b.addEventListener("click", function () {
        picks[joueur_actif].push(f.name);
        index_select = i;
        $("select").click();
      });
      box.appendChild(b);
    });
    $("fam-titre").textContent = U().choisisFamille + " · " + U().joueur + " " + (joueur_actif + 1);
  }

  // ---------------------------------------------------------------- main du joueur
  var TYPE_CLASSE = { pion: "t-pion", item: "t-item", sort: "t-sort", evenement: "t-evenement", batiment: "t-batiment", salle: "t-salle" };
  function rendreMain() {
    var t = U(), box = $("main");
    var visible = !enBiomes() && joueurs[joueur_actif].cartes.length >= 0 && engineAvance();
    $("mainbox").hidden = !visible;
    if (!visible) return;
    var cartes = joueurs[joueur_actif].cartes;
    $("h-main").textContent = t.mainDe + " " + (joueur_actif + 1) + " · " + cartes.length + " " + t.cartes;
    var html = cartes.map(function (c, i) {
      var cout = c.type === "batiment" ? (c.prix || 0) + " 🪙 · " + (c.cout_construction || 0) + " 🛠️" : (c.prix ? c.prix + " 🪙" : "");
      return "<button type=button class='carte " + (TYPE_CLASSE[c.type] || "") + "' data-i='" + i + "'><span class=ty>" + esc(t.typeNoms[c.type] || c.type) + (c.type === "pion" ? " · " + c.puissance : "") + "</span><strong>" + esc(propre(c.name)) + "</strong>" + (cout ? "<span class=cout>" + cout + "</span>" : "") + "</button>";
    }).join("") || "<p class=vide>" + t.mainVide + "</p>";
    if (maj("main", html + Tamer.lang + joueur_actif)) box.innerHTML = html;
  }
  $("main").addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest(".carte") : null; if (!b) return;
    var c = joueurs[joueur_actif].cartes[Number(b.dataset.i)]; if (!c) return;
    var t = U();
    var kws = c.mot_cle ? KW.map(function (k) { var cle = Array.isArray(k) ? k[0] : k, id = Array.isArray(k) ? k[1] : k, v = c.mot_cle[cle]; return v ? bouton(id, v) : ""; }).join("") : "";
    selection = null; memo.detail = null;
    $("detail").innerHTML = "<h2>" + esc(propre(c.name)) + "</h2><div class=sous>" + esc(t.typeNoms[c.type] || c.type) +
      (c.puissance ? " · " + t.puissance + " " + c.puissance : "") + (c.prix ? " · " + c.prix + " 🪙" : "") + (c.cout_construction ? " · " + c.cout_construction + " " + t.marteaux : "") + "</div>" +
      (kws ? "<div><div class=sous>" + t.mots + "</div><div class=chips>" + kws + "</div></div>" : "") +
      (c.piece_robot ? "<p class=vide>" + (Tamer.lang === "fr" ? "Morceau de Robot : 4 morceaux sur 5 se fusionnent en un Robot 2×2." : "Robot piece: 4 of the 5 pieces fuse into a 2×2 Robot.") + "</p>" : "");
  });

  // ---------------------------------------------------------------- raccourcis clavier
  document.addEventListener("keydown", function (e) {
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || e.ctrlKey || e.metaKey || e.altKey || !$("accueil").hidden || $("aide").classList.contains("on")) return;
    var a = ACTIONS.filter(function (x) { return x.k.toLowerCase() === e.key.toLowerCase(); })[0];
    if (!a) return;
    var b = $("zone-selection").querySelector("button.act[data-act='" + a.id + "']");
    if (b) { b.click(); e.preventDefault(); }
  });

  // ---------------------------------------------------------------- boutons de l'accueil
  $("b-nouvelle").addEventListener("click", function () {
    if (demarree && engineAvance() && window.confirm(U().nouvelleSure)) { location.hash = "partie"; location.reload(); return; }
    location.hash = "partie";
  });
  $("b-reprendre").addEventListener("click", function () { location.hash = "partie"; });

  // ---------------------------------------------------------------- boucle de mise a jour
  function rendreTout() {
    rendreAccueil(); rendreLegende(); rendreJoueurs(); rendreBandeau(); decorerPlateau(); rendreDetail();
    decorerActions(); rendreIndispo(); rendreFamilles(); rendreMain();
  }
  function tick() { try { rendreTout(); } catch (e) { console.error("interface :", e); } }

  new MutationObserver(function () { decorerActions(); rendreIndispo(); }).observe($("zone-selection"), { childList: true });
  new MutationObserver(decorerPlateau).observe($("pions"), { childList: true });
  new MutationObserver(synchroMessage).observe($("texte"), { childList: true, characterData: true, subtree: true });

  Tamer.aPourLangue(function () {
    memo = {}; dernierFam = "";
    reetiqueterActions(); retraduireMessage(); tick();
  });
  window.addEventListener("hashchange", route);

  document.addEventListener("DOMContentLoaded", function () { /* aide.js applique deja la langue */ });
  Tamer.appliquerStatique();
  synchroMessage();
  route();
  tick();
  setInterval(tick, 400);

  window.TamerUI = { tick: tick, picks: picks };
})();
