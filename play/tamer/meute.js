// =====================================================================
// Meute (voir le ticket "Mot-clé Meute")
//
// quand un pion Meute ou un Chef se déplace, les pions Meute alliés qui lui
// sont reliés peuvent le suivre : ils se déplacent dans la même direction et
// d'autant de cases que lui. les suiveurs forment une chaîne de pions
// adjacents (comme les aidants d'un combat, mais sans limite de nombre ni
// de couleur). le Chef peut être suivi mais ne suit jamais. suivre ne coûte
// pas d'action : tout le groupe bouge dans la même action de déplacement.
// =====================================================================

// ce pion, qui vient de bouger, peut-il être suivi ?
function peutEtreSuivi(pion) {
	return !!motCle(pion, "meute") || !!motCle(pion, "chef");
}

// "suiveur" peut suivre "meneur" (en ignorant la position) : allié, Meute, pas Chef, libre d'agir
function peutSuivre(suiveur, meneur) {
	if (suiveur === meneur) return false;
	if (suiveur.dataset.joueur !== meneur.dataset.joueur) return false;
	if (!motCle(suiveur, "meute")) return false;
	if (motCle(suiveur, "chef")) return false; // le Chef ne suit pas
	if (etatBloquant(suiveur)) return false; // gelé ou enfermé
	if (pionBloqueParLeNoir(suiveur)) return false; // la nuit sans Nyctalope
	return true;
}

// la case où atterrirait un suiveur : sa position + le vecteur du meneur
function caseDeSuivi(suiveur, vecteur) {
	const pos = parseCellId(suiveur.dataset.caseId);
	if (!pos) return null;
	return document.getElementById(cellIdDepuisGlobal(pos.ligne + vecteur.dLigne, pos.colonne + vecteur.dColonne));
}

// la case existe, n'est pas un trou (sauf pour qui vole), et le suiveur peut y entrer
function destinationPossible(suiveur, caseEl) {
	if (!caseEl) return false;
	if (caseEl.style.backgroundColor === "transparent" && !motCle(suiveur, "vol")) return false;
	if (motCle(suiveur, "claustrophobe") && batimentSurCase(caseEl.id)) return false;
	if (!deplacementAutorise(suiveur, suiveur.dataset.caseId, caseEl.id)) return false; // terrain.js
	return peutEntrerSurCase(suiveur, caseEl.id); // noir.js
}

// le vecteur de déplacement entre deux cases (en cases du plateau)
function vecteurDeDeplacement(caseDepartId, caseArriveeId) {
	const a = parseCellId(caseDepartId);
	const b = parseCellId(caseArriveeId);
	if (!a || !b) return null;
	return { dLigne: b.ligne - a.ligne, dColonne: b.colonne - a.colonne };
}

// pions qu'on peut encore ajouter aux suiveurs : alliés Meute reliés à la case
// de départ du meneur (ou à un suiveur déjà retenu) qui ont une destination possible
function candidatsSuiveurs(meneur, caseDepartId, vecteur, choisis) {
	const voisinsDuDepart = casesAdjacentes(caseDepartId).map(c => c.id);
	const resultat = [];
	pionsSurPlateau().forEach(pion => {
		if (choisis.includes(pion) || !peutSuivre(pion, meneur)) return;
		if (!destinationPossible(pion, caseDeSuivi(pion, vecteur))) return;
		const relie = voisinsDuDepart.includes(pion.dataset.caseId) || choisis.some(s => sontAdjacents(pion, s));
		if (relie) resultat.push(pion);
	});
	return resultat;
}

// ne garde que les suiveurs encore reliés à la case de départ par une chaîne
function elaguerSuiveurs(caseDepartId, choisis) {
	const voisinsDuDepart = casesAdjacentes(caseDepartId).map(c => c.id);
	const relies = [];
	let ajoute = true;
	while (ajoute) {
		ajoute = false;
		choisis.forEach(pion => {
			if (relies.includes(pion)) return;
			if (voisinsDuDepart.includes(pion.dataset.caseId) || relies.some(r => sontAdjacents(pion, r))) {
				relies.push(pion);
				ajoute = true;
			}
		});
	}
	return relies;
}

// le joueur choisit qui suit (même interface que les aidants du combat)
function choisirSuiveurs(meneur, caseDepartId, vecteur) {
	return choisirGroupe({
		principal: meneur,
		indexChoisisseur: Number(meneur.dataset.joueur),
		limite: Infinity,
		candidats: (choisis) => candidatsSuiveurs(meneur, caseDepartId, vecteur, choisis),
		elaguer: (choisis) => elaguerSuiveurs(caseDepartId, choisis),
		libelle: (nb) => "qui suit " + meneur.carte.name + " ? (" + nb + " choisi(s))",
	});
}

// fait suivre les suiveurs : le plus en avant (le long du vecteur) d'abord, pour
// libérer la place de ceux de derrière. renvoie ceux qui n'ont pas pu bouger.
function deplacerSuiveurs(suiveurs, vecteur) {
	const devant = (pion) => {
		const p = parseCellId(pion.dataset.caseId);
		return p.ligne * vecteur.dLigne + p.colonne * vecteur.dColonne;
	};
	const bloques = [];
	suiveurs.slice().sort((a, b) => devant(b) - devant(a)).forEach(suiveur => {
		const cible = caseDeSuivi(suiveur, vecteur);
		if (destinationPossible(suiveur, cible) && !casesOccupees.has(cible.id)) {
			deplacerPionSurCase(suiveur, cible);
		} else {
			bloques.push(suiveur);
		}
	});
	return bloques;
}

// après le déplacement d'un pion : si c'est un Meute ou un Chef, ses suiveurs
// éventuels le suivent. promesse terminée quand tout le monde a bougé.
// "selecteur" permet de remplacer le choix du joueur (tests)
async function suivreMeute(meneur, caseDepartId, selecteur = choisirSuiveurs) {
	if (!caseDepartId || !peutEtreSuivi(meneur)) return;

	const vecteur = vecteurDeDeplacement(caseDepartId, meneur.dataset.caseId);
	if (!vecteur || (vecteur.dLigne === 0 && vecteur.dColonne === 0)) return;

	const suiveurs = await selecteur(meneur, caseDepartId, vecteur);
	if (suiveurs.length === 0) return;

	const bloques = deplacerSuiveurs(suiveurs, vecteur);
	message(meneur.carte.name + " est suivi par " + (suiveurs.length - bloques.length) + " pion(s)" +
		(bloques.length > 0 ? " (" + bloques.length + " bloque(s))" : ""));
}


// Tronc-mobile (item avec second_deplacement: true) : apres avoir bouge, le porteur peut faire un
// 2e deplacement d'une case dans la meme direction. renvoie true s'il l'a fait
async function secondDeplacement(pion, caseDepartId) {
	if (!caseDepartId || !itemsDe(pion).some(item => item.second_deplacement)) return false;
	const v = vecteurDeDeplacement(caseDepartId, pion.dataset.caseId);
	if (!v || (v.dLigne === 0 && v.dColonne === 0)) return false;

	const pas = { dLigne: Math.sign(v.dLigne), dColonne: Math.sign(v.dColonne) };
	const cible = caseDeSuivi(pion, pas);
	if (!destinationPossible(pion, cible) || casesOccupees.has(cible.id)) return false;

	const oui = await jeu.demanderChoix(Number(pion.dataset.joueur), "un 2e deplacement dans la meme direction ?",
		[{ label: "oui", valeur: true }, { label: "non", valeur: false }]);
	if (!oui) return false;
	deplacerPionSurCase(pion, cible);
	return true;
}
