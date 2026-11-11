psychopate = {
	image: "film_horreur\\psychopate.png",
	name: "psychopate",
	type: "pion",
	pose_noir: true,
	couleur: "vert",
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
		courageux: true,
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
	puissance: 5
}

machette = {
	image: "film_horreur\\machette.png",
	name: "machette",
	type: "item",
	bonus_attaque: 2,
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
	pouvoir: false,
	puissance: 0
}

bruit_suspect = {
	image: "film_horreur\\bruit_suspect.png",
	name: "bruit suspect",
	type: "evenement",
	cible: "pion",
	effet: event_suspect
}

maison_hante = {
	image: "film_horreur\\maison_hante.png",
	name: "maison hante",
	type: "batiment",
	declencheurs: { debut_tour: maison_hantee_debut_tour },
	prix: 1,
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

panne_courant = {
	image: "film_horreur\\panne_courant.png",
	name: "panne courant",
	type: "evenement",
	cible: "batiment",
	effet: event_panne
}

// Machette : +2 en attaque (bonus_attaque)

// Bruit suspect : la cible gagne Claustrophobe (un Courageux l'ignore)
function event_suspect(ctx) {
	ctx.jeu.accorderMotCle(ctx.cible, "claustrophobe", true, "permanent", ctx.joueur);
	ctx.jeu.message(ctx.cible.carte.name + " devient claustrophobe");
}

// Maison hantee : tout personnage qui commence son tour dedans gagne Claustrophobe pendant 1 tour
function maison_hantee_debut_tour(ctx) {
	const pion = ctx.jeu.casesOccupees.get(ctx.batiment.case.id);
	if (!pion || Number(pion.dataset.joueur) !== ctx.jeu.joueurActif) return;
	ctx.jeu.accorderMotCle(pion, "claustrophobe", true, { type: "n_tours", n: 1 }, Number(pion.dataset.joueur));
}

// Coupure de courant : un batiment est plonge dans le noir (jusqu'a reparation par un Ingenieur) ;
// si c'est une machine electrique, il est casse a la place
function event_panne(ctx) {
	const batiment = ctx.cible;
	if (ctx.jeu.estMachine(batiment)) {
		ctx.jeu.casser("batiment", batiment, ctx.joueur);
		ctx.jeu.message(batiment.name + " tombe en panne");
	} else {
		ctx.jeu.plongerBatimentDansLeNoir(batiment, false);
		ctx.jeu.message(batiment.name + " est plonge dans le noir");
	}
}
