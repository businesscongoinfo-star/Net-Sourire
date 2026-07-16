// ==========================================
// NET SOURIRE
// PARAMETRES.JS
// PARTIE 1
// ==========================================

import { db } from "./firebase.js";

import {
doc,
setDoc,
getDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { storage } from "./firebase.js";

import {
ref,
uploadBytes,
getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// ==========================================
// VARIABLES
// ==========================================

const form = document.getElementById("parametresForm");

const btnSave = document.getElementById("btnEnregistrerParametres");

// ==========================================
// CHARGER PARAMÈTRES
// ==========================================

async function chargerParametres(){

try{

const snap = await getDoc(

doc(db,"configuration","cabinet")

);

if(!snap.exists()) return;

const data = snap.data();

nomCabinet.value = data.nomCabinet || "";

responsable.value = data.responsable || "";

telephoneCabinet.value = data.telephoneCabinet || "";

emailCabinet.value = data.emailCabinet || "";

adresseCabinet.value = data.adresseCabinet || "";

villeCabinet.value = data.villeCabinet || "";

paysCabinet.value = data.paysCabinet || "";

devise.value = data.devise || "FCFA";

descriptionCabinet.value = data.descriptionCabinet || "";

horaires.value = data.horaires || "";

conditions.value = data.conditions || "";

}catch(error){

console.error(error);

}

}

window.addEventListener("load",chargerParametres);

// ==========================================
// FIN PARTIE 1
// ==========================================
// ==========================================
// NET SOURIRE
// PARAMETRES.JS
// PARTIE 2
// ==========================================

// ==========================================
// ENREGISTRER LES PARAMÈTRES
// ==========================================

if(form){

form.addEventListener("submit",enregistrerParametres);

}

if(btnSave){

btnSave.addEventListener("click",()=>{

form.requestSubmit();

});

}

async function enregistrerParametres(e){

e.preventDefault();

try{

btnSave.disabled=true;

btnSave.innerHTML="Enregistrement...";

let logoURL="";

const fichier=logoCabinet.files[0];

if(fichier){

const chemin=ref(

storage,

"cabinet/logo.png"

);

await uploadBytes(

chemin,

fichier

);

logoURL=

await getDownloadURL(

chemin

);

}else{

const snap=

await getDoc(

doc(db,"configuration","cabinet")

);

if(snap.exists()){

logoURL=

snap.data().logoURL || "";

}

}

await setDoc(

doc(db,"configuration","cabinet"),

{

nomCabinet:nomCabinet.value,

responsable:responsable.value,

telephoneCabinet:telephoneCabinet.value,

emailCabinet:emailCabinet.value,

adresseCabinet:adresseCabinet.value,

villeCabinet.value,

paysCabinet:paysCabinet.value,

devise:devise.value,

descriptionCabinet:descriptionCabinet.value,

horaires:horaires.value,

conditions:conditions.value,

logoURL,

dateModification:serverTimestamp()

}

);

alert("✅ Paramètres enregistrés avec succès.");

}catch(error){

console.error(error);

alert(error.message);

}

btnSave.disabled=false;

btnSave.innerHTML=`

<i class="fa-solid fa-floppy-disk"></i>

Enregistrer

`;

}

// ==========================================
// FIN PARTIE 2
// ==========================================
// ==========================================
// NET SOURIRE
// PARAMETRES.JS
// PARTIE 3
// ==========================================

// ==========================================
// APERÇU DU LOGO
// ==========================================

const logoInput = document.getElementById("logoCabinet");

if(logoInput){

logoInput.addEventListener("change",(e)=>{

const fichier=e.target.files[0];

if(!fichier) return;

const lecteur=new FileReader();

lecteur.onload=function(evt){

let apercu=document.getElementById("logoPreview");

if(!apercu){

apercu=document.createElement("img");

apercu.id="logoPreview";

apercu.style.width="140px";

apercu.style.height="140px";

apercu.style.objectFit="contain";

apercu.style.marginTop="20px";

apercu.style.borderRadius="15px";

apercu.style.border="1px solid #ddd";

logoInput.parentElement.appendChild(apercu);

}

apercu.src=evt.target.result;

};

lecteur.readAsDataURL(fichier);

});

}

// ==========================================
// RÉINITIALISER LE FORMULAIRE
// ==========================================

window.reinitialiserParametres=function(){

if(confirm("Réinitialiser tous les champs ?")){

form.reset();

const apercu=document.getElementById("logoPreview");

if(apercu){

apercu.remove();

}

}

}

// ==========================================
// INFORMATIONS DU CABINET
// ==========================================

window.getCabinetInfo=async function(){

const snap=await getDoc(

doc(db,"configuration","cabinet")

);

if(!snap.exists()) return null;

return snap.data();

}

// ==========================================
// CHARGEMENT AUTOMATIQUE
// ==========================================

document.addEventListener("DOMContentLoaded",()=>{

chargerParametres();

});

// ==========================================
// FIN PARAMETRES.JS
// NET SOURIRE V2.0
// ==========================================