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

// ==========================================
// FONCTION D'ECLAPPEMENT ANTI-XSS
// ==========================================

function escapeHtml(valeur){

return String(valeur ?? "")

.replace(/&/g,"&amp;")

.replace(/</g,"&lt;")

.replace(/>/g,"&gt;")

.replace(/"/g,"&quot;")

.replace(/'/g,"&#39;");

}


const form=document.getElementById("rendezvousForm");

const table=document.getElementById("rendezvousTable");

const modal=document.getElementById("rendezvousModal");

const btnNouveau=document.getElementById("btnNouveauRdv");

const btnFermer=document.getElementById("closeModal");

const btnAnnuler=document.getElementById("annulerRendezvous");

let patient=null;

// Champs du formulaire
const champDate=document.getElementById("date");
const champHeure=document.getElementById("heure");
const champDentiste=document.getElementById("dentiste");
const champMotif=document.getElementById("motif");
const champType=document.getElementById("typeConsultation");

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

// Si on arrive avec ?id=... (depuis le dashboard), afficher les details
const params=new URLSearchParams(window.location.search);
const idParam=params.get("id");
if(idParam){

window.voirRendezVous(idParam);

}

});

// ==========================================
// MODAL
// ==========================================

btnNouveau?.addEventListener("click",()=>{

modal.classList.add("active");

});

btnFermer?.addEventListener("click",()=>{

modal.classList.remove("active");

});

btnAnnuler?.addEventListener("click",()=>{

modal.classList.remove("active");

});

window.addEventListener("click",(e)=>{

if(e.target===modal){

modal.classList.remove("active");

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

date:champDate.value,

heure:champHeure.value,

dentiste:champDentiste.value,

typeConsultation:champType.value,

motif:champMotif.value,

statut:"En attente",

dateCreation:serverTimestamp()

}

);

form.reset();

modal.classList.remove("active");

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

<td>${escapeHtml(rdv.date)}</td>

<td>${escapeHtml(rdv.heure)}</td>

<td>${escapeHtml(rdv.dentiste || "-")}</td>

<td>${escapeHtml(rdv.motif)}</td>

<td>

<span class="status ${escapeHtml(rdv.statut ? rdv.statut.toLowerCase().replace(/\s/g,'-') : "en-attente")}">

${escapeHtml(rdv.statut)}

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

<h3>${escapeHtml(rdv.typeConsultation)}</h3>

<hr>

<p><strong>📅 Date :</strong> ${escapeHtml(rdv.date)}</p>

<p><strong>🕒 Heure :</strong> ${escapeHtml(rdv.heure)}</p>

<p><strong>👨‍⚕️ Dentiste :</strong> ${escapeHtml(rdv.dentiste || "À définir")}</p>

<p><strong>📝 Motif :</strong> ${escapeHtml(rdv.motif)}</p>

<p><strong>📌 Statut :</strong>

<span class="status ${escapeHtml(rdv.statut ? rdv.statut.toLowerCase().replace(/\s/g,'-') : "en-attente")}">

${escapeHtml(rdv.statut)}

</span>

</p>

</div>

`;

document.getElementById("rendezvousDetails").classList.add("active");

};

// ==========================================
// FERMER DETAILS
// ==========================================

document.getElementById("closeDetails")?.addEventListener("click",()=>{

document.getElementById("rendezvousDetails").classList.remove("active");

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

details.classList.remove("active");

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