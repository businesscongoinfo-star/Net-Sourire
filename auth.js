import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

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
// PROTECTION DU DASHBOARD
// ===============================

if (window.location.pathname.includes("dashboard.html")) {

  onAuthStateChanged(auth, (user) => {

    if (!user) {

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
