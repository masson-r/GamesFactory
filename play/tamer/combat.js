// =====================================================================
// Combat avec groupes (voir le ticket "Groupes de combat par couleur")
//
// - couleur d'un pion = puissance de base de sa carte (sans items ni bonus) :
//   vert 1-5, orange 6-10, rouge 11-15
// - aidants : pions alliés, reliés au pion principal par une chaîne de
//   pions adjacents. vert : jusqu'à 4 autres verts ; orange : jusqu'à 2
//   autres oranges ; rouge : seul, et ne peut jamais aider
// - la défense est aidée avec les mêmes règles, choisie par son propriétaire
// - chaque camp additionne les puissances ; seul le pion principal du
//   camp perdant meurt ; égalité : rien ne se passe (sauf Chef, voir
//   departagerEgalite)
// =====================================================================

const LIMITE_AIDANTS = { vert: 4, orange: 2, rouge: 0 };

function couleurDe(pion) {
	const base = (pion && pion.carte && pion.carte.puissance) || 0;
	if (base >= 11) return "rouge";
	if (base >= 6) return "orange";
	return "vert";
}

function limiteAidants(pion) {
	return LIMITE_AIDANTS[couleurDe(pion)];
}

// le pion porte une gemme Grossissement (item avec grossissement: true)
function aGrossissement(pion) {
	return itemsDe(pion).some(item => item.grossissement);
}

// couleurs d'aidants qu'un pion principal accepte : sa propre couleur ; avec la
// gemme Grossissement, un vert accepte les 3 couleurs et un orange orange + rouge
function couleursAcceptees(principal) {
	const couleur = couleurDe(principal);
	if (couleur === "vert") return aGrossissement(principal) ? ["vert", "orange", "rouge"] : ["vert"];
	if (couleur === "orange") return aGrossissement(principal) ? ["orange", "rouge"] : ["orange"];
	return []; // un rouge combat seul
}

// deux pions sont adjacents si une case de l'un touche une case de l'autre (grands pions compris)
function sontAdjacents(a, b) {
	const siennes = new Set(casesDuPion(b));
	return casesVoisinesDuPion(a).some(id => siennes.has(id));
}

// vrai si "aidant" peut aider "principal" (sans tenir compte de la position)
function peutAider(aidant, principal) {
	if (aidant === principal) return false;
	if (aidant.dataset.joueur !== principal.dataset.joueur) return false; // pas un allié
	if (!couleursAcceptees(principal).includes(couleurDe(aidant))) return false; // vert avec verts, orange avec oranges, un rouge seul
	if (motCle(aidant, "peur_sang")) return false;
	if (etatBloquant(aidant)) return false;
	return true;
}

// pions qu'on peut encore ajouter comme aidants : alliés valides adjacents
// au pion principal ou à un aidant déjà retenu, tant que la limite n'est pas atteinte
function candidatsAidants(principal, choisis) {
	if (choisis.length >= limiteAidants(principal)) return [];

	const groupe = [principal, ...choisis];
	const resultat = [];
	pionsSurPlateau().forEach(pion => {
		if (choisis.includes(pion) || !peutAider(pion, principal)) return;
		if (groupe.some(membre => sontAdjacents(pion, membre))) resultat.push(pion);
	});
	return resultat;
}

// ne garde que les aidants encore reliés au pion principal par une chaîne
// d'aidants adjacents (utile quand on retire un maillon)
function elaguerChaine(principal, choisis) {
	const relies = [];
	let ajoute = true;
	while (ajoute) {
		ajoute = false;
		choisis.forEach(pion => {
			if (relies.includes(pion)) return;
			if (sontAdjacents(pion, principal) || relies.some(r => sontAdjacents(pion, r))) {
				relies.push(pion);
				ajoute = true;
			}
		});
	}
	return relies;
}

// restrictions propres a une cible, declarees sur sa carte :
//   attaquable_par : [puissances de base] (Pasteque : seulement 3 ou 5, sans aide ni objet)
//   inattaquable : { distance: true, couleurs: ["vert"] } (La Chose : ni a distance ni par un vert)
function cibleAttaquablePar(cible, attaquant, distance) {
	const carte = cible.carte;
	if (Array.isArray(carte.attaquable_par) && !carte.attaquable_par.includes(attaquant.carte.puissance)) return false;
	if (carte.inattaquable) {
		if (carte.inattaquable.distance && distance > 1) return false;
		if ((carte.inattaquable.couleurs || []).includes(couleurDe(attaquant))) return false;
	}
	return true;
}

// bonus propres au rôle dans le combat : bonus_attaque / bonus_defense portés par
// la carte ou ses items (gemmes Puissance et Défense, Machette, Boucli-feuille...),
// et +1 de puissance pour un rouge qui porte la gemme Grossissement
function bonusDeRole(pion, role, adversaire) {
	const champ = (role === "attaque") ? "bonus_attaque" : "bonus_defense";
	const sources = [pion.carte, ...itemsDe(pion)];
	let total = sources.reduce((somme, source) => somme + ((source && source[champ]) || 0), 0);
	if (adversaire && adversaire.carte) {
		sources.forEach(source => {
			if (!source) return;
			// Robot (Drill) : bonus contre certaines couleurs, bonus_contre_couleurs: { rouge: 2, vert: 2 }
			if (source.bonus_contre_couleurs) total += source.bonus_contre_couleurs[couleurDe(adversaire)] || 0;
			// Katana : +2 si la puissance de base du porteur est plus petite que celle de l'adversaire
			if (source.bonus_si_plus_faible && (pion.carte.puissance || 0) < (adversaire.carte.puissance || 0)) total += source.bonus_si_plus_faible;
			// Nachosette : +3 contre la couleur tiree au hasard ce tour-ci
			if (source.bonus_contre_couleur && source.couleur_du_tour && couleurDe(adversaire) === source.couleur_du_tour) total += source.bonus_contre_couleur;
		});
	}
	if (couleurDe(pion) === "rouge" && aGrossissement(pion)) total += 1;
	return total;
}

// role : "attaque" ou "defense" (optionnel : sans lui, aucun bonus de rôle)
function puissanceGroupe(principal, aidants, role, adversaire) {
	const membres = [principal, ...aidants];
	return membres.reduce((somme, pion) => somme + puissanceTotale(pion) + (role ? bonusDeRole(pion, role, adversaire) : 0), 0);
}

// un camp compte un Chef si son pion principal ou un de ses aidants en est un
// (le mot-clé peut venir de la carte ou d'un item, ex. la Couronne)
function campCompteUnChef(principal, aidants) {
	return [principal, ...aidants].some(pion => !!motCle(pion, "chef"));
}

// départage une égalité : renvoie "attaquant", "defenseur" ou null (l'égalité tient).
// le Chef gagne l'égalité ; si les deux camps ont un Chef (ou aucun), elle tient
function departagerEgalite(principalAttaque, aidantsAttaque, principalDefense, aidantsDefense) {
	const attaqueAChef = campCompteUnChef(principalAttaque, aidantsAttaque);
	const defenseAChef = campCompteUnChef(principalDefense, aidantsDefense);
	if (attaqueAChef && !defenseAChef) return "attaquant";
	if (defenseAChef && !attaqueAChef) return "defenseur";
	return null;
}

// résultat d'un combat : { totalAttaque, totalDefense, vainqueur } avec
// vainqueur = "attaquant" | "defenseur" | "egalite"
function resoudreCombat(attaquant, aidantsAttaque, cible, aidantsDefense) {
	const totalAttaque = puissanceGroupe(attaquant, aidantsAttaque, "attaque", cible);
	// le terrain pèse sur le pion attaqué (Lac de poison : -5 sur sa case)
	const totalDefense = puissanceGroupe(cible, aidantsDefense, "defense", attaquant) - malusDefenseTerrain(cible);

	let vainqueur = "egalite";
	if (totalAttaque > totalDefense) vainqueur = "attaquant";
	else if (totalDefense > totalAttaque) vainqueur = "defenseur";
	else vainqueur = departagerEgalite(attaquant, aidantsAttaque, cible, aidantsDefense) || "egalite";

	return { totalAttaque, totalDefense, vainqueur };
}

// demande au joueur "indexChoisisseur" de composer un groupe autour d'un pion
// principal (sur le même écran). clic sur un pion bleu = l'ajouter, clic sur
// un pion doré = le retirer (avec ceux qui n'y sont plus reliés), puis bouton
// Valider. sert au combat (aidants) et à Meute (suiveurs).
//  - limite : nombre maximal de membres (Infinity : aucune limite)
//  - candidats(choisis) : pions qu'on peut encore ajouter
//  - elaguer(choisis) : ne garde que les membres encore reliés au groupe
//  - libelle(nbChoisis) : le texte affiché au joueur
// promesse -> la liste des pions choisis
function choisirGroupe({ principal, indexChoisisseur, limite, candidats, elaguer, libelle }) {
	if (limite === 0 || candidats([]).length === 0) {
		return Promise.resolve([]);
	}

	return new Promise(resolve => {
		let choisis = [];
		let ecouteurs = [];

		function nettoyer() {
			ecouteurs.forEach(({ el, fn }) => {
				el.removeEventListener("click", fn);
				el.style.boxShadow = "none";
				el.style.cursor = "grab";
			});
			ecouteurs = [];
		}

		function brancher(el, couleur, fn) {
			el.style.boxShadow = "0 0 0 3px " + couleur;
			el.style.cursor = "pointer";
			el.addEventListener("click", fn);
			ecouteurs.push({ el, fn });
		}

		function rafraichir() {
			nettoyer();

			if (choisis.length < limite) {
				candidats(choisis).forEach(el => {
					brancher(el, "deepskyblue", () => { choisis.push(el); rafraichir(); });
				});
			}
			choisis.forEach(el => {
				brancher(el, "gold", () => {
					choisis = elaguer(choisis.filter(p => p !== el));
					rafraichir();
				});
			});

			message("Joueur " + (indexChoisisseur + 1) + " : " + libelle(choisis.length));

			conteneur.innerHTML = "";
			const bouton = document.createElement("button");
			bouton.textContent = "Valider (" + choisis.length + ")";
			bouton.classList.add("bouton");
			bouton.addEventListener("click", () => {
				nettoyer();
				conteneur.innerHTML = "";
				resolve(choisis.slice());
			});
			conteneur.appendChild(bouton);
		}

		rafraichir();
	});
}

// les aidants d'un pion principal (combat)
function choisirAidants(principal, indexChoisisseur) {
	return choisirGroupe({
		principal,
		indexChoisisseur,
		limite: limiteAidants(principal),
		candidats: (choisis) => candidatsAidants(principal, choisis),
		elaguer: (choisis) => elaguerChaine(principal, choisis),
		libelle: (nb) => "choisis jusqu'a " + limiteAidants(principal) + " aidant(s) pour " +
			principal.carte.name + " (" + nb + " choisi(s))",
	});
}

// déroule un combat entre un attaquant et une cible : choix des aidants
// des deux camps, déclencheurs "attaque", résolution et conséquences.
// promesse terminée quand tout est appliqué (le tour peut alors se finir)
async function lancerCombat(attaquant, cible) {
	const aidantsAttaque = await choisirAidants(attaquant, Number(attaquant.dataset.joueur));
	const aidantsDefense = await choisirAidants(cible, Number(cible.dataset.joueur));

	declencher("attaque", { pion: attaquant, extra: { role: "attaquant", cible, aidants: aidantsAttaque } });
	declencher("attaque", { pion: cible, extra: { role: "defenseur", cible: attaquant, aidants: aidantsDefense } });

	const resultat = resoudreCombat(attaquant, aidantsAttaque, cible, aidantsDefense);
	const bilan = attaquant.carte.name + " (" + resultat.totalAttaque + ") contre " +
		cible.carte.name + " (" + resultat.totalDefense + ")";

	if (resultat.vainqueur === "defenseur") {
		message(bilan + " : l'attaquant meurt");
		detruirePion(attaquant, cible);
	} else if (resultat.vainqueur === "attaquant") {
		message(bilan + " : la cible meurt");
		const caseCibleId = cible.dataset.caseId;
		detruirePion(cible, attaquant);

		if (motCle(attaquant, "belier")) {
			const caseCible = document.getElementById(caseCibleId);
			if (caseCible) deplacerPionSurCase(attaquant, caseCible);
		}
	} else {
		message(bilan + " : egalite, rien ne se passe");
	}

	// un item qui explose quand on l'attaque assez fort (Tronc-mobile) tue son porteur
	const bombe = itemsDe(cible).find(item => item.explose_si_attaque_min && resultat.totalAttaque >= item.explose_si_attaque_min);
	if (bombe && pionSurPlateau(cible)) {
		message(bombe.name + " explose et tue " + cible.carte.name);
		detruirePion(cible, attaquant);
	}
}
