// ==========================================
// NET SOURIRE
// PATIENT-AUTH.JS
// PARTIE 1
// ==========================================

import { auth, db } from "./firebase.js";

import {
signInWithEmailAndPassword,
sendPasswordResetEmail,
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ==========================================
// CONNEXION PATIENT
// ==========================================

const form = document.getElementById("patientLoginForm");

const message = document.getElementById("loginMessage");

const btnConnexion = document.getElementById("btnConnexion");

if(form){

form.addEventListener("submit",connexionPatient);

}

async function connexionPatient(e){

e.preventDefault();

const email=document.getElementById("email").value.trim();

const password=document.getElementById("password").value;

try{

btnConnexion.disabled=true;

btnConnexion.innerHTML=`

<i class="fa-solid fa-spinner fa-spin"></i>

Connexion...

`;

message.style.color="#0D6EFD";

message.innerHTML="Connexion en cours...";

const userCredential=

await signInWithEmailAndPassword(

auth,

email,

password

);

const uid=userCredential.user.uid;

const patientDoc=

await getDoc(

doc(db,"patients",uid)

);

if(!patientDoc.exists()){

message.style.color="red";

message.innerHTML="Compte patient introuvable.";

return;

}

// Vérification du compte patient
const patient = patientDoc.data();

if(patient.statut && patient.statut === "bloque"){

message.style.color="red";

message.innerHTML="Votre compte est désactivé. Contactez le cabinet.";

btnConnexion.disabled=false;

btnConnexion.innerHTML=`

<i class="fa-solid fa-right-to-bracket"></i>

Connexion

`;

return;

}

// Sauvegarde de la session

localStorage.setItem("patientUID",uid);

localStorage.setItem("patientNom",patient.nom || "");

localStorage.setItem("patientEmail",patient.email || "");

localStorage.setItem("patientTelephone",patient.telephone || "");

// Redirection

message.style.color="green";

message.innerHTML="Connexion réussie...";

setTimeout(()=>{

window.location.href="patient-dashboard.html";

},1000);

}catch(error){

console.error(error);

let erreur="Impossible de se connecter.";

switch(error.code){

case "auth/invalid-email":
erreur="Adresse e-mail invalide.";
break;

case "auth/user-not-found":
erreur="Compte introuvable.";
break;

case "auth/wrong-password":
erreur="Mot de passe incorrect.";
break;

case "auth/invalid-credential":
erreur="Adresse e-mail ou mot de passe incorrect.";
break;

case "auth/too-many-requests":
erreur="Trop de tentatives. Réessayez plus tard.";
break;

}

message.style.color="red";

message.innerHTML=erreur;

}finally{

btnConnexion.disabled=false;

btnConnexion.innerHTML=`

<i class="fa-solid fa-right-to-bracket"></i>

Connexion

`;

}

}

// ==========================================
// MOT DE PASSE OUBLIÉ
// ==========================================

const forgot=document.getElementById("forgotPassword");

if(forgot){

forgot.addEventListener("click",async(e)=>{

e.preventDefault();

const email=prompt("Entrez votre adresse e-mail");

if(!email) return;

try{

await sendPasswordResetEmail(auth,email);

alert("Un e-mail de réinitialisation a été envoyé.");

}catch(error){

alert(error.message);

}

});

}

// ==========================================
// DÉCONNEXION PATIENT
// ==========================================

// Fonction globale de déconnexion (utilisée par le menu patient)
window.deconnexionPatient = async function(){

try{

await signOut(auth);

localStorage.removeItem("patientUID");

localStorage.removeItem("patientNom");

localStorage.removeItem("patientEmail");

localStorage.removeItem("patientTelephone");

window.location.href = "patient-login.html";

}catch(error){

console.error(error);

window.location.href = "patient-login.html";

}

};

// Déconnexion via le bouton logoutBtn des pages patient
const logoutBtn = document.getElementById("logoutBtn");

if(logoutBtn){

logoutBtn.addEventListener("click", async (e) => {

e.preventDefault();

await window.deconnexionPatient();

});

}

// ==========================================
// FIN PARTIE 2
// ==========================================
