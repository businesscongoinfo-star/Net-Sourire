// ==========================================
// NET SOURIRE
// PARAMETRES.JS
// PARTIE 1
// ==========================================

import { db, storage } from "./firebase.js";

import {
doc,
setDoc,
getDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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

const champs = {

nomCabinet: document.getElementById("nomCabinet"),
responsable: document.getElementById("responsable"),
telephoneCabinet: document.getElementById("telephoneCabinet"),
emailCabinet: document.getElementById("emailCabinet"),
adresseCabinet: document.getElementById("adresseCabinet"),
villeCabinet: document.getElementById("villeCabinet"),
paysCabinet: document.getElementById("paysCabinet"),
devise: document.getElementById("devise"),
descriptionCabinet: document.getElementById("descriptionCabinet"),
horaires: document.getElementById("horaires"),
conditions: document.getElementById("conditions"),
logoCabinet: document.getElementById("logoCabinet")

};

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

if(champs.nomCabinet) champs.nomCabinet.value = data.nomCabinet || "";

if(champs.responsable) champs.responsable.value = data.responsable || "";

if(champs.telephoneCabinet) champs.telephoneCabinet.value = data.telephoneCabinet || "";

if(champs.emailCabinet) champs.emailCabinet.value = data.emailCabinet || "";

if(champs.adresseCabinet) champs.adresseCabinet.value = data.adresseCabinet || "";

if(champs.villeCabinet) champs.villeCabinet.value = data.villeCabinet || "";

if(champs.paysCabinet) champs.paysCabinet.value = data.paysCabinet || "";

if(champs.devise) champs.devise.value = data.devise || "FCFA";

if(champs.descriptionCabinet) champs.descriptionCabinet.value = data.descriptionCabinet || "";

if(champs.horaires) champs.horaires.value = data.horaires || "";

if(champs.conditions) champs.conditions.value = data.conditions || "";

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

if(form) form.requestSubmit();

});

}

async function enregistrerParametres(e){

e.preventDefault();

try{

btnSave.disabled=true;

btnSave.innerHTML="Enregistrement...";

let logoURL="";

const fichier=champs.logoCabinet && champs.logoCabinet.files[0];

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

nomCabinet:champs.nomCabinet?champs.nomCabinet.value:"",

responsable:champs.responsable?champs.responsable.value:"",

telephoneCabinet:champs.telephoneCabinet?champs.telephoneCabinet.value:"",

emailCabinet:champs.emailCabinet?champs.emailCabinet.value:"",

adresseCabinet:champs.adresseCabinet?champs.adresseCabinet.value:"",

villeCabinet:champs.villeCabinet?champs.villeCabinet.value:"",

paysCabinet:champs.paysCabinet?champs.paysCabinet.value:"",

devise:champs.devise?champs.devise.value:"FCFA",

descriptionCabinet:champs.descriptionCabinet?champs.descriptionCabinet.value:"",

horaires:champs.horaires?champs.horaires.value:"",

conditions:champs.conditions?champs.conditions.value:"",

logoURL:logoURL,

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

lecteur.onload=function(evt){\

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

if(form) form.reset();

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
