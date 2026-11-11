# GamesFactory

Site statique bilingue FR/EN (HTML/CSS/JS), aucun build pour le site lui-même. Ouvre `index.html` dans un navigateur
(ou lance un petit serveur : `python -m http.server`, nécessaire pour que Hop & Lock charge ses modules JS).

## Architecture — le site et les jeux sont séparés
```
index.html            home (liste des jeux)
games/<jeu>.html      fiche du jeu (textes, infos, bouton Jouer)   <- édité à la main
games/_template.html  modèle de fiche
css/ js/              thème et sélecteur de langue du site
play/<jeu>/           le jeu lui-même, copie du build                 <- GÉNÉRÉ, ne pas éditer
tools/sync-games.ps1  recopie les jeux sources vers play/
```
Jeux actuels : `hop-and-lock` (Hop & Lock) et `tamer` (T.A.M.E.R).

## Mettre à jour un jeu
1. **Hop & Lock** : dans `C:\Projets\Claude`, lancer `npm run build` (génère `dist/`).
2. **T.A.M.E.R** : rien à faire, la synchro copie directement les fichiers du prototype.
3. Dans ce dossier : `.\tools\sync-games.ps1` (ou `.\tools\sync-games.ps1 tamer` pour un seul jeu).
4. Mettre à jour la fiche `games/<jeu>.html` (version, changelog, description) si besoin.
5. `git add . ; git commit -m "Update <jeu>" ; git push`

Si un projet source change d'emplacement, modifier les chemins en haut de `tools/sync-games.ps1`.

## Bilingue
Chaque texte est écrit deux fois, l'un des deux est masqué selon la langue :
- bloc : `<p class="fr">Bonjour</p>` `<p class="en">Hello</p>`
- en ligne : `<span class="fr">Jouer</span><span class="en">Play</span>`
Les jeux ont leur propre gestion de langue (FR/EN intégrée).

## Ajouter un jeu
1. Ajouter une entrée dans `$games` de `tools/sync-games.ps1`, puis lancer la synchro.
2. Copier `games/_template.html` vers `games/mon-jeu.html`, le remplir (FR et EN) et pointer le bouton Jouer vers `play/mon-jeu/...`.
3. Dans `index.html`, copier un bloc `<a class="card panel">`.
4. Statut : `badge released` (Dispo), `badge wip` (En cours), `badge soon` (Bientôt).
