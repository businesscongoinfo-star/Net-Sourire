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

// =============================
// MENU MOBILE (burger)
// =============================
const burger = document.getElementById("burger");
const nav = document.querySelector("nav");

if (burger && nav) {
  burger.addEventListener("click", () => {
    nav.classList.toggle("mobile-open");
  });
  // Ferme le menu quand on clique sur un lien
  nav.querySelectorAll("ul a").forEach((a) => {
    a.addEventListener("click", () => nav.classList.remove("mobile-open"));
  });
}

// HEADER : effet au scroll
const headerEl = document.querySelector("header");
window.addEventListener("scroll", () => {
  if (!headerEl) return;
  if (window.scrollY > 12) {
    headerEl.classList.add("scrolled");
  } else {
    headerEl.classList.remove("scrolled");
  }
});

// RÉVÉLATION DES SECTIONS au scroll
const revealTargets = document.querySelectorAll(
  ".service-card, .doctor-card, .gallery-card, .before-card, .testimonial-card, .contact-card, .patient-card"
);

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealTargets.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(28px)";
    el.style.transition = "opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)";
    revealObserver.observe(el);
  });
}

