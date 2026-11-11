couronne = {
	image: "royaute\\couronne.png",
	name: "couronne",
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
		nyctalope: false,
		malin: false,
		ingenieur: false,
		chef: true,
		electrique: false,
		fragile: false,
		casser: false
	},
	pouvoir: false,
	puissance: 0
}

arc_fleche = {
	image: "royaute\\arc_fleche.png",
	name: "arc et fleche",
	type: "item",
	emplacement: "deux_mains",
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
	puissance: 2
}

epee = {
	image: "royaute\\epee.png",
	name: "epee",
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
		courageux: true,
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
	puissance: 1
}

muret = {
	image: "royaute\\muret.png",
	name: "muret",
	type: "batiment",
	peut_entrer: muret_peut_entrer,
	peut_sortir: muret_peut_sortir,
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

lac_poison = {
	image: "royaute\\lac_poison.png",
	name: "lac de poison",
	type: "batiment",
	peut_entrer: lac_peut_entrer,
	malus_defense: 5,
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

// Muret : on n'y entre que par le bas (depuis la case juste en dessous) et on
// n'en sort que vers le bas ou le haut ; les pions qui volent l'ignorent
function muret_peut_entrer(pion, departId, arriveeId) {
	if (motCle(pion, "vol")) return true;
	const depart = parseCellId(departId);
	const arrivee = parseCellId(arriveeId);
	return !!depart && !!arrivee && depart.colonne === arrivee.colonne && depart.ligne === arrivee.ligne + 1;
}

function muret_peut_sortir(pion, arriveeId, departId) {
	if (motCle(pion, "vol")) return true;
	const depart = parseCellId(departId);
	const arrivee = parseCellId(arriveeId);
	return !!depart && !!arrivee && depart.colonne === arrivee.colonne && Math.abs(arrivee.ligne - depart.ligne) === 1;
}

// Lac de poison : il faut voler ou avoir au moins 13 de puissance pour y entrer
function lac_peut_entrer(pion, departId, arriveeId) {
	return !!motCle(pion, "vol") || puissanceTotale(pion) >= 13;
}
