// bloc de 9 cases (cell-{row}-{col}-*-*) qui appartient à chaque joueur,
// selon la position de sa base dans tamer.js (0,0 / 510,0 / 510,510 / 0,510)
const blocsJoueurs = [
	{ row: 1, col: 1 }, // joueur 1 : haut-gauche
	{ row: 1, col: 4 }, // joueur 2 : haut-droite
	{ row: 4, col: 4 }, // joueur 3 : bas-droite
	{ row: 4, col: 1 }, // joueur 4 : bas-gauche
];

// --- texte mixte fixe / obfusque (facon parametre k de Minecraft) ---------------
// dans un nom de carte, tout ce qui est entre deux "§" est affiche avec
// des caracteres aleatoires qui changent en continu ; le reste est fixe

const POOL_OBFUSCATION = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*?";

function caractereAleatoire() {
	return POOL_OBFUSCATION[Math.floor(Math.random() * POOL_OBFUSCATION.length)];
}

// remplit "element" avec le texte donne : les segments entre §...§
// deviennent des <span class="obf"> obfusques en continu, le reste est
// insere tel quel (texte fixe)
function creerTexteMixte(element, texte) {
	const parties = String(texte).split("§");
	element.textContent = "";

	parties.forEach((partie, i) => {
		if (i % 2 === 0) {
			element.appendChild(document.createTextNode(partie));
		} else {
			const span = document.createElement("span");
			span.className = "obf";
			span.style.color = "#ff2079";
			span.dataset.text = partie;
			span.textContent = partie;
			element.appendChild(span);
		}
	});
}

function brouillerTousLesSpansObfusques() {
	document.querySelectorAll(".obf").forEach(span => {
		const original = span.dataset.text;
		span.textContent = original
			.split("")
			.map(c => (c === " " ? " " : caractereAleatoire()))
			.join("");
	});
}

// une seule boucle globale pour tous les textes obfusques de la partie
setInterval(brouillerTousLesSpansObfusques, 60);

// renvoie les 9 cases noires appartenant au joueur donné
function casesDuJoueur(indexJoueur) {
	const { row, col } = blocsJoueurs[indexJoueur];
	return document.querySelectorAll(`#plateau [id^="cell-${row}-${col}-"]`);
}

// suivi global : id de case -> pion qui l'occupe (persiste pour toute la partie)
const casesOccupees = new Map();

// bâtiments construits sur le plateau : contrairement aux pions, ils
// n'appartiennent à aucun joueur en particulier une fois posés (liste
// globale, pas dans cartes_actif d'un joueur)
const batimentsConstruits = [];

// renvoie la carte du bâtiment posé sur cette case (ou undefined s'il n'y en a pas)
function batimentSurCase(caseId) {
	return batimentsConstruits.find(b => b.case && b.case.id === caseId);
}


// un id de case ressemble à "cell-{blocRow}-{blocCol}-{r}-{c}" :
// blocRow/blocCol repèrent le bloc de 9 cases dans la grille des blocs,
// r/c repèrent la case à l'intérieur de ce bloc (1 à 3).
// on convertit ça en une position "globale" dans la grille entière du
// plateau pour pouvoir calculer les voisins haut/bas/gauche/droite,
// même quand ce voisin se trouve dans un bloc différent.
function parseCellId(id) {
	const m = id.match(/^cell-(\d+)-(\d+)-(\d+)-(\d+)$/);
	if (!m) return null;
	const blocRow = Number(m[1]);
	const blocCol = Number(m[2]);
	const r = Number(m[3]);
	const c = Number(m[4]);
	return {
		ligne: (blocRow - 1) * 3 + r,
		colonne: (blocCol - 1) * 3 + c,
	};
}

function cellIdDepuisGlobal(ligne, colonne) {
	const blocRow = Math.floor((ligne - 1) / 3) + 1;
	const r = ((ligne - 1) % 3) + 1;
	const blocCol = Math.floor((colonne - 1) / 3) + 1;
	const c = ((colonne - 1) % 3) + 1;
	return `cell-${blocRow}-${blocCol}-${r}-${c}`;
}

// renvoie les éléments DOM des cases adjacentes (haut, bas, gauche, droite)
// d'une case donnée ; ignore les directions qui sortent du plateau
function casesAdjacentes(caseId) {
	const pos = parseCellId(caseId);
	if (!pos) return [];

	const directions = [
		[-1, 0], // haut
		[1, 0],  // bas
		[0, -1], // gauche
		[0, 1],  // droite
	];

	const resultat = [];
	directions.forEach(([dLigne, dColonne]) => {
		const id = cellIdDepuisGlobal(pos.ligne + dLigne, pos.colonne + dColonne);
		const el = document.getElementById(id);
		if (el) resultat.push(el);
	});

	return resultat;
}

// distance de déplacement d'un pion : 1 case par défaut ; si le mot-clé
// "rapide" est un chiffre x, il peut aller jusqu'à x+1 cases
function distanceDeplacement(pion) {
	const rapide = motCle(pion, "rapide"); // moteur.js : carte + items cumulés
	return (typeof rapide === "number") ? rapide + 1 : 1;
}

// cases atteignables en ligne droite depuis une case, dans les 4 directions
// (haut/bas/gauche/droite), plus les 4 diagonales si avecDiagonales est
// vrai (mot-clé "agile"), jusqu'à "distance" cases. la ligne s'arrête dès
// qu'elle sort du plateau, touche un "trou" (case transparente) ou une
// case déjà occupée (qui elle-même n'est jamais incluse dans le résultat)
// cases atteignables en ligne droite depuis une case, dans les 4 directions
// (haut/bas/gauche/droite), plus les 4 diagonales si avecDiagonales est
// vrai (mot-clé "agile"), jusqu'à "distance" cases. la ligne s'arrête dès
// qu'elle sort du plateau ou touche une case déjà occupée (qui elle-même
// n'est jamais incluse dans le résultat). un "trou" (case transparente)
// bloque la ligne, sauf si peutVoler est vrai (mot-clé "vol") : dans ce
// cas la ligne continue au-delà, et le trou lui-même est une case valide
// (le pion peut le survoler ou s'y arrêter)
function casesAtteignables(caseId, distance, avecDiagonales, peutVoler, pionIgnore) {
	const pos = parseCellId(caseId);
	if (!pos) return [];

	const directions = [
		[-1, 0], [1, 0], [0, -1], [0, 1],
	];
	if (avecDiagonales) {
		directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
	}

	const resultat = [];

	directions.forEach(([dLigne, dColonne]) => {
		for (let pas = 1; pas <= distance; pas++) {
			const id = cellIdDepuisGlobal(pos.ligne + dLigne * pas, pos.colonne + dColonne * pas);
			const el = document.getElementById(id);
			if (!el) break; // sorti du plateau

			if (el.style.backgroundColor === "transparent") {
				if (peutVoler) {
					resultat.push(el); // peut aussi bien le survoler que s'y arrêter
					continue;
				}
				break; // pas de vol : le trou bloque la ligne
			}

			const occupant = casesOccupees.get(el.id);
			if (occupant && occupant !== pionIgnore) {
				if (pionIgnore && pionIgnore.carte && pionIgnore.carte.partageCase) { // Papillon : partage la case, ou la survole si elle est pleine
					if (peutPartagerCase(pionIgnore, el.id)) resultat.push(el);
					continue;
				}
				break; // case occupée (par un autre) : bloque la ligne, pas incluse
			}

			resultat.push(el);
		}
	});

	return resultat;
}

// crée une copie indépendante d'une carte : les objets de cartes.js (test,
// tous les joueurs, donc sans copie, un état propre au pion (comme "item")
// modifierait l'objet global et "fuiterait" vers tous les autres pions de
// la même carte, chez tous les joueurs
function clonerCarte(carte) {
	const copie = { ...carte };
	if (carte.mot_cle) copie.mot_cle = { ...carte.mot_cle };
	if (Array.isArray(carte.item)) copie.item = [...carte.item];
	return copie;
}

// crée un pion glissable que le joueur doit déposer sur une de ses 9 cases.
// une fois déposé, la carte est ajoutée à cartes_actif et le tour se termine.
function creerPionDraggable(carte) {
	conteneur.innerHTML = ""; // on cache les boutons de carte pendant le glisser-déposer
	message(carte.pose_noir
		? "Depose le pion sur une case de ta base ou sur un batiment dans le noir"
		: "Depose le pion sur une case de ta base");

	const cases = casesPosablesPour(carte, joueur_actif); // noir.js : base, plus les batiments noirs si pose_noir

	const pion = document.createElement("div");
	pion.style.position = "absolute";
	pion.style.width = "30px";
	pion.style.height = "30px";
	pion.style.cursor = "grab";
	pion.style.zIndex = "10";
	pion.dataset.joueur = joueur_actif; // mémorise à qui appartient ce pion
	pion.carte = clonerCarte(carte); // copie indépendante : évite de partager l'état (item...) entre pions

	const img = document.createElement("img");
	img.src = carte.image;
	img.style.height = "30px";
	img.draggable = false; // évite que le navigateur démarre son propre drag-and-drop natif sur l'image
	pion.appendChild(img);
	if (typeof habillerMorceaux === "function") habillerMorceaux(pion); // robot.js : un quart par morceau choisi

	// position de départ : au centre du plateau
	const rectPlateau = plateau.getBoundingClientRect();
	pion.style.left = (rectPlateau.width / 2 - 15) + "px";
	pion.style.top = (rectPlateau.height / 2 - 15) + "px";

	pions.appendChild(pion);

	let dragging = false;
	let decalageX = 0;
	let decalageY = 0;

	function onMouseDown(e) {
		e.preventDefault(); // évite le drag natif du navigateur sur l'image
		dragging = true;
		decalageX = e.offsetX;
		decalageY = e.offsetY;
		pion.style.cursor = "grabbing";
	}

	function onMouseMove(e) {
		if (!dragging) return;

		const rectPlateau = plateau.getBoundingClientRect();
		const x = e.clientX - rectPlateau.left - decalageX;
		const y = e.clientY - rectPlateau.top - decalageY;

		pion.style.left = x + "px";
		pion.style.top = y + "px";

		// feedback visuel : vert si libre et survolée, rouge si déjà occupée et survolée
		cases.forEach(c => {
			const r = c.getBoundingClientRect();
			const survole = e.clientX >= r.left && e.clientX <= r.right &&
			                 e.clientY >= r.top && e.clientY <= r.bottom;

			if (!survole) {
				c.style.outline = "none";
			} else {
				c.style.outline = empreinteLibre(pion, c.id) ? "3px solid limegreen" : "3px solid crimson"; // moteur.js : toute l'empreinte doit etre libre
			}
		});
	}

	function onMouseUp(e) {
		if (!dragging) return;
		dragging = false;
		pion.style.cursor = "grab";

		let deposee = false;
		let caseOccupeeVisee = false;

		cases.forEach(c => {
			c.style.outline = "none";
			if (deposee) return;

			const r = c.getBoundingClientRect();
			const dansLaCase = e.clientX >= r.left && e.clientX <= r.right &&
			                    e.clientY >= r.top && e.clientY <= r.bottom;

			if (dansLaCase && !empreinteLibre(pion, c.id)) {
				caseOccupeeVisee = true;
				return;
			}

			if (dansLaCase && empreinteLibre(pion, c.id)) {
				const rectPlateau = plateau.getBoundingClientRect();
				pion.style.left = (r.left - rectPlateau.left + r.width / 2 - 15) + "px";
				pion.style.top = (r.top - rectPlateau.top + r.height / 2 - 15) + "px";
				deposee = true;

				occuperCases(pion, c.id); // moteur.js : toutes les cases de son empreinte
				if (estGrandPion(pion)) positionnerGrandPion(pion);
				ajusterInvite(pion);
				appliquerEffetCostaud();
			}
		});

		if (!deposee) {
			// lâché en dehors d'une case valide, ou sur une case déjà prise : retour au centre
			const rectPlateau = plateau.getBoundingClientRect();
			pion.style.left = (rectPlateau.width / 2 - 15) + "px";
			pion.style.top = (rectPlateau.height / 2 - 15) + "px";
			message(caseOccupeeVisee ? "Cette case est deja occupee, choisis-en une autre" : "Dépose le pion sur une case de ta base");
			return; // on ne termine pas le tour, le joueur peut réessayer
		}

		document.removeEventListener("mousemove", onMouseMove);
		document.removeEventListener("mouseup", onMouseUp);

		joueurs[joueur_actif].cartes_actif.push(pion.carte);
		declencher("a_la_pose", { pion, carte: pion.carte });
		signalerDeplacement(pion, null); // entrée éventuelle dans un bâtiment + réévaluation des effets
		end_tour();
	}

	pion.addEventListener("mousedown", onMouseDown);
	document.addEventListener("mousemove", onMouseMove);
	document.addEventListener("mouseup", onMouseUp);
}

// pions du joueur actif, actuellement posés, de type "pion" et qui n'ont
// pas encore d'item (utilisé pour savoir où poser une carte "item")
function trouverPionsPourItem(item) {
	// moteur.js : de la place dans l'emplacement demandé (2 mains, 1 tête,
	// 1 gemme) et les mots-clés requis par l'item déjà possédés
	return pionsPouvantRecevoir(item, joueur_actif);
}

// cases utilisables (non "trou") situées sur la même ligne OU la même
// colonne globale que la base du joueur donné (utilisé pour cibler un sort)
function casesLigneColonneBase(indexJoueur) {
	const caseBase = caseSousBase(indexJoueur);
	if (!caseBase) return [];

	const pos = parseCellId(caseBase.id);
	if (!pos) return [];

	const resultat = [];
	document.querySelectorAll('#plateau [id^="cell-"]').forEach(c => {
		const p = parseCellId(c.id);
		if (!p) return;
		if (p.ligne !== pos.ligne && p.colonne !== pos.colonne) return;
		if (c.style.backgroundColor === "transparent") return; // case "trou", pas utilisable
		resultat.push(c);
	});

	return resultat;
}

// pose une carte "item" sur un de tes pions posés qui n'en a pas encore :
// contrairement à un pion ou un bâtiment, ça ne crée pas de nouveau pion,
// ça ajoute juste la carte à la liste "item" du pion ciblé
// affiche un petit badge (image de l'item) dans le coin bas-gauche du pion
function afficherItemSurPion(pion, itemCarte) {
	const badge = document.createElement("img");
	badge.src = itemCarte.image;
	badge.draggable = false;
	badge.style.position = "absolute";
	// plusieurs items : on les décale pour qu'ils restent tous visibles
	const rang = Math.max(0, (pion.carte.item || []).indexOf(itemCarte));
	badge.style.left = (rang * 8) + "px";
	badge.style.bottom = "0";
	badge.style.width = "14px";
	badge.style.height = "14px";
	badge.style.border = "1px solid white";
	badge.style.borderRadius = "3px";
	badge.style.backgroundColor = "white";
	badge.style.zIndex = "11"; // au dessus de l'image du pion
	pion.appendChild(badge);
}

// joue une carte "evenement" : pas de pion créé, pas de case ciblée,
// elle active simplement son pouvoir
function jouerEvenement(carte) {
	conteneur.innerHTML = "";

	// moteur.js : appelle carte.effet(ctx) (la carte peut déclarer une cible)
	jouerEffetCarte(carte).then(() => end_tour());
}

function poserItem(carte) {
	conteneur.innerHTML = "";

	const cibles = trouverPionsPourItem(carte);

	if (cibles.length === 0) {
		message("Aucun pion ne peut recevoir cet objet");
		end_tour();
		return;
	}

	message("Clique sur un pion pour lui donner l'objet");

	function onClickPion(e) {
		const pion = e.currentTarget;

		cibles.forEach(p => {
			p.style.boxShadow = "none";
			p.style.cursor = "grab";
			p.removeEventListener("click", onClickPion);
		});

		const itemClone = clonerCarte(carte);
		pion.carte.item.push(itemClone);
		afficherItemSurPion(pion, itemClone);
		declencher("a_la_pose", { pion, carte: itemClone });

		end_tour();
	}

	cibles.forEach(pion => {
		pion.style.boxShadow = "0 0 0 3px deepskyblue";
		pion.style.cursor = "pointer";
		pion.addEventListener("click", onClickPion);
	});
}

// joue une carte "sort" sur une case de la ligne ou de la colonne de ta
// base : ça ne crée pas de pion, ça applique juste l'effet de la carte
function jouerSort(carte) {
	conteneur.innerHTML = "";

	// moteur.js : par défaut un sort cible une case de la ligne ou de la
	// colonne de la base ; la cible choisie arrive dans ctx.cible
	jouerEffetCarte(carte).then(() => end_tour());
}

function jouer_carte() {
	conteneur.innerHTML = "";
	joueurs[joueur_actif].cartes.forEach((carte, i) => {
		if (carte.type == "batiment" || carte.type == "salle") return; // se joue via "construire", pas ici
		if (carte.piece_robot) return; // un morceau de robot ne se joue pas seul : action "fusionner le robot"
		if (carte.type == "item" && trouverPionsPourItem(carte).length == 0) return; // aucun pion disponible pour recevoir l'objet
		if (!conditionOk(carte, creerContexte({ joueur: joueur_actif }))) return; // condition de la carte non remplie
		if ((carte.type == "sort" || carte.type == "evenement") && !aUneCibleValide(carte, creerContexte({ joueur: joueur_actif }))) return; // aucune cible possible : masquée

		const btn = document.createElement("button");

		const img = document.createElement("img");
		img.src = carte.image;
		img.style.width = "24px";
		btn.appendChild(img);

		const label = document.createElement("span");
		creerTexteMixte(label, carte.name);
		btn.appendChild(label);

		btn.classList.add("bouton");
		btn.addEventListener("click", () => {
			index_select = i;
			const carteChoisie = joueurs[joueur_actif].cartes[index_select];
			joueurs[joueur_actif].cartes.splice(index_select, 1);

			if (carteChoisie.type === "item") {
				poserItem(carteChoisie);
			} else if (carteChoisie.type === "sort") {
				jouerSort(carteChoisie);
			} else if (carteChoisie.type === "evenement") {
				jouerEvenement(carteChoisie);
			} else {
				creerPionDraggable(carteChoisie);
			}
		});
		conteneur.appendChild(btn);
	});
}

// acheter un blink (blinks.js) : 1 pièce, on choisit une sorte, le blink est posé
// tout de suite sur une case libre de la base
function acheter() {
	conteneur.innerHTML = "";
	message("Achete un blink : " + PRIX_BLINK + " piece");

	sortesDisponibles().forEach(({ sorte, nom, nb, carte }) => {
		const btn = document.createElement("button");

		const img = document.createElement("img");
		img.src = carte.image;
		img.style.width = "24px";
		btn.appendChild(img);

		const label = document.createElement("span");
		label.textContent = nom + " (" + nb + ")";
		btn.appendChild(label);

		btn.classList.add("bouton");
		btn.addEventListener("click", () => {
			acheterBlink(sorte);
		});
		conteneur.appendChild(btn);
	});
}

function deplacer() {
	conteneur.innerHTML = "";

	// pour chaque pion du joueur actif posé sur le plateau, la liste de ses
	// cases adjacentes libres (seuls ces pions-là peuvent être déplacés)
	const mouvementsPossibles = new Map(); // pion -> [cases libres adjacentes]

	pionsSurPlateau().forEach((pion) => {
		if (pion.dataset.joueur != joueur_actif) return;
		if (etatBloquant(pion)) return; // gelé ou enfermé : ne bouge pas
		if (pionBloqueParLeNoir(pion)) return; // noir.js : sans Nyctalope sur une case noire, il ne bouge pas

		const estAgile = !!motCle(pion, "agile");
		const peutVoler = !!motCle(pion, "vol");
		const estClaustrophobe = !!motCle(pion, "claustrophobe");
		const distance = distanceDeplacement(pion);

		let casesLibres = casesAtteignables(pion.dataset.caseId, distance, estAgile, peutVoler, pion);
		if (estClaustrophobe) {
			casesLibres = casesLibres.filter(c => !batimentSurCase(c.id)); // ne peut pas rentrer dans un batiment
		}
		casesLibres = casesLibres.filter(c => peutEntrerSurCase(pion, c.id)); // noir.js : pas de batiment noir sans Nyctalope
		casesLibres = casesLibres.filter(c => deplacementAutorise(pion, pion.dataset.caseId, c.id)); // terrain.js : Muret, Lac de poison...
		if (estGrandPion(pion)) casesLibres = casesLibres.filter(c => empreinteLibre(pion, c.id)); // toute l'empreinte doit tenir

		if (casesLibres.length > 0) {
			mouvementsPossibles.set(pion, casesLibres);
		}
	});

	if (mouvementsPossibles.size === 0) {
		message("Aucun de tes pions ne peut se deplacer");
		end_tour();
		return;
	}

	message("Depose un de tes pions sur une case adjacente libre");

	// affiche/efface l'aperçu de toutes les cases atteignables, pour que le
	// joueur voie ses options avant même d'avoir saisi un pion
	function montrerApercu() {
		mouvementsPossibles.forEach(casesLibres => {
			casesLibres.forEach(c => {
				c.style.outline = "2px dashed dodgerblue";
			});
		});
	}

	function cacherApercu() {
		mouvementsPossibles.forEach(casesLibres => {
			casesLibres.forEach(c => {
				c.style.outline = "none";
			});
		});
	}

	// met en évidence les pions que l'on peut effectivement déplacer
	mouvementsPossibles.forEach((_, pion) => {
		pion.style.cursor = "grab";
		pion.style.boxShadow = "0 0 0 3px gold";
	});

	montrerApercu();

	let pionActif = null;
	let casesValides = [];
	let decalageX = 0;
	let decalageY = 0;
	let positionDepart = { left: "0px", top: "0px" };

	function onMouseDown(e) {
		e.preventDefault(); // évite le drag natif du navigateur sur l'image
		const pion = e.currentTarget;
		const casesLibres = mouvementsPossibles.get(pion);
		if (!casesLibres) return;

		pionActif = pion;
		casesValides = casesLibres;
		decalageX = e.offsetX;
		decalageY = e.offsetY;
		positionDepart = { left: pion.style.left, top: pion.style.top };

		pion.style.cursor = "grabbing";
		pion.style.zIndex = "20";
	}

	function onMouseMove(e) {
		if (!pionActif) return;

		const rectPlateau = plateau.getBoundingClientRect();
		const x = e.clientX - rectPlateau.left - decalageX;
		const y = e.clientY - rectPlateau.top - decalageY;

		pionActif.style.left = x + "px";
		pionActif.style.top = y + "px";

		// feedback visuel : vert si la case adjacente valide est survolée
		casesValides.forEach(c => {
			const r = c.getBoundingClientRect();
			const survole = e.clientX >= r.left && e.clientX <= r.right &&
			                 e.clientY >= r.top && e.clientY <= r.bottom;
			c.style.outline = survole ? "3px solid limegreen" : "2px dashed dodgerblue";
		});
	}

	function onMouseUp(e) {
		if (!pionActif) return;
		const pion = pionActif;

		let deposee = false;
		let caseDeDepart = null; // pour que les Meute puissent suivre (meute.js)

		casesValides.forEach(c => {
			if (deposee) return;

			// double vérification : la case doit toujours être libre au moment
			// du lâcher (jamais deux pions sur la même case). le trou est déjà
			// géré en amont par casesAtteignables (autorisé seulement si le
			// pion peut voler), donc pas besoin de le revérifier ici
			const occupant = casesOccupees.get(c.id);
			if (occupant && occupant !== pion && !peutPartagerCase(pion, c.id)) return;

			const r = c.getBoundingClientRect();
			const dansLaCase = e.clientX >= r.left && e.clientX <= r.right &&
			                    e.clientY >= r.top && e.clientY <= r.bottom;

			if (dansLaCase) {
				const rectPlateau = plateau.getBoundingClientRect();
				pion.style.left = (r.left - rectPlateau.left + r.width / 2 - 15) + "px";
				pion.style.top = (r.top - rectPlateau.top + r.height / 2 - 15) + "px";

				const ancienneCaseId = pion.dataset.caseId;
				caseDeDepart = ancienneCaseId;
				libererCases(pion);
				occuperCases(pion, c.id);
				if (estGrandPion(pion)) positionnerGrandPion(pion);
				ajusterInvite(pion); // Papillon sur la case d'un autre : leger decalage
				appliquerEffetCostaud();
				signalerDeplacement(pion, ancienneCaseId);

				deposee = true;
			}
		});

		pion.style.cursor = "grab";
		pion.style.zIndex = "10";

		if (!deposee) {
			// lâché en dehors d'une case adjacente valide : retour à la position de départ
			pion.style.left = positionDepart.left;
			pion.style.top = positionDepart.top;
			pionActif = null;
			message("Depose un de tes pions sur une case adjacente libre");
			return; // on ne termine pas le tour, le joueur peut réessayer
		}

		cacherApercu();
		mouvementsPossibles.forEach((_, p) => {
			p.style.boxShadow = "none";
			p.removeEventListener("mousedown", onMouseDown);
		});
		document.removeEventListener("mousemove", onMouseMove);
		document.removeEventListener("mouseup", onMouseUp);

		// meute.js : les Meute alliés reliés peuvent suivre le pion qui vient de bouger
		suivreMeute(pion, caseDeDepart).then(() => secondDeplacement(pion, caseDeDepart)).then(() => end_tour());
	}

	mouvementsPossibles.forEach((_, pion) => {
		pion.addEventListener("mousedown", onMouseDown);
	});

	document.addEventListener("mousemove", onMouseMove);
	document.addEventListener("mouseup", onMouseUp);
}

// trouve la case du plateau sur laquelle se trouve géométriquement le rond
// (le cercle) d'une base, en comparant son centre aux cases de son bloc
function caseSousBase(indexJoueur) {
	const joueur = joueurs[indexJoueur];
	if (!joueur.base.element) return null;

	const rectBase = joueur.base.element.getBoundingClientRect();
	const cx = rectBase.left + rectBase.width / 2;
	const cy = rectBase.top + rectBase.height / 2;

	const casesBase = casesDuJoueur(indexJoueur);
	for (const c of casesBase) {
		const r = c.getBoundingClientRect();
		if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
			return c;
		}
	}
	return null;
}

// renvoie la liste des joueurs (objets de "joueurs") dont la base est
// actuellement détruisible par le joueur actif : pas déjà détruite, et
// accessible depuis un de ses pions (puissance >= 1) adjacent au rond
function trouverBasesDetruisibles() {
	return joueurs.filter((joueur, index) => {
		if (index == joueur_actif) return false; // pas ta propre base
		if (joueur.base_destroy) return false; // déjà détruite
		if (!joueur.base.element) return false; // pas encore affichée

		const caseBase = caseSousBase(index);
		if (!caseBase) return false;

		return casesAdjacentes(caseBase.id).some(c => {
			const pion = casesOccupees.get(c.id);
			return pion && pion.dataset.joueur == joueur_actif &&
				pion.carte && pion.carte.puissance >= 1;
		});
	});
}

// utilisé par tamer.js pour n'afficher le bouton "Detruire la base
// ennemies" que si au moins une base est effectivement atteignable
function peutDetruireBase() {
	return trouverBasesDetruisibles().length > 0;
}

function detruire() {
	conteneur.innerHTML = "";

	const basesDetruisibles = trouverBasesDetruisibles();

	if (basesDetruisibles.length === 0) {
		message("Aucune base ennemie n'est a ta portee");
		end_tour();
		return;
	}

	message("Clique sur une base ennemie pour la detruire");

	function onClickBase(e) {
		const cible = basesDetruisibles.find(j => j.base.element === e.currentTarget);
		if (!cible) return;

		// on retire la mise en évidence et les écouteurs de toutes les bases
		basesDetruisibles.forEach(j => {
			j.base.element.style.boxShadow = "none";
			j.base.element.style.cursor = "default";
			j.base.element.removeEventListener("click", onClickBase);
		});

		cible.base_destroy = true;
		cible.base.element.style.opacity = "0.3"; // indication visuelle que la base est détruite

		end_tour();
	}

	// met en évidence les bases atteignables et les rend cliquables
	basesDetruisibles.forEach(joueur => {
		joueur.base.element.style.boxShadow = "0 0 0 4px gold";
		joueur.base.element.style.cursor = "pointer";
		joueur.base.element.addEventListener("click", onClickBase);
	});
}

// somme de puissance (carte + items) des pions du joueur actif ayant le
// mot-clé "constructeur", présents sur la case donnée OU sur une case
// adjacente (haut/bas/gauche/droite)
function puissanceConstructionSurCase(caseEl) {
	const idsAVerifier = [caseEl.id, ...casesAdjacentes(caseEl.id).map(c => c.id)];
	let total = 0;

	idsAVerifier.forEach(id => {
		occupantsDeCase(id).forEach(pion => {
			if (pion.dataset.joueur != joueur_actif) return;
			if (!pion.carte) return;

			// moteur.js : somme des valeurs "constructeur" de la carte et de ses
			// items (un "true" compte pour la puissance de la carte qui le porte)
			total += valeurConstructeur(pion);
		});
	});

	return total;
}

// cases du plateau où la puissance "constructeur" alentour (voir
// puissanceConstructionSurCase) est suffisante pour construire cette carte.
// le seuil requis se règle avec carte.cout_construction (0 par défaut si absent)
function casesConstructibles(carte) {
	const seuil = carte.cout_construction || 0;
	const resultat = [];

	document.querySelectorAll('#plateau [id^="cell-"]').forEach(c => {
		if (c.style.backgroundColor === "transparent") return; // case "trou", pas utilisable
		if (puissanceConstructionSurCase(c) >= seuil) resultat.push(c);
	});

	return resultat;
}

// affiche l'image du bâtiment, positionnée au centre de la case donnée
// (même logique de positionnement que pour les pions, en statique)
function placerBatimentSurCase(carte, caseEl) {
	const batiment = document.createElement("div");
	batiment.style.position = "absolute";
	batiment.style.width = "30px";
	batiment.style.height = "30px";
	batiment.style.zIndex = "9";
	batiment.dataset.joueur = joueur_actif; // simple info : qui l'a construit (n'affecte plus qui peut y ajouter une salle)
	batiment.carte = carte;
	carte.element = batiment; // pour retrouver ce bâtiment depuis sa carte (ex: y installer une salle)
	carte.case = caseEl; // pour vérifier la présence de constructeurs à proximité, peu importe le joueur

	const img = document.createElement("img");
	img.src = carte.image;
	img.style.height = "30px";
	img.draggable = false;
	batiment.appendChild(img);

	const rectPlateau = plateau.getBoundingClientRect();
	const rectCase = caseEl.getBoundingClientRect();
	batiment.style.left = (rectCase.left - rectPlateau.left + rectCase.width / 2 - 15) + "px";
	batiment.style.top = (rectCase.top - rectPlateau.top + rectCase.height / 2 - 15) + "px";

	pions.appendChild(batiment);

	return batiment;
}

// une fois le bâtiment choisi : met en évidence les cases constructibles et
// attend le clic sur l'une d'elles pour finaliser la construction
function choisirCaseConstruction(carte) {
	conteneur.innerHTML = "";

	const cibles = casesConstructibles(carte);

	if (cibles.length === 0) {
		message("Aucune case n'a assez de pions constructeurs a proximite");
		end_tour();
		return;
	}

	message("Clique sur une case pour y construire " + carte.name);

	function onClickCase(e) {
		const caseCliquee = e.currentTarget;

		cibles.forEach(c => {
			c.style.outline = "none";
			c.style.cursor = "default";
			c.removeEventListener("click", onClickCase);
		});

		const index = joueurs[joueur_actif].cartes.indexOf(carte);
		if (index !== -1) joueurs[joueur_actif].cartes.splice(index, 1);
		payer(joueur_actif, carte.prix);

		const carteClone = clonerCarte(carte);
		placerBatimentSurCase(carteClone, caseCliquee);
		batimentsConstruits.push(carteClone); // liste globale : n'appartient à aucun joueur en particulier
		notifierChangementEffets(); // un bâtiment échappe à la nuit du plateau : on redessine le noir
		declencher("a_la_pose", { batiment: carteClone, carte: carteClone });

		message(carte.name + " construit !");
		end_tour();
	}

	cibles.forEach(c => {
		c.style.outline = "3px solid orange";
		c.style.cursor = "pointer";
		c.addEventListener("click", onClickCase);
	});
}

// ---------------------------------------------------------------------
// Tente (mobile_vertical) : un batiment qui se deplace d'une case vers le haut ou le bas,
// comme un pion. elle est controlee par le joueur dont un pion est dedans ; ce pion ne bouge pas.
// ---------------------------------------------------------------------

// tentes controlees par ce joueur : celles qui ont un de ses pions dedans
function tentesDuJoueur(indexJoueur) {
	return batimentsConstruits.filter(b => b.mobile_vertical && b.case && b.element && !b.prisonnier && (() => {
		const occupant = casesOccupees.get(b.case.id);
		return !!occupant && Number(occupant.dataset.joueur) === indexJoueur;
	})());
}

// cases libres juste au-dessus et en dessous : ni trou, ni batiment, ni pion, ni base
function casesPourTente(tente) {
	const pos = parseCellId(tente.case.id);
	const basesIds = joueurs.map((_, i) => caseSousBase(i)).filter(Boolean).map(c => c.id);
	return [-1, 1].map(d => document.getElementById(cellIdDepuisGlobal(pos.ligne + d, pos.colonne))).filter(c =>
		c && c.style.backgroundColor !== "transparent" && !batimentSurCase(c.id) && !casesOccupees.has(c.id) && !basesIds.includes(c.id));
}

function peutDeplacerTente() {
	return tentesDuJoueur(joueur_actif).some(t => casesPourTente(t).length > 0);
}

// deplace la tente sur une case : le pion qui y etait reste sur l'ancienne case
function poserTenteSurCase(tente, caseEl) {
	const rectPlateau = plateau.getBoundingClientRect();
	const rectCase = caseEl.getBoundingClientRect();
	tente.case = caseEl;
	tente.element.style.left = (rectCase.left - rectPlateau.left + rectCase.width / 2 - 15) + "px";
	tente.element.style.top = (rectCase.top - rectPlateau.top + rectCase.height / 2 - 15) + "px";
	notifierChangementEffets(); // le noir des batiments suit la nouvelle case
}

function deplacerTente() {
	conteneur.innerHTML = "";
	const tentes = tentesDuJoueur(joueur_actif).filter(t => casesPourTente(t).length > 0);
	if (tentes.length === 0) {
		message("Aucune tente ne peut se deplacer");
		end_tour();
		return;
	}
	message("Clique sur une de tes tentes, puis sur la case voisine (haut ou bas)");

	function effacerDestinations() {
		tentes.forEach(t => casesPourTente(t).forEach(c => { c.style.outline = "none"; c.style.cursor = "default"; c.removeEventListener("click", t.surCase); }));
	}

	tentes.forEach(t => {
		t.surClic = () => { // choisir la tente : on affiche ses destinations
			effacerDestinations();
			casesPourTente(t).forEach(c => {
				c.style.outline = "3px solid orange"; c.style.cursor = "pointer";
				c.addEventListener("click", t.surCase);
			});
		};
		t.surCase = (e) => {
			const destination = e.currentTarget;
			effacerDestinations();
			tentes.forEach(autre => { autre.element.style.outline = "none"; autre.element.style.cursor = "default"; autre.element.removeEventListener("click", autre.surClic); });
			poserTenteSurCase(t, destination);
			message(t.name + " se deplace");
			end_tour();
		};
		t.element.style.outline = "3px solid gold"; t.element.style.cursor = "pointer";
		t.element.addEventListener("click", t.surClic);
	});
}

// tous les bâtiments posés sur le plateau, peu importe qui les a construits
function batimentsPoses() {
	return batimentsConstruits;
}

// un bâtiment est éligible à recevoir une salle si : il n'en a pas déjà une,
// et le joueur actif a assez de puissance "constructeur" (ses pions à lui)
// sur la case du bâtiment ou une case adjacente — peu importe qui a
// construit le bâtiment lui-même
// vrai si le joueur actif a au moins un pion avec le mot-clé "constructeur"
// valant plus que 0 (true, ou un chiffre > 0), sur la case donnée ou une case adjacente
function aConstructeurAProximite(caseEl) {
	const idsAVerifier = [caseEl.id, ...casesAdjacentes(caseEl.id).map(c => c.id)];

	return idsAVerifier.some(id => {
		return occupantsDeCase(id).some(pion =>
			pion.dataset.joueur == joueur_actif && pion.carte && valeurConstructeur(pion) > 0);
	});
}

function batimentsEligiblesPourSalle(carteSalle) {
	const seuil = (carteSalle && carteSalle.cout_construction) || 0;
	return batimentsPoses().filter(b =>
		!b.salle && !b.sans_salle && b.element && b.case && aConstructeurAProximite(b.case) &&
		puissanceConstructionSurCase(b.case) >= seuil // total "constructeur" de mes pions a portee >= cout de la salle
	);
}

// cartes "salle" en main, affichées seulement si au moins un batiment est
// éligible (peu importe le joueur qui l'a construit) grâce à un pion
// constructeur du joueur actif à proximité
function sallesJouables() {
	return joueurs[joueur_actif].cartes.filter(carte =>
		carte.type === "salle" &&
		peutPayer(joueur_actif, carte.prix) &&
		batimentsEligiblesPourSalle(carte).length > 0
	);
}

// affiche un petit badge dans le coin bas-droit du bâtiment : un dos de carte
// ("?") tant que la salle n'est pas révélée (voir salles.js)
function afficherSalleSurBatiment(batimentEl, salleCarte) {
	const badge = document.createElement("div");
	badge.style.position = "absolute";
	badge.style.right = "0";
	badge.style.bottom = "0";
	badge.style.width = "14px";
	badge.style.height = "14px";
	badge.style.border = "1px solid white";
	badge.style.borderRadius = "3px";
	badge.style.backgroundColor = "white";
	badge.style.fontSize = "11px";
	badge.style.lineHeight = "14px";
	badge.style.textAlign = "center";
	badge.style.zIndex = "11";
	batimentEl.appendChild(badge);
	salleCarte.badge = badge;
	majBadgeSalle(salleCarte);
}

// pose une carte "salle" sur un bâtiment (n'importe lequel) qui n'en a pas
// encore et près duquel le joueur actif a assez de constructeurs
function poserSalle(carte) {
	conteneur.innerHTML = "";

	const cibles = batimentsEligiblesPourSalle(carte);

	if (cibles.length === 0) {
		message("Aucun batiment ne peut recevoir cette salle");
		end_tour();
		return;
	}

	message("Clique sur un batiment pour y installer la salle");

	function onClickBatiment(e) {
		const batimentEl = e.currentTarget;
		const batimentCarte = cibles.find(b => b.element === batimentEl);

		cibles.forEach(b => {
			b.element.style.boxShadow = "none";
			b.element.style.cursor = "default";
			b.element.removeEventListener("click", onClickBatiment);
		});

		const index = joueurs[joueur_actif].cartes.indexOf(carte);
		if (index !== -1) joueurs[joueur_actif].cartes.splice(index, 1);
		payer(joueur_actif, carte.prix);

		const salleClone = clonerCarte(carte);
		salleClone.proprietaire = joueur_actif; // celui qui l'a posée : seul à la voir (salles.js)
		salleClone.revelee = false;
		batimentCarte.salle = salleClone;
		afficherSalleSurBatiment(batimentEl, salleClone);
		declencher("a_la_pose", { batiment: batimentCarte, carte: salleClone });

		message(carte.name + " installee !");
		end_tour();
	}

	cibles.forEach(b => {
		b.element.style.boxShadow = "0 0 0 3px violet";
		b.element.style.cursor = "pointer";
		b.element.addEventListener("click", onClickBatiment);
	});
}

// ---- économie : pièces (🪙) ----
// le prix en pièces (carte.prix) se paie à la pose d'un bâtiment ou d'une
// salle (et à l'achat d'un Blink). le coût en marteaux (cout_construction)
// n'est jamais payé : c'est un seuil de puissance constructeur.

function peutPayer(indexJoueur, montant) {
	return joueurs[indexJoueur].argent >= (montant || 0);
}

// retire le montant des pièces du joueur ; renvoie false (sans rien retirer)
// s'il n'en a pas assez
function payer(indexJoueur, montant) {
	const prix = montant || 0;
	if (!peutPayer(indexJoueur, prix)) return false;
	joueurs[indexJoueur].argent -= prix;
	afficherArgent();
	return true;
}

// affiche les pièces de chaque joueur (zone #debug de la page)
function afficherArgent() {
	debug(joueurs.map((j, i) => "J" + (i + 1) + " : " + j.argent + " pièce(s)").join("   |   "));
}

// cartes "batiment" en main qu'on peut se permettre ET pour lesquelles il
// existe au moins une case constructible
function batimentsJouables() {
	return joueurs[joueur_actif].cartes.filter(carte =>
		carte.type === "batiment" &&
		peutPayer(joueur_actif, carte.prix) &&
		casesConstructibles(carte).length > 0
	);
}

// utilisé par tamer.js pour n'afficher le bouton "construire" que si au
// moins un batiment est réellement constructible OU qu'une salle est posable
function peutConstruire() {
	return batimentsJouables().length > 0 || sallesJouables().length > 0;
}

function construire() {
	conteneur.innerHTML = "";

	const jouablesBatiments = batimentsJouables();
	const jouablesSalles = sallesJouables();

	if (jouablesBatiments.length === 0 && jouablesSalles.length === 0) {
		message("Aucun batiment ni salle a construire pour le moment");
		end_tour();
		return;
	}

	message("Choisis un batiment ou une salle a construire");

	jouablesBatiments.forEach(carte => {
		const btn = document.createElement("button");

		const img = document.createElement("img");
		img.src = carte.image;
		img.style.width = "24px";
		btn.appendChild(img);

		const label = document.createElement("span");
		creerTexteMixte(label, carte.name);
		btn.appendChild(label);

		btn.classList.add("bouton");
		btn.addEventListener("click", () => {
			choisirCaseConstruction(carte);
		});
		conteneur.appendChild(btn);
	});

	jouablesSalles.forEach(carte => {
		const btn = document.createElement("button");

		const img = document.createElement("img");
		img.src = carte.image;
		img.style.width = "24px";
		btn.appendChild(img);

		const label = document.createElement("span");
		creerTexteMixte(label, carte.name);
		btn.appendChild(label);

		btn.classList.add("bouton");
		btn.addEventListener("click", () => {
			poserSalle(carte);
		});
		conteneur.appendChild(btn);
	});
}

function activer() {
	conteneur.innerHTML = "";

	// pions du joueur actif dont le pouvoir ACTIF peut être activé (moteur.js :
	// un pouvoir passif ne s'active pas, une condition ou une cible manquante l'empêche)
	const pionsAvecPouvoir = pionsActivables(joueur_actif);

	if (pionsAvecPouvoir.length === 0) {
		message("Aucun de tes pions n'a de pouvoir a activer");
		end_tour();
		return;
	}

	message("Clique sur un pion pour activer son pouvoir");

	function onClickPion(e) {
		const pion = e.currentTarget;

		// on retire la mise en évidence et les écouteurs de tous les pions
		pionsAvecPouvoir.forEach(p => {
			p.style.boxShadow = "none";
			p.style.cursor = "grab";
			p.removeEventListener("click", onClickPion);
		});

		// moteur.js : choisit la cible déclarée par la carte puis appelle pouvoir(ctx)
		activerPouvoir(pion).then(() => end_tour());
	}

	// met en évidence les pions activables et les rend cliquables
	pionsAvecPouvoir.forEach(pion => {
		pion.style.boxShadow = "0 0 0 3px gold";
		pion.style.cursor = "pointer";
		pion.addEventListener("click", onClickPion);
	});
}

// retire un pion du plateau (case occupée + élément DOM + cartes_actif de son propriétaire)
function detruirePion(pion, tueur = null) {
	declencher("mort", { pion, extra: { tueur } }); // avant le retrait : le pion est encore sur le plateau
	retirerEffetsDe("pion", pion);

	(pion.passagers || []).slice().forEach(passager => detruirePion(passager, tueur)); // les passagers meurent avec leur transport
	libererCases(pion);
	batimentsConstruits.forEach(b => { if (b.prisonnier === pion) { b.prisonnier = null; b.cachot_salle = null; } });

	const proprietaire = joueurs[pion.dataset.joueur];
	if (proprietaire && pion.carte) {
		const index = proprietaire.cartes_actif.indexOf(pion.carte);
		if (index !== -1) proprietaire.cartes_actif.splice(index, 1);
	}

	pion.remove();
}

// premier pion rencontré sur chaque ligne droite (haut/bas/gauche/droite)
// depuis une case, jusqu'à "distance" cases. le premier pion trouvé sur
// une direction bloque la ligne (allié ou ennemi) ; les cases vides
// (biome ou trou) laissent passer la ligne de tir plus loin.
// renvoie des paires {pion, distance} : distance = nombre de cases entre
// l'origine et ce pion (1 = adjacent)
function ciblesEnLigneDroite(caseId, distance) {
	const pos = parseCellId(caseId);
	if (!pos) return [];

	const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
	const resultat = [];

	directions.forEach(([dLigne, dColonne]) => {
		for (let pas = 1; pas <= distance; pas++) {
			const id = cellIdDepuisGlobal(pos.ligne + dLigne * pas, pos.colonne + dColonne * pas);
			const el = document.getElementById(id);
			if (!el) break; // sorti du plateau

			const occupant = casesOccupees.get(el.id);
			if (occupant) {
				resultat.push({ pion: occupant, distance: pas }); // bloque, allié ou ennemi
				break;
			}
			// case vide (biome ou trou) : la ligne continue
		}
	});

	return resultat;
}

// pour chaque pion du joueur actif posé sur le plateau, la liste des
// pions ennemis atteignables (adjacents par défaut ; jusqu'à x+1 cases en
// ligne droite si le mot-clé "tireur" vaut un chiffre x)
function trouverCombatsPossibles() {
	const combatsPossibles = new Map(); // pion attaquant -> [pions ennemis atteignables]

	pionsSurPlateau().forEach((pion) => {
		if (pion.dataset.joueur != joueur_actif) return;
		if (motCle(pion, "peur_sang")) return; // ne peut pas attaquer
		if (etatBloquant(pion)) return; // gelé ou enfermé : ne peut pas attaquer (combat.js)

		const tireur = motCle(pion, "tireur");
		const distance = (typeof tireur === "number") ? tireur + 1 : 1;

		const ennemisAdjacents = ciblesDepuisLePion(pion, distance)
			.filter(({ pion: cible, distance: dist }) => {
				if (cible.dataset.joueur == joueur_actif) return false; // pas un ennemi

				// noir.js : sans Nyctalope sur une case noire, pas d'attaque à distance
				if (dist > 1 && pionBloqueParLeNoir(pion)) return false;

				// une cible "sous_terre" n'est attaquable qu'au corps à corps
				// (case adjacente : haut, bas, gauche ou droite)
				if (motCle(cible, "sous_terre") && dist > 1) return false;

				// combat.js : restrictions propres a la cible (Pastèque, La Chose)
				if (!cibleAttaquablePar(cible, pion, dist)) return false;

				return true;
			})
			.map(({ pion: cible }) => cible);

		// sous-case cachot : le pion qui est dans le bâtiment peut attaquer le prisonnier ennemi
		const batimentDuPion = batimentSurCase(pion.dataset.caseId);
		if (batimentDuPion && batimentDuPion.prisonnier && batimentDuPion.prisonnier.dataset.joueur != joueur_actif) {
			ennemisAdjacents.push(batimentDuPion.prisonnier);
		}

		if (ennemisAdjacents.length > 0) {
			combatsPossibles.set(pion, ennemisAdjacents);
		}
	});

	return combatsPossibles;
}

// puissance totale d'un pion : celle de sa carte + celle de tous ses items
function puissanceTotale(pion) {
	if (!pion.carte) return 0;

	let total = pion.carte.puissance || 0;

	itemsDe(pion).forEach(item => { // moteur.js : un item cassé ne compte plus
		total += item.puissance || 0;
		// Armes goblines : bonus selon la couleur du porteur, bonus_par_couleur: { vert: 3, orange: 2, rouge: 1 }
		if (item.bonus_par_couleur) total += item.bonus_par_couleur[couleurDe(pion)] || 0;
	});

	// bonus "dans le noir" (M. Bonsoir, Mme Bonjour) : champ bonus_noir de la carte
	if (pion.carte.bonus_noir && estDansLeNoir(pion)) {
		total += pion.carte.bonus_noir;
	}

	// bonus donnes par des effets actifs (amour des lecteurs d'un Poeme, couple Bonjour/Bonsoir...)
	effetsSur("pion", pion, "bonus_puissance").forEach(e => { total += (e.donnees && e.donnees.valeur) || 0; });
	total += bonusLienDAmour(pion); // moteur.js
	total += bonusSallesCouleur(pion); // salles.js : Repaire rebelle

	return total;
}

// si un pion "fragile" se retrouve à côté d'un pion "costaud" (peu importe
// le joueur), il perd définitivement le mot-clé "fragile". à appeler après
// tout placement/déplacement de pion susceptible de créer une nouvelle
// adjacence sur le plateau
function appliquerEffetCostaud() {
	pionsSurPlateau().forEach(pion => {
		if (!pion.carte || !pion.carte.mot_cle || !pion.carte.mot_cle.fragile) return;

		if (voisinsDuPion(pion).some(voisin => motCle(voisin, "costaud"))) {
			pion.carte.mot_cle.fragile = false;
		}
	});
}

// utilisé par tamer.js pour n'afficher le bouton "combattre" que si au
// moins un de tes pions a un ennemi adjacent
function peutCombattre() {
	return trouverCombatsPossibles().size > 0;
}

// déplace un pion déjà posé vers une nouvelle case : met à jour
// casesOccupees, son dataset.caseId, sa position visuelle, et réévalue
// l'effet costaud (utilisé par le mot-clé "belier" pour prendre la place
// d'un pion qu'il vient de tuer)
function deplacerPionSurCase(pion, caseEl) {
	const ancienneCaseId = pion.dataset.caseId;
	if (estGrandPion(pion) && !empreinteLibre(pion, caseEl.id)) return false;

	libererCases(pion);
	occuperCases(pion, caseEl.id);

	if (estGrandPion(pion)) {
		positionnerGrandPion(pion);
	} else {
		const rectPlateau = plateau.getBoundingClientRect();
		const rectCase = caseEl.getBoundingClientRect();
		pion.style.left = (rectCase.left - rectPlateau.left + rectCase.width / 2 - 15) + "px";
		pion.style.top = (rectCase.top - rectPlateau.top + rectCase.height / 2 - 15) + "px";
		ajusterInvite(pion);
	}

	appliquerEffetCostaud();
	signalerDeplacement(pion, ancienneCaseId);
	return true;
}

// place l'element d'un grand pion au centre de son empreinte, a la taille de son plus grand cote
function positionnerGrandPion(pion) {
	const ids = casesDuPion(pion);
	const rectPlateau = plateau.getBoundingClientRect();
	// boite englobante des cases de l'empreinte : le pion a la forme de son empreinte (2x1, 2x2...)
	let gauche = Infinity, haut = Infinity, droite = -Infinity, bas = -Infinity;
	ids.forEach(id => {
		const r = document.getElementById(id).getBoundingClientRect();
		gauche = Math.min(gauche, r.left); haut = Math.min(haut, r.top);
		droite = Math.max(droite, r.left + r.width); bas = Math.max(bas, r.top + r.height);
	});
	const marge = 10;
	const largeur = Math.max(30, droite - gauche - marge);
	const hauteur = Math.max(30, bas - haut - marge);
	pion.style.width = largeur + "px";
	pion.style.height = hauteur + "px";
	const img = pion.querySelector ? pion.querySelector(":scope > img") : null;
	if (img) { img.style.width = largeur + "px"; img.style.height = hauteur + "px"; }
	pion.style.left = ((gauche + droite) / 2 - rectPlateau.left - largeur / 2) + "px";
	pion.style.top = ((haut + bas) / 2 - rectPlateau.top - hauteur / 2) + "px";
}

// pions atteignables depuis un pion, en comptant toutes les cases d'un grand pion
function ciblesDepuisLePion(pion, distance) {
	const atteints = [];
	casesDuPion(pion).forEach(id => {
		ciblesEnLigneDroite(id, distance).forEach(entree => {
			if (entree.pion === pion || atteints.some(a => a.pion === entree.pion)) return;
			atteints.push(entree);
		});
	});
	return atteints;
}

// si un pion "claustrophobe" se retrouve sur la case d'un bâtiment (forcé,
// par ex. un bâtiment construit sur sa case), il en sort tout seul au
// début du tour suivant de son propriétaire, vers une case adjacente libre
function appliquerSortieClaustrophobes(indexJoueur) {
	pionsSurPlateau().forEach((pion) => {
		if (pion.dataset.joueur != indexJoueur) return;
		if (!motCle(pion, "claustrophobe")) return;
		if (etatBloquant(pion)) return; // gelé ou enfermé : on ne le déplace pas de force
		if (!batimentSurCase(pion.dataset.caseId)) return;

		const caseLibre = casesAdjacentes(pion.dataset.caseId).find(c =>
			!casesOccupees.has(c.id) &&
			c.style.backgroundColor !== "transparent" &&
			!batimentSurCase(c.id)
		);

		if (caseLibre) {
			deplacerPionSurCase(pion, caseLibre);
			message(pion.carte.name + " (claustrophobe) est sorti du batiment automatiquement");
		}
	});
}

function combattre() {
	conteneur.innerHTML = "";

	const combatsPossibles = trouverCombatsPossibles();

	if (combatsPossibles.size === 0) {
		message("Aucun de tes pions ne peut combattre");
		end_tour();
		return;
	}

	message("Choisis un de tes pions pour combattre");

	function annulerSelectionAttaquants() {
		combatsPossibles.forEach((_, pion) => {
			pion.style.boxShadow = "none";
			pion.style.cursor = "grab";
			pion.removeEventListener("click", onClickAttaquant);
		});
	}

	function onClickAttaquant(e) {
		const attaquant = e.currentTarget;
		const ennemis = combatsPossibles.get(attaquant);

		annulerSelectionAttaquants();

		message("Choisis le pion ennemi a attaquer");

		function annulerSelectionCibles() {
			ennemis.forEach(cible => {
				cible.style.boxShadow = "none";
				cible.style.cursor = "grab";
				cible.removeEventListener("click", onClickCible);
			});
		}

		function onClickCible(e) {
			const cible = e.currentTarget;
			annulerSelectionCibles();

			// combat.js : choix des aidants des deux camps, puis résolution
			lancerCombat(attaquant, cible).then(() => end_tour());
		}

		// met en évidence les pions ennemis attaquables
		ennemis.forEach(cible => {
			cible.style.boxShadow = "0 0 0 3px crimson";
			cible.style.cursor = "pointer";
			cible.addEventListener("click", onClickCible);
		});
	}

	// met en évidence tous les pions du joueur actif pouvant combattre
	combatsPossibles.forEach((_, pion) => {
		pion.style.boxShadow = "0 0 0 3px gold";
		pion.style.cursor = "pointer";
		pion.addEventListener("click", onClickAttaquant);
	});
}