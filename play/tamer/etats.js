// =====================================================================
// États d'objet : gelé, cassé, électrique, réparer
// (voir le ticket "États Fragile, Cassé, Électrique, Ingénieur")
//
// - gelé : effet "gele" sur un pion (état bloquant, voir etatBloquant dans
//   moteur.js). levé quand un pion adjacent, de n'importe quel camp, est
//   Costaud ou a une puissance totale supérieure à 10. le Freeze ne donne
//   PAS le mot-clé Fragile.
// - cassé : effet "casse" sur un item, une salle ou un bâtiment, jusqu'à
//   réparation. un item cassé ne donne plus rien ; une salle cassée (ou dans
//   un bâtiment cassé) est inutilisable.
// - électrique : mot-clé d'un item, d'une salle ou d'un bâtiment (une
//   "machine"), que Coupure de courant peut casser.
// - réparer : action du tour d'un Ingénieur, sur sa case ou une case voisine.
// =====================================================================

// ---------------------------------------------------------------------
// Gelé
// ---------------------------------------------------------------------

// un pion adjacent (tout camp) est Costaud ou a une puissance totale > 10
function pionVoisinLibere(pion) {
	return voisinsDuPion(pion).some(voisin => !!motCle(voisin, "costaud") || puissanceTotale(voisin) > 10);
}

// gèle un pion (sort Freeze). le gel est réévalué à chaque début de tour
function poserGel(pion, proprietaire) {
	const deja = effetsSur("pion", pion, "gele")[0];
	if (deja) return deja;
	return ajouterEffet({
		nom: "gele", portee: "pion", cible: pion, proprietaire,
		duree: { type: "condition", condition: (ctx, effet) => pionVoisinLibere(effet.cible) },
	});
}

// ---------------------------------------------------------------------
// Cassé
// ---------------------------------------------------------------------

const PORTEES_CASSABLES = ["item", "salle", "batiment"];

function estCasse(portee, cible) {
	return aEffet("casse", portee, cible);
}

// casse un item, une salle ou un bâtiment (renvoie l'effet, ou null s'il l'était déjà)
function casser(portee, cible, proprietaire) {
	if (!PORTEES_CASSABLES.includes(portee)) throw new Error("On ne peut pas casser : " + portee);
	if (estCasse(portee, cible)) return null;
	return ajouterEffet({ nom: "casse", portee, cible, duree: "permanent", proprietaire });
}

// répare un objet cassé ; renvoie true s'il l'était
function reparerObjet(portee, cible) {
	const casses = effetsSur(portee, cible, "casse");
	casses.forEach(retirerEffet);
	return casses.length > 0;
}

// la salle d'un bâtiment est utilisable si elle existe et que ni elle ni son bâtiment ne sont cassés
function salleUtilisable(batiment) {
	return !!batiment && !!batiment.salle &&
		!estCasse("salle", batiment.salle) && !estCasse("batiment", batiment);
}

// ---------------------------------------------------------------------
// Électrique
// ---------------------------------------------------------------------

function estMachine(carte) {
	return !!(carte && carte.mot_cle && carte.mot_cle.electrique);
}

// toutes les machines électriques du plateau qui ne sont pas déjà cassées :
// { portee, cible, nom }
function machinesCassables() {
	const machines = [];

	pionsSurPlateau().forEach(pion => {
		itemsPortes(pion).forEach(item => {
			if (estMachine(item) && !estCasse("item", item)) machines.push({ portee: "item", cible: item, nom: item.name });
		});
	});

	batimentsConstruits.forEach(batiment => {
		if (estMachine(batiment) && !estCasse("batiment", batiment)) {
			machines.push({ portee: "batiment", cible: batiment, nom: batiment.name });
		}
		if (batiment.salle && estMachine(batiment.salle) && !estCasse("salle", batiment.salle)) {
			machines.push({ portee: "salle", cible: batiment.salle, nom: batiment.salle.name });
		}
	});

	return machines;
}

// ---------------------------------------------------------------------
// Réparer (action du tour d'un Ingénieur)
// ---------------------------------------------------------------------

// le noir d'un bâtiment peut être levé s'il n'est pas éternel
function noirRepareable(batiment) {
	const noirs = effetsSur("batiment", batiment, "noir");
	return noirs.length > 0 && !noirs.some(e => e.donnees && e.donnees.eternel);
}

// tout ce que les Ingénieurs du joueur peuvent réparer : objets cassés et
// bâtiments en panne de courant, sur la case de l'Ingénieur ou une case voisine.
// chaque cible : { type, portee, cible, libelle }
function ciblesDeReparation(indexJoueur) {
	const cibles = [];
	const ajouter = (entree) => {
		if (!cibles.some(c => c.type === entree.type && c.cible === entree.cible)) cibles.push(entree);
	};

	pionsDuJoueur(indexJoueur)
		.filter(p => motCle(p, "ingenieur") && !etatBloquant(p))
		.forEach(ingenieur => {
			const ids = [ingenieur.dataset.caseId, ...casesAdjacentes(ingenieur.dataset.caseId).map(c => c.id)];
			ids.forEach(id => {
				const pionLa = casesOccupees.get(id);
				if (pionLa) {
					itemsPortes(pionLa).forEach(item => {
						if (estCasse("item", item)) {
							ajouter({ type: "item", portee: "item", cible: item, libelle: item.name + " (objet de " + pionLa.carte.name + ")" });
						}
					});
				}

				const batiment = batimentSurCase(id);
				if (batiment) {
					if (estCasse("batiment", batiment)) {
						ajouter({ type: "batiment", portee: "batiment", cible: batiment, libelle: batiment.name + " (batiment casse)" });
					}
					if (batiment.salle && estCasse("salle", batiment.salle)) {
						ajouter({ type: "salle", portee: "salle", cible: batiment.salle, libelle: batiment.salle.name + " (salle de " + batiment.name + ")" });
					}
					if (noirRepareable(batiment)) {
						ajouter({ type: "noir", portee: "batiment", cible: batiment, libelle: batiment.name + " (panne de courant)" });
					}
				}
			});
		});

	return cibles;
}

// répare une cible de ciblesDeReparation ; renvoie true si quelque chose a été réparé
function appliquerReparation(entree) {
	if (entree.type === "noir") return rallumerBatiment(entree.cible); // noir.js
	return reparerObjet(entree.portee, entree.cible);
}

function peutReparer() {
	return ciblesDeReparation(joueur_actif).length > 0;
}

// action "réparer" : le joueur choisit parmi les cibles réparables
function reparer() {
	conteneur.innerHTML = "";
	const cibles = ciblesDeReparation(joueur_actif);

	if (cibles.length === 0) {
		message("Rien a reparer a portee de tes ingenieurs");
		end_tour();
		return;
	}

	message("Que veux-tu reparer ?");
	cibles.forEach(entree => {
		const bouton = document.createElement("button");
		bouton.textContent = entree.libelle;
		bouton.classList.add("bouton");
		bouton.addEventListener("click", () => {
			appliquerReparation(entree);
			message(entree.libelle + " : repare");
			end_tour();
		});
		conteneur.appendChild(bouton);
	});
}

// utilisables par les cartes via ctx.jeu
Object.assign(jeu, {
	poserGel, casser, reparerObjet, estCasse, salleUtilisable, estMachine, machinesCassables,
});
