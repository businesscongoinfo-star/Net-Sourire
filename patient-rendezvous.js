// ==========================================
// NET SOURIRE
// PATIENT-RENDEZVOUS.JS
// PARTIE 1
// ==========================================

import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {

collection,
addDoc,
query,
where,
orderBy,
onSnapshot,
serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ==========================================
// VARIABLES
// ==========================================

const form=document.getElementById("rendezvousForm");

const table=document.getElementById("rendezvousTable");

const modal=document.getElementById("rendezvousModal");

const btnNouveau=document.getElementById("btnNouveauRdv");

const btnFermer=document.getElementById("closeModal");

const btnAnnuler=document.getElementById("annulerRendezvous");

let patient=null;

// ==========================================
// AUTHENTIFICATION
// ==========================================

onAuthStateChanged(auth,(user)=>{

if(!user){

window.location.href="patient-login.html";

return;

}

patient=user;

chargerRendezVous();

});

// ==========================================
// MODAL
// ==========================================

btnNouveau?.addEventListener("click",()=>{

modal.style.display="flex";

});

btnFermer?.addEventListener("click",()=>{

modal.style.display="none";

});

btnAnnuler?.addEventListener("click",()=>{

modal.style.display="none";

});

window.addEventListener("click",(e)=>{

if(e.target===modal){

modal.style.display="none";

}

});

// ==========================================
// ENREGISTRER RENDEZ-VOUS
// ==========================================

form?.addEventListener("submit",enregistrerRendezVous);

async function enregistrerRendezVous(e){

e.preventDefault();

const btn=form.querySelector("button[type='submit']");

btn.disabled=true;

btn.innerHTML="Enregistrement...";

try{

await addDoc(

collection(db,"rendezvous"),

{

patientId:patient.uid,

patientNom:patient.displayName || "",

patientEmail:patient.email,

date:date.value,

heure:heure.value,

dentiste:dentiste.value,

typeConsultation:typeConsultation.value,

motif:motif.value,

statut:"En attente",

dateCreation:serverTimestamp()

}

);

form.reset();

modal.style.display="none";

alert("✅ Votre demande de rendez-vous a été envoyée.");

}catch(error){

console.error(error);

alert(error.message);

}

btn.disabled=false;

btn.innerHTML=`

<i class="fa-solid fa-paper-plane"></i>

Envoyer la demande

`;

}

// ==========================================
// FIN PARTIE 1
// ==========================================
// ==========================================
// NET SOURIRE
// PATIENT-RENDEZVOUS.JS
// PARTIE 2
// ==========================================

// ==========================================
// CHARGER LES RENDEZ-VOUS
// ==========================================

function chargerRendezVous(){

const q=query(

collection(db,"rendezvous"),

where("patientId","==",patient.uid),

orderBy("dateCreation","desc")

);

onSnapshot(q,(snapshot)=>{

table.innerHTML="";

if(snapshot.empty){

table.innerHTML=`

<tr>

<td colspan="6" style="text-align:center">

Aucun rendez-vous trouvé.

</td>

</tr>

`;

return;

}

snapshot.forEach((docu)=>{

const rdv=docu.data();

table.innerHTML+=`

<tr>

<td>${rdv.date}</td>

<td>${rdv.heure}</td>

<td>${rdv.dentiste || "-"}</td>

<td>${rdv.motif}</td>

<td>

<span class="status ${rdv.statut.toLowerCase().replace(/\s/g,'-')}">

${rdv.statut}

</span>

</td>

<td>

<button

class="btn-primary"

onclick="voirRendezVous('${docu.id}')">

Voir

</button>

<button

class="btn-secondary"

onclick="annulerRendezVous('${docu.id}')">

Annuler

</button>

</td>

</tr>

`;

});

});

}

// ==========================================
// FIN PARTIE 2
// ==========================================
// ==========================================
// NET SOURIRE
// PATIENT-RENDEZVOUS.JS
// PARTIE 3
// ==========================================

import {

doc,
getDoc,
updateDoc

} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ==========================================
// VOIR RENDEZ-VOUS
// ==========================================

window.voirRendezVous = async function(id){

const snap = await getDoc(

doc(db,"rendezvous",id)

);

if(!snap.exists()){

alert("Rendez-vous introuvable.");

return;

}

const rdv = snap.data();

const info = document.getElementById("rendezvousInfo");

info.innerHTML = `

<div class="details-card">

<h3>${rdv.typeConsultation}</h3>

<hr>

<p><strong>📅 Date :</strong> ${rdv.date}</p>

<p><strong>🕒 Heure :</strong> ${rdv.heure}</p>

<p><strong>👨‍⚕️ Dentiste :</strong> ${rdv.dentiste || "À définir"}</p>

<p><strong>📝 Motif :</strong> ${rdv.motif}</p>

<p><strong>📌 Statut :</strong>

<span class="status ${rdv.statut.toLowerCase().replace(/\s/g,'-')}">

${rdv.statut}

</span>

</p>

</div>

`;

document.getElementById("rendezvousDetails").style.display="flex";

};

// ==========================================
// FERMER DETAILS
// ==========================================

document.getElementById("closeDetails")?.addEventListener("click",()=>{

document.getElementById("rendezvousDetails").style.display="none";

});

// ==========================================
// ANNULER RENDEZ-VOUS
// ==========================================

window.annulerRendezVous = async function(id){

const confirmation = confirm(

"Voulez-vous vraiment annuler ce rendez-vous ?"

);

if(!confirmation) return;

await updateDoc(

doc(db,"rendezvous",id),

{

statut:"Annulé"

}

);

alert("✅ Rendez-vous annulé.");

};

// ==========================================
// FIN PARTIE 3
// ==========================================
// ==========================================
// NET SOURIRE
// PATIENT-RENDEZVOUS.JS
// PARTIE 4
// ==========================================

// ==========================================
// RECHERCHE
// ==========================================

const recherche=document.getElementById("rechercheRdv");

recherche?.addEventListener("input",(e)=>{

const texte=e.target.value.toLowerCase();

document.querySelectorAll("#rendezvousTable tr").forEach((ligne)=>{

ligne.style.display=

ligne.innerText.toLowerCase().includes(texte)

? ""

: "none";

});

});

// ==========================================
// FERMETURE DES MODALES
// ==========================================

window.addEventListener("click",(e)=>{

const details=document.getElementById("rendezvousDetails");

if(e.target===details){

details.style.display="none";

}

});

// ==========================================
// RAFRAÎCHISSEMENT AUTOMATIQUE
// ==========================================

document.addEventListener("visibilitychange",()=>{

if(document.visibilityState==="visible" && patient){

chargerRendezVous();

}

});

// ==========================================
// FORMAT DATE
// ==========================================

window.formaterDate=function(date){

if(!date) return "-";

const d=new Date(date);

return d.toLocaleDateString("fr-FR",{

day:"2-digit",

month:"long",

year:"numeric"

});

};

// ==========================================
// FORMAT HEURE
// ==========================================

window.formaterHeure=function(heure){

if(!heure) return "-";

return heure;

};

// ==========================================
// MESSAGE SI AUCUN RENDEZ-VOUS
// ==========================================

window.afficherAucunRendezVous=function(){

table.innerHTML=`

<tr>

<td colspan="6" style="text-align:center;padding:40px;">

📅 Aucun rendez-vous disponible.

</td>

</tr>

`;

};

// ==========================================
// FIN PATIENT-RENDEZVOUS.JS
// NET SOURIRE V2.0
// ==========================================