chose = {
	image: "",
	name: "la chose",
	type: "pion",
	inattaquable: { distance: true, couleurs: ["vert"] },
	couleur: "orange",
	mot_cle: {
		constructeur: false,
		costaud: false,
		agile: true,
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
		nyctalope: true,
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

white_house = {
	image: "",
	name: "white house",
	type: "batiment",
	declencheurs: { a_la_pose: white_house_a_la_pose },
	prix: 2,
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

sceptre = {
	image: "chose\\sceptre.png",
	name: "sceptre blanc",
	type: "item",
	requiert: "nyctalope",
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
	pouvoir: false,
	puissance: 3
}

lunette = {
	image: "chose\\lunette.png",
	name: "lunette blanche",
	type: "item",
	emplacement: "tete",
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
		nyctalope: true,
		malin: false,
		ingenieur: false,
		chef: false,
		electrique: false,
		fragile: false,
		casser: false
	},
	pouvoir: false,
	puissance: 0
}

demence = {
	image: "",
	name: "demence",
	type: "sort",
	effet: sort_demence
}

// La Chose : ni attaquee a distance ni par un vert (inattaquable, voir combat.js)

// The White House : un noir eternel, jamais reparable
function white_house_a_la_pose(ctx) {
	ctx.jeu.plongerBatimentDansLeNoir(ctx.batiment, true);
}

// Demence : on retourne des cartes du paquet non joue (les familles que personne n'a choisies)
// jusqu'a tomber sur une unite ; la cible perd tous ses mots-cles et prend ceux de cette carte.
// s'il n'y a aucune unite, elle devient Analphabete
function sort_demence(ctx) {
	const pioche = [];
	liste_famille.forEach(famille => famille.cartes.forEach(carte => {
		if (carte.type === "pion") pioche.push(carte);
	}));

	const tiree = pioche.length > 0 ? pioche[Math.floor(Math.random() * pioche.length)] : null;
	const mots = tiree ? Object.assign({}, tiree.mot_cle) : { analphabete: true };

	effetsSur("pion", ctx.cible, "demence").forEach(e => ctx.jeu.retirerEffet(e));
	ctx.jeu.ajouterEffet({
		nom: "demence", portee: "pion", cible: ctx.cible, duree: "permanent",
		proprietaire: Number(ctx.cible.dataset.joueur), donnees: { mots, carte: tiree ? tiree.name : null },
	});
	ctx.jeu.message(ctx.cible.carte.name + " perd la raison" + (tiree ? " et prend les mots-cles de " + tiree.name : " et devient analphabete"));
}
