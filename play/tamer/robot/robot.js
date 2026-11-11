// =====================================================================
// Famille Robot : 5 morceaux (des cartes pion, qui ne se posent pas seules). un joueur qui en a au
// moins 4 en main peut en choisir 4, un par un, et les fusionner : cela cree le Robot, un pion de
// puissance 8 qui occupe 2x2 cases et cumule les attributs des 4 morceaux choisis. Chaque morceau
// choisi est dessine dans un quart du Robot (carte.morceaux, voir habillerMorceaux).
// =====================================================================

cle_robot = {
	image: "fleche_droite.png",
	name: "cle du robot",
	type: "pion",
	piece_robot: true,
	mot_cle: Object.assign(motsClesVides(), { ingenieur: true }),
	pouvoir: false,
	puissance: 0
}

magie_robot = {
	image: "fleche_droite.png",
	name: "magie du robot",
	type: "pion",
	piece_robot: true,
	lanceur: "orthogonal",
	mot_cle: motsClesVides(),
	pouvoir: false,
	puissance: 0
}

nike_robot = {
	image: "fleche_droite.png",
	name: "nike du robot",
	type: "pion",
	piece_robot: true,
	mot_cle: Object.assign(motsClesVides(), { rapide: 1 }),
	pouvoir: false,
	puissance: 0
}

drill_robot = {
	image: "fleche_droite.png",
	name: "drill du robot",
	type: "pion",
	piece_robot: true,
	bonus_contre_couleurs: { rouge: 2, vert: 2 },
	mot_cle: motsClesVides(),
	pouvoir: false,
	puissance: 0
}

marteau_robot = {
	image: "fleche_droite.png",
	name: "marteau du robot",
	type: "pion",
	piece_robot: true,
	mot_cle: Object.assign(motsClesVides(), { constructeur: 4 }),
	pouvoir: false,
	puissance: 0
}

const EMPREINTE_ROBOT = [[0, 0], [0, 1], [1, 0], [1, 1]];

function piecesRobotEnMain(indexJoueur) {
	return joueurs[indexJoueur].cartes.filter(carte => carte.piece_robot);
}

// pivots de la base du joueur ou le Robot (2x2) tient en entier, dans la base
function positionsLibresPourRobot(indexJoueur) {
	const sonde = { carte: { empreinte: EMPREINTE_ROBOT, mot_cle: {}, item: [] }, dataset: { caseId: "" } };
	return casesPosablesPour(sonde.carte, indexJoueur).filter(c => empreinteLibre(sonde, c.id));
}

function peutFusionnerRobot() {
	const joueur = joueurs[joueur_actif];
	return !joueur.base_destroy && piecesRobotEnMain(joueur_actif).length >= 4 && positionsLibresPourRobot(joueur_actif).length > 0;
}

// le Robot : 8, orange, 2x2, avec les attributs des morceaux choisis (un par quart : haut-gauche,
// haut-droite, bas-gauche, bas-droite)
function creerRobot(pieces) {
	const robot = {
		image: "fleche_droite.png", name: "robot", type: "pion", couleur: "orange", puissance: 8,
		empreinte: EMPREINTE_ROBOT, mot_cle: motsClesVides(), item: [], pouvoir: false,
		morceaux: pieces.map(p => ({ name: p.name, image: p.image })),
	};
	pieces.forEach(piece => {
		Object.entries(piece.mot_cle || {}).forEach(([nom, valeur]) => {
			if (valeur) robot.mot_cle[nom] = valeur;
		});
		if (piece.lanceur) robot.lanceur = piece.lanceur;
		if (piece.bonus_contre_couleurs) robot.bonus_contre_couleurs = Object.assign({}, robot.bonus_contre_couleurs, piece.bonus_contre_couleurs);
	});
	return robot;
}

// dessine le Robot : 4 quarts, chacun montre un des morceaux choisis (remplace l'image unique du pion)
function habillerMorceaux(pion) {
	const morceaux = pion.carte && pion.carte.morceaux;
	if (!morceaux || !pion.appendChild || !document.createElement) return;
	const image = pion.querySelector ? pion.querySelector(":scope > img") : null;
	if (image) image.style.display = "none";
	const grille = document.createElement("div");
	grille.className = "quarts";
	grille.style.cssText = "position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:1px;overflow:hidden;pointer-events:none;";
	morceaux.slice(0, 4).forEach(m => {
		const quart = document.createElement("div");
		quart.className = "quart";
		quart.title = m.name;
		quart.dataset.sigle = String(m.name).charAt(0).toUpperCase();
		quart.style.cssText = "position:relative;overflow:hidden;";
		const img = document.createElement("img");
		img.src = m.image; img.alt = ""; img.draggable = false;
		img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
		quart.appendChild(img);
		grille.appendChild(quart);
	});
	pion.appendChild(grille);
}

// action : le joueur choisit ses 4 morceaux un par un (parmi ceux qu'il a en main), ils quittent sa main,
// puis il pose le Robot dans sa base
async function fusionnerRobot() {
	conteneur.innerHTML = "";
	const disponibles = piecesRobotEnMain(joueur_actif);
	const choisies = [];
	while (choisies.length < 4) {
		const restantes = disponibles.filter(p => !choisies.includes(p));
		if (restantes.length === 4 - choisies.length) { choisies.push(...restantes); break; } // plus de choix possible
		const index = await jeu.demanderChoix(joueur_actif, "morceau " + (choisies.length + 1) + " sur 4 du robot",
			restantes.map((p, i) => ({ label: p.name, valeur: i })));
		choisies.push(restantes[index]);
	}
	choisies.forEach(piece => {
		const position = joueurs[joueur_actif].cartes.indexOf(piece);
		if (position !== -1) joueurs[joueur_actif].cartes.splice(position, 1);
	});
	creerPionDraggable(creerRobot(choisies));
}
