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

    const galerie = document.querySelector(".gallery");

    if (!galerie) return;

    galerie.innerHTML = "";

    const q = query(
        collection(db, "publications"),
        orderBy("date", "desc")
    );

    const snapshot = await getDocs(q);

    snapshot.forEach(doc => {

        const data = doc.data();

        const div = document.createElement("div");

        div.className = "photo";

        if (data.type === "image") {

            div.innerHTML = `
                <img src="${data.url}" alt="${data.titre}">
            `;

        } else {

            div.innerHTML = `
                <video controls width="100%">
                    <source src="${data.url}">
                </video>
            `;

        }

        galerie.appendChild(div);

    });

}

chargerPublications();
