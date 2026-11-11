// =====================================================================
// Règles de terrain portées par les bâtiments (Muret, Lac de poison...)
//
// un bâtiment peut déclarer sur sa carte :
//   peut_entrer(pion, departId, arriveeId) -> booléen : qui peut entrer sur sa case, et d'où
//   peut_sortir(pion, arriveeId, departId) -> booléen : qui peut en sortir, et vers où
//   malus_defense : puissance retirée au pion attaqué qui se trouve sur sa case
// seuls les déplacements normaux et les suivis de Meute les consultent.
// =====================================================================

// le pion peut-il passer de la case de départ à la case d'arrivée ?
function deplacementAutorise(pion, departId, arriveeId) {
	const sortie = batimentSurCase(departId);
	if (sortie && typeof sortie.peut_sortir === "function" && !sortie.peut_sortir(pion, arriveeId, departId)) return false;

	const entree = batimentSurCase(arriveeId);
	if (entree && typeof entree.peut_entrer === "function" && !entree.peut_entrer(pion, departId, arriveeId)) return false;

	return true;
}

// puissance retirée à un pion attaqué selon le bâtiment sur lequel il se trouve
function malusDefenseTerrain(pion) {
	const batiment = batimentSurCase(pion.dataset.caseId);
	return (batiment && batiment.malus_defense) || 0;
}
