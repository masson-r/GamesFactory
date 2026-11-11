tour_mage = {
	image: "",
	name: "tour de mage",
	type: "batiment",
	lanceur: "orthogonal",
	lanceur_dernier_entre: true,
	prix: 3,
	cout_construction: 4,
	mot_cle: {
		constructeur: false,
		costaud: false,
		agile: false,
		tireur: false,
		rapide: false,
		vol: false,
		belier: false, 
		sous_terre: false,
		fort_esprit: false,
		claustrophobe: false,
		courageux: false,
		analphabete: false,
		peur_sang: false,
		meute: false,
		nyctalope: false,
		malin: false,
		ingenieur: false,
		chef: false,
		electrique: false,
		fragile: false,
		casser: false
	},
	salle: null,
	pouvoir: false,
	puissance: 0
}

magicien = {
	image: "",
	name: "magicien",
	type: "pion",
	lanceur: "orthogonal_diagonal",
	couleur: "orange",
	mot_cle: {
		constructeur: false,
		costaud: false,
		agile: false,
		tireur: 1,
		rapide: false,
		vol: false,
		belier: false, 
		sous_terre: false,
		fort_esprit: false,
		claustrophobe: false,
		courageux: false,
		analphabete: false,
		peur_sang: false,
		meute: false,
		nyctalope: false,
		malin: false,
		ingenieur: false,
		chef: false,
		electrique: false,
		fragile: false,
		casser: false
	},
	item: [],
	pouvoir: false,
	puissance: 6
}

freeze = {
	image: "freeze",
	name: "freeze",
	type: "sort",
	effet: sort_freeze
}

fireball = {
	image: "",
	name: "fireball",
	type: "sort",
	// tue une cible de puissance 8 ou moins
	cible: { type: "pion", filtre: (pion) => puissanceTotale(pion) <= 8 },
	effet: sort_fireball
}

cachot = {
	image: "fleche_droite.png",
	name: "cachot",
	type: "salle",
	// enferme une unité de puissance 10 ou moins, adjacente au bâtiment
	cible: { type: "pion", filtre: cachot_filtre },
	effet: effet_cachot
}

// Freeze : la cible ne peut plus rien faire (état "gelé", pas Fragile) ; elle est
// libérée par un Costaud ou un pion de puissance supérieure à 10 à côté d'elle
function sort_freeze(ctx) {
	ctx.jeu.poserGel(ctx.cible, ctx.joueur);
	ctx.jeu.message(ctx.cible.carte.name + " est gele");
}

function sort_fireball(ctx) {
	ctx.jeu.message("Fireball tue " + ctx.cible.carte.name);
	ctx.jeu.detruirePion(ctx.cible);
}

// la cible du Cachot : puissance totale 10 ou moins, sur une case voisine du bâtiment
function cachot_filtre(pion, ctx) {
	if (puissanceTotale(pion) > 10) return false;
	return ctx.jeu.casesAdjacentes(ctx.batiment.case.id).some(c => c.id === pion.dataset.caseId);
}

// Cachot : le pion est déplacé dans la sous-case du bâtiment. libération, destruction
// du Cachot et replacement sont gérés par salles.js (traiterLiberations)
function effet_cachot(ctx) {
	ctx.jeu.enfermerPion(ctx.batiment, ctx.cible, ctx.salle);
	ctx.jeu.message(ctx.cible.carte.name + " est enferme dans le cachot");
}
