// =====================================================================
// Sources et portée des sorts (voir le ticket "Ciblage et portée des sorts")
//
// un joueur lance un sort sur une cible située dans la réunion des zones
// de ses sources :
//   - sa base (ligne et colonne de la case sous la base), tant qu'elle
//     n'est pas détruite
//   - chaque carte portant le champ lanceur ("orthogonal" ou
//     "orthogonal_diagonal") : un pion, ou un item (la source est alors son
//     porteur)
//   - un bâtiment qui porte lanceur et lanceur_dernier_entre: true (Tour de
//     mage) : le propriétaire de la dernière unité entrée, tant qu'elle est
//     toujours dans le bâtiment
// les zones ne sont pas bloquées par les pions, vont jusqu'au bord du
// plateau, et incluent les cases "trou" ainsi que la case de la source.
// =====================================================================

// la dernière unité entrée dans ce bâtiment est-elle toujours dedans ?
function dernierEntreValide(batiment) {
	const pion = batiment.dernier_entre;
	return !!pion && !!batiment.case && pionSurPlateau(pion) && pion.dataset.caseId === batiment.case.id;
}

// toutes les sources de sorts d'un joueur : { caseId, portee }
function sourcesDeSorts(indexJoueur) {
	const sources = [];

	// 1. la base
	const joueur = joueurs[indexJoueur];
	if (joueur && !joueur.base_destroy) {
		const caseBase = caseSousBase(indexJoueur);
		if (caseBase) sources.push({ caseId: caseBase.id, portee: "orthogonal" });
	}

	// 2. les pions lanceurs, et les pions qui portent un item lanceur
	pionsDuJoueur(indexJoueur).forEach(pion => {
		[pion.carte, ...itemsDe(pion)].forEach(carte => {
			if (carte && carte.lanceur) sources.push({ caseId: pion.dataset.caseId, portee: carte.lanceur });
		});
	});

	// 3. les bâtiments à "dernier entré" (Tour de mage) dont le dernier entré est à ce joueur
	batimentsConstruits.forEach(batiment => {
		if (!batiment.lanceur || !batiment.lanceur_dernier_entre) return;
		if (!dernierEntreValide(batiment)) return;
		if (Number(batiment.dernier_entre.dataset.joueur) !== indexJoueur) return;
		sources.push({ caseId: batiment.case.id, portee: batiment.lanceur });
	});

	return sources;
}

// les ids de cases touchées depuis une case : toute sa ligne et toute sa
// colonne, plus ses diagonales si portee vaut "orthogonal_diagonal"
function idsDansLaPortee(caseId, portee) {
	const origine = parseCellId(caseId);
	if (!origine) return [];

	const ids = [];
	document.querySelectorAll('#plateau [id^="cell-"]').forEach(c => {
		const p = parseCellId(c.id);
		if (!p) return;
		const dLigne = Math.abs(p.ligne - origine.ligne);
		const dColonne = Math.abs(p.colonne - origine.colonne);
		const enLigneOuColonne = dLigne === 0 || dColonne === 0;
		const enDiagonale = dLigne === dColonne;
		if (enLigneOuColonne || (portee === "orthogonal_diagonal" && enDiagonale)) ids.push(c.id);
	});
	return ids;
}

// la zone totale où le joueur peut lancer un sort : Set d'ids de cases
function zoneDeSorts(indexJoueur) {
	const zone = new Set();
	sourcesDeSorts(indexJoueur).forEach(source => {
		idsDansLaPortee(source.caseId, source.portee).forEach(id => zone.add(id));
	});
	return zone;
}

// vrai si la carte ne vise personne, ou s'il existe au moins une cible valide
function aUneCibleValide(carte, ctx) {
	return normaliserCible(carte).type === "aucune" || candidatsCible(carte, ctx).length > 0;
}
