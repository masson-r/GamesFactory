test = {
	image: "fleche_droite.png",
	name: "flèche",
	type: "pion",
	couleur: "rouge",
	mot_cle: {
		constructeur: 1,
		costaud: true,
		agile: true,
		tireur: 1,
		rapide: 1,
		vol: true,
		belier: true, 
		sous_terre: true,
		fort_esprit: false,
		claustrophobe: false,
		courageux: false,
		analphabete: false,
		peur_sang: false,
		meute: true,
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
	puissance: 7
}

test_batiment = {
	image: "fleche_droite.png",
	name: "tente",
	type: "batiment",
	mobile_vertical: true, // se deplace d'une case vers le haut ou le bas, comme un pion (action "deplacer la tente")
	prix: 1,
	cout_construction: 2,
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

test_item = {
	image: "fleche_droite.png",
	name: "bouton",
	type: "item",
	retire_mots_cles: ["analphabete"], // son porteur n'est plus Analphabete (voir motCleBrut, moteur.js)
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
		malin: true,
		ingenieur: true,
		chef: false,
		electrique: false,
		fragile: false,
		casser: false
	},
	pouvoir: false,
	puissance: 3
}

test_sort = {
	image: "fleche_droite.png",
	name: "ligne",
	type: "sort",
	cible: "case",
	effet: sort_ligne
}

test_salle = {
	image: "fleche_droite.png",
	name: "triangle",
	type: "salle",
	effet: function_test
}

test_event = {
	image: "fleche_droite.png",
	name: "trianguler",
	type: "evenement",
	cible: { type: "batiment", filtre: (batiment) => !!batiment.salle },
	effet: event_trianguler
}

vendre = {
	image: "fleche_gauche.png",
	name: "vendre",
	type: "pion",
	couleur: "rouge",
	mot_cle: {
		constructeur: 10,
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
	item: [],
	pouvoir: function_test,
	puissance: 1
}

// Ligne : tue tous les pions de la ligne de la case visee, a gauche comme a droite
function sort_ligne(ctx) {
	const origine = parseCellId(ctx.cible.id);
	const victimes = pionsSurPlateau().filter(pion => {
		const p = parseCellId(pion.dataset.caseId);
		return p && casesDuPion(pion).some(id => parseCellId(id).ligne === origine.ligne);
	});
	victimes.forEach(pion => ctx.jeu.detruirePion(pion));
	ctx.jeu.message("Ligne tue " + victimes.length + " pion(s)");
}

// Trianguler : le joueur regarde la salle d'un batiment sans y etre ; elle reste cachee pour les autres
function event_trianguler(ctx) {
	const batiment = ctx.cible;
	ctx.jeu.message("Trianguler : la salle de " + batiment.name + " est " + batiment.salle.name);
}

function function_test() {
	console.log("pouvoir activé")
}

// tous les mots-cles a faux : modele pour creer une carte (blinks.js, robot/robot.js)
function motsClesVides() {
	return {
		constructeur: false, costaud: false, agile: false, tireur: false, rapide: false,
		vol: false, belier: false, sous_terre: false, fort_esprit: false, claustrophobe: false,
		courageux: false, analphabete: false, peur_sang: false, meute: false, nyctalope: false,
		malin: false, ingenieur: false, chef: false, electrique: false, fragile: false, casser: false,
	};
}
