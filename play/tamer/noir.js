// =====================================================================
// Système noir / lumière (voir le ticket "Système noir / lumière")
//
// - tout est éclairé par défaut ; le noir est un effet actif nommé "noir"
//   posé sur une case, un bâtiment ou le plateau entier
// - un effet de plateau (la nuit de "Pardon ?") rend noires toutes les
//   cases hors bâtiments
// - un pion est "dans le noir" si sa case est noire ou si son bâtiment est noir
// - un pion sans Nyctalope sur une case noire du plateau ne peut ni se
//   déplacer ni attaquer à distance
// - un pion sans Nyctalope ne peut pas entrer dans un bâtiment noir (mais
//   peut en sortir)
// =====================================================================

function elementDeCase(caseId) {
	return document.getElementById(caseId);
}

function batimentEstNoir(batiment) {
	return !!batiment && aEffet("noir", "batiment", batiment);
}

// case noire du plateau : effet "noir" sur la case, ou nuit du plateau sur
// une case qui n'est pas dans un bâtiment
function caseNoireDuPlateau(caseEl) {
	if (!caseEl) return false;
	if (aEffet("noir", "case", caseEl)) return true;
	return aEffet("noir", "plateau") && !batimentSurCase(caseEl.id);
}

// une case est dans le noir si elle est noire, ou si son bâtiment l'est
function caseDansLeNoir(caseId) {
	if (caseNoireDuPlateau(elementDeCase(caseId))) return true;
	return batimentEstNoir(batimentSurCase(caseId));
}

function estDansLeNoir(pion) {
	return !!pion && !!pion.dataset && caseDansLeNoir(pion.dataset.caseId);
}

// le noir empêche ce pion de bouger et d'attaquer à distance : sans
// Nyctalope, sur une case noire du plateau (pas dans un bâtiment noir)
function pionBloqueParLeNoir(pion) {
	if (motCle(pion, "nyctalope")) return false;
	return caseNoireDuPlateau(elementDeCase(pion.dataset.caseId));
}

// un pion peut entrer sur cette case : tout bâtiment noir exige Nyctalope
function peutEntrerSurCase(pion, caseId) {
	const batiment = batimentSurCase(caseId);
	if (!batiment || !batimentEstNoir(batiment)) return true;
	return !!motCle(pion, "nyctalope");
}

// ---- poser et lever le noir ----

// la nuit : dure un tour complet, jusqu'au début du prochain tour du joueur
// qui l'a jouée
function poserNuit(proprietaire) {
	return ajouterEffet({
		nom: "noir", portee: "plateau", duree: { type: "n_tours", n: 1 },
		proprietaire: (proprietaire === undefined) ? joueur_actif : proprietaire,
	});
}

// plonge un bâtiment dans le noir jusqu'à réparation ; éternel : jamais réparable
function plongerBatimentDansLeNoir(batiment, eternel = false) {
	return ajouterEffet({
		nom: "noir", portee: "batiment", cible: batiment,
		duree: "permanent", donnees: { eternel: !!eternel },
	});
}

// rallume un bâtiment (réparation). renvoie false si le noir est éternel
// ou s'il n'y avait pas de noir à lever
function rallumerBatiment(batiment) {
	const noirs = effetsSur("batiment", batiment, "noir");
	if (noirs.length === 0 || noirs.some(e => e.donnees && e.donnees.eternel)) return false;
	noirs.forEach(retirerEffet);
	return true;
}

// ---- pose d'un pion dans un bâtiment noir (Psychopathe) ----

// cases où le joueur peut poser ce pion depuis sa main : sa base, plus tout
// bâtiment noir du plateau si la carte porte pose_noir: true
function casesPosablesPour(carte, indexJoueur) {
	let cases = Array.from(casesDuJoueur(indexJoueur));
	// un grand pion (Dinosaure, Robot) doit tenir en entier dans la base
	if (empreinteDe(carte).length > 1) {
		const idsBase = new Set(cases.map(c => c.id));
		return cases.filter(c => {
			const ids = idsEmpreinte(c.id, carte);
			return !!ids && ids.every(id => idsBase.has(id));
		});
	}
	if (carte.pose_noir) {
		batimentsConstruits.forEach(b => {
			if (b.case && batimentEstNoir(b) && !cases.includes(b.case)) cases.push(b.case);
		});
	}
	return cases;
}

// ---- rendu ----

// assombrit visuellement les cases dans le noir
function rafraichirRenduNoir() {
	document.querySelectorAll('#plateau [id^="cell-"]').forEach(c => {
		const trou = c.style.backgroundColor === "transparent";
		c.style.filter = (!trou && caseDansLeNoir(c.id)) ? "brightness(0.35)" : "none";
	});
}

// le noir est utilisable par les cartes via ctx.jeu
Object.assign(jeu, {
	poserNuit, plongerBatimentDansLeNoir, rallumerBatiment,
	estDansLeNoir, caseDansLeNoir, batimentEstNoir,
});
