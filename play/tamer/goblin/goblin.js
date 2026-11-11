dino_goblin = {
	image: "goblin\\dino_goblin.png",
	name: "dinosaure des goblins",
	type: "pion",
	empreinte: [[0, 0], [0, 1]],
	condition: dino_condition,
	couleur: "rouge",
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
		analphabete: true,
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
	item: [],
	pouvoir: dino_pouvoir,
	puissance: 15
}

roi_goblin = {
	image: "goblin\\ruk_roi.png",
	name: "Ruk Roi Des Gobelins",
	type: "pion",
	couleur: "rouge",
	mot_cle: {
		constructeur: false,
		costaud: true,
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
		chef: true,
		electrique: false,
		fragile: false,
		casser: false
	},
	item: [],
	pouvoir: false,
	puissance: 14
}

tim = {
	image: "goblin\\tim.png",
	name: "goblins(tim)",
	type: "pion",
	couleur: "vert",
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
		courageux: true,
		analphabete: false,
		peur_sang: false,
		meute: true,
		nyctalope: false,
		malin: false,
		ingenieur: false,
		chef: false,
		electrique: false,
		fragile: false,
		casser: false
	},
	item: [],
	pouvoir: false,
	puissance: 2
}

var_ = {
	image: "goblin\\var.png",
	name: "goblins(var)",
	type: "pion",
	couleur: "vert",
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
		analphabete: true,
		peur_sang: false,
		meute: true,
		nyctalope: false,
		malin: false,
		ingenieur: false,
		chef: false,
		electrique: false,
		fragile: false,
		casser: false
	},
	item: [],
	pouvoir: false,
	puissance: 3
}

wil = {
	image: "goblin\\wil.png",
	name: "goblins(wil)",
	type: "pion",
	couleur: "vert",
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
		analphabete: true,
		peur_sang: false,
		meute: true,
		nyctalope: true,
		malin: false,
		ingenieur: false,
		chef: false,
		electrique: false,
		fragile: false,
		casser: false
	},
	item: [],
	pouvoir: false,
	puissance: 2
}

armes_goblines = {
	image: "goblin\\armes_goblines.png",
	name: "armes goblines",
	type: "item",
	bonus_par_couleur: { vert: 3, orange: 2, rouge: 1 },
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

// Armes goblines : +3 sur un vert, +2 sur un orange, +1 sur un rouge (bonus_par_couleur, voir puissanceTotale)

// ---------------------------------------------------------------------
// Dinosaure dompte : 2 cases de large (empreinte), transporte jusqu'a 2 pions verts.
// - il se joue depuis la main dans la base, a condition de posseder les 3 gobelins
//   (Tim, Var et Wil, en main ou en jeu)
// - son pouvoir actif embarque un pion vert allie adjacent, ou debarque un passager
//   sur une case libre adjacente ; un passager sort du plateau et compte pour son
//   proprietaire ; si le dinosaure meurt, ses passagers meurent avec lui
// ---------------------------------------------------------------------

const GOBELINS_REQUIS = ["goblins(tim)", "goblins(var)", "goblins(wil)"];
const PASSAGERS_MAX = 2;

function possedeLesTroisGobelins(joueur) {
	const noms = new Set(joueur.cartes_actif.map(c => c.name)); // les 3 gobelins doivent etre poses sur le plateau
	return GOBELINS_REQUIS.every(nom => noms.has(nom));
}

// alliés verts adjacents que le dinosaure peut embarquer
function candidatsEmbarquement(dino) {
	if ((dino.passagers || []).length >= PASSAGERS_MAX) return [];
	return voisinsDuPion(dino).filter(p =>
		p.dataset.joueur === dino.dataset.joueur && couleurDe(p) === "vert" && !estGrandPion(p));
}

function peutDebarquer(dino) {
	return (dino.passagers || []).length > 0 && casesLibresAutourDuPion(dino).length > 0;
}

// jouer le dinosaure : il faut les 3 gobelins ; l'activer : il faut pouvoir embarquer ou debarquer
function dino_condition(ctx) {
	if (!ctx.source) return possedeLesTroisGobelins(ctx.jeu.joueurs[ctx.joueur]);
	return candidatsEmbarquement(ctx.source).length > 0 || peutDebarquer(ctx.source);
}

function embarquer(dino, passager) {
	libererCases(passager);
	passager.dataset.caseId = "bord:" + dino.dataset.caseId;
	passager.embarqueSur = dino;
	passager.style.display = "none";
	dino.passagers = dino.passagers || [];
	dino.passagers.push(passager);
}

function debarquer(dino, passager, caseEl) {
	const index = (dino.passagers || []).indexOf(passager);
	if (index === -1) return false;
	dino.passagers.splice(index, 1);
	passager.embarqueSur = null;
	passager.style.display = "";
	deplacerPionSurCase(passager, caseEl);
	return true;
}

async function dino_pouvoir(ctx) {
	const dino = ctx.source;
	const options = [];
	if (candidatsEmbarquement(dino).length > 0) options.push({ label: "embarquer un vert adjacent", valeur: "embarquer" });
	if (peutDebarquer(dino)) options.push({ label: "debarquer un passager", valeur: "debarquer" });
	if (options.length === 0) return;

	const choix = options.length === 1 ? options[0].valeur
		: await ctx.jeu.demanderChoix(ctx.joueur, "transport du dinosaure", options);

	if (choix === "embarquer") {
		const candidats = candidatsEmbarquement(dino);
		const res = await choisirCible({ name: "embarquement", type: "pouvoir", cible: { type: "pion_allie", filtre: (p) => candidats.includes(p) } }, ctx);
		if (res.ok) {
			embarquer(dino, res.cible);
			ctx.jeu.message(res.cible.carte.name + " monte sur le dinosaure");
		}
	} else {
		let passager = dino.passagers[0];
		if (dino.passagers.length > 1) {
			const index = await ctx.jeu.demanderChoix(ctx.joueur, "quel passager debarque ?",
				dino.passagers.map((p, i) => ({ label: p.carte.name, valeur: i })));
			passager = dino.passagers[index];
		}
		const caseChoisie = await choisirParmiCases(casesLibresAutourDuPion(dino), "Joueur " + (ctx.joueur + 1) + " : ou debarque " + passager.carte.name + " ?");
		debarquer(dino, passager, caseChoisie);
		ctx.jeu.message(passager.carte.name + " descend du dinosaure");
	}
}
