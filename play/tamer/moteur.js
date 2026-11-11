// =====================================================================
// Moteur de pouvoirs (voir GLOSSARY.md et le ticket "Modèle générique
// d'un pouvoir, sort ou événement")
//
// Une carte peut déclarer :
//   effet(ctx)        sort / événement / salle : ce qui se passe quand on la joue
//   pouvoir(ctx)      pion : capacité du pion (active par défaut)
//   passif: true      le pouvoir ne s'active pas à la main et ne prend pas l'action
//   cible             "aucune" | "case" | "pion" | "pion_ennemi" | "pion_allie" | "batiment"
//                     ou { type, filtre(candidat, ctx), zone }
//   condition(ctx)    renvoie faux => la carte ne peut pas être jouée / activée
//   declencheurs      { a_la_pose, debut_tour, fin_tour, deplacement,
//                       entree_batiment, sortie_batiment, attaque, mort } : fn(ctx)
//
// ctx = { joueur, source, cible, jeu, ...extras (pion, batiment, item, salle, role) }
// =====================================================================

const DECLENCHEURS = [
	"a_la_pose", "debut_tour", "fin_tour", "deplacement",
	"entree_batiment", "sortie_batiment", "attaque", "mort",
];
const TYPES_CIBLE = ["aucune", "case", "pion", "pion_ennemi", "pion_allie", "batiment"];
const PORTEES_EFFET = ["pion", "case", "batiment", "item", "salle", "joueur", "plateau"];
const TYPES_DUREE = ["fin_de_tour", "n_tours", "condition", "permanent"];

// ---------------------------------------------------------------------
// Effets actifs : états posés sur un pion, une case, un bâtiment, un
// joueur ou tout le plateau, avec une durée
// ---------------------------------------------------------------------

const effetsActifs = [];

function normaliserDuree(duree) {
	if (duree === undefined || duree === null) return { type: "permanent" };
	const d = (typeof duree === "string") ? { type: duree } : { ...duree };
	if (!TYPES_DUREE.includes(d.type)) throw new Error("Durée d'effet inconnue : " + d.type);
	if (d.type === "n_tours") {
		if (!(d.n >= 1)) throw new Error("Durée n_tours : n doit valoir au moins 1");
		d.restant = d.n;
	}
	if (d.type === "condition" && typeof d.condition !== "function") {
		throw new Error("Durée condition : une fonction condition(ctx, effet) est requise");
	}
	return d;
}

// pose un effet actif.
// - nom : identifiant de l'effet (ex. "noir", "freeze")
// - portee : "pion" | "case" | "batiment" | "joueur" | "plateau"
// - cible : l'élément visé (pion, case, carte de bâtiment, index de joueur ; null pour le plateau)
// - duree : "permanent" | "fin_de_tour" | { type: "n_tours", n } | { type: "condition", condition(ctx, effet) }
// - proprietaire : joueur qui a posé l'effet (par défaut le joueur actif)
function ajouterEffet({ nom, portee, cible = null, duree = "permanent", proprietaire, donnees = {} }) {
	if (!nom) throw new Error("ajouterEffet : nom manquant");
	if (!PORTEES_EFFET.includes(portee)) throw new Error("Portée d'effet inconnue : " + portee);

	const effet = {
		nom,
		portee,
		cible: portee === "plateau" ? null : cible,
		duree: normaliserDuree(duree),
		proprietaire: (proprietaire === undefined) ? joueur_actif : proprietaire,
		donnees,
	};
	effetsActifs.push(effet);
	notifierChangementEffets();
	return effet;
}

function retirerEffet(effet) {
	const index = effetsActifs.indexOf(effet);
	if (index !== -1) {
		effetsActifs.splice(index, 1);
		notifierChangementEffets();
	}
}

// les effets visibles (le noir) se redessinent quand un effet change
function notifierChangementEffets() {
	if (typeof rafraichirRenduNoir === "function") rafraichirRenduNoir();
}

// tous les effets posés sur une cible (nom optionnel pour filtrer)
function effetsSur(portee, cible = null, nom) {
	return effetsActifs.filter(e =>
		e.portee === portee &&
		(portee === "plateau" || e.cible === cible) &&
		(nom === undefined || e.nom === nom)
	);
}

function aEffet(nom, portee, cible = null) {
	return effetsSur(portee, cible, nom).length > 0;
}

function retirerEffetsDe(portee, cible) {
	effetsSur(portee, cible).forEach(retirerEffet);
}

// début du tour d'un joueur : fait avancer les durées "n_tours" de ses
// effets, puis réévalue les conditions de tous les effets
function debutTourEffets(indexJoueur) {
	effetsActifs.slice().forEach(e => {
		if (e.duree.type === "n_tours" && e.proprietaire === indexJoueur) {
			e.duree.restant -= 1;
			if (e.duree.restant <= 0) retirerEffet(e);
		}
	});
	reevaluerEffets();
}

// fin du tour : les effets "fin_de_tour" disparaissent
function finTourEffets() {
	effetsActifs.slice().forEach(e => {
		if (e.duree.type === "fin_de_tour") retirerEffet(e);
	});
}

// retire les effets dont la condition de fin est remplie (ex. Freeze levé
// par un Costaud) et ceux posés sur un pion qui n'est plus sur le plateau
function reevaluerEffets() {
	effetsActifs.slice().forEach(e => {
		if (e.portee === "pion" && !pionSurPlateau(e.cible)) {
			retirerEffet(e);
			return;
		}
		if (e.duree.type === "condition") {
			let leve = false;
			try {
				leve = !!e.duree.condition(creerContexte({ joueur: e.proprietaire, source: e.cible }), e);
			} catch (err) {
				console.error("Condition d'effet en erreur (" + e.nom + ")", err);
			}
			if (leve) retirerEffet(e);
		}
	});
}

function pionSurPlateau(pion) {
	if (!pion || !pion.dataset) return false;
	if (batimentsConstruits.some(b => b.prisonnier === pion)) return true; // enfermé dans un cachot : toujours en jeu
	if (pion.embarqueSur) return pionSurPlateau(pion.embarqueSur); // transporté par un autre pion (Dinosaure)
	return occupantsDeCase(pion.dataset.caseId).includes(pion);
}

// ---------------------------------------------------------------------
// Contexte transmis à tous les effets
// ---------------------------------------------------------------------

function pionsDuJoueur(indexJoueur) {
	const resultat = [];
	pionsSurPlateau().forEach(pion => {
		if (pion.dataset.joueur == indexJoueur) resultat.push(pion);
	});
	return resultat;
}

// demande un choix à un joueur (pas forcément le joueur actif) sur le même
// écran : le jeu annonce qui choisit. options = [{ label, valeur }].
// renvoie une promesse qui donne la valeur choisie.
function demanderChoix(indexJoueur, texte, options) {
	return new Promise(resolve => {
		message("Joueur " + (indexJoueur + 1) + " : " + texte);
		conteneur.innerHTML = "";
		options.forEach(option => {
			const bouton = document.createElement("button");
			bouton.textContent = option.label;
			bouton.classList.add("bouton");
			bouton.addEventListener("click", () => {
				conteneur.innerHTML = "";
				resolve(option.valeur);
			});
			conteneur.appendChild(bouton);
		});
	});
}

// l'accès au jeu donné aux cartes : tout ce qu'un effet a besoin de lire ou d'agir
const jeu = {
	get joueurs() { return joueurs; },
	get casesOccupees() { return casesOccupees; },
	get batiments() { return batimentsConstruits; },
	get joueurActif() { return joueur_actif; },
	message: (texte) => message(texte),
	ajouterEffet, retirerEffet, effetsSur, aEffet, retirerEffetsDe,
	declencher: (nom, options) => declencher(nom, options),
	pionsDuJoueur,
	casesAdjacentes: (id) => casesAdjacentes(id),
	batimentSurCase: (id) => batimentSurCase(id),
	detruirePion: (pion) => detruirePion(pion),
	deplacerPionSurCase: (pion, caseEl) => deplacerPionSurCase(pion, caseEl),
	demanderChoix,
};

// ctx = { joueur, source, cible, jeu, ...extras }
function creerContexte({ joueur, source = null, cible = null, extra = {} } = {}) {
	return {
		joueur: (joueur === undefined) ? joueur_actif : joueur,
		source,
		cible,
		jeu,
		...extra,
	};
}

// états qui empêchent un pion d'agir : gelé, enfermé ou endormi (effets actifs sur le pion).
// il ne peut ni bouger, ni attaquer, ni activer de pouvoir, ni aider, ni être
// déplacé de force ; ses déclencheurs automatiques continuent
function etatBloquant(pion) {
	return aEffet("gele", "pion", pion) || aEffet("enferme", "pion", pion) || aEffet("endormi", "pion", pion);
}

// vrai si la carte n'a pas de condition, ou si sa condition est remplie
function conditionOk(carte, ctx) {
	if (!carte || typeof carte.condition !== "function") return true;
	try {
		return !!carte.condition(ctx);
	} catch (err) {
		console.error("Condition en erreur (" + carte.name + ")", err);
		return false;
	}
}

// ---------------------------------------------------------------------
// Ciblage déclaratif
// ---------------------------------------------------------------------

// normalise carte.cible en { type, filtre, zone }
// défaut : un sort cible une case de la ligne ou colonne de la base du
// joueur ; les autres cartes ne visent personne
function normaliserCible(carte) {
	let cible = carte.cible;
	if (cible === undefined || cible === null) {
		cible = (carte.type === "sort") ? "pion" : "aucune";
	}
	if (typeof cible === "string") cible = { type: cible };
	cible = { ...cible };

	if (!TYPES_CIBLE.includes(cible.type)) throw new Error("Type de cible inconnu : " + cible.type);
	if (cible.zone === undefined) {
		// un sort se lance dans la zone de ses sources (sorts.js) : base, lanceurs, tour de mage
		cible.zone = (carte.type === "sort") ? "zone_sorts" : "plateau";
	}
	return cible;
}

// les éléments qui peuvent être visés : cases (DOM), pions (DOM) ou cartes de bâtiments
function candidatsCible(carte, ctx) {
	const cible = normaliserCible(carte);
	if (cible.type === "aucune") return [];

	let idsZone = null;
	if (cible.zone === "zone_sorts") {
		idsZone = zoneDeSorts(ctx.joueur); // sorts.js : réunion des zones des sources du joueur
	} else if (cible.zone === "ligne_colonne_base") {
		idsZone = new Set(casesLigneColonneBase(ctx.joueur).map(c => c.id));
	}
	const dansZone = (caseId) => !idsZone || idsZone.has(caseId);
	const filtre = (candidat) => typeof cible.filtre !== "function" || !!cible.filtre(candidat, ctx);

	let candidats = [];

	if (cible.type === "case") {
		document.querySelectorAll('#plateau [id^="cell-"]').forEach(c => {
			if (c.style.backgroundColor === "transparent") return; // case "trou"
			if (dansZone(c.id)) candidats.push(c);
		});
	} else if (cible.type === "batiment") {
		candidats = batimentsConstruits.filter(b => b.case && dansZone(b.case.id));
	} else {
		pionsSurPlateau().forEach(pion => {
			const estAllie = pion.dataset.joueur == ctx.joueur;
			if (cible.type === "pion_ennemi" && estAllie) return;
			if (cible.type === "pion_allie" && !estAllie) return;
			if (dansZone(pion.dataset.caseId)) candidats.push(pion);
		});
	}

	return candidats.filter(filtre);
}

// élément DOM à mettre en évidence pour un candidat
function elementDeCandidat(candidat) {
	return (candidat && candidat.element) ? candidat.element : candidat;
}

// met en évidence les candidats et attend le clic du joueur.
// promesse -> { ok: true, cible } (cible = null si la carte ne vise personne)
// ou { ok: false } s'il n'existe aucune cible valide
function choisirCible(carte, ctx) {
	const cible = normaliserCible(carte);
	if (cible.type === "aucune") return Promise.resolve({ ok: true, cible: null });

	const candidats = candidatsCible(carte, ctx);
	if (candidats.length === 0) {
		message("Aucune cible valide pour " + (carte.name || "cette carte"));
		return Promise.resolve({ ok: false });
	}

	message("Choisis la cible de " + (carte.name || "cette carte"));

	return new Promise(resolve => {
		const ecouteurs = [];

		function nettoyer() {
			ecouteurs.forEach(({ el, ecouteur }) => {
				el.style.outline = "none";
				el.style.cursor = (cible.type === "case") ? "default" : "grab";
				el.removeEventListener("click", ecouteur);
			});
		}

		candidats.forEach(candidat => {
			const el = elementDeCandidat(candidat);
			const ecouteur = () => {
				nettoyer();
				resolve({ ok: true, cible: candidat });
			};
			el.style.outline = "3px solid deepskyblue";
			el.style.cursor = "pointer";
			el.addEventListener("click", ecouteur);
			ecouteurs.push({ el, ecouteur });
		});
	});
}

// ---------------------------------------------------------------------
// Jouer un effet (sort / événement) et activer un pouvoir
// ---------------------------------------------------------------------

// lance une fonction d'effet avec son contexte ; toute erreur est
// attrapée pour ne jamais bloquer la partie. promesse terminée une fois
// l'effet (éventuellement asynchrone) fini.
function lancerEffet(fonction, ctx, nomCarte) {
	try {
		return Promise.resolve(fonction(ctx)).catch(err => {
			console.error("Effet en erreur (" + nomCarte + ")", err);
		});
	} catch (err) {
		console.error("Effet en erreur (" + nomCarte + ")", err);
		return Promise.resolve();
	}
}

// joue l'effet d'une carte sort / événement : choisit la cible si besoin,
// puis appelle carte.effet(ctx). promesse -> true si l'effet a été lancé.
function jouerEffetCarte(carte) {
	const ctx = creerContexte({ joueur: joueur_actif });
	return choisirCible(carte, ctx).then(res => {
		if (!res.ok) return false;
		ctx.cible = res.cible;
		if (typeof carte.effet !== "function") return true;
		return lancerEffet(carte.effet, ctx, carte.name).then(() => true);
	});
}

// un pouvoir est actif s'il s'active à la main (consomme l'action) ;
// passif: true => il n'agit que par déclencheurs et effets
function pouvoirEstActif(carte) {
	return !!carte && typeof carte.pouvoir === "function" && !carte.passif;
}

// pions du joueur dont le pouvoir actif peut être activé maintenant
// (condition remplie et, si une cible est requise, au moins une cible valide)
function pionsActivables(indexJoueur) {
	return pionsDuJoueur(indexJoueur).filter(pion => {
		const carte = pion.carte;
		if (!pouvoirEstActif(carte)) return false;
		if (etatBloquant(pion)) return false; // gelé ou enfermé : ne peut pas activer de pouvoir
		const ctx = creerContexte({ joueur: indexJoueur, source: pion });
		if (!conditionOk(carte, ctx)) return false;
		return normaliserCible(carte).type === "aucune" || candidatsCible(carte, ctx).length > 0;
	});
}

// active le pouvoir d'un pion. promesse -> true si le pouvoir a été lancé.
function activerPouvoir(pion) {
	const carte = pion.carte;
	const ctx = creerContexte({ joueur: joueur_actif, source: pion });
	return choisirCible(carte, ctx).then(res => {
		if (!res.ok) return false;
		ctx.cible = res.cible;
		return lancerEffet(carte.pouvoir, ctx, carte.name).then(() => true);
	});
}

// ---------------------------------------------------------------------
// Déclencheurs
// ---------------------------------------------------------------------

// liste des cartes qui peuvent réagir à un déclencheur : { carte, source, item, salle }
function emetteursPourPion(pion) {
	const liste = [{ carte: pion.carte, source: pion }];
	itemsDe(pion).forEach(item => liste.push({ carte: item, source: pion, item }));
	return liste;
}

function emetteursPourBatiment(batiment) {
	const liste = [{ carte: batiment, source: elementDeCandidat(batiment), batiment }];
	if (batiment.salle) liste.push({ carte: batiment.salle, source: elementDeCandidat(batiment), batiment, salle: batiment.salle });
	return liste;
}

// fait réagir les cartes concernées à un déclencheur.
//  options.pion      pion concerné (pose, déplacement, attaque, mort, entrée/sortie)
//  options.batiment  bâtiment concerné (pose, entrée/sortie)
//  options.carte     pour "a_la_pose" : la carte qui vient d'être posée (pion, item, bâtiment, salle)
//  options.extra     données ajoutées au contexte (cible, role, tueur…)
// "debut_tour" / "fin_tour" concernent les pions du joueur actif, leurs
// items, et tous les bâtiments et salles du plateau.
function declencher(nom, options = {}) {
	if (!DECLENCHEURS.includes(nom)) throw new Error("Déclencheur inconnu : " + nom);

	const { pion = null, batiment = null, carte = null, extra = {} } = options;
	let emetteurs = [];

	if (nom === "debut_tour" || nom === "fin_tour") {
		pionsDuJoueur(joueur_actif).forEach(p => emetteurs.push(...emetteursPourPion(p)));
		batimentsConstruits.forEach(b => emetteurs.push(...emetteursPourBatiment(b)));
	} else if (nom === "a_la_pose") {
		const hote = pion || batiment;
		const emetteur = (pion ? emetteursPourPion(pion) : emetteursPourBatiment(batiment))
			.find(e => e.carte === carte);
		if (hote && emetteur) emetteurs = [emetteur];
	} else if (nom === "entree_batiment" || nom === "sortie_batiment") {
		if (pion) emetteurs.push(...emetteursPourPion(pion));
		if (batiment) emetteurs.push(...emetteursPourBatiment(batiment));
	} else if (pion) {
		emetteurs = emetteursPourPion(pion);
	}

	emetteurs.forEach(({ carte: emettrice, source, item, salle, batiment: batimentEmetteur }) => {
		const handler = emettrice && emettrice.declencheurs && emettrice.declencheurs[nom];
		if (typeof handler !== "function") return;

		const proprietaire = (source && source.dataset && source.dataset.joueur !== undefined && source.carte && source.carte.type === "pion")
			? Number(source.dataset.joueur)
			: joueur_actif;

		const ctx = creerContexte({
			joueur: proprietaire,
			source,
			extra: {
				declencheur: nom,
				pion,
				batiment: batiment || batimentEmetteur || null,
				item: item || null,
				salle: salle || null,
				...extra,
			},
		});
		lancerEffet(handler, ctx, emettrice.name);
	});
}

// à appeler après qu'un pion a changé de case : signale sortie du bâtiment
// quitté, déplacement, puis entrée dans le bâtiment rejoint, et réévalue
// les effets
// Endormi (Papillon) : etat bloquant comme gele ; il se leve des qu'un pion de son proprietaire
// vient de bouger a cote de lui (la condition de l'effet lit donnees.reveille)
function reveillerEndormis(pionDeplace) {
	const voisins = voisinsDuPion(pionDeplace);
	effetsActifs.forEach(e => {
		if (e.nom !== "endormi" || e.portee !== "pion" || e.cible === pionDeplace) return;
		if (Number(e.cible.dataset.joueur) !== Number(pionDeplace.dataset.joueur)) return;
		if (voisins.includes(e.cible)) e.donnees.reveille = true;
	});
}

function signalerDeplacement(pion, ancienneCaseId) {
	const ancien = ancienneCaseId ? batimentSurCase(ancienneCaseId) : undefined;
	const nouveau = batimentSurCase(pion.dataset.caseId);

	if (ancienneCaseId) reveillerEndormis(pion);
	if (ancien && ancien !== nouveau) declencher("sortie_batiment", { pion, batiment: ancien });
	if (ancienneCaseId) declencher("deplacement", { pion }); // poser un pion n'est pas le déplacer
	if (nouveau && nouveau !== ancien) {
		nouveau.dernier_entre = pion; // le bâtiment mémorise la dernière unité entrée (Tour de mage)
		declencher("entree_batiment", { pion, batiment: nouveau });
	}

	reevaluerEffets();
}

// ---------------------------------------------------------------------
// Cycle de tour
// ---------------------------------------------------------------------

function moteurDebutTour(indexJoueur) {
	debutTourEffets(indexJoueur);
	declencher("debut_tour");
}

function moteurFinTour() {
	declencher("fin_tour");
	finTourEffets();
}

// ---------------------------------------------------------------------
// Items : emplacements, prérequis et mots-clés cumulés
//
// Un pion peut porter : 2 mains, 1 tête, 1 gemme. Chaque item déclare
//   emplacement : "main" (défaut) | "deux_mains" | "tete" | "gemme"
//                 (ou un tableau de ces valeurs, qui s'additionnent)
//   requiert    : mot-clé que le porteur doit déjà avoir (ex. "malin"),
//                 ou un tableau de mots-clés
// ---------------------------------------------------------------------

const CAPACITE_EMPLACEMENTS = { main: 2, tete: 1, gemme: 1 };

// tous les items portés par un pion, cassés ou non (ils occupent leur emplacement)
function itemsPortes(pion) {
	return (pion && pion.carte && Array.isArray(pion.carte.item)) ? pion.carte.item : [];
}

// les items d'un pion qui agissent : un item cassé ne donne plus ni puissance,
// ni mots-clés, ni lanceur, et ne réagit plus aux déclencheurs
function itemsDe(pion) {
	return itemsPortes(pion).filter(item => !aEffet("casse", "item", item));
}

// mots-clés qu'un pion Courageux ignore (ses "peurs" et phobies)
const MOTS_CLES_DE_PEUR = ["claustrophobe", "peur_sang"];

// mots-clés "mentaux" : une gemme Mental les retire à son porteur
const MOTS_CLES_MENTAUX = [
	"fort_esprit", "claustrophobe", "courageux", "analphabete", "peur_sang",
	"meute", "nyctalope", "malin", "ingenieur", "chef",
];

// donne un mot-clé à un pion pour un moment (effet actif nommé "mot_cle") :
// ex. Bruit suspect donne Claustrophobe, Maison hantée aussi pendant un tour
function accorderMotCle(pion, nom, valeur = true, duree = "permanent", proprietaire) {
	return ajouterEffet({
		nom: "mot_cle", portee: "pion", cible: pion, duree, proprietaire,
		donnees: { mot_cle: nom, valeur },
	});
}

// valeur brute d'un mot-clé : carte + items actifs + mots-clés accordés par des
// effets. false si absent, true s'il est vrai quelque part, un nombre sinon
// (constructeur : somme des nombres ; autres : le plus grand)
function motCleBrut(pion, nom) {
	if (!pion || !pion.carte) return false;

	// Demence : le pion perd tous ses mots-cles et prend ceux de la carte tiree
	const demence = effetsSur("pion", pion, "demence")[0];
	let valeurs;
	if (demence) {
		valeurs = [demence.donnees.mots ? demence.donnees.mots[nom] : undefined];
	} else {
		const sources = [pion.carte, ...itemsDe(pion)];
		valeurs = sources
			.map(s => (s && s.mot_cle) ? s.mot_cle[nom] : undefined)
			.concat(effetsSur("pion", pion, "mot_cle")
				.filter(e => e.donnees && e.donnees.mot_cle === nom)
				.map(e => e.donnees.valeur));
		// mots-cles donnes a l'occupant par son batiment (Arbre abri : Peur du sang)
		const batiment = (pion.dataset && typeof batimentSurCase === "function") ? batimentSurCase(pion.dataset.caseId) : null;
		if (batiment && batiment.mots_cles_occupant) valeurs.push(batiment.mots_cles_occupant[nom]);
	}
	// un item peut retirer des mots-cles a son porteur (Bouton : Analphabete)
	if (itemsDe(pion).some(item => (item.retire_mots_cles || []).includes(nom))) return false;
	valeurs = valeurs.filter(v => v !== undefined && v !== null && v !== false && v !== 0);

	if (valeurs.length === 0) return false;
	const nombres = valeurs.filter(v => typeof v === "number");
	if (nombres.length === 0) return true;
	return (nom === "constructeur")
		? nombres.reduce((a, b) => a + b, 0)
		: Math.max(...nombres);
}

// valeur d'un mot-clé pour un pion (voir motCleBrut). un pion Courageux
// ignore Claustrophobe et Peur du sang, d'où qu'ils viennent (carte, item, effet)
function motCle(pion, nom) {
	// gemme Mental (item avec retire_mentaux: true) : plus aucun mot-clé mental
	if (MOTS_CLES_MENTAUX.includes(nom) && itemsDe(pion).some(item => item.retire_mentaux)) return false;
	if (MOTS_CLES_DE_PEUR.includes(nom) && motCleBrut(pion, "courageux")) return false;
	return motCleBrut(pion, nom);
}

// Analphabète : un pion qui ne sait pas lire ne peut pas lire un Poème
// (seul effet de ce mot-clé pour l'instant)
function peutLire(pion) {
	return !motCle(pion, "analphabete");
}

// contribution "constructeur" d'un pion : la somme des valeurs de sa carte
// et de ses items ; un constructeur à "true" compte pour la puissance de
// la carte qui le porte
function valeurConstructeur(pion) {
	if (!pion || !pion.carte) return 0;
	return [pion.carte, ...itemsDe(pion)].reduce((total, source) => {
		const c = source.mot_cle ? source.mot_cle.constructeur : undefined;
		if (!c) return total;
		return total + ((typeof c === "number") ? c : (source.puissance || 0));
	}, 0);
}

// emplacements occupés par un item : { main, tete, gemme }
function emplacementsItem(item) {
	const declares = Array.isArray(item.emplacement) ? item.emplacement : [item.emplacement || "main"];
	const besoin = { main: 0, tete: 0, gemme: 0 };
	declares.forEach(e => {
		if (e === "deux_mains") besoin.main += 2;
		else if (besoin[e] !== undefined) besoin[e] += 1;
		else throw new Error("Emplacement d'item inconnu : " + e);
	});
	return besoin;
}

function emplacementsUtilises(pion) {
	const total = { main: 0, tete: 0, gemme: 0 };
	itemsPortes(pion).forEach(item => {
		const b = emplacementsItem(item);
		total.main += b.main; total.tete += b.tete; total.gemme += b.gemme;
	});
	return total;
}

// vrai si le pion peut recevoir cet item : de la place dans chaque
// emplacement demandé, et tous les mots-clés requis déjà possédés
function peutRecevoirItem(pion, item) {
	if (!pion || !pion.carte || pion.carte.type !== "pion") return false;

	const besoin = emplacementsItem(item);
	const utilise = emplacementsUtilises(pion);
	for (const e of Object.keys(CAPACITE_EMPLACEMENTS)) {
		if (utilise[e] + besoin[e] > CAPACITE_EMPLACEMENTS[e]) return false;
	}

	const requis = Array.isArray(item.requiert) ? item.requiert : (item.requiert ? [item.requiert] : []);
	return requis.every(nom => !!motCle(pion, nom));
}

// pions du joueur sur lesquels l'item peut être posé
function pionsPouvantRecevoir(item, indexJoueur) {
	return pionsDuJoueur(indexJoueur).filter(pion => peutRecevoirItem(pion, item));
}

// ---------------------------------------------------------------------
// Camp (voir le ticket "Changement de camp")
//
// le camp d'un pion est son propriétaire. changer de camp transfère le pion
// définitivement à un autre joueur, avec sa case, ses items et ses effets
// actifs (dont le propriétaire devient le nouveau joueur). Fort d'esprit
// l'interdit. on ne transfère jamais vers un joueur éliminé.
// ---------------------------------------------------------------------

// { ok: true } ou { ok: false, raison } si le transfert est impossible
function peutChangerDeCamp(pion, nouveauJoueur) {
	if (!pion || !pion.carte || !pion.dataset) return { ok: false, raison: "pas un pion" };
	if (!joueurs[nouveauJoueur]) return { ok: false, raison: "joueur inconnu" };
	if (Number(pion.dataset.joueur) === nouveauJoueur) return { ok: false, raison: "deja dans ce camp" };
	if (joueurs[nouveauJoueur].elimine) return { ok: false, raison: "joueur elimine" };
	if (motCle(pion, "fort_esprit")) return { ok: false, raison: "fort d'esprit" };
	return { ok: true };
}

// transfère le pion au joueur donné. renvoie { ok, raison? }
function transfererPion(pion, nouveauJoueur) {
	const verdict = peutChangerDeCamp(pion, nouveauJoueur);
	if (!verdict.ok) return verdict;

	const ancienJoueur = Number(pion.dataset.joueur);

	const ancienneListe = joueurs[ancienJoueur].cartes_actif;
	const index = ancienneListe.indexOf(pion.carte);
	if (index !== -1) ancienneListe.splice(index, 1);
	joueurs[nouveauJoueur].cartes_actif.push(pion.carte);

	pion.dataset.joueur = String(nouveauJoueur);

	// les effets posés sur le pion suivent : leur propriétaire devient le nouveau joueur
	effetsSur("pion", pion).forEach(e => { e.proprietaire = nouveauJoueur; });

	message(pion.carte.name + " passe dans le camp du joueur " + (nouveauJoueur + 1));
	reevaluerEffets();
	return { ok: true };
}

Object.assign(jeu, { peutChangerDeCamp, transfererPion, accorderMotCle, peutLire });


// ---------------------------------------------------------------------
// Lien d'amour (Poeme) : +2 de puissance a chacun des deux lecteurs tant
// qu'ils sont adjacents, que le Poeme est toujours porte par le 1er lecteur
// et que les deux sont en jeu
// ---------------------------------------------------------------------

function bonusLienDAmour(pion) {
	let total = 0;
	effetsSur("pion", pion, "lien_amour").forEach(lien => {
		const { avec, poeme, porteur } = lien.donnees;
		if (!avec || !pionSurPlateau(avec) || !pionSurPlateau(pion)) return;
		if (!itemsPortes(porteur).includes(poeme) || !pionSurPlateau(porteur)) return;
		if (sontAdjacents(pion, avec)) total += 2; // combat.js
	});
	return total;
}


// ---------------------------------------------------------------------
// Cases multiples : un pion peut occuper plusieurs cases (Dinosaure sur 2,
// Robot sur 2x2). sa carte porte empreinte: [[dLigne, dColonne], ...] a partir
// de sa case "pivot" (dataset.caseId, en haut a gauche). casesOccupees contient
// une entree par case occupee, qui pointent toutes vers le meme pion : les
// tests de case libre et de voisinage marchent donc sans changement.
// ---------------------------------------------------------------------

const EMPREINTE_SIMPLE = [[0, 0]];

function empreinteDe(carte) {
	return (carte && Array.isArray(carte.empreinte)) ? carte.empreinte : EMPREINTE_SIMPLE;
}

function estGrandPion(pion) {
	return empreinteDe(pion && pion.carte).length > 1;
}

// les pions du plateau, chacun une seule fois (un grand pion a plusieurs entrees)
function pionsSurPlateau() {
	return Array.from(new Set(casesOccupees.values()));
}

// ids des cases qu'occuperait la carte si son pivot etait sur pivotId ; null si une sort du plateau
function idsEmpreinte(pivotId, carte) {
	const offsets = empreinteDe(carte);
	if (offsets.length === 1) return [pivotId];
	const pos = parseCellId(pivotId);
	if (!pos) return null;
	const ids = [];
	for (const [dLigne, dColonne] of offsets) {
		const id = cellIdDepuisGlobal(pos.ligne + dLigne, pos.colonne + dColonne);
		if (!document.getElementById(id)) return null;
		ids.push(id);
	}
	return ids;
}

// les cases occupees par ce pion en ce moment
function casesDuPion(pion) {
	if (!estGrandPion(pion)) return [pion.dataset.caseId];
	return idsEmpreinte(pion.dataset.caseId, pion.carte) || [pion.dataset.caseId];
}

// toute l'empreinte existe, n'a pas de trou (sauf pour qui vole) et n'est occupee que par ce pion
function empreinteLibre(pion, pivotId) {
	const ids = idsEmpreinte(pivotId, pion.carte);
	if (!ids) return false;
	return ids.every(id => {
		const el = document.getElementById(id);
		if (el && el.style.backgroundColor === "transparent" && !motCle(pion, "vol")) return false;
		const occupant = casesOccupees.get(id);
		if (!occupant || occupant === pion) return true;
		return peutPartagerCase(pion, id); // Papillon : partage la case d'un autre pion
	});
}

// ---------------------------------------------------------------------
// Case partagee (Papillon, carte.partageCase) : au plus 2 pions par case. L'occupant
// habituel est sous la cle id ; l'invite sous la cle id + "~". Les deux sont de vrais
// pions du plateau (pionsSurPlateau les voit, ils sont voisins l'un de l'autre).
// ---------------------------------------------------------------------
const CLE_INVITE = "~";

function occupantsDeCase(id) {
	const liste = [];
	const hote = casesOccupees.get(id);
	const invite = casesOccupees.get(id + CLE_INVITE);
	if (hote) liste.push(hote);
	if (invite) liste.push(invite);
	return liste;
}

// vrai si ce pion peut se poser sur une case deja occupee (petit pion a partageCase, case non pleine)
function peutPartagerCase(pion, id) {
	if (!pion || !pion.carte || !pion.carte.partageCase || estGrandPion(pion)) return false;
	const occupants = occupantsDeCase(id);
	if (occupants.includes(pion)) return true;
	return occupants.length === 1 && !occupants[0].carte.empreinte;
}

function occuperCases(pion, pivotId) {
	pion.dataset.caseId = pivotId;
	if (casesOccupees.has(pivotId) && casesOccupees.get(pivotId) !== pion && peutPartagerCase(pion, pivotId)) {
		casesOccupees.set(pivotId + CLE_INVITE, pion);
		return;
	}
	(idsEmpreinte(pivotId, pion.carte) || [pivotId]).forEach(id => casesOccupees.set(id, pion));
}

function libererCases(pion) {
	casesDuPion(pion).forEach(id => {
		if (casesOccupees.get(id) === pion) {
			casesOccupees.delete(id);
			const invite = casesOccupees.get(id + CLE_INVITE);
			if (invite) { // l'hote part : l'invite devient l'occupant de la case
				casesOccupees.delete(id + CLE_INVITE);
				casesOccupees.set(id, invite);
				if (invite.style) { // il etait decale : il se recentre
					invite.style.left = ((parseFloat(invite.style.left) || 0) - DECALAGE_INVITE) + "px";
					invite.style.top = ((parseFloat(invite.style.top) || 0) - DECALAGE_INVITE) + "px";
				}
			}
		} else if (casesOccupees.get(id + CLE_INVITE) === pion) {
			casesOccupees.delete(id + CLE_INVITE);
		}
	});
}

// decale un peu l'invite pour que les deux pions restent visibles sur la case
// (a appeler une fois le pion positionne sur sa case)
const DECALAGE_INVITE = 12;
function ajusterInvite(pion) {
	if (!pion || !pion.style || casesOccupees.get(pion.dataset.caseId + CLE_INVITE) !== pion) return;
	pion.style.left = ((parseFloat(pion.style.left) || 0) + DECALAGE_INVITE) + "px";
	pion.style.top = ((parseFloat(pion.style.top) || 0) + DECALAGE_INVITE) + "px";
	pion.style.zIndex = "12";
}

// ids des cases voisines (haut, bas, gauche, droite) de toute l'empreinte, sans les siennes
function casesVoisinesDuPion(pion) {
	const siennes = new Set(casesDuPion(pion));
	const voisines = new Set();
	siennes.forEach(id => casesAdjacentes(id).forEach(c => {
		if (!siennes.has(c.id)) voisines.add(c.id);
	}));
	return Array.from(voisines);
}

// les pions voisins (chacun une fois)
function voisinsDuPion(pion) {
	const vus = new Set();
	casesVoisinesDuPion(pion).forEach(id => {
		occupantsDeCase(id).forEach(p => { if (p !== pion) vus.add(p); });
	});
	// un pion qui partage sa case (Papillon) est au contact de l'autre
	casesDuPion(pion).forEach(id => occupantsDeCase(id).forEach(p => { if (p !== pion) vus.add(p); }));
	return Array.from(vus);
}

// cases libres autour d'un pion (hors trous)
function casesLibresAutourDuPion(pion) {
	return casesVoisinesDuPion(pion)
		.map(id => document.getElementById(id))
		.filter(c => c && !casesOccupees.has(c.id) && c.style.backgroundColor !== "transparent");
}

// pions embarques sur un autre pion (Dinosaure) : ils comptent pour leur proprietaire
function pionsEmbarquesDuJoueur(indexJoueur) {
	const embarques = [];
	pionsSurPlateau().forEach(p => (p.passagers || []).forEach(passager => {
		if (Number(passager.dataset.joueur) === indexJoueur) embarques.push(passager);
	}));
	return embarques;
}
