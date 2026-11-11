// =====================================================================
// Mise en place : connexion des biomes (voir le ticket "Mise en place :
// familles et biomes")
//
// chaque quart de joueur doit être relié par un chemin de cases non-trou
// (marchable, sans voler) au quart du joueur précédent : J2 à J1, J3 à J2,
// J4 à J3. on teste les biomes de coin (les biomes de base, toujours pleins),
// qui sont reliés entre eux seulement si les pièces posées entre eux
// laissent un passage.
// =====================================================================

// y a-t-il un chemin entre un des "departs" et un des "arrivees" ?
// estMarchable(id) -> booléen ; voisins(id) -> ids adjacents
function cheminExiste(departs, arrivees, estMarchable, voisins) {
	const cibles = new Set(arrivees);
	const vus = new Set();
	const file = [];

	departs.forEach(id => {
		if (estMarchable(id) && !vus.has(id)) { vus.add(id); file.push(id); }
	});

	while (file.length > 0) {
		const id = file.shift();
		if (cibles.has(id)) return true;
		voisins(id).forEach(v => {
			if (!vus.has(v) && estMarchable(v)) { vus.add(v); file.push(v); }
		});
	}
	return false;
}

// toutes les façons d'ordonner une liste
function permutations(liste) {
	if (liste.length <= 1) return [liste.slice()];
	const resultat = [];
	liste.forEach((element, i) => {
		const reste = liste.slice(0, i).concat(liste.slice(i + 1));
		permutations(reste).forEach(p => resultat.push([element, ...p]));
	});
	return resultat;
}

// les 9 ids de cases du biome de base d'un joueur (un coin du plateau)
function idsBlocDeBase(indexJoueur) {
	const { row, col } = blocsJoueurs[indexJoueur];
	const ids = [];
	for (let r = 1; r <= 3; r++) {
		for (let c = 1; c <= 3; c++) ids.push("cell-" + row + "-" + col + "-" + r + "-" + c);
	}
	return ids;
}

// une case est marchable si elle existe et n'est pas un trou (transparente)
function caseMarchable(id) {
	const el = document.getElementById(id);
	if (!el) return false;
	const couleur = el.style.backgroundColor;
	return couleur !== "" && couleur !== "transparent";
}

function voisinsMarchables(id) {
	return casesAdjacentes(id).map(c => c.id);
}

// le biome de base du joueur est relié à celui du joueur précédent par un
// chemin de cases marchables (le joueur 1 n'a pas de précédent)
function connecteAuJoueurPrecedent(indexJoueur) {
	if (indexJoueur === 0) return true;
	return cheminExiste(idsBlocDeBase(indexJoueur), idsBlocDeBase(indexJoueur - 1), caseMarchable, voisinsMarchables);
}
