import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ===============================
// CONNEXION ADMIN
// ===============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

  loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {

      await signInWithEmailAndPassword(auth, email, password);

      alert("Connexion réussie.");

      window.location.href = "dashboard.html";

    } catch (error) {

      alert("Erreur : " + error.message);

    }

  });

}

// ===============================
// PROTECTION DES PAGES ADMIN
// ===============================

const adminPages = [
  "dashboard.html",
  "patients.html",
  "rendezvous.html",
  "ordonnance.html",
  "facture.html",
  "publications.html",
  "parametres.html"
];

if (adminPages.some((page) => window.location.pathname.includes(page))) {

  onAuthStateChanged(auth, async (user) => {

    if (!user) {

      window.location.href = "login.html";

      return;

    }

    // Vérifier que l'utilisateur a bien le rôle administrateur
    try {

      const refDoc = doc(db, "utilisateurs", user.uid);

      const userDoc = await getDoc(refDoc);

      if (!userDoc.exists() || userDoc.data().role !== "admin") {

        await signOut(auth);

        window.location.href = "login.html";

      }

    } catch (error) {

      await signOut(auth);

      window.location.href = "login.html";

    }

  });

}

// ===============================
// DÉCONNEXION
// ===============================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    await signOut(auth);

    window.location.href = "login.html";

  });

}

// Fonction globale de déconnexion (utilisée par le menu des pages admin)
window.deconnexion = async function(){

  await signOut(auth);

  window.location.href = "login.html";

};
