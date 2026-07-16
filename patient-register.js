// ==========================================
// NET SOURIRE
// PATIENT-REGISTER.JS V2
// PARTIE 1
// ==========================================

import { auth, db } from "./firebase.js";

import {
createUserWithEmailAndPassword,
updateProfile
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
doc,
setDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ==========================================
// VARIABLES
// ==========================================

const form=document.getElementById("patientRegisterForm");

const btnRegister=document.getElementById("btnRegister");

const message=document.getElementById("registerMessage");

// ==========================================
// INSCRIPTION
// ==========================================

if(form){

form.addEventListener("submit",inscrirePatient);

}

async function inscrirePatient(e){

e.preventDefault();

const nom=document.getElementById("nom").value.trim();

const telephone=document.getElementById("telephone").value.trim();

const email=document.getElementById("email").value.trim();

const password=document.getElementById("password").value;

const confirmPassword=document.getElementById("confirmPassword").value;

if(!nom || !telephone || !email || !password){

message.style.color="red";

message.innerHTML="Veuillez remplir tous les champs.";

return;

}

if(password!==confirmPassword){

message.style.color="red";

message.innerHTML="Les mots de passe ne correspondent pas.";

return;

}

try{

btnRegister.disabled=true;

btnRegister.innerHTML=`

<i class="fa-solid fa-spinner fa-spin"></i>

Création du compte...

`;

message.style.color="#0D6EFD";

message.innerHTML="Création de votre compte...";
// ==========================================
// NET SOURIRE
// PATIENT-REGISTER.JS V2
// PARTIE 2
// ==========================================

const userCredential=

await createUserWithEmailAndPassword(

auth,

email,

password

);

const user=userCredential.user;

// Mise à jour du profil Firebase

await updateProfile(user,{

displayName:nom

});

// Enregistrement dans Firestore

await setDoc(

doc(db,"patients",user.uid),

{

uid:user.uid,

nom:nom,

telephone:telephone,

email:email,

role:"patient",

statut:"actif",

photo:"",

adresse:"",

dateNaissance:"",

sexe:"",

groupeSanguin:"",

allergies:"",

antecedents:"",

observations:"",

dateCreation:serverTimestamp(),

derniereConnexion:serverTimestamp()

}

);

// Sauvegarde locale

localStorage.setItem("patientUID",user.uid);

localStorage.setItem("patientNom",nom);

localStorage.setItem("patientEmail",email);

localStorage.setItem("patientTelephone",telephone);

message.style.color="#198754";

message.innerHTML="✅ Compte créé avec succès.";

setTimeout(()=>{

window.location.href="patient-dashboard.html";

},1500);
// ==========================================
// NET SOURIRE
// PATIENT-REGISTER.JS V2
// PARTIE 3
// ==========================================

}catch(error){

console.error(error);

let erreur="Une erreur est survenue.";

switch(error.code){

case "auth/email-already-in-use":

erreur="Cette adresse e-mail est déjà utilisée.";

break;

case "auth/invalid-email":

erreur="Adresse e-mail invalide.";

break;

case "auth/weak-password":

erreur="Le mot de passe doit contenir au moins 6 caractères.";

break;

case "auth/network-request-failed":

erreur="Vérifiez votre connexion Internet.";

break;

default:

erreur=error.message;

}

message.style.color="#DC3545";

message.innerHTML=erreur;

}finally{

btnRegister.disabled=false;

btnRegister.innerHTML=`

<i class="fa-solid fa-user-plus"></i>

Créer mon compte

`;

}

}

// ==========================================
// VÉRIFICATION MOT DE PASSE
// ==========================================

const passwordInput=document.getElementById("password");

const confirmInput=document.getElementById("confirmPassword");

if(passwordInput && confirmInput){

confirmInput.addEventListener("input",()=>{

if(confirmInput.value===""){

confirmInput.style.borderColor="#E4E8F2";

return;

}

if(passwordInput.value===confirmInput.value){

confirmInput.style.borderColor="#198754";

}else{

confirmInput.style.borderColor="#DC3545";

}

});

}

// ==========================================
// FOCUS AUTOMATIQUE
// ==========================================

window.addEventListener("DOMContentLoaded",()=>{

const nom=document.getElementById("nom");

if(nom){

nom.focus();

}

});

// ==========================================
// FIN PATIENT-REGISTER.JS V2
// ==========================================
