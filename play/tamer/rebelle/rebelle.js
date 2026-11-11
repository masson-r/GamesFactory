blink_americain = {
	image: "rebelle\\blink_americain.png",
	name: "blink americain",
	type: "pion",
	declencheurs: { a_la_pose: pose_blink_americain },
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
		analphabete: true,
		peur_sang: false,
		meute: false,
		nyctalope: false,
		malin: true,
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

papillon = {
	image: "rebelle\\papillon.png",
	name: "papillon",
	type: "pion",
	cible: { type: "pion_ennemi", filtre: papillon_filtre },
	partageCase: true,
	couleur: "vert",
	mot_cle: {
		constructeur: false,
		costaud: false,
		agile: true,
		tireur: false,
		rapide: 3,
		vol: true,
		belier: false, 
		sous_terre: false,
		fort_esprit: false,
		claustrophobe: false,
		courageux: false,
		analphabete: true,
		peur_sang: true,
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
	pouvoir: pouvoir_papillon,
	puissance: 1
}

pasteque = {
	image: "rebelle\\pasteque.png",
	name: "pasteque",
	type: "pion",
	attaquable_par: [3, 5],
	couleur: "vert",
	mot_cle: {
		constructeur: false,
		costaud: false,
		agile: true,
		tireur: false,
		rapide: 2,
		vol: false,
		belier: false, 
		sous_terre: false,
		fort_esprit: false,
		claustrophobe: false,
		courageux: false,
		analphabete: true,
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
	puissance: 1
}

goulag_man = {
	image: "rebelle\\goulag_man.png",
	name: "goulag man",
	type: "pion",
	couleur: "vert",
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
	puissance: 4
}

repaire = {
	image: "rebelle\\repaire.png",
	name: "repaire rebelle",
	type: "salle",
	passif: true,
	bonus_couleur: { vert: 5 }
}

// Blink americain : a sa pose, pioche gratuitement un blink du magasin (dans sa main)
async function pose_blink_americain(ctx) {
	await ctx.jeu.piocherBlink(ctx.joueur);
}

// Papillon : endort un pion ennemi qui partage SA case (il peut se poser sur la case d'un autre pion).
// Endormi = meme etat que gele ; il se reveille quand un pion de son proprietaire bouge a cote de lui
// (voir reveillerEndormis dans moteur.js).
function papillon_filtre(pion, ctx) {
	return pion !== ctx.source && pion.dataset.caseId === ctx.source.dataset.caseId;
}

function pouvoir_papillon(ctx) {
	ctx.jeu.ajouterEffet({
		nom: "endormi", portee: "pion", cible: ctx.cible,
		duree: { type: "condition", condition: (c, effet) => !!effet.donnees.reveille },
		proprietaire: Number(ctx.cible.dataset.joueur), donnees: { reveille: false },
	});
	ctx.jeu.message(ctx.cible.carte.name + " s'endort");
}

// Repaire rebelle (salle passive, voir salles.js) : tant qu'un pion est dans le batiment et que la
// salle est revelee, tout pion vert gagne +5 (bonus_couleur, applique par puissanceTotale)
