function debug(msg){
	document.getElementById("debug").textContent = msg;
}

function message(msg){
	document.getElementById("texte").textContent = String(msg);
}

const zone = document.getElementById("zone");
const plateau = document.getElementById("plateau");
const bases = document.getElementById("bases");
const pions = document.getElementById("pions");
const boutonValidation = document.getElementById("validation");
const tousLesElements = document.querySelectorAll(".draggable");
const tousLesEmplacements = document.querySelectorAll(".emplacement");
const boutonGauche = document.getElementById("gauche");
const boutonSelect = document.getElementById("select");
const texteSelect = document.getElementById("texte_select");
const boutonDroite = document.getElementById("droite");
const conteneur = document.getElementById("zone-selection");

let count_famille = 0
let joueur_actif = 0

const liste_famille = [
	{
		name: "terreur nocturne",
		cartes: [Mbonjour, Mbonsoir, nachosette, pardon, poeme]
	},
	{
		name: "goblin",
		cartes: [dino_goblin, roi_goblin, tim, var_, wil, armes_goblines]
	},
	{
		name: "film d'horreur",
		cartes: [psychopate, machette, maison_hante, bruit_suspect, panne_courant]
	},
	{
		name: "steampunk",
		cartes: [outils_steampunk, bougie, pistolet_rouage, homme_riche, salle_piege]
	},
	{
		name: "rebelle",
		cartes: [blink_americain, papillon, pasteque, goulag_man, repaire]
	},
	{
		name: "gems",
		cartes: [defense, puissance, mental, vitesse, grossisement]
	},
	{
		name: "mr ours",
		cartes: [ours_costard, boucli_feuille, arbre_abri, tronc_mobile, cochi_fi_ca_tion]
	},
	{
		name: "ninja",
		cartes: [ninja, passage_secret, passage_secret, temple, katana]
	},
	{
		name: "magie",
		cartes: [tour_mage, magicien, freeze, fireball, cachot]
	},
	{
		name: "maison",
		cartes: [habitation1, habitation2, habitation3, marteau_batisseur, baby_batisseur]
	},
	{
		name: "la chose",
		cartes: [chose, white_house, sceptre, lunette, demence]
	},
	{
		name: "biome",
		cartes: [deplacement, changement, instabilite, breche, tal_inconnue]
	},
	{
		name: "royaute",
		cartes: [couronne, arc_fleche, epee, muret, lac_poison]
	},
	{
		name: "robot",
		cartes: [cle_robot, magie_robot, nike_robot, drill_robot, marteau_robot]
	},
	{
		name: "test",
		cartes: [test_batiment, test_item, test_event, test, test_sort]
	},
]

// blinks.js : 26 blinks (6 soldats, 8 constructeurs, 6 lanceurs de sort, 6 diplomates)
const magasin = creerMagasin();

let index_select = 0

const joueurs = [
	{
		base_destroy : false,
		elimine: false,
		base: new Base(0, 0, 1),
		argent: 0,
		cartes: [],
		cartes_actif: [],
	},
	{
		base_destroy : false,
		elimine: false,
		base: new Base(510, 0, 2),
		argent: 0,
		cartes: [],
		cartes_actif: [],
	},
	{
		base_destroy : false,
		elimine: false,
		base: new Base(510, 510, 3),
		argent: 0,
		cartes: [],
		cartes_actif: [],
	},
	{
		base_destroy : false,
		elimine: false,
		base: new Base(0, 510, 4),
		argent: 0,
		cartes: [],
		cartes_actif: [],
	},
]

// liste des positions valides (x, y), EN COORDONNÉES LOCALES À LA ZONE
// doit correspondre aux .emplacement ci-dessus (phase 0 = position actuelle en HTML)
const emplacements = [
	{ x: 150, y: 10 },
	{ x: 10, y: 150 },
	{ x: 150, y: 150 }
];

// Les différentes "phases" du jeu : chaque phase déplace la zone à un
// endroit différent (un quart du plateau) avec ses propres emplacements
// locaux (le quart bloqué/noir du plateau est celui qu'on n'inclut pas).
const phases = [
	{
		// phase 0 : quart supérieur gauche (position déjà en place dans le HTML)
		zoneLeft: 0,
		zoneTop: 0,
		emplacements: [
			{ x: 150, y: 10 },
			{ x: 10, y: 150 },
			{ x: 150, y: 150 }
		]
	},
	{
		// phase 1 : quart supérieur droit du plateau
		zoneLeft: 280,
		zoneTop: 0,
		emplacements: [
			{ x: 10, y: 10 },
			{ x: 10, y: 150 },
			{ x: 150, y: 150 }
		]
	},
	{
		// phase 1 : quart supérieur droit du plateau
		zoneLeft: 280,
		zoneTop: 280,
		emplacements: [
			{ x: 10, y: 10 },
			{ x: 10, y: 150 },
			{ x: 150, y: 10 }
		]
	},
	{
		// phase 1 : quart supérieur droit du plateau
		zoneLeft: 0,
		zoneTop: 280,
		emplacements: [
			{ x: 10, y: 10 },
			{ x: 150, y: 10 },
			{ x: 150, y: 150 }
		]
	}
];

let phaseActuelle = 0;

const SEUIL = 70; // distance maximale en pixels pour s'accrocher

// occupePar[i] = l'élément qui occupe l'emplacement i, ou null si libre
const occupePar = new Array(emplacements.length).fill(null);

// trouve la couleur "pleine" (non transparente) d'un élément, pour pouvoir
// repeindre ses cases avant d'y remettre des trous aléatoires
function couleurDeBase(element) {
	const cases = element.querySelectorAll('div[style*="background-color"]');
	for (const c of cases) {
		if (c.style.backgroundColor !== "transparent") return c.style.backgroundColor;
	}
	return "gray";
}

// rend entre 0 et 2 cases de l'élément transparentes, au hasard
function randomiserTrous(element) {
	const cases = Array.from(element.querySelectorAll('div[style*="background-color"]'));
	const couleur = couleurDeBase(element);

	// on repart d'une pièce pleine
	cases.forEach(c => c.style.backgroundColor = couleur);

	// on mélange les indices des 9 cases (Fisher-Yates)
	const indices = [...cases.keys()];
	for (let i = indices.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[indices[i], indices[j]] = [indices[j], indices[i]];
	}

	// entre 0 et 2 trous
	const nbTrous = Math.floor(Math.random() * 3);
	indices.slice(0, nbTrous).forEach(idx => {
		cases[idx].style.backgroundColor = "transparent";
	});
}

tousLesElements.forEach(randomiserTrous);

// on mémorise UNE FOIS la position de départ de chaque élément (celle du CSS)
const positionsDepart = new Map();
tousLesElements.forEach(el => {
	const rectEl = el.getBoundingClientRect();
	const rectZone = zone.getBoundingClientRect();
	positionsDepart.set(el, {
		x: rectEl.left - rectZone.left,
		y: rectEl.top - rectZone.top
	});
});

// l'élément actuellement déplacé (null si aucun)
let elementActif = null;
let decalageX = 0;
let decalageY = 0;

tousLesElements.forEach(element => {
	element.addEventListener("mousedown", (e) => {
		elementActif = element;
		decalageX = e.offsetX;
		decalageY = e.offsetY;
		element.style.cursor = "grabbing";
	});
});

document.addEventListener("mousemove", (e) => {
	if (!elementActif) return;

	const rectZone = zone.getBoundingClientRect();
	const x = e.clientX - rectZone.left - decalageX;
	const y = e.clientY - rectZone.top - decalageY;

	elementActif.style.left = x + "px";
	elementActif.style.top = y + "px";

	// feedback visuel : vert si proche ET libre, gris sinon (y compris si occupé par un autre)
	emplacements.forEach((pos, index) => {
		const occupeParAutre = occupePar[index] !== null && occupePar[index] !== elementActif;
		const distance = Math.hypot(pos.x - x, pos.y - y);
		const proche = distance <= SEUIL;

		tousLesEmplacements[index].style.borderColor = (proche && !occupeParAutre) ? "limegreen" : "#aaa";
	});
});

document.addEventListener("mouseup", () => {
	if (!elementActif) return;

	const element = elementActif;
	element.style.cursor = "grab";

	const x = parseInt(element.style.left);
	const y = parseInt(element.style.top);

	// l'emplacement que cet élément occupait avant ce déplacement (-1 si aucun)
	const ancienIndex = occupePar.indexOf(element);

	// chercher l'emplacement libre le plus proche (on ignore ceux pris par un AUTRE élément)
	let plusProcheIndex = -1;
	let distanceMin = Infinity;

	emplacements.forEach((pos, index) => {
		if (occupePar[index] !== null && occupePar[index] !== element) return; // déjà pris par un autre

		const distance = Math.hypot(pos.x - x, pos.y - y);
		if (distance < distanceMin) {
			distanceMin = distance;
			plusProcheIndex = index;
		}
	});

	if (plusProcheIndex !== -1 && distanceMin <= SEUIL) {
		// assez proche et libre : on accroche l'élément
		if (ancienIndex !== -1) occupePar[ancienIndex] = null; // libère son ancien emplacement
		occupePar[plusProcheIndex] = element;

		element.style.left = emplacements[plusProcheIndex].x + "px";
		element.style.top = emplacements[plusProcheIndex].y + "px";
	} else {
		// trop loin, ou seul emplacement proche déjà pris : retour à la position de départ
		if (ancienIndex !== -1) occupePar[ancienIndex] = null;

		const depart = positionsDepart.get(element);
		element.style.left = depart.x + "px";
		element.style.top = depart.y + "px";
	}

	tousLesEmplacements.forEach(el => el.style.borderColor = "#aaa");
	elementActif = null;

	mettreAJourVisibiliteBouton();
});

function tousLesEmplacementsSontOccupes() {
	return occupePar.every(el => el !== null);
}

function mettreAJourVisibiliteBouton() {
	boutonValidation.style.display = tousLesEmplacementsSontOccupes() ? "inline-block" : "none";
}

// Peint les cases du plateau en fonction des pièces actuellement posées :
// pour chaque pièce posée, on regarde géométriquement, pour chacune de ses
// 9 cases, quelle case du plateau se trouve juste en dessous, et on lui
// applique la couleur de la pièce (sauf pour les cases "trou" = transparent).
function peindrePlateauSelonPieces(pieces = occupePar) {
	const casesPlateau = document.querySelectorAll('#plateau [id^="cell-"]');

	pieces.forEach(piece => {
		if (!piece) return;

		const casesPiece = piece.querySelectorAll('div[style*="background-color"]');

		casesPiece.forEach(casePiece => {
			const couleur = casePiece.style.backgroundColor;
			if (couleur === "transparent") return; // un trou : on ne peint pas

			const rect = casePiece.getBoundingClientRect();
			const cx = rect.left + rect.width / 2;
			const cy = rect.top + rect.height / 2;

			for (const caseP of casesPlateau) {
				const r = caseP.getBoundingClientRect();
				if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
					caseP.style.backgroundColor = couleur;
					break;
				}
			}
		});
	});
}

// Remet tous les éléments à leur position de départ et vide les emplacements
function remettreElementsADepart() {
	tousLesElements.forEach(el => {
		const depart = positionsDepart.get(el);
		el.style.left = depart.x + "px";
		el.style.top = depart.y + "px";
		randomiserTrous(el)
	});
	occupePar.fill(null);
}

// Applique une phase donnée : déplace la zone et ses emplacements
function appliquerPhase(indexPhase) {
	message("joueur" + String(indexPhase+1) + ", places tes biomes")
	const phase = phases[indexPhase];

	zone.style.left = phase.zoneLeft + "px";
	zone.style.top = phase.zoneTop + "px";

	phase.emplacements.forEach((pos, i) => {
		emplacements[i].x = pos.x;
		emplacements[i].y = pos.y;
		tousLesEmplacements[i].style.left = pos.x + "px";
		tousLesEmplacements[i].style.top = pos.y + "px";
	});
}

function select_on(liste) {
	boutonGauche.style.display = "inline-block";
	boutonSelect.style.display = "inline-block";
	boutonDroite.style.display = "inline-block";
	texteSelect.textContent = liste[index_select].name;
}

function select_off() {
	boutonGauche.style.display = "none";
	boutonSelect.style.display = "none";
	boutonDroite.style.display = "none";
	texteSelect.textContent = "";
	index_select = 0;
}

function isPouvoir() {
	return pionsActivables(joueur_actif).length > 0; // moteur.js : pouvoir actif, condition remplie, cible disponible
}

function start_game() {
	message("debut de la partie")
	joueurs.forEach((joueur) => {
		bases.appendChild(joueur.base.creerRond())
	})
	start_tour()
}

function start_tour() {	
	message("tour du joueur " + (joueur_actif+1))
	joueurs[joueur_actif].argent += 1
	afficherArgent() // action.js : pièces de chaque joueur
	moteurDebutTour(joueur_actif) // moteur.js : durées des effets actifs + déclencheur debut_tour
	appliquerEffetCostaud() // filet de sécurité : couvre aussi les adjacences changées par le combat
	appliquerSortieClaustrophobes(joueur_actif) // fait sortir les pions claustrophobes forcés dans un batiment

	// salles.js : libère les prisonniers qui remplissent les conditions, puis affiche le menu
	traiterLiberations().catch(err => console.error("Liberation en erreur", err)).then(() => afficherMenuTour());
}

// le menu des actions du joueur actif
function afficherMenuTour() {
	conteneur.innerHTML = "";

	let bouton = document.createElement("button");
	bouton.textContent = "passer";
	bouton.classList.add("bouton"); // réutilise ta classe CSS existante
	bouton.addEventListener("click", () => {
		end_tour()
	});
		conteneur.appendChild(bouton); // ou un autre conteneur

	if (sallesDuJoueur(joueur_actif).length > 0) {
		let boutonSalles = document.createElement("button");
		boutonSalles.textContent = "mes salles";
		boutonSalles.classList.add("bouton");
		boutonSalles.addEventListener("click", () => {
			voirMesSalles() // salles.js : consultation et révélation gratuite
		});
		conteneur.appendChild(boutonSalles);
	}

	if (joueurs[joueur_actif].cartes.length > 0 && !joueurs[joueur_actif].base_destroy) {
		let bouton = document.createElement("button");
		bouton.textContent = "jouer une carte";
		bouton.classList.add("bouton"); // réutilise ta classe CSS existante
		bouton.addEventListener("click", () => {
			jouer_carte()
		});
		conteneur.appendChild(bouton); // ou un autre conteneur
	}	

	if (peutFusionnerRobot()) {
		bouton = document.createElement("button");
		bouton.textContent = "fusionner le robot";
		bouton.classList.add("bouton");
		bouton.addEventListener("click", () => {
			fusionnerRobot() // robot.js
		});
		conteneur.appendChild(bouton);
	}

	if (peutAcheterBlink()) { // blinks.js : stock, base debout, 1 pièce, case libre
		bouton = document.createElement("button");
		bouton.textContent = "acheter des blink";
		bouton.classList.add("bouton"); // réutilise ta classe CSS existante
		bouton.addEventListener("click", () => {
			acheter()
		});
		conteneur.appendChild(bouton); // ou un autre conteneur	
	}

	if (peutDeplacerTente()) { // action.js : une tente a soi, avec une case libre au-dessus ou en dessous
		bouton = document.createElement("button");
		bouton.textContent = "deplacer la tente";
		bouton.classList.add("bouton");
		bouton.addEventListener("click", () => {
			deplacerTente()
		});
		conteneur.appendChild(bouton);
	}

	if (joueurs[joueur_actif].cartes_actif.length > 0) {
		bouton = document.createElement("button");
		bouton.textContent = "Deplacer";
		bouton.classList.add("bouton"); // réutilise ta classe CSS existante
		bouton.addEventListener("click", () => {
			deplacer()
		});
		conteneur.appendChild(bouton); // ou un autre conteneur	

		if (peutCombattre()) {
			bouton = document.createElement("button");
			bouton.textContent = "combattre";
			bouton.classList.add("bouton"); // réutilise ta classe CSS existante
			bouton.addEventListener("click", () => {
				combattre()
			});
			conteneur.appendChild(bouton); // ou un autre conteneur	
		}

		if (isPouvoir()) {
			bouton = document.createElement("button");
			bouton.textContent = "activer une carte";
			bouton.classList.add("bouton"); // réutilise ta classe CSS existante
			bouton.addEventListener("click", () => {
				activer()
			});
			conteneur.appendChild(bouton); // ou un autre conteneur	
		}

		if (peutDetruireBase()) {
			bouton = document.createElement("button");
			bouton.textContent = "Detruire la base ennemies";
			bouton.classList.add("bouton"); // réutilise ta classe CSS existante
			bouton.addEventListener("click", () => {
				detruire()
			});
			conteneur.appendChild(bouton); // ou un autre conteneur	
		}

		if (peutConstruire()) {
			bouton = document.createElement("button");
			bouton.textContent = "construire";
			bouton.classList.add("bouton"); // réutilise ta classe CSS existante
			bouton.addEventListener("click", () => {
				construire()
			});
			conteneur.appendChild(bouton); // ou un autre conteneur	
		}

		if (peutUtiliserSalle()) {
			bouton = document.createElement("button");
			bouton.textContent = "utiliser une salle";
			bouton.classList.add("bouton");
			bouton.addEventListener("click", () => {
				utiliserUneSalle() // salles.js
			});
			conteneur.appendChild(bouton);
		}

		if (peutReparer()) {
			bouton = document.createElement("button");
			bouton.textContent = "reparer";
			bouton.classList.add("bouton");
			bouton.addEventListener("click", () => {
				reparer() // etats.js
			});
			conteneur.appendChild(bouton);
		}
	}
	if (joueurs[joueur_actif].cartes_actif.length == 0 && joueurs[joueur_actif].base_destroy){
		end_tour();
	}
}

// ---- fin de partie ----
// un joueur est éliminé quand sa base est détruite ET qu'il n'a plus aucun
// pion en jeu. l'élimination est définitive. le dernier joueur non éliminé
// gagne la partie.

// pions comptés pour un joueur (sur le plateau ; à étendre avec les pions
// enfermés dans un cachot, qui comptent aussi pour leur propriétaire)
function nombrePionsEnJeu(indexJoueur) {
	// moteur.js + salles.js : les pions enfermés dans un cachot comptent pour leur propriétaire
	return pionsDuJoueur(indexJoueur).length + pionsEnfermesDuJoueur(indexJoueur).length + pionsEmbarquesDuJoueur(indexJoueur).length;
}

// marque comme éliminés les joueurs qui remplissent la condition ;
// renvoie la liste des joueurs nouvellement éliminés
function verifierEliminations() {
	const nouveaux = [];
	joueurs.forEach((joueur, index) => {
		if (joueur.elimine) return;
		if (joueur.base_destroy && nombrePionsEnJeu(index) === 0) {
			joueur.elimine = true;
			nouveaux.push(index);
		}
	});
	return nouveaux;
}

function joueursEnJeu() {
	return joueurs.map((joueur, index) => index).filter(index => !joueurs[index].elimine);
}

let partieTerminee = false;

function end_tour() {
	if (partieTerminee) return;
	conteneur.innerHTML = "";
	moteurFinTour() // moteur.js : déclencheur fin_tour + fin des effets "fin_de_tour"

	const elimines = verifierEliminations();
	const restants = joueursEnJeu();
	if (restants.length <= 1) {
		partieTerminee = true;
		conteneur.innerHTML = "";
		message(restants.length === 1
			? "Joueur " + (restants[0] + 1) + " gagne la partie !"
			: "Partie terminee : plus aucun joueur en jeu");
		return;
	}
	if (elimines.length > 0) {
		message("Elimine : " + elimines.map(i => "joueur " + (i + 1)).join(", "));
	}

	// joueur suivant, en sautant les joueurs éliminés
	do {
		joueur_actif ++;
		if (joueur_actif == joueurs.length) {
			joueur_actif = 0
		};
	} while (joueurs[joueur_actif].elimine);
	start_tour()
}

// ---- connexion des biomes (voir miseenplace.js) ----

function sauvegarderCouleursPlateau() {
	const sauvegarde = new Map();
	document.querySelectorAll('#plateau [id^="cell-"]').forEach(c => sauvegarde.set(c, c.style.backgroundColor));
	return sauvegarde;
}

function restaurerCouleursPlateau(sauvegarde) {
	sauvegarde.forEach((couleur, c) => { c.style.backgroundColor = couleur; });
}

// place les pièces dans les emplacements selon "ordre" (ordre[i] sur l'emplacement i)
function placerPiecesSurEmplacements(ordre) {
	ordre.forEach((piece, i) => {
		piece.style.left = emplacements[i].x + "px";
		piece.style.top = emplacements[i].y + "px";
	});
}

// essaie un arrangement des 3 pièces : peint, teste la connexion avec le
// joueur précédent, puis remet le plateau comme avant
function arrangementOk(indexJoueur, ordre) {
	const sauvegarde = sauvegarderCouleursPlateau();
	placerPiecesSurEmplacements(ordre);
	peindrePlateauSelonPieces(ordre);
	const ok = connecteAuJoueurPrecedent(indexJoueur);
	restaurerCouleursPlateau(sauvegarde);
	return ok;
}

// vérifie que le joueur est relié à celui d'avant. sinon : message ; si un
// autre arrangement fonctionne, il doit réarranger ses pièces ; si aucun
// arrangement ne fonctionne, les trous des pièces sont tirés de nouveau
function verifierConnexionDuJoueur(indexJoueur) {
	if (indexJoueur === 0) return true;

	const piecesPosees = occupePar.slice();
	const retourAuxPositions = () => placerPiecesSurEmplacements(piecesPosees);

	if (arrangementOk(indexJoueur, piecesPosees)) {
		retourAuxPositions();
		return true;
	}

	const unArrangementMarche = () => permutations(piecesPosees).some(ordre => arrangementOk(indexJoueur, ordre));

	if (unArrangementMarche()) {
		retourAuxPositions();
		message("Joueur " + (indexJoueur + 1) + " : tes biomes ne sont pas relies au joueur precedent par un chemin de cases pleines. Reorganise tes pieces.");
		return false;
	}

	let essais = 0;
	do {
		piecesPosees.forEach(randomiserTrous);
		essais++;
	} while (essais < 100 && !unArrangementMarche());
	retourAuxPositions();
	message("Joueur " + (indexJoueur + 1) + " : aucun arrangement ne marchait, les trous ont ete tires de nouveau. Verifie tes pieces.");
	return false;
}

boutonValidation.addEventListener("click", () => {
	if (!tousLesEmplacementsSontOccupes()) return;
	if (!verifierConnexionDuJoueur(phaseActuelle)) return; // reste sur la même phase

	peindrePlateauSelonPieces();
	remettreElementsADepart();
	boutonValidation.style.display = "none";

	phaseActuelle++;

	if (phaseActuelle < phases.length) {
		// passe à la phase suivante (ex : quart supérieur droit)
		appliquerPhase(phaseActuelle);
	} else {
		zone.style.display = "none";
		message("Joueur 1 choisis tes familles");
		select_on(liste_famille)
		return;
	}
});

boutonGauche.addEventListener("click", () => {
	index_select -= 1;
	if (index_select < 0) {
		index_select = liste_famille.length-1;
	}
	texteSelect.textContent = liste_famille[index_select].name
});

boutonDroite.addEventListener("click", () => {
	index_select += 1;
	if (index_select > liste_famille.length-1) {
		index_select = 0;
	}
	texteSelect.textContent = liste_famille[index_select].name
});

boutonSelect.addEventListener("click", () => {
	joueurs[joueur_actif].cartes = joueurs[joueur_actif].cartes.concat(liste_famille[index_select].cartes);
	liste_famille.splice(index_select, 1);
	count_famille ++;
	if (index_select > liste_famille.length-1) {
		index_select = 0;
	}
	texteSelect.textContent = liste_famille[index_select].name
	if (count_famille == 3) {
		count_famille = 0;
		joueur_actif ++;
		message("joueur " + (joueur_actif+1) + " a toi")
		if (joueur_actif == joueurs.length) {
			joueur_actif = 0;
			select_off();
			start_game();
		};
	};
});

// initialisation : on se place explicitement sur la phase 0
appliquerPhase(0);
