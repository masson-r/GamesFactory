// =====================================================================
// Salles : face cachée, usage, révélation, cachot
// (voir le ticket "Salles : face cachée, visibilité et usage")
//
// - une salle posée montre un dos de carte ("?") à tout le monde ; son
//   propriétaire (celui qui l'a posée) la consulte via "mes salles"
// - utiliser une salle est une action du tour : un pion du joueur situé
//   dans un bâtiment qui contient une salle utilisable. peu importe qui a
//   posé la salle. une salle passive (passif: true) n'a pas d'action :
//   elle n'agit que révélée
// - utiliser une salle la révèle définitivement ; son propriétaire peut
//   aussi la révéler gratuitement à son tour
// - sous-case cachot : un pion enfermé quitte le plateau, vit dans son
//   bâtiment, compte pour son propriétaire et peut être attaqué par le pion
//   qui est dans le bâtiment
// =====================================================================

// ---------------------------------------------------------------------
// Face cachée et révélation
// ---------------------------------------------------------------------

function sallesDuJoueur(indexJoueur) {
	return batimentsConstruits.filter(b => b.salle && b.salle.proprietaire === indexJoueur);
}

// redessine le badge d'une salle : dos de carte tant qu'elle n'est pas révélée
function majBadgeSalle(salle) {
	const badge = salle.badge;
	if (!badge) return;
	badge.innerHTML = "";
	if (salle.revelee) {
		const img = document.createElement("img");
		img.src = salle.image;
		img.draggable = false;
		img.style.width = "100%";
		img.style.height = "100%";
		badge.appendChild(img);
	} else {
		badge.textContent = "?";
	}
}

// révèle une salle, définitivement, pour tous
function reveler(salle) {
	if (!salle || salle.revelee) return false;
	salle.revelee = true;
	majBadgeSalle(salle);
	return true;
}

// une salle passive n'agit que révélée, utilisable (ni elle ni son bâtiment
// cassés), et tant qu'un pion est dans le bâtiment
function salleActive(batiment) {
	if (!batiment || !batiment.salle || !batiment.case) return false;
	return !!batiment.salle.revelee && salleUtilisable(batiment) && casesOccupees.has(batiment.case.id);
}

// détruit la salle d'un bâtiment (Salle piégée, Cachot détruit...)
function detruireSalle(batiment) {
	const salle = batiment && batiment.salle;
	if (!salle) return false;
	if (salle.badge && salle.badge.remove) salle.badge.remove();
	retirerEffetsDe("salle", salle);
	batiment.salle = null;
	return true;
}

// ---------------------------------------------------------------------
// Utiliser une salle (action du tour)
// ---------------------------------------------------------------------

function contexteDeSalle(pion, batiment) {
	return creerContexte({
		joueur: Number(pion.dataset.joueur),
		source: pion,
		extra: { pion, batiment, salle: batiment.salle },
	});
}

// le Temple ninja a un passage secret intégré (pas de salle posée) : tout pion qui s'y trouve peut l'utiliser
function passageDuTemple(batiment) {
	return !!batiment && !!batiment.passage_secret && !batiment.salle && !estCasse("batiment", batiment);
}

// pions du joueur qui peuvent utiliser la salle de leur bâtiment maintenant
function pionsUtilisantSalle(indexJoueur) {
	return pionsDuJoueur(indexJoueur).filter(pion => {
		const batiment = batimentSurCase(pion.dataset.caseId);
		if (passageDuTemple(batiment)) return !etatBloquant(pion);
		if (!batiment || !salleUtilisable(batiment)) return false;
		const salle = batiment.salle;
		if (salle.passif || typeof salle.effet !== "function") return false;
		if (etatBloquant(pion)) return false;
		const ctx = contexteDeSalle(pion, batiment);
		return conditionOk(salle, ctx) && aUneCibleValide(salle, ctx);
	});
}

function peutUtiliserSalle() {
	return pionsUtilisantSalle(joueur_actif).length > 0;
}

// utilise la salle du bâtiment où se trouve le pion : la révèle, choisit la
// cible déclarée par la salle, puis appelle salle.effet(ctx)
function utiliserSalle(pion) {
	const batiment = batimentSurCase(pion.dataset.caseId);
	if (passageDuTemple(batiment)) return utiliserPassageSecret(pion, contexteDeSalle(pion, batiment)).then(() => true);
	const salle = batiment.salle;
	const ctx = contexteDeSalle(pion, batiment);

	reveler(salle);
	return choisirCible(salle, ctx).then(res => {
		if (!res.ok) return false;
		ctx.cible = res.cible;
		return lancerEffet(salle.effet, ctx, salle.name).then(() => true);
	});
}

// action "utiliser une salle" : le joueur clique sur un de ses pions
function utiliserUneSalle() {
	conteneur.innerHTML = "";
	const pions = pionsUtilisantSalle(joueur_actif);

	if (pions.length === 0) {
		message("Aucun de tes pions ne peut utiliser une salle");
		end_tour();
		return;
	}

	message("Clique sur un de tes pions pour utiliser la salle de son batiment");

	function onClickPion(e) {
		pions.forEach(p => {
			p.style.boxShadow = "none";
			p.style.cursor = "grab";
			p.removeEventListener("click", onClickPion);
		});
		utiliserSalle(e.currentTarget).then(() => end_tour());
	}

	pions.forEach(p => {
		p.style.boxShadow = "0 0 0 3px violet";
		p.style.cursor = "pointer";
		p.addEventListener("click", onClickPion);
	});
}

// ---------------------------------------------------------------------
// "Mes salles" : consultation et révélation gratuite par le propriétaire
// ---------------------------------------------------------------------

function voirMesSalles() {
	conteneur.innerHTML = "";
	const mesBatiments = sallesDuJoueur(joueur_actif);

	message("Tes salles : " + (mesBatiments.length === 0 ? "aucune" :
		mesBatiments.map(b => b.salle.name + " (" + b.name + (b.salle.revelee ? ", revelee" : ", cachee") + ")").join(" ; ")));

	mesBatiments.filter(b => !b.salle.revelee).forEach(b => {
		const bouton = document.createElement("button");
		bouton.textContent = "reveler " + b.salle.name;
		bouton.classList.add("bouton");
		bouton.addEventListener("click", () => {
			reveler(b.salle);
			voirMesSalles(); // pas d'action consommée : on reste dans ce menu
		});
		conteneur.appendChild(bouton);
	});

	const retour = document.createElement("button");
	retour.textContent = "retour";
	retour.classList.add("bouton");
	retour.addEventListener("click", () => afficherMenuTour());
	conteneur.appendChild(retour);
}

// ---------------------------------------------------------------------
// Cachot : la sous-case d'un bâtiment
// ---------------------------------------------------------------------

function pionsEnfermesDuJoueur(indexJoueur) {
	return batimentsConstruits
		.map(b => b.prisonnier)
		.filter(p => !!p && Number(p.dataset.joueur) === indexJoueur);
}

// place l'élément du pion dans le coin du bâtiment (la sous-case cachot)
function afficherPrisonnier(pion, batiment) {
	const el = batiment.element;
	if (!el) return;
	pion.style.left = (parseFloat(el.style.left) + 18) + "px";
	pion.style.top = (parseFloat(el.style.top) - 14) + "px";
}

// enferme un pion dans la sous-case cachot d'un bâtiment (un seul prisonnier
// par bâtiment). le pion quitte sa case du plateau mais reste à son propriétaire.
function enfermerPion(batiment, pion, salle) {
	if (!batiment || !pion || batiment.prisonnier) return false;

	libererCases(pion);
	pion.dataset.caseId = "cachot:" + (batiment.case ? batiment.case.id : "");
	batiment.prisonnier = pion;
	batiment.cachot_salle = salle || batiment.salle;
	afficherPrisonnier(pion, batiment);

	ajouterEffet({ nom: "enferme", portee: "pion", cible: pion, duree: "permanent", proprietaire: Number(pion.dataset.joueur) });
	return true;
}

// verdict de libération d'un prisonnier : { libere, detruit }
//  - libéré dès que lui-même, ou un pion adjacent au bâtiment (tout camp), a
//    Malin, Ingénieur, Costaud ou une puissance totale d'au moins 13
//  - avec Costaud ou une puissance d'au moins 13, le Cachot est détruit
//  - libéré aussi si son Cachot n'existe plus
function verdictLiberation(batiment) {
	const prisonnier = batiment.prisonnier;
	if (!prisonnier) return { libere: false, detruit: false };
	if (!batiment.salle || batiment.salle !== batiment.cachot_salle) return { libere: true, detruit: false };

	const voisins = batiment.case
		? casesAdjacentes(batiment.case.id).map(c => casesOccupees.get(c.id)).filter(p => !!p)
		: [];
	const candidats = [prisonnier, ...voisins];

	const detruit = candidats.some(p => !!motCle(p, "costaud") || puissanceTotale(p) >= 13);
	const ouvre = candidats.some(p => !!motCle(p, "malin") || !!motCle(p, "ingenieur"));
	return { libere: detruit || ouvre, detruit };
}

// cases libres autour d'un bâtiment où un prisonnier peut être replacé
function casesLibresAutour(batiment) {
	return casesAdjacentes(batiment.case.id).filter(c =>
		!casesOccupees.has(c.id) && c.style.backgroundColor !== "transparent"
	);
}

// le joueur clique sur une des cases proposées (une seule : choisie d'office)
function choisirParmiCases(cases, texte) {
	if (cases.length === 1) return Promise.resolve(cases[0]);
	message(texte);
	return new Promise(resolve => {
		const ecouteurs = [];
		cases.forEach(c => {
			const fn = () => {
				ecouteurs.forEach(({ el, f }) => { el.style.outline = "none"; el.style.cursor = "default"; el.removeEventListener("click", f); });
				resolve(c);
			};
			c.style.outline = "3px solid deepskyblue";
			c.style.cursor = "pointer";
			c.addEventListener("click", fn);
			ecouteurs.push({ el: c, f: fn });
		});
	});
}

function libererPrisonnier(batiment, caseEl) {
	const pion = batiment.prisonnier;
	if (!pion) return false;
	effetsSur("pion", pion, "enferme").forEach(retirerEffet);
	batiment.prisonnier = null;
	batiment.cachot_salle = null;
	deplacerPionSurCase(pion, caseEl); // le replace sur le plateau
	return true;
}

// début de tour : libère les prisonniers qui remplissent les conditions. le
// joueur actif choisit la case de sortie ; s'il n'y en a aucune, le prisonnier attend
async function traiterLiberations() {
	for (const batiment of batimentsConstruits.slice()) {
		if (!batiment.prisonnier) continue;
		const verdict = verdictLiberation(batiment);
		if (!verdict.libere) continue;

		const libres = casesLibresAutour(batiment);
		if (libres.length === 0) {
			message(batiment.prisonnier.carte.name + " pourrait sortir de " + batiment.name + " mais aucune case libre autour : il attend");
			continue;
		}

		if (verdict.detruit) detruireSalle(batiment);
		const nom = batiment.prisonnier.carte.name;
		const caseChoisie = await choisirParmiCases(libres, "Joueur " + (joueur_actif + 1) + " : ou replacer " + nom + " ?");
		libererPrisonnier(batiment, caseChoisie);
		message(nom + " est libere");
	}
}

// bonus de puissance donne par les salles passives actives selon la couleur du pion
// (Repaire rebelle : bonus_couleur: { vert: 5 }, tant qu'un pion est dans le batiment
// et que la salle est revelee)
function bonusSallesCouleur(pion) {
	let total = 0;
	batimentsConstruits.forEach(batiment => {
		const bonus = batiment.salle && batiment.salle.bonus_couleur;
		if (bonus && salleActive(batiment)) total += bonus[couleurDe(pion)] || 0;
	});
	return total;
}

// utilisables par les cartes via ctx.jeu
Object.assign(jeu, {
	reveler, salleActive, detruireSalle, enfermerPion, sallesDuJoueur, pionsEnfermesDuJoueur,
});
