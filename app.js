import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    orderBy,
    query
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// =============================
// Charger les publications
// =============================

async function chargerPublications() {

    // On cible le conteneur réel de la galerie (le contenu statique reste en place)
    const galerie = document.getElementById("galleryContainer");

    if (!galerie) return;

    const q = query(
        collection(db, "publications"),
        orderBy("dateCreation", "desc")
    );

    const snapshot = await getDocs(q);

    // Créer une zone pour les publications dynamiques (après le contenu statique)
    const zoneDynamique = document.getElementById("gallerieDynamique");

    if (!zoneDynamique) {

        const nouvelleZone = document.createElement("div");

        nouvelleZone.id = "galerieDynamique";

        nouvelleZone.className = "gallery-grid";

        galerie.appendChild(nouvelleZone);

        galerie.classList.remove("gallery-grid");

    }

    const zone = document.getElementById("galerieDynamique");

    zone.innerHTML = "";

    snapshot.forEach(doc => {

        const data = doc.data();

        if (!data.url) return;

        const div = document.createElement("div");

        div.className = "gallery-card";

        const image = document.createElement("img");

        image.src = data.url;

        image.alt = data.titre || "Publication";

        image.loading = "lazy";

        const info = document.createElement("div");

        info.className = "gallery-info";

        const titre = document.createElement("h3");

        titre.textContent = data.titre || "";

        const description = document.createElement("p");

        description.textContent = data.description || "";

        info.appendChild(titre);

        info.appendChild(description);

        div.appendChild(image);

        div.appendChild(info);

        zone.appendChild(div);

    });

}

chargerPublications();
