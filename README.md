# GamesFactory

Site statique bilingue FR/EN (HTML/CSS/JS), aucun build. Ouvre `index.html` dans un navigateur.

## Structure
- `index.html` — home (liste des jeux)
- `games/*.html` — une page par jeu
- `games/_template.html` — modèle vierge à copier
- `css/style.css` — thème dark / retro pixel
- `js/lang.js` — sélecteur de langue FR/EN (mémorisé dans le navigateur)
- `assets/<nom-du-jeu>/` — images (cover.png, shot1.png…)

## Bilingue
Chaque texte est écrit deux fois, l'un des deux est masqué selon la langue :
- bloc : `<p class="fr">Bonjour</p>` `<p class="en">Hello</p>`
- en ligne : `<span class="fr">Jouer</span><span class="en">Play</span>`

## Ajouter un jeu
1. Copier `games/_template.html` vers `games/mon-jeu.html` et le remplir (FR et EN).
2. Dans `index.html`, copier un bloc `<a class="card panel">` et pointer `href` vers la nouvelle page.
3. Statut : `badge released` (Dispo), `badge wip` (En cours), `badge soon` (Bientôt).
4. Images : remplacer les `<svg>` placeholders par `<img src="../assets/mon-jeu/cover.png" alt="...">`.
