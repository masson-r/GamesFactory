// =====================================================================
// Magasin et Blinks (voir le ticket "Magasin et sortes de Blinks")
//
// - 26 Blinks verts de puissance 1 : 6 soldats, 8 constructeurs,
//   6 lanceurs de sort, 6 diplomates. magasin commun, sans réassort
// - acheter : 1 pièce, prend l'action, le Blink est posé tout de suite sur
//   une case libre de la base
// - le Blink américain (famille Rebelle) pioche gratuitement une sorte du
//   magasin dans sa main (piocherBlink)
// - diplomate : dans la base d'un adversaire, échange une carte un pour un
//   (pouvoir actif)
// =====================================================================

const PRIX_BLINK = 1;
const STOCK_BLINKS = { soldat: 6, constructeur: 8, lanceur: 6, diplomate: 6 };

// image provisoire : une image par sorte reste à dessiner
function creerBlink(sorte, motsCles, extra) {
	return Object.assign({
		image: "fleche_gauche.png",
		name: "blink " + sorte,
		sorte,
		type: "pion",
		couleur: "vert",
		mot_cle: Object.assign(motsClesVides(), motsCles || {}),
		item: [],
		pouvoir: false,
		puissance: 1,
	}, extra || {});
}

// ---------------------------------------------------------------------
// Le diplomate
// ---------------------------------------------------------------------

// l'adversaire dont la base (le biome de coin) contient cette case, ou -1
function adversaireDeLaCase(caseId, indexJoueur) {
	for (let i = 0; i < joueurs.length; i++) {
		if (i !== indexJoueur && idsBlocDeBase(i).includes(caseId)) return i;
	}
	return -1;
}

// il faut être dans la base d'un adversaire, et que les deux joueurs aient une carte en main
function condition_diplomate(ctx) {
	if (!ctx.source) return false;
	const adversaire = adversaireDeLaCase(ctx.source.dataset.caseId, ctx.joueur);
	if (adversaire < 0) return false;
	return joueurs[ctx.joueur].cartes.length > 0 && joueurs[adversaire].cartes.length > 0;
}

// échange un pour un : chacun choisit, sur le même écran, la carte qu'il donne
async function pouvoir_diplomate(ctx) {
	const adversaire = adversaireDeLaCase(ctx.source.dataset.caseId, ctx.joueur);
	const miennes = joueurs[ctx.joueur].cartes;
	const siennes = joueurs[adversaire].cartes;
	if (adversaire < 0 || miennes.length === 0 || siennes.length === 0) return;

	const options = (main) => main.map((carte, i) => ({ label: String(carte.name).replace(/§/g, ""), valeur: i }));

	const indexDonnee = await ctx.jeu.demanderChoix(ctx.joueur, "choisis la carte a donner", options(miennes));
	const indexRendue = await ctx.jeu.demanderChoix(adversaire, "choisis la carte a donner en echange", options(siennes));

	const donnee = miennes.splice(indexDonnee, 1)[0];
	const rendue = siennes.splice(indexRendue, 1)[0];
	miennes.push(rendue);
	siennes.push(donnee);
	ctx.jeu.message("Echange de cartes entre le joueur " + (ctx.joueur + 1) + " et le joueur " + (adversaire + 1));
}

// ---------------------------------------------------------------------
// Les quatre sortes
// ---------------------------------------------------------------------

const blink_soldat = creerBlink("soldat");
const blink_constructeur = creerBlink("constructeur", { constructeur: 1 });
const blink_lanceur = creerBlink("lanceur de sort", {}, { sorte: "lanceur", lanceur: "orthogonal" });
const blink_diplomate = creerBlink("diplomate", {}, { pouvoir: pouvoir_diplomate, condition: condition_diplomate });

const CARTES_BLINKS = {
	soldat: blink_soldat,
	constructeur: blink_constructeur,
	lanceur: blink_lanceur,
	diplomate: blink_diplomate,
};

// la pile commune : 26 cartes (la même carte plusieurs fois, comme avant ; on la
// clone à la pose)
function creerMagasin() {
	const pile = [];
	Object.keys(STOCK_BLINKS).forEach(sorte => {
		for (let i = 0; i < STOCK_BLINKS[sorte]; i++) pile.push(CARTES_BLINKS[sorte]);
	});
	return pile;
}

// ---------------------------------------------------------------------
// Acheter et piocher
// ---------------------------------------------------------------------

// les sortes encore en stock : [{ sorte, nom, nb, carte }]
function sortesDisponibles() {
	return Object.keys(STOCK_BLINKS)
		.map(sorte => ({
			sorte,
			nom: CARTES_BLINKS[sorte].name,
			nb: magasin.filter(c => c.sorte === sorte).length,
			carte: CARTES_BLINKS[sorte],
		}))
		.filter(entree => entree.nb > 0);
}

function casesLibresDeLaBase(indexJoueur) {
	return Array.from(casesDuJoueur(indexJoueur)).filter(c => !casesOccupees.has(c.id));
}

// acheter est possible : du stock, la base debout, 1 pièce, une case libre dans la base
function peutAcheterBlink() {
	const joueur = joueurs[joueur_actif];
	return magasin.length > 0 && !joueur.base_destroy &&
		peutPayer(joueur_actif, PRIX_BLINK) && casesLibresDeLaBase(joueur_actif).length > 0;
}

// paie 1 pièce, retire un Blink de cette sorte du magasin et le fait poser dans la base
function acheterBlink(sorte) {
	const index = magasin.findIndex(c => c.sorte === sorte);
	if (index === -1 || !peutAcheterBlink()) return false;

	payer(joueur_actif, PRIX_BLINK);
	const carte = magasin.splice(index, 1)[0];
	creerPionDraggable(carte);
	return true;
}

// Blink américain : le joueur choisit gratuitement une sorte du magasin, qui
// entre dans sa main. rien si le magasin est vide. promesse -> la carte ou null
async function piocherBlink(indexJoueur) {
	const sortes = sortesDisponibles();
	if (sortes.length === 0) return null;

	const choix = await jeu.demanderChoix(indexJoueur, "choisis un blink a piocher",
		sortes.map(s => ({ label: s.nom + " (" + s.nb + ")", valeur: s.sorte })));
	const index = magasin.findIndex(c => c.sorte === choix);
	if (index === -1) return null;

	const carte = magasin.splice(index, 1)[0];
	joueurs[indexJoueur].cartes.push(carte);
	return carte;
}

Object.assign(jeu, { piocherBlink, sortesDisponibles });
