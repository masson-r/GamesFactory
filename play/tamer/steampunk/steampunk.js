outils_steampunk = {
	image: "steampunk\\outils_steampunk.png",
	name: "outils steampunk",
	type: "item",
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
	puissance: 0
}

bougie = {
	image: "steampunk\\bougie.png",
	name: "bougie",
	type: "item",
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

pistolet_rouage = {
	image: "steampunk\\pistolet_rouage.png",
	name: "pistolet rouage",
	type: "item",
	requiert: "malin",
	mot_cle: {
		constructeur: false,
		costaud: false,
		agile: false,
		tireur: 2,
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

homme_riche = {
	image: "steampunk\\homme_riche.png",
	name: "homme riche",
	type: "pion",
	couleur: "vert",
	mot_cle: {
		constructeur: 2,
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
		peur_sang: true,
		meute: false,
		nyctalope: false,
		malin: true,
		ingenieur: true,
		chef: false,
		electrique: false,
		fragile: false,
		casser: false
	},
	item: [],
	pouvoir: false,
	puissance: 5
}

salle_piege = {
	image: "steampunk\\salle_piege.png",
	name: "salle piege",
	type: "salle",
	effet: effet_piege
}

// Salle piégée : si celui qui l'utilise (n'importe quel joueur, même son propriétaire)
// n'est pas Malin, la salle explose : il meurt et la salle est détruite (le
// bâtiment reste). un Malin l'utilise sans danger ; elle est révélée dans les deux cas
function effet_piege(ctx) {
	if (motCle(ctx.pion, "malin")) {
		ctx.jeu.message(ctx.pion.carte.name + " est malin : il desamorce la salle piegee");
		return;
	}
	ctx.jeu.message("La salle piegee explose et tue " + ctx.pion.carte.name);
	ctx.jeu.detruirePion(ctx.pion);
	ctx.jeu.detruireSalle(ctx.batiment);
}
