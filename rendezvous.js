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

const pageContent=document.getElementById("pageContent");

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

const zone=document.getElementById("listeRendezVous");

if(!zone) return;

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

<tbody id="rendezVousTable">

</tbody>

</table>

`;

const tbody=document.getElementById("rendezVousTable");

const q=query(

collection(db,"rendezvous"),

orderBy("dateCreation","desc")

);

const snapshot=await getDocs(q);

tbody.innerHTML="";

snapshot.forEach((rdv)=>{

const data=rdv.data();

tbody.innerHTML+=`

<tr>

<td>${data.nom || ""}</td>

<td>${data.telephone || ""}</td>

<td>${data.date || ""}</td>

<td>${data.heure || ""}</td>

<td>${data.motif || ""}</td>

<td>

<span class="badge badge-primary">

${data.statut || "En attente"}

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

});

if(snapshot.empty){

tbody.innerHTML=`

<tr>

<td colspan="7" style="text-align:center;padding:30px;">

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

const table=document.getElementById("rendezVousTable");

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

if(e.target.id==="btnNouveauRdv"){

ouvrirFormulaireRendezVous();

}

});

function ouvrirFormulaireRendezVous(){

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

📅 Nouveau Rendez-vous

</h2>

</div>

<form id="rdvForm">

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
.getElementById("rdvForm")
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

await addDoc(

collection(db,"rendezvous"),

{

nom:nom.value,

telephone:telephone.value,

email:email.value,

date:date.value,

heure:heure.value,

motif:motif.value,

statut:"En attente",

dateCreation:serverTimestamp()

}

);

alert("✅ Rendez-vous enregistré.");

ouvrirModuleRendezVous();

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

<td>${data.nom}</td>

<td>${data.date}</td>

<td>${data.heure}</td>

<td>

<span class="badge badge-primary">

${data.statut}

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

const table=document.getElementById("rendezVousTable");

if(table){

chargerRendezVous();

}

verifierNouveauxRendezVous();

compteurRendezVous();

}

// ==========================================
// FIN PARTIE 5
// ==========================================
);
const calendrierBtn=document.getElementById("calendrierRdvBtn");

if(calendrierBtn){

calendrierBtn.addEventListener("click",(e)=>{

e.preventDefault();

afficherCalendrierRendezVous();

});

}
