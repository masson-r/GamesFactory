class Base {
	constructor(x, y, joueur) {
		this.x = x;
		this.y = y;
		this.joueur = joueur;
		this.element = null; // rempli par creerRond() une fois affiché sur le plateau
	}

	creerRond(couleur = "yellow", taille = 40) {
		const rond = document.createElement("div");
		rond.style.position = "absolute";
		rond.style.left = this.x + "px";
		rond.style.top = this.y + "px";
		rond.style.width = taille + "px";
		rond.style.height = taille + "px";
		rond.style.borderRadius = "50%";
		rond.style.backgroundColor = couleur;
		rond.style.display = "flex";
		rond.style.alignItems = "center";
		rond.style.justifyContent = "center";

		rond.textContent = this.joueur;

		this.element = rond; // mémorise l'élément, utile pour le retrouver plus tard
		return rond;
	}
}