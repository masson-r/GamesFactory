ninja = {
	image: "ninja\\ninja.png",
	name: "ninja",
	type: "pion",
	condition: ninja_dans_un_batiment,
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
	pouvoir: pouvoir_ninja,
	puissance: 4
}

passage_secret = {
	image: "",
	name: "passage secret",
	type: "salle",
	passage_secret: true,
	effet: effet_passage
}

temple = {
	image: "ninja\\temple.png",
	name: "temple ninja",
	type: "batiment",
	passage_secret: true,
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

katana = {
	image: "ninja\\katana.png",
	name: "katana",
	type: "item",
	bonus_si_plus_faible: 2,
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

// Katana : +2 si la puissance de base du porteur est plus petite que celle de l'adversaire (combat.js)

// un batiment est equipe d'un passage secret : le Temple ninja, ou une salle Passage secret utilisable
function batimentAPassageSecret(batiment) {
	if (batiment.passage_secret) return true;
	return !!(batiment.salle && batiment.salle.passage_secret && salleUtilisable(batiment));
}

// le Ninja utilise le passage secret depuis n'importe quel batiment
// (depuis la main, sans pion source : il se joue librement ; la condition ne porte que sur son pouvoir)
function ninja_dans_un_batiment(ctx) {
	if (!ctx.source) return true;
	return !!ctx.source && !!batimentSurCase(ctx.source.dataset.caseId);
}

// Passage secret : le pion va sur la case libre d'un autre batiment equipe d'un passage secret,
// ou sur une case libre de sa base, au choix du joueur
async function utiliserPassageSecret(pion, ctx) {
	const depart = pion.dataset.caseId;
	const destinations = [];
	ctx.jeu.batiments.forEach(b => {
		if (b.case && b.case.id !== depart && batimentAPassageSecret(b) && !ctx.jeu.casesOccupees.has(b.case.id)) {
			destinations.push(b.case);
		}
	});
	casesLibresDeLaBase(Number(pion.dataset.joueur)).forEach(c => {
		if (c.id !== depart && !destinations.includes(c)) destinations.push(c);
	});

	if (destinations.length === 0) {
		ctx.jeu.message("Aucune destination pour le passage secret");
		return;
	}
	const choisie = await choisirParmiCases(destinations, "Joueur " + (Number(pion.dataset.joueur) + 1) + " : ou va " + pion.carte.name + " ?");
	ctx.jeu.deplacerPionSurCase(pion, choisie);
}

function effet_passage(ctx) {
	return utiliserPassageSecret(ctx.pion, ctx);
}

function pouvoir_ninja(ctx) {
	return utiliserPassageSecret(ctx.source, ctx);
}
