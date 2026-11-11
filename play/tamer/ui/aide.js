// Aide en ligne et langue de la page de test (voir tamer_ui.html).
// Les textes viennent de la maquette d'interface ; les regles decrites suivent celles du jeu (retrospec.md).
(function () {
  "use strict";

  var UI = {
    fr: {
      aide: "Aide", fermer: "Fermer", regles: "Lire les règles", nouvelle: "Nouvelle partie",
      pitch: "Un jeu de cartes et de plateau à quatre joueurs : posez vos biomes, invoquez vos familles, détruisez les bases adverses.",
      maquette: "Maquette d'interface : les données de la partie sont des exemples.",
      step1t: "Poser ses biomes", step1p: "Trois pièces de 3×3 cases dans ton quart du plateau, reliées au joueur d'avant.",
      step2t: "Choisir ses familles", step2p: "Chaque joueur prend 3 familles à la suite. Leurs cartes forment sa main.",
      step3t: "Jouer", step3p: "À ton tour, tu gagnes 1 pièce puis tu fais une seule action. Le dernier joueur en jeu gagne.",
      miseenplace: "Mise en place", st1: "1 · Biomes", st2: "2 · Familles", st3: "3 · Partie",
      consigne: function (j) { return "Joueur " + j + " : choisis une famille (" + "3 au total" + ")."; },
      consigneFin: "Toutes les familles sont choisies. Il en reste une, inutilisée.",
      commencer: "Commencer la partie", recommencer: "Recommencer",
      biomesTitre: "Tes biomes",
      biomesTexte: "Avant les familles, chaque joueur place ses 3 pièces de 3×3 cases dans son quart du plateau. Les pièces ont 0 à 2 trous au hasard. Le jeu vérifie que ton quart est relié au joueur précédent par un chemin de cases pleines ; sinon il te demande de réarranger tes pièces, ou retire les trous au sort.",
      cartes: "cartes", joueur: "Joueur", tourDe: "Tour du joueur", pieces: "pièces", pions: "pions",
      baseOk: "base intacte", baseKo: "base détruite", uneAction: "Ton tour : une seule action",
      main: "Ta main", demo: "Démo :", nuit: "Faire tomber la nuit", jour: "Lever le jour", voircombat: "Voir un combat",
      nuitMsg: "La nuit est tombée : hors des bâtiments, les pions sans Nyctalope ne peuvent ni bouger ni attaquer à distance.",
      une: "1 action / tour", aucun: "Clique sur un pion ou une carte pour voir son détail.",
      puissance: "Puissance", base: "base", camp: "Camp", mots: "Mots-clés", objets: "Équipement", effets: "Effets en cours",
      mains: "Mains", tete: "Tête", gemme: "Gemme", libre: "libre", passagers: "Passagers",
      vert: "Vert", orange: "Orange", rouge: "Rouge",
      legendeTitre: "Lecture du plateau",
      leg1: "Le chiffre est la puissance, l'anneau la couleur : vert, orange ou rouge.",
      leg2: "La couleur de remplissage est le camp du joueur.",
      leg3: "Trou : on ne marche pas dessus (sauf si l'on vole). Carré gris : bâtiment.",
      combatT: "Combat", attaque: "Attaque", defense: "Défense", total: "total", valider: "Valider le combat", annuler: "Annuler",
      aidants: "Aidants", principal: "Pion principal", gagne: "L'attaque l'emporte : le pion défendant meurt, les aidants survivent.",
      regleCombat: "Chaque camp additionne les puissances de son pion principal et de ses aidants. Seul le pion principal du camp perdant meurt. À égalité rien ne se passe, sauf si un Chef est présent.",
      tabRegles: "Règles", tabMots: "Mots-clés", tabEcran: "L'écran", chercherPh: "Rechercher…",
      aucunRes: "Aucun résultat.", ouvrirAide: "Ouvrir l'aide sur : ",
      actionsT: { passer: "Passer", jouer: "Jouer une carte", acheter: "Acheter un blink", deplacer: "Déplacer", combattre: "Combattre", activer: "Activer un pouvoir", detruire: "Détruire une base", construire: "Construire", reparer: "Réparer", salle: "Utiliser une salle", messalles: "Mes salles", fusionner: "Fusionner le robot", tente: "Déplacer la tente" },
      actionsS: { passer: "Termine ton tour", jouer: "Pion, objet, sort, événement", acheter: "1 pièce, posé dans ta base", deplacer: "Un pion, vers une case adjacente libre", combattre: "Un de tes pions attaque, avec aidants", activer: "Pouvoir actif d'un pion", detruire: "Un pion adjacent à une base ennemie", construire: "Bâtiment ou salle, avec des constructeurs", reparer: "Un Ingénieur répare un objet", salle: "Un pion dans un bâtiment avec salle", messalles: "Voir ou révéler tes salles (gratuit)", fusionner: "4 morceaux sur 5 : Robot 2×2", tente: "Une tente, d'une case vers le haut ou le bas" },
      raisons: { detruire: "Aucun de tes pions n'est adjacent à une base ennemie.", reparer: "Aucun Ingénieur n'a de cible à portée.", salle: "Aucun de tes pions n'est dans un bâtiment avec une salle utilisable.", fusionner: "Il faut 4 morceaux de Robot en main et une place 2×2 dans ta base." },
      conseils: {
        passer: "Tu termines ton tour sans action.", jouer: "Choisis une carte de ta main. Un sort se lance sur un pion dans la zone de tes sources de sorts.",
        acheter: "Achète un blink : 1 pièce. Il est posé tout de suite sur une case libre de ta base.", deplacer: "Dépose un de tes pions sur une case adjacente libre.",
        combattre: "Choisis un de tes pions pour combattre, puis sa cible, puis les aidants.", activer: "Clique sur un pion pour activer son pouvoir.",
        construire: "Clique sur une case pour y construire : la puissance de construction autour d'elle doit atteindre le coût en marteaux.", messalles: "Tes salles restent cachées aux autres joueurs : révèle-les quand tu veux, gratuitement."
      },
      tourDeJ: "Tour du joueur 1", choisis: "choisis une action.",
      typeNoms: { pion: "Pion", item: "Objet", sort: "Sort", evenement: "Événement", batiment: "Bâtiment", salle: "Salle" },
      coutPieces: "pièce(s)", coutMarteaux: "marteaux"
    },
    en: {
      aide: "Help", fermer: "Close", regles: "Read the rules", nouvelle: "New game",
      pitch: "A four-player card and board game: lay out your biomes, summon your families, destroy the enemy bases.",
      maquette: "Interface mockup: all game data shown here is sample data.",
      step1t: "Lay out your biomes", step1p: "Three 3×3 pieces in your quarter of the board, connected to the previous player.",
      step2t: "Pick your families", step2p: "Each player takes 3 families in a row. Their cards make up your hand.",
      step3t: "Play", step3p: "On your turn you gain 1 coin, then take a single action. The last player standing wins.",
      miseenplace: "Setup", st1: "1 · Biomes", st2: "2 · Families", st3: "3 · Game",
      consigne: function (j) { return "Player " + j + ": pick a family (" + "3 in total" + ")."; },
      consigneFin: "All families are picked. One is left over, unused.",
      commencer: "Start the game", recommencer: "Start over",
      biomesTitre: "Your biomes",
      biomesTexte: "Before families, each player places 3 pieces of 3×3 cells in their quarter of the board. Pieces have 0 to 2 random holes. The game checks that your quarter is linked to the previous player by a path of solid cells; if not, it asks you to rearrange your pieces, or redraws the holes at random.",
      cartes: "cards", joueur: "Player", tourDe: "Player's turn:", pieces: "coins", pions: "pawns",
      baseOk: "base intact", baseKo: "base destroyed", uneAction: "Your turn: one action only",
      main: "Your hand", demo: "Demo:", nuit: "Make night fall", jour: "Bring back the day", voircombat: "See a fight",
      nuitMsg: "Night has fallen: outside buildings, pawns without Nyctalope can neither move nor attack at range.",
      une: "1 action / turn", aucun: "Click a pawn or a card to see its details.",
      puissance: "Power", base: "base", camp: "Side", mots: "Keywords", objets: "Equipment", effets: "Active effects",
      mains: "Hands", tete: "Head", gemme: "Gem", libre: "free", passagers: "Passengers",
      vert: "Green", orange: "Orange", rouge: "Red",
      legendeTitre: "Reading the board",
      leg1: "The number is the power, the ring its colour: green, orange or red.",
      leg2: "The fill colour is the owner's side.",
      leg3: "Hole: no walking there (unless you fly). Grey square: building.",
      combatT: "Fight", attaque: "Attack", defense: "Defence", total: "total", valider: "Confirm the fight", annuler: "Cancel",
      aidants: "Helpers", principal: "Main pawn", gagne: "The attack wins: the defending pawn dies, the helpers survive.",
      regleCombat: "Each side adds up the power of its main pawn and its helpers. Only the main pawn of the losing side dies. A tie changes nothing, unless a Chief is present.",
      tabRegles: "Rules", tabMots: "Keywords", tabEcran: "The screen", chercherPh: "Search…",
      aucunRes: "No result.", ouvrirAide: "Open help on: ",
      actionsT: { passer: "Pass", jouer: "Play a card", acheter: "Buy a blink", deplacer: "Move", combattre: "Fight", activer: "Activate a power", detruire: "Destroy a base", construire: "Build", reparer: "Repair", salle: "Use a room", messalles: "My rooms", fusionner: "Fuse the robot", tente: "Move the tent" },
      actionsS: { passer: "End your turn", jouer: "Pawn, item, spell, event", acheter: "1 coin, placed in your base", deplacer: "One pawn, to a free adjacent cell", combattre: "One of your pawns attacks, with helpers", activer: "A pawn's active power", detruire: "A pawn next to an enemy base", construire: "Building or room, with builders", reparer: "An Engineer repairs an item", salle: "A pawn inside a building with a room", messalles: "View or reveal your rooms (free)", fusionner: "4 of 5 pieces: 2×2 Robot", tente: "One tent, one cell up or down" },
      raisons: { detruire: "None of your pawns is next to an enemy base.", reparer: "No Engineer has a target in reach.", salle: "None of your pawns is inside a building with a usable room.", fusionner: "You need 4 Robot pieces in hand and a free 2×2 spot in your base." },
      conseils: {
        passer: "You end your turn without an action.", jouer: "Pick a card from your hand. A spell is cast on a pawn inside the zone of your spell sources.",
        acheter: "Buy a blink: 1 coin. It is placed at once on a free cell of your base.", deplacer: "Drop one of your pawns on a free adjacent cell.",
        combattre: "Pick one of your pawns to fight, then its target, then the helpers.", activer: "Click a pawn to activate its power.",
        construire: "Click a cell to build there: the building power around it must reach the hammer cost.", messalles: "Your rooms stay hidden from the other players: reveal them whenever you like, for free."
      },
      tourDeJ: "Player 1's turn", choisis: "pick an action.",
      typeNoms: { pion: "Pawn", item: "Item", sort: "Spell", evenement: "Event", batiment: "Building", salle: "Room" },
      coutPieces: "coin(s)", coutMarteaux: "hammers"
    }
  };

  /* ---------- cles propres a la page de test ---------- */
  Object.assign(UI.fr, {
    pageTest: "Page de test : le vrai moteur du jeu, avec la nouvelle interface.",
    reprendre: "Reprendre la partie", nouvelleSure: "Une partie est en cours. Recommencer ?",
    famillesT: "Familles", choisisFamille: "Choisis une famille", plusRien: "Plus de famille à choisir.",
    mainVide: "Aucune carte en main.", mainDe: "Main du joueur", elimine: "éliminé", actif: "à toi", gagneT: "Fin de la partie",
    prix: "Prix", marteaux: "marteaux", salleT: "Salle", cachee: "cachée", revelee: "révélée", aucuneSalle: "aucune", batimentT: "Bâtiment",
    pieceTitre: "Pièces à placer", pieceTexte: "Glisse chaque pièce dans un emplacement pointillé de ton quart. Elle doit rester reliée au joueur d'avant.",
    indispo: "Pas possible maintenant", base1: "Base du joueur",
    nbCartes: "carte(s)", aucunPion: "Clique sur un pion ou un bâtiment du plateau pour voir son détail.",
    raisons2: {
      combattre: "Aucun de tes pions n'a d'ennemi à portée.", construire: "Rien à construire : il manque un bâtiment ou une salle jouable, des constructeurs ou des pièces.",
      acheter: "Il faut 1 pièce, une case libre dans ta base et du stock.", jouer: "Plus de carte en main, ou ta base est détruite.",
      deplacer: "Aucun de tes pions ne peut se déplacer.", activer: "Aucun pion n'a de pouvoir actif utilisable.", messalles: "Tu n'as posé aucune salle."
    },
    moteurFr: "Les messages du jeu restent en français."
  });
  Object.assign(UI.en, {
    pageTest: "Test page: the real game engine, with the new interface.",
    reprendre: "Resume the game", nouvelleSure: "A game is in progress. Start over?",
    famillesT: "Families", choisisFamille: "Pick a family", plusRien: "No family left to pick.",
    mainVide: "No card in hand.", mainDe: "Hand of player", elimine: "eliminated", actif: "your turn", gagneT: "Game over",
    prix: "Price", marteaux: "hammers", salleT: "Room", cachee: "hidden", revelee: "revealed", aucuneSalle: "none", batimentT: "Building",
    pieceTitre: "Pieces to place", pieceTexte: "Drag each piece into a dotted slot of your quarter. It must stay linked to the previous player.",
    indispo: "Not possible right now", base1: "Base of player",
    nbCartes: "card(s)", aucunPion: "Click a pawn or a building on the board to see its details.",
    raisons2: {
      combattre: "None of your pawns has an enemy in reach.", construire: "Nothing to build: no playable building or room, not enough builders or coins.",
      acheter: "You need 1 coin, a free cell in your base and stock.", jouer: "No card left in hand, or your base is destroyed.",
      deplacer: "None of your pawns can move.", activer: "No pawn has a usable active power.", messalles: "You have not placed any room."
    },
    moteurFr: "In-game messages stay in French."
  });

  /* ---------- familles ---------- */
  var FAMILLES = [
    { id: "goblin", fr: ["Goblin", "Trois gobelins, leur roi, et un dinosaure sur 2 cases."], en: ["Goblin", "Three goblins, their king, and a 2-cell dinosaur."] },
    { id: "ours", fr: ["Mr Ours", "Boucli-feuille, arbre abri, cochi-fi-ca-tion."], en: ["Mr Bear", "Leaf shield, shelter tree, pig-ification."] },
    { id: "ninja", fr: ["Ninja", "Passages secrets, temple, katana."], en: ["Ninja", "Secret passages, temple, katana."] },
    { id: "horreur", fr: ["Film d'horreur", "Psychopathe, bruit suspect, maison hantée."], en: ["Horror movie", "Psychopath, suspicious noise, haunted house."] },
    { id: "steampunk", fr: ["Steampunk", "Outils, bougie, pistolet-rouage, salle piégée."], en: ["Steampunk", "Tools, candle, gear pistol, trapped room."] },
    { id: "magie", fr: ["Magie", "Magicien, tour de mage, Freeze, Fireball, Cachot."], en: ["Magic", "Mage, mage tower, Freeze, Fireball, Dungeon."] },
    { id: "rebelle", fr: ["Rebelle", "Papillon, pastèque, repaire rebelle."], en: ["Rebel", "Butterfly, watermelon, rebel hideout."] },
    { id: "maison", fr: ["Maison", "Habitations, marteau bâtisseur."], en: ["House", "Dwellings, builder's hammer."] },
    { id: "chose", fr: ["La Chose", "Inattaquable par un vert ou à distance. White House."], en: ["The Thing", "Immune to greens and to ranged attacks. White House."] },
    { id: "biome", fr: ["Biome", "Déplacer, changer, briser le plateau."], en: ["Biome", "Move, swap and break the board."] },
    { id: "test", fr: ["Test", "Tente mobile, bouton, trianguler, flèche, ligne."], en: ["Test", "Movable tent, button, triangulate, arrow, line."] },
    { id: "robot", fr: ["Robot", "Cinq morceaux, quatre à fusionner en un Robot 2×2."], en: ["Robot", "Five pieces, fuse four into one 2×2 Robot."] },
    { id: "royaute", fr: ["Royauté", "Couronne, arc, épée, muret, lac de poison."], en: ["Royalty", "Crown, bow, sword, wall, poison lake."] },
    { id: "gems", fr: ["Gems", "Cinq gemmes qui changent un pion."], en: ["Gems", "Five gems that change a pawn."] },
    { id: "terreur", fr: ["Terreur nocturne", "M. Bonsoir, Mme Bonjour, poème, Pardon ?"], en: ["Night terror", "Mr Evening, Ms Morning, poem, Pardon?"] }
  ];

  /* ---------- mots-cles et etats ---------- */
  var MOTS = [
    { id: "constructeur", fr: ["Constructeur [x]", "Compte pour x de puissance de construction. Les pions sur la case ou à côté s'additionnent jusqu'au coût en marteaux du bâtiment ; les objets cumulent."], en: ["Builder [x]", "Counts as x building power. Pawns on or next to the cell add up to the building's hammer cost; items stack."] },
    { id: "costaud", fr: ["Costaud", "Casse les choses fragiles à son contact et libère un pion gelé qui est à côté de lui."], en: ["Sturdy", "Breaks fragile things on contact and frees a frozen pawn next to it."] },
    { id: "agile", fr: ["Agile", "Se déplace aussi en diagonale."], en: ["Agile", "Also moves diagonally."] },
    { id: "tireur", fr: ["Tireur [x]", "Attaque jusqu'à x+1 cases en ligne droite. Le premier pion rencontré bloque la ligne."], en: ["Shooter [x]", "Attacks up to x+1 cells in a straight line. The first pawn met blocks the line."] },
    { id: "rapide", fr: ["Rapide [x]", "Se déplace de x cases de plus."], en: ["Fast [x]", "Moves x cells further."] },
    { id: "vole", fr: ["Vole", "Passe au-dessus des trous, ignore le Muret et peut entrer dans le Lac de poison."], en: ["Flies", "Passes over holes, ignores the Wall and may enter the Poison lake."] },
    { id: "belier", fr: ["Bélier", "Après avoir tué sa cible, prend sa place."], en: ["Ram", "After killing its target, takes its cell."] },
    { id: "sous_terre", fr: ["Sous terre", "N'est attaquable qu'au corps à corps."], en: ["Underground", "Can only be attacked in melee."] },
    { id: "fort_esprit", fr: ["Fort d'esprit", "Ne peut jamais changer de camp."], en: ["Strong-minded", "Can never change sides."] },
    { id: "claustrophobe", fr: ["Claustrophobe", "Ne peut pas entrer dans un bâtiment ; s'il y est forcé, il en sort tout seul."], en: ["Claustrophobic", "Cannot enter a building; if forced in, it walks out by itself."] },
    { id: "courageux", fr: ["Courageux", "Ignore Claustrophobe et Peur du sang, d'où qu'ils viennent."], en: ["Brave", "Ignores Claustrophobic and Bloodphobia, whatever their source."] },
    { id: "analphabete", fr: ["Analphabète", "Ne sait pas lire : il ne peut pas lire un Poème."], en: ["Illiterate", "Cannot read: it cannot read a Poem."] },
    { id: "peur_sang", fr: ["Peur du sang", "Ne peut pas attaquer, ni aider un combat."], en: ["Bloodphobia", "Cannot attack, nor help in a fight."] },
    { id: "meute", fr: ["Meute", "Quand un Meute ou un Chef bouge, les Meute alliés reliés en chaîne peuvent le suivre : même direction, même distance, sans coût d'action."], en: ["Pack", "When a Pack pawn or a Chief moves, allied Pack pawns linked in a chain may follow: same direction, same distance, no action cost."] },
    { id: "nyctalope", fr: ["Nyctalope", "Voit dans le noir : il bouge et tire de loin la nuit, et entre dans les bâtiments sans lumière."], en: ["Night-sighted", "Sees in the dark: moves and shoots at range at night, and enters unlit buildings."] },
    { id: "malin", fr: ["Malin", "Peut utiliser les mécanismes compliqués (Salle piégée, Pistolet-rouage)."], en: ["Cunning", "Can use tricky mechanisms (Trapped room, Gear pistol)."] },
    { id: "ingenieur", fr: ["Ingénieur", "Peut réparer : action Réparer sur sa case ou à côté."], en: ["Engineer", "Can repair: Repair action on its cell or next to it."] },
    { id: "chef", fr: ["Chef", "Gagne les égalités de combat. Les Meute le suivent, mais lui ne suit personne."], en: ["Chief", "Wins combat ties. Pack pawns follow it, but it follows nobody."] },
    { id: "electrique", fr: ["Électrique", "Machine : la Coupure de courant peut la casser."], en: ["Electric", "A machine: the Power cut can break it."] },
    { id: "fragile", fr: ["Fragile", "Se brise au contact d'un Costaud."], en: ["Fragile", "Breaks on contact with a Sturdy pawn."] },
    { id: "casse", fr: ["Cassé", "Objet, salle ou bâtiment inutilisable jusqu'à réparation par un Ingénieur."], en: ["Broken", "Item, room or building unusable until an Engineer repairs it."] },
    { id: "gele", etat: true, fr: ["Gelé", "Ne peut rien faire (bouger, attaquer, aider, activer). Levé par un Costaud ou un pion de puissance supérieure à 10 à côté."], en: ["Frozen", "Can do nothing (move, attack, help, activate). Lifted by a Sturdy pawn or a pawn of power over 10 next to it."] },
    { id: "endormi", etat: true, fr: ["Endormi", "Comme gelé, jusqu'à ce qu'un pion de son propriétaire bouge à côté de lui."], en: ["Asleep", "Like frozen, until one of its owner's pawns moves next to it."] },
    { id: "enferme", etat: true, fr: ["Enfermé", "Dans la sous-case d'un Cachot : hors du plateau, intouchable sauf par le pion du bâtiment. Libéré par un Malin, un Ingénieur, un Costaud ou une puissance d'au moins 13."], en: ["Locked up", "In a Dungeon's sub-cell: off the board, untouchable except by the building's pawn. Freed by a Cunning, an Engineer, a Sturdy pawn or power 13+."] },
    { id: "noir", etat: true, fr: ["Noir / nuit", "La nuit noircit tout hors des bâtiments pendant un tour complet. Sans Nyctalope, on ne bouge pas et on ne tire pas de loin sur une case noire."], en: ["Dark / night", "Night darkens everything outside buildings for one full round. Without Night-sight, you cannot move or shoot at range on a dark cell."] }
  ];
  function motPar(id) { for (var i = 0; i < MOTS.length; i++) if (MOTS[i].id === id) return MOTS[i]; return null; }

  /* ---------- articles de regles ---------- */
  var ARTICLES = [
    { id: "but", fr: { t: "But du jeu", h: "<p>Jusqu'à <span class=em>quatre joueurs</span> s'affrontent sur un plateau de 4×4 biomes, chacun de 3×3 cases. Chaque joueur a une <span class=em>base</span> dans son coin.</p><p>Un joueur est <span class=em>éliminé</span> quand sa base est détruite et qu'il n'a plus aucun pion. Le dernier joueur en jeu gagne.</p>" },
      en: { t: "Goal", h: "<p>Up to <span class=em>four players</span> fight on a board of 4×4 biomes, each 3×3 cells. Every player has a <span class=em>base</span> in a corner.</p><p>A player is <span class=em>eliminated</span> when their base is destroyed and they have no pawn left. The last player in the game wins.</p>" } },
    { id: "tour", fr: { t: "Ton tour", h: "<p>Au début de ton tour tu gagnes <span class=em>1 pièce</span> 🪙. Puis tu fais <span class=em>une seule action</span> :</p><ul><li>Déplacer un pion d'une case adjacente (plus loin avec Rapide, en diagonale avec Agile)</li><li>Jouer une carte : pion, objet, sort ou événement</li><li>Activer le pouvoir actif d'un pion</li><li>Combattre</li><li>Construire un bâtiment ou une salle</li><li>Acheter un blink (1 pièce)</li><li>Détruire une base ennemie voisine</li><li>Réparer, utiliser une salle, fusionner le Robot</li><li>Passer</li></ul><p>Consulter ou révéler tes salles est gratuit et ne compte pas comme une action. Si ta base est détruite, tu ne peux plus jouer de cartes ni acheter, mais tes pions déjà en jeu continuent.</p>" },
      en: { t: "Your turn", h: "<p>At the start of your turn you gain <span class=em>1 coin</span> 🪙. Then you take <span class=em>one action only</span>:</p><ul><li>Move a pawn one adjacent cell (further with Fast, diagonally with Agile)</li><li>Play a card: pawn, item, spell or event</li><li>Activate a pawn's active power</li><li>Fight</li><li>Build a building or a room</li><li>Buy a blink (1 coin)</li><li>Destroy a neighbouring enemy base</li><li>Repair, use a room, fuse the Robot</li><li>Pass</li></ul><p>Viewing or revealing your rooms is free and is not an action. If your base is destroyed you can no longer play cards or buy, but the pawns already in play keep going.</p>" } },
    { id: "couleurs", fr: { t: "Puissance et couleurs", h: "<p>La puissance d'un pion va de 1 à 15 : sa carte, plus ses objets et ses bonus. Sa <span class=em>couleur</span> dépend de la puissance de base de la carte seule :</p><table><tr><td><span class=coul style='--c:var(--vert)'>Vert</span></td><td>1 à 5</td><td>jusqu'à 4 autres verts pour aider</td></tr><tr><td><span class=coul style='--c:var(--orange)'>Orange</span></td><td>6 à 10</td><td>jusqu'à 2 autres oranges</td></tr><tr><td><span class=coul style='--c:var(--rouge)'>Rouge</span></td><td>11 à 15</td><td>combat seul</td></tr></table>" },
      en: { t: "Power and colours", h: "<p>A pawn's power ranges from 1 to 15: its card plus its items and bonuses. Its <span class=em>colour</span> depends on the card's base power alone:</p><table><tr><td><span class=coul style='--c:var(--vert)'>Green</span></td><td>1 to 5</td><td>up to 4 other greens to help</td></tr><tr><td><span class=coul style='--c:var(--orange)'>Orange</span></td><td>6 to 10</td><td>up to 2 other oranges</td></tr><tr><td><span class=coul style='--c:var(--rouge)'>Red</span></td><td>11 to 15</td><td>fights alone</td></tr></table>" } },
    { id: "combat", fr: { t: "Combat", h: "<p>Un de tes pions attaque un ennemi adjacent (ou en ligne droite avec Tireur). Tu choisis tes <span class=em>aidants</span>, puis le propriétaire du défenseur choisit les siens, sur le même écran.</p><ul><li>Les aidants sont des alliés de la bonne couleur, reliés au pion principal par une chaîne de pions adjacents.</li><li>Chaque camp additionne les puissances. Le total le plus faible perd.</li><li>Seul le <span class=em>pion principal</span> du camp perdant meurt. Les aidants survivent.</li><li>Égalité : rien ne se passe, sauf si un Chef est dans l'un des camps (et pas l'autre).</li></ul>" },
      en: { t: "Fighting", h: "<p>One of your pawns attacks an adjacent enemy (or in a straight line with Shooter). You choose your <span class=em>helpers</span>, then the defender's owner chooses theirs, on the same screen.</p><ul><li>Helpers are allies of the right colour, linked to the main pawn through a chain of adjacent pawns.</li><li>Each side adds up its power. The lower total loses.</li><li>Only the losing side's <span class=em>main pawn</span> dies. Helpers survive.</li><li>A tie changes nothing, unless a Chief is on one side (and not the other).</li></ul>" } },
    { id: "construire", fr: { t: "Construire, salles", h: "<p>Un <span class=em>bâtiment</span> coûte des pièces 🪙 (payées) et des marteaux 🛠️ (un seuil : la puissance de construction de tes pions sur la case ou à côté doit l'atteindre).</p><p>Une <span class=em>salle</span> se pose, face cachée, sur un bâtiment qui n'en a pas. Seul son propriétaire voit sa face. N'importe quel joueur dont un pion est dans le bâtiment peut l'utiliser, ce qui la révèle pour de bon. Une salle passive agit toute seule, mais seulement révélée.</p>" },
      en: { t: "Building, rooms", h: "<p>A <span class=em>building</span> costs coins 🪙 (paid) and hammers 🛠️ (a threshold: the building power of your pawns on or next to the cell must reach it).</p><p>A <span class=em>room</span> is placed face down on a building that has none. Only its owner sees its face. Any player with a pawn inside the building can use it, which reveals it for good. A passive room works by itself, but only once revealed.</p>" } },
    { id: "magasin", fr: { t: "Pièces et blinks", h: "<p>Le magasin commun compte 26 <span class=em>blinks</span> verts de puissance 1 : 6 soldats, 8 constructeurs, 6 lanceurs de sort, 6 diplomates. Acheter un blink coûte 1 pièce et prend ton action ; il est posé dans ta base.</p><p>Un diplomate dans la base d'un adversaire échange une carte avec lui, un pour un.</p>" },
      en: { t: "Coins and blinks", h: "<p>The shared shop holds 26 green <span class=em>blinks</span> of power 1: 6 soldiers, 8 builders, 6 spell casters, 6 diplomats. Buying a blink costs 1 coin and takes your action; it is placed in your base.</p><p>A diplomat inside an opponent's base swaps one card with them, one for one.</p>" } },
    { id: "sorts", fr: { t: "Sorts", h: "<p>Un sort se lance sur un pion dans la <span class=em>zone de tes sources</span> : ta base (ligne et colonne), chaque pion lanceur, et la Tour de mage si le dernier entré est à toi. Les pions lanceurs voient en ligne et colonne ; le Magicien aussi en diagonale. Rien ne bloque la ligne.</p>" },
      en: { t: "Spells", h: "<p>A spell is cast on a pawn inside the <span class=em>zone of your sources</span>: your base (row and column), each caster pawn, and the Mage tower if the last one in is yours. Caster pawns see along rows and columns; the Mage also diagonally. Nothing blocks the line.</p>" } },
    { id: "nuit", fr: { t: "Nuit et états", h: "<p>La nuit dure un tour complet. Hors des bâtiments, un pion sans <span class=em>Nyctalope</span> ne peut ni bouger ni attaquer à distance. Un bâtiment noir est interdit d'entrée à qui ne voit pas dans le noir.</p><p>Les états <span class=em>gelé</span>, <span class=em>endormi</span> et <span class=em>enfermé</span> empêchent un pion d'agir. Voir l'onglet Mots-clés.</p>" },
      en: { t: "Night and states", h: "<p>Night lasts one full round. Outside buildings, a pawn without <span class=em>Night-sight</span> can neither move nor attack at range. A dark building cannot be entered by anyone who cannot see in the dark.</p><p>The <span class=em>frozen</span>, <span class=em>asleep</span> and <span class=em>locked up</span> states stop a pawn from acting. See the Keywords tab.</p>" } },
    { id: "camp", fr: { t: "Camp, grands pions", h: "<p>Le camp d'un pion est son propriétaire. Certains effets le font changer de camp pour de bon, avec ses objets et ses effets ; Fort d'esprit l'interdit.</p><p>Le Dinosaure occupe 2 cases et porte 2 verts ; le Robot occupe 2×2 cases. Ils se posent entièrement dans ta base.</p>" },
      en: { t: "Sides, large pawns", h: "<p>A pawn's side is its owner. Some effects change it for good, together with its items and effects; Strong-minded forbids it.</p><p>The Dinosaur takes 2 cells and carries 2 greens; the Robot takes 2×2 cells. They are placed entirely inside your base.</p>" } }
  ];

  var ECRAN = {
    fr: [["Bandeau du haut", "Le joueur dont c'est le tour et ce que le jeu attend de lui. La pastille « 1 action / tour » rappelle la règle."],
         ["Colonne de gauche", "Les quatre joueurs : pièces, nombre de pions, état de la base. Un liseré de la couleur du joueur marque son camp."],
         ["Plateau", "12×12 cases en 4×4 biomes. Pion : le chiffre est la puissance, l'anneau la couleur. Gros carré : grand pion. Case sombre : la nuit."],
         ["Panneau de droite", "Détail du pion ou de la carte choisi : puissance, mots-clés (cliquables), équipement (2 mains, tête, gemme), effets en cours."],
         ["Barre d'actions", "Les actions du tour avec leur touche. Une action grisée dit pourquoi elle est impossible. Le « ? » ouvre l'aide sur l'action."],
         ["Ta main", "Tes cartes, avec leur type et leur coût en pièces et en marteaux."],
         ["Raccourcis", "P passer · J jouer · A acheter · D déplacer · C combattre · V activer · B base · K construire · R réparer · S salle · M mes salles · F fusionner · ? aide"]],
    en: [["Top banner", "Whose turn it is and what the game expects. The “1 action / turn” pill restates the rule."],
         ["Left column", "The four players: coins, pawn count, base status. A stripe in the player's colour marks their side."],
         ["Board", "12×12 cells in 4×4 biomes. Pawn: the number is power, the ring its colour. Big square: large pawn. Dark cell: night."],
         ["Right panel", "Details of the chosen pawn or card: power, keywords (clickable), equipment (2 hands, head, gem), active effects."],
         ["Action bar", "The turn's actions with their key. A greyed action says why it is impossible. The “?” opens help on that action."],
         ["Your hand", "Your cards, with their type and cost in coins and hammers."],
         ["Shortcuts", "P pass · J play · A buy · D move · C fight · V activate · B base · K build · R repair · S room · M my rooms · F fuse · ? help"]]
  };

  /* ================== MODULE D'AIDE : langue + tiroir ================== */
  var lang = "fr";
  try {
    var memo = localStorage.getItem("tamer-lang");
    if (memo === "fr" || memo === "en") lang = memo;
    else if ((navigator.language || "").slice(0, 2) !== "fr") lang = "en";
  } catch (e) { }

  var ecouteurs = [];
  var etat = { onglet: "regles" };
  function $(id) { return document.getElementById(id); }
  function motPar(id) { for (var i = 0; i < MOTS.length; i++) if (MOTS[i].id === id) return MOTS[i]; return null; }
  function fam(id) { for (var i = 0; i < FAMILLES.length; i++) if (FAMILLES[i].id === id) return FAMILLES[i]; return null; }

  function appliquerStatique(racine) {
    Array.prototype.forEach.call((racine || document).querySelectorAll("[data-i]"), function (n) {
      var v = UI[lang][n.getAttribute("data-i")];
      if (typeof v === "string") n.textContent = v;
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-lang]"), function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang)); });
    var ch = $("chercher");
    if (ch) { ch.placeholder = UI[lang].chercherPh; ch.setAttribute("aria-label", UI[lang].chercherPh); }
  }
  function changerLangue(l) {
    lang = l; document.documentElement.lang = l;
    try { localStorage.setItem("tamer-lang", l); } catch (e) { }
    appliquerStatique(); rendreAide();
    ecouteurs.forEach(function (f) { try { f(l); } catch (e) { console.error(e); } });
  }

  function rendreAide() {
    var corps = $("corps-aide"); if (!corps) return;
    var t = UI[lang], q = ($("chercher").value || "").trim().toLowerCase(), html = "";
    Array.prototype.forEach.call(document.querySelectorAll(".aide [data-tab]"), function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-tab") === etat.onglet)); });
    function ok(s) { return !q || s.toLowerCase().indexOf(q) >= 0; }
    if (etat.onglet === "regles") {
      ARTICLES.forEach(function (a) {
        var d = a[lang]; if (ok(d.t + " " + d.h.replace(/<[^>]+>/g, " "))) html += "<article class=art id='art-" + a.id + "'><h3>" + d.t + "</h3>" + d.h + "</article>";
      });
    } else if (etat.onglet === "mots") {
      MOTS.forEach(function (m) {
        var d = m[lang]; if (ok(d[0] + " " + d[1])) html += "<article class=art id='mot-" + m.id + "'><h3>" + d[0] + (m.etat ? " <span class=rien>· " + (lang === "fr" ? "état" : "state") + "</span>" : "") + "</h3><p>" + d[1] + "</p></article>";
      });
    } else {
      ECRAN[lang].forEach(function (r) { if (ok(r[0] + " " + r[1])) html += "<article class=art><h3>" + r[0] + "</h3><p>" + r[1] + "</p></article>"; });
    }
    corps.innerHTML = html || "<p class=rien>" + t.aucunRes + "</p>";
  }
  function ouvrir(onglet, cible) {
    etat.onglet = onglet || "regles"; $("chercher").value = "";
    $("aide").classList.add("on"); rendreAide();
    if (cible) {
      var n = $((onglet === "mots" ? "mot-" : "art-") + cible);
      if (n) { n.classList.add("surligne"); if (n.scrollIntoView) n.scrollIntoView({ block: "start" }); setTimeout(function () { n.classList.remove("surligne"); }, 2200); }
    } else { $("corps-aide").scrollTop = 0; }
    $("fermer-aide").focus();
  }
  function fermer() { $("aide").classList.remove("on"); }

  document.addEventListener("click", function (e) {
    var cible = e.target.closest ? e.target.closest("[data-lang], [data-kw], [data-aide], [data-tab]") : null;
    if (!cible) return;
    if (cible.hasAttribute("data-lang")) changerLangue(cible.getAttribute("data-lang"));
    else if (cible.hasAttribute("data-kw")) ouvrir("mots", cible.getAttribute("data-kw"));
    else if (cible.hasAttribute("data-aide")) ouvrir("regles", cible.getAttribute("data-aide"));
    else if (cible.hasAttribute("data-tab") && cible.closest(".aide")) { etat.onglet = cible.getAttribute("data-tab"); rendreAide(); }
  });
  document.addEventListener("DOMContentLoaded", function () {
    $("fermer-aide").addEventListener("click", fermer);
    $("btn-aide").addEventListener("click", function () { ouvrir("regles"); });
    $("chercher").addEventListener("input", rendreAide);
    document.addEventListener("keydown", function (e) {
      var tag = (e.target && e.target.tagName) || "";
      if (e.key === "Escape") { fermer(); return; }
      if (tag === "INPUT" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "?") { ouvrir("regles"); e.preventDefault(); }
    });
    document.documentElement.lang = lang;
    appliquerStatique(); rendreAide();
  });

  window.Tamer = {
    UI: UI, MOTS: MOTS, FAMILLES: FAMILLES, ARTICLES: ARTICLES, ECRAN: ECRAN,
    motPar: motPar, famille: fam,
    get lang() { return lang; },
    t: function (cle) { return UI[lang][cle]; },
    changerLangue: changerLangue, aPourLangue: function (f) { ecouteurs.push(f); },
    appliquerStatique: appliquerStatique, ouvrirAide: ouvrir, fermerAide: fermer
  };
})();
