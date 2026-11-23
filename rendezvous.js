// ==========================================
// NET SOURIRE
// rendezvous.js
// PARTIE 1
// ==========================================

import { db } from "./firebase.js";

import {
collection,
addDoc,
getDocs,
getDoc,
updateDoc,
deleteDoc,
doc,
query,
orderBy,
where,
serverTimestamp,
onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ==========================================
// VARIABLES (contexte détecté)
// ==========================================

// Mode dashboard : contenu dynamique dans #pageContent
// Mode standalone : table #rendezvousTable + modales fixes du HTML
const pageContent=document.getElementById("pageContent");
const estStandalone=!pageContent;

// Échappement anti-XSS
function escapeHtml(valeur){
return String(valeur ?? "")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#39;");
}

// ==========================================
// MENU RENDEZ-VOUS
// ==========================================

const rdvBtn=document.getElementById("rdvBtn");

if(rdvBtn){

rdvBtn.addEventListener("click",(e)=>{
e.preventDefault();

ouvrirModuleRendezVous();

});

}

// ==========================================
// OUVRIR MODULE
// ==========================================

export async function ouvrirModuleRendezVous(){

if(estStandalone){

// Page rendezvous.html : la table existe déjà, on ne fait que la charger
chargerRendezVous();

return;

}

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<button
id="btnNouveauRdv"
class="btn-primary">

+ Nouveau Rendez-vous

</button>

<h2>

📅 Gestion des Rendez-vous

</h2>

</div>

<div id="listeRendezVous">

<div class="loader"></div>

</div>

</section>

`;

chargerRendezVous();

}

// ==========================================
// FIN PARTIE 1
// ==========================================
// ==========================================
// CHARGER LES RENDEZ-VOUS
// ==========================================

async function chargerRendezVous(){

const tbody=document.getElementById("rendezvousTable");

if(!tbody) return;

// En mode dashboard, le gabarit est créé dynamiquement dans #listeRendezVous
if(!estStandalone){

const zone=document.getElementById("listeRendezVous");

if(zone){

zone.innerHTML=`

<table class="table">

<thead>

<tr>

<th>Patient</th>

<th>Téléphone</th>

<th>Date</th>

<th>Heure</th>

<th>Motif</th>

<th>Statut</th>

<th>Actions</th>

</tr>

</thead>

<tbody id="rendezvousTable">

</tbody>

</table>

`;

}

}


const q=query(
collection(db,"rendezvous"),
orderBy("dateCreation","desc")
);

const snapshot=await getDocs(q);

tbody.innerHTML="";

snapshot.forEach((rdv)=>{

const data=rdv.data();

if(estStandalone){

// Tableau standalone : N°, Patient, Téléphone, Date, Heure, Dentiste, Statut, Actions
tbody.innerHTML+=`

<tr>

<td>${snapshot.indexOf(rdv)+1}</td>

<td>${escapeHtml(data.patientNom || data.nom || "")}</td>

<td>${escapeHtml(data.telephone || "-")}</td>

<td>${escapeHtml(data.date || "")}</td>

<td>${escapeHtml(data.heure || "")}</td>

<td>${escapeHtml(data.dentiste || "-")}</td>

<td>

<span class="badge badge-primary">

${escapeHtml(data.statut || "En attente")}

</span>

</td>

<td>

<button
class="btn btn-success"
onclick="accepterRendezVous('${rdv.id}')">

✅

</button>

<button
class="btn btn-warning"
onclick="reporterRendezVous('${rdv.id}')">

📅

</button>

<button
class="btn btn-danger"
onclick="refuserRendezVous('${rdv.id}')">

❌

</button>

</td>

</tr>

`;

}else{

tbody.innerHTML+=`

<tr>

<td>${escapeHtml(data.patientNom || data.nom || "")}</td>

<td>${escapeHtml(data.telephone || "-")}</td>

<td>${escapeHtml(data.date || "")}</td>

<td>${escapeHtml(data.heure || "")}</td>

<td>${escapeHtml(data.motif || "")}</td>

<td>

<span class="badge badge-primary">

${escapeHtml(data.statut || "En attente")}

</span>

</td>

<td>

<button
class="btn btn-success"
onclick="accepterRendezVous('${rdv.id}')">

✅

</button>

<button
class="btn btn-warning"
onclick="reporterRendezVous('${rdv.id}')">

📅

</button>

<button
class="btn btn-danger"
onclick="refuserRendezVous('${rdv.id}')">

❌

</button>

</td>

</tr>

`;

}

});

if(snapshot.empty){

tbody.innerHTML=`

<tr>

<td colspan="${estStandalone?8:7}" style="text-align:center;padding:30px;">

Aucun rendez-vous enregistré.

</td>

</tr>

`;

}

}

// ==========================================
// SYNCHRONISATION TEMPS RÉEL
// ==========================================

onSnapshot(
collection(db,"rendezvous"),
()=>{

const table=document.getElementById("rendezvousTable");

if(table){

chargerRendezVous();

}

}

);

// ==========================================
// FIN PARTIE 2
// ==========================================
// ==========================================
// RENDEZVOUS.JS - PARTIE 3
// AJOUT D'UN RENDEZ-VOUS
// ==========================================

document.addEventListener("click",(e)=>{

if(e.target.id==="btnNouveauRdv" || e.target.id==="btnAjouterRdv"){

ouvrirFormulaireRendezVous();

}

});

function ouvrirFormulaireRendezVous(){

if(estStandalone){

// La page rendezvous.html possède déjà #rendezvousModal et #rendezvousForm
const modal=document.getElementById("rendezvousModal");

if(modal) modal.style.display="flex";

return;

}

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

📅 Nouveau Rendez-vous

</h2>

</div>

<form id="rdvFormDynamique">

<input
type="text"
id="nom"
placeholder="Nom du patient"
required>

<input
type="text"
id="telephone"
placeholder="Téléphone"
required>

<input
type="email"
id="email"
placeholder="Adresse e-mail">

<input
type="date"
id="date"
required>

<input
type="time"
id="heure"
required>

<textarea
id="motif"
placeholder="Motif de la consultation"></textarea>

<button
type="submit"
class="btn-primary">

Enregistrer

</button>

<button
type="button"
class="btn btn-warning"
id="retourListeRdv">

Retour

</button>

</form>

</section>

`;

document
.getElementById("rdvFormDynamique")
.addEventListener("submit",enregistrerRendezVous);

document
.getElementById("retourListeRdv")
.addEventListener("click",ouvrirModuleRendezVous);

}

// ==========================================
// ENREGISTRER
// ==========================================

async function enregistrerRendezVous(e){

e.preventDefault();

let patientNom="",telephone="",email="",date="",heure="",dentiste="",typeConsultation="",motif="",statut="En attente",observation="";

if(estStandalone){

// Champs de rendezvous.html
patientNom=document.getElementById("patientNom").value.trim();

telephone=document.getElementById("patientTelephone").value.trim();

date=document.getElementById("dateRdv").value;

heure=document.getElementById("heureRdv").value;

dentiste=document.getElementById("dentiste").value.trim();

typeConsultation=document.getElementById("typeConsultation").value;

motif=document.getElementById("motif").value.trim();

statut=document.getElementById("statut").value;

observation=document.getElementById("observation").value.trim();

email="";

}else{

patientNom=document.getElementById("nom").value.trim();

telephone=document.getElementById("telephone").value.trim();

email=document.getElementById("email").value.trim();

date=document.getElementById("date").value;

heure=document.getElementById("heure").value;

motif=document.getElementById("motif").value.trim();

}


// Si un patient existant correspond au nom/email, on lie le rendez-vous à son uid
let patientId="";

if(patientNom){

try{

const qPatients=query(
collection(db,"patients"),
where("nom","==",patientNom)
);

const snapPatients=await getDocs(qPatients);

if(!snapPatients.empty){

patientId=snapPatients.docs[0].id;

if(!email) email=snapPatients.docs[0].data().email||"";

}

}catch(error){

console.error(error);

}

}


await addDoc(

collection(db,"rendezvous"),

{

patientId:patientId,

patientNom:patientNom,

patientEmail:email,

telephone:telephone,

date:date,

heure:heure,

dentiste:dentiste,

typeConsultation:typeConsultation,

motif:motif,

statut:statut,

observation:observation,

dateCreation:serverTimestamp()

}

);

alert("✅ Rendez-vous enregistré.");

if(estStandalone){

fermerModalStandalone("rendezvousModal");

}

ouvrirModuleRendezVous();

}

// Ferme un modal en mode standalone
function fermerModalStandalone(id){

const modal=document.getElementById(id);

if(modal) modal.style.display="none";

}

// ==========================================
// FIN PARTIE 3
// ==========================================
// ==========================================
// RENDEZVOUS.JS - PARTIE 4
// ACCEPTER - REPORTER - REFUSER
// ==========================================

// ===============================
// ACCEPTER
// ===============================

window.accepterRendezVous = async function(id){

try{

await updateDoc(

doc(db,"rendezvous",id),

{

statut:"Accepté",

dateValidation:serverTimestamp()

}

);

alert("✅ Rendez-vous accepté.");

}catch(error){

console.error(error);

alert("Erreur lors de la validation.");

}

}

// ===============================
// REPORTER
// ===============================

window.reporterRendezVous = async function(id){

const nouvelleDate = prompt("Nouvelle date (AAAA-MM-JJ)");

if(!nouvelleDate) return;

const nouvelleHeure = prompt("Nouvelle heure (HH:MM)");

if(!nouvelleHeure) return;

try{

await updateDoc(

doc(db,"rendezvous",id),

{

date:nouvelleDate,

heure:nouvelleHeure,

statut:"Reporté"

}

);

alert("📅 Rendez-vous reporté.");

}catch(error){

console.error(error);

alert("Erreur lors du report.");

}

}

// ===============================
// REFUSER
// ===============================

window.refuserRendezVous = async function(id){

if(!confirm("Refuser ce rendez-vous ?"))

return;

try{

await updateDoc(

doc(db,"rendezvous",id),

{

statut:"Refusé"

}

);

alert("❌ Rendez-vous refusé.");

}catch(error){

console.error(error);

alert("Erreur lors du refus.");

}

}

// ==========================================
// COMPTEUR RENDEZ-VOUS
// ==========================================

async function compteurRendezVous(){

const snapshot = await getDocs(

collection(db,"rendezvous")

);

const total = document.getElementById("totalRendezVous");

if(total){

total.innerHTML = snapshot.size;

}

}

compteurRendezVous();

// ==========================================
// FIN PARTIE 4
// ==========================================
// ==========================================
// RENDEZVOUS.JS - PARTIE 5
// CALENDRIER & NOTIFICATIONS
// ==========================================

// ===============================
// CALENDRIER
// ===============================

window.afficherCalendrierRendezVous = async function(){

if(estStandalone){

// La page rendezvous.html a son propre calendrier
const tbody=document.getElementById("calendrierRdv");

if(!tbody) return;

}


pageContent.innerHTML = `

<section class="dashboard-box">

<div class="box-header">

<h2>📅 Calendrier des Rendez-vous</h2>

</div>

<table>

<thead>

<tr>

<th>Patient</th>

<th>Date</th>

<th>Heure</th>

<th>Statut</th>

</tr>

</thead>

<tbody id="calendrierRdv">

</tbody>

</table>

</section>

`;

const tbody=document.getElementById("calendrierRdv");

const snapshot=await getDocs(

query(
collection(db,"rendezvous"),
orderBy("dateCreation","desc")
)
);

tbody.innerHTML="";

snapshot.forEach((docu)=>{

const data=docu.data();

tbody.innerHTML+=`

<tr>

<td>${escapeHtml(data.patientNom || data.nom || "")}</td>

<td>${escapeHtml(data.date || "")}</td>

<td>${escapeHtml(data.heure || "")}</td>

<td>

<span class="badge badge-primary">

${escapeHtml(data.statut || "En attente")}

</span>

</td>

</tr>

`;

});

}

// ===============================
// NOTIFICATIONS
// ===============================

async function verifierNouveauxRendezVous(){

const snapshot=await getDocs(
collection(db,"rendezvous")
);

let attente=0;

snapshot.forEach((docu)=>{

const data=docu.data();

if(data.statut==="En attente"){

attente++;

}

});

const badge=document.getElementById("notificationCount");

if(badge){

badge.innerHTML=attente;

}

}

verifierNouveauxRendezVous();

// ===============================
// TEMPS RÉEL
// ===============================

onSnapshot(
collection(db,"rendezvous"),
()=>{

const table=document.getElementById("rendezvousTable");

if(table){

chargerRendezVous();

}

verifierNouveauxRendezVous();

compteurRendezVous();

}

);

// ==========================================
// FIN PARTIE 5
// ==========================================

const calendrierBtn=document.getElementById("calendrierRdvBtn");

if(calendrierBtn){

calendrierBtn.addEventListener("click",(e)=>{

e.preventDefault();

afficherCalendrierRendezVous();

});

}

// Fermetures de modales sur la page standalone rendezvous.html
if(estStandalone){

const croixRdv=document.getElementById("closeRdvModal");

if(croixRdv) croixRdv.addEventListener("click",()=>fermerModalStandalone("rendezvousModal"));


const annulerRdv=document.getElementById("annulerRdv");

if(annulerRdv) annulerRdv.addEventListener("click",()=>fermerModalStandalone("rendezvousModal"));


const croixDetails=document.getElementById("closeRendezvousDetails");

if(croixDetails) croixDetails.addEventListener("click",()=>fermerModalStandalone("rendezvousDetails"));


// Câblage du formulaire de la page standalone
const form=document.getElementById("rendezvousForm");

if(form) form.addEventListener("submit",enregistrerRendezVous);

}
