Mbonjour = {
	image: "terreur_nocturne\\M.bonjour.png",
	name: "Mme.bonjour",
	type: "pion",
	bonus_noir: 2,
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
		courageux: false,
		analphabete: false,
		peur_sang: false,
		meute: false,
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
	puissance: 13
}

Mbonsoir = {
	image: "terreur_nocturne\\M.bonsoir.png",
	name: "M.bonsoir",
	type: "pion",
	declencheurs: { debut_tour: couple_debut_tour },
	bonus_noir: 5,
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
		courageux: false,
		analphabete: false,
		peur_sang: false,
		meute: false,
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
	puissance: 11
}

poeme = {
	image: "terreur_nocturne\\poeme.png",
	name: "poeme",
	type: "item",
	declencheurs: { debut_tour: poeme_debut_tour },
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
	item: [],
	pouvoir: false,
	puissance: 0
}

nachosette = {
	image: "terreur_nocturne\\nachosette.png",
	name: "nachosette",
	type: "item",
	bonus_contre_couleur: 3,
	declencheurs: { debut_tour: nachosette_debut_tour },
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

pardon = {
	image: "terreur_nocturne\\pardon.png",
	name: "pardon ?",
	type: "evenement",
	effet: event_pardon
}

// Pardon ? : la nuit tombe pour un tour complet (voir noir.js)
function event_pardon(ctx) {
	ctx.jeu.poserNuit(ctx.joueur);
	ctx.jeu.message("La nuit tombe");
}

// M. Bonsoir et Mme Bonjour : s'ils sont adjacents la nuit, les personnages rouges du joueur
// dont c'est le tour gagnent +2 ce tour, a chaque tour (declenche par M. Bonsoir)
function couple_debut_tour(ctx) {
	if (!ctx.jeu.aEffet("noir", "plateau")) return; // "lies par l'amour durant la nuit"
	const bonjour = ctx.jeu.casesAdjacentes(ctx.source.dataset.caseId)
		.map(c => ctx.jeu.casesOccupees.get(c.id))
		.find(p => p && p.carte.name === "Mme.bonjour");
	if (!bonjour) return;

	ctx.jeu.pionsDuJoueur(ctx.joueur).forEach(pion => {
		if (couleurDe(pion) !== "rouge") return;
		ctx.jeu.ajouterEffet({
			nom: "bonus_puissance", portee: "pion", cible: pion, duree: "fin_de_tour",
			proprietaire: ctx.joueur, donnees: { valeur: 2 },
		});
	});
	ctx.jeu.message("M. Bonsoir et Mme Bonjour : les rouges gagnent +2 ce tour");
}

// Nachosette : chaque tour, une couleur est tiree au hasard ; +3 contre cette couleur (combat.js)
function nachosette_debut_tour(ctx) {
	const couleurs = ["vert", "orange", "rouge"];
	ctx.item.couleur_du_tour = couleurs[Math.floor(Math.random() * couleurs.length)];
	ctx.jeu.message("Nachosette : +3 contre " + ctx.item.couleur_du_tour + " ce tour");
}

// Poeme : le pion qui le porte est le 1er lecteur. au debut du tour de son proprietaire, un pion
// adjacent qui sait lire devient le 2e lecteur (au choix s'il y en a plusieurs) ; ils gagnent +2
// tant qu'ils sont adjacents. le proprietaire peut une seule fois faire passer le 2e lecteur dans
// son camp. une seule paire par Poeme.
async function poeme_debut_tour(ctx) {
	const poeme = ctx.item;
	const premier = ctx.source;
	if (poeme.lecteur2 || !ctx.jeu.peutLire(premier)) return;

	const candidats = ctx.jeu.casesAdjacentes(premier.dataset.caseId)
		.map(c => ctx.jeu.casesOccupees.get(c.id))
		.filter(p => p && p !== premier && ctx.jeu.peutLire(p));
	if (candidats.length === 0) return;

	let second = candidats[0];
	if (candidats.length > 1) {
		const index = await ctx.jeu.demanderChoix(ctx.joueur, "choisis le 2e lecteur du poeme",
			candidats.map((p, i) => ({ label: p.carte.name + " (joueur " + (Number(p.dataset.joueur) + 1) + ")", valeur: i })));
		second = candidats[index];
	}

	poeme.lecteur2 = second;
	[[premier, second], [second, premier]].forEach(([a, b]) => {
		ctx.jeu.ajouterEffet({
			nom: "lien_amour", portee: "pion", cible: a, duree: "permanent",
			proprietaire: Number(a.dataset.joueur), donnees: { avec: b, poeme, porteur: premier },
		});
	});
	ctx.jeu.message(premier.carte.name + " et " + second.carte.name + " sont lies par l'amour");

	if (Number(second.dataset.joueur) !== ctx.joueur && ctx.jeu.peutChangerDeCamp(second, ctx.joueur).ok) {
		const passe = await ctx.jeu.demanderChoix(ctx.joueur, "faire passer " + second.carte.name + " dans ton camp ?",
			[{ label: "oui", valeur: true }, { label: "non", valeur: false }]);
		if (passe) ctx.jeu.transfererPion(second, ctx.joueur);
	}
}
