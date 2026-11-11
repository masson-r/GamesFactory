ours_costard = {
	image: "",
	name: "ours en costard",
	type: "pion",
	couleur: "orange",
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
	puissance: 6
}

boucli_feuille = {
	image: "",
	name: "boucli-feuille",
	type: "item",
	bonus_defense: 5,
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

arbre_abri = {
	image: "",
	name: "arbre abri",
	type: "batiment",
	mots_cles_occupant: { peur_sang: true },
	sans_salle: true,
	prix: 0,
	cout_construction: 0,
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

tronc_mobile = {
	image: "",
	name: "tronc mobile",
	type: "item",
	second_deplacement: true,
	explose_si_attaque_min: 15,
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

cochi_fi_ca_tion = {
	image: "",
	name: "cochi-fi-ca-tion",
	type: "sort",
	effet: sort_cochi_fi_ca_tion
}

// Boucli-feuille : +5 en defense (bonus_defense)
// Arbre abri : le personnage dedans gagne Peur du sang (mots_cles_occupant, lu par motCle)
// Tronc-mobile : un 2e deplacement dans la meme direction (voir meute.js, secondDeplacement) ; explose si
// l'attaque contre son porteur vaut 15 ou plus, et le tue (voir combat.js)

// le cochon : 1, vert, Meute
function creerCochon() {
	return {
		image: "", name: "cochon", type: "pion", couleur: "vert", puissance: 1,
		mot_cle: Object.assign(motsClesVides(), { meute: true }), item: [], pouvoir: false,
	};
}

// Cochi-fi-ca-tion : la cible devient un cochon ; elle garde son camp, sa case, tous ses items et ses effets
function sort_cochi_fi_ca_tion(ctx) {
	const pion = ctx.cible;
	const cochon = creerCochon();
	cochon.item = pion.carte.item; // les items suivent

	const joueur = ctx.jeu.joueurs[Number(pion.dataset.joueur)];
	const index = joueur.cartes_actif.indexOf(pion.carte);
	const ancienne = pion.carte;
	pion.carte = cochon;
	if (index !== -1) joueur.cartes_actif[index] = cochon;

	const img = pion.querySelector ? pion.querySelector("img") : null;
	if (img) img.title = "cochon";
	ctx.jeu.message(ancienne.name + " devient un cochon");
}
