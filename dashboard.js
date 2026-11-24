// ==========================================
// DASHBOARD.JS - PARTIE 1
// NET SOURIRE
// ==========================================

import { db, auth, storage } from "./firebase.js";

import {
collection,
addDoc,
getDocs,
getDoc,
updateDoc,
deleteDoc,
setDoc,
doc,
query,
where,
orderBy,
serverTimestamp,
onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
ref,
uploadBytes,
getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// ===============================
// VARIABLES
// ===============================

const pageContent = document.getElementById("pageContent");

const totalPatients = document.getElementById("totalPatients");
const totalRendezVous = document.getElementById("totalRendezVous");
const totalOrdonnances = document.getElementById("totalOrdonnances");
const totalFactures = document.getElementById("totalFactures");
const totalRecettes = document.getElementById("totalRecettes");

// ===============================
// UTILITAIRES
// ===============================

// Échappe les données venant de Firestore avant injection HTML (anti-XSS)
function escapeHtml(valeur){
return String(valeur ?? "")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#39;");
}

// Récupère la date d'un document (dateCreation prioritaire, sinon date texte)
function getDateDocument(data){
if(data.dateCreation && typeof data.dateCreation.toDate === "function"){
return data.dateCreation.toDate();
}
if(data.date){
const parties = String(data.date).split("/");
if(parties.length === 3){
return new Date(Number(parties[2]), Number(parties[1]) - 1, Number(parties[0]));
}
const d = new Date(data.date);
if(!isNaN(d)) return d;
}
return null;
}

function memeJour(a,b){
return a.getFullYear() === b.getFullYear()
&& a.getMonth() === b.getMonth()
&& a.getDate() === b.getDate();
}

function memeSemaine(a,b){
const debut = new Date(b);
debut.setDate(b.getDate() - ((b.getDay() + 6) % 7));
debut.setHours(0,0,0,0);
const fin = new Date(debut);
fin.setDate(debut.getDate() + 6);
fin.setHours(23,59,59,999);
return a >= debut && a <= fin;
}

function memeMois(a,b){
return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

// ===============================
// TABLEAU DE BORD
// ===============================

async function chargerDashboard(){

chargerStatistiques();

chargerPatientsDashboard();

chargerRendezVousDashboard();

chargerSectionsAccueil();

}

// ===============================
// SECTIONS DU DASHBOARD (ACCUEIL)
// ===============================

// Compte les rendez-vous en attente (notification)
async function chargerNotifications(){

try{

const snapshot=await getDocs(collection(db,"rendezvous"));

let attente=0;

snapshot.forEach((docu)=>{

const data=docu.data();

if(data.statut==="En attente"){

attente++;

}

});

const badge=document.getElementById("notificationCount");

if(badge){

badge.textContent=attente;

}

}catch(error){

console.error(error);

}

}

// Nouveaux patients du mois en cours
async function chargerNouveauxPatients(){

try{

const maintenant=new Date();

const snapshot=await getDocs(collection(db,"patients"));

let total=0;

snapshot.forEach((docu)=>{

const data=docu.data();

const dateDoc=getDateDocument(data);

if(dateDoc && dateDoc.getFullYear()===maintenant.getFullYear()

&& dateDoc.getMonth()===maintenant.getMonth()){

total++;

}

});

const zone=document.getElementById("nouveauxPatients");

if(zone){

zone.textContent=total;

}

}catch(error){

console.error(error);

}

}

// Activités récentes (patients, rendez-vous, factures)
async function chargerActivites(){

const zone=document.getElementById("activityList");

if(!zone) return;


let lignes=[];


try{

const rdv=await getDocs(collection(db,"rendezvous"));

rdv.forEach((docu)=>{

const data=docu.data();

if(data.dateCreation && typeof data.dateCreation.toDate==="function"){

lignes.push({

date:data.dateCreation.toDate(),

texte:"Rendez-vous : "+(data.patientNom||data.nom||"")

});

}

});

}catch(error){}


try{

const factures=await getDocs(collection(db,"factures"));

factures.forEach((docu)=>{

const data=docu.data();

if(data.dateCreation && typeof data.dateCreation.toDate==="function"){

lignes.push({

date:data.dateCreation.toDate(),

texte:"Facture : "+(data.patient||"")

});

}

});

}catch(error){}


try{

const patients=await getDocs(collection(db,"patients"));

patients.forEach((docu)=>{

const data=docu.data();

if(data.dateCreation && typeof data.dateCreation.toDate==="function"){

lignes.push({

date:data.dateCreation.toDate(),

texte:"Patient : "+(data.nom||"")

});

}

});

}catch(error){}


lignes.sort((a,b)=>b.date-a.date);

lignes=lignes.slice(0,6);


if(lignes.length===0){

zone.innerHTML="<p>Aucune activité pour le moment.</p>";

return;

}


zone.innerHTML="";

lignes.forEach((ligne)=>{

zone.innerHTML+=`

<div class="activity-item">

<div class="activity-left">

<i class="fa-solid fa-circle-dot"></i>

<div>

<h4>${escapeHtml(ligne.texte)}</h4>

<small>${ligne.date.toLocaleDateString()}</small>

</div>

</div>

</div>

`;

});

}

// Mini calendrier (rendez-vous du mois)
async function chargerMiniCalendrier(){

const zone=document.getElementById("calendar");

if(!zone) return;


try{

const maintenant=new Date();

const snapshot=await getDocs(collection(db,"rendezvous"));

const parJour={};

snapshot.forEach((docu)=>{

const data=docu.data();

if(!data.date) return;

if(!parJour[data.date]) parJour[data.date]=0;

parJour[data.date]++;

});


const debutMois=new Date(maintenant.getFullYear(),maintenant.getMonth(),1);

const joursMois=new Date(maintenant.getFullYear(),maintenant.getMonth()+1,0).getDate();


let html=`

<div class="mini-calendar">

<div class="mini-calendar-header">

<strong>${debutMois.toLocaleDateString(undefined,{month:"long",year:"numeric"})}</strong>

</div>

<div class="mini-calendar-grid">

`;


for(let i=0;i<debutMois.getDay();i++){

html+="<div class=\"mini-day empty\"></div>";

}


for(let jour=1;jour<=joursMois;jour++){

const dateStr=`${maintenant.getFullYear()}-${String(maintenant.getMonth()+1).padStart(2,"0")}-${String(jour).padStart(2,"0")}`;

const compte=parJour[dateStr]||0;

html+=`<div class="mini-day">${jour}${compte>0?`<span class="mini-badge">${compte}</span>`:""}</div>`;

}


html+=`

</div>

</div>

`;

zone.innerHTML=html;

}catch(error){

console.error(error);

}

}

// Notifications du tableau de bord
async function chargerNotificationsList(){

const zone=document.getElementById("notificationsList");

if(!zone) return;


try{

const snapshot=await getDocs(collection(db,"rendezvous"));

const rdv=snapshot.docs

.map((docu)=>({id:docu.id,data:docu.data()}))

.filter((item)=>item.data.statut==="En attente")

.sort((a,b)=>String(b.data.date||"").localeCompare(String(a.data.date||"")))

.slice(0,5);


if(rdv.length===0){

zone.innerHTML="<li>Aucune notification pour le moment.</li>";

return;

}


zone.innerHTML="";

rdv.forEach((item)=>{

const data=item.data;

zone.innerHTML+=`

<li>

Rendez-vous en attente — ${escapeHtml(data.patientNom||data.nom||"")} (${escapeHtml(data.date||"")})

</li>

`;

});

}catch(error){

console.error(error);

}

}

// Charge toutes les sections de l'accueil
async function chargerSectionsAccueil(){

chargerNotifications();

chargerNouveauxPatients();

chargerActivites();

chargerMiniCalendrier();

chargerNotificationsList();

}

chargerDashboard();

// ===============================
// PATIENTS RÉCENTS (ACCUEIL DASHBOARD)
// ===============================

async function chargerPatientsDashboard(){

const tbody = document.getElementById("patientsRecentsTable");

if(!tbody) return;

tbody.innerHTML = "";

const q = query(
collection(db,"patients"),
orderBy("dateCreation","desc")
);

const snapshot = await getDocs(q);

let compteur = 0;

snapshot.forEach((patient)=>{

if(compteur >= 5) return;

compteur++;

const data = patient.data();

tbody.innerHTML += `

<tr>

<td>${escapeHtml(data.nom || "")}</td>

<td>${escapeHtml(data.telephone || "—")}</td>

<td>${escapeHtml(data.dateCreation && typeof data.dateCreation.toDate === "function" ? data.dateCreation.toDate().toLocaleDateString() : "—")}</td>

<td>

<button
class="btn btn-success"
onclick="ouvrirDossierPatient('${patient.id}')">
Dossier
</button>

</td>

</tr>

`;

});

}

// ===============================
// RENDEZ-VOUS DU JOUR (ACCUEIL DASHBOARD)
// ===============================

async function chargerRendezVousDashboard(){

const tbody = document.getElementById("tableRendezVous");

if(!tbody) return;

tbody.innerHTML = "";

const aujourdhui = new Date().toISOString().split("T")[0];

const q = query(
collection(db,"rendezvous"),
orderBy("dateCreation","desc")
);

const snapshot = await getDocs(q);

let compteur = 0;

snapshot.forEach((rdv)=>{

if(compteur >= 10) return;

const data = rdv.data();

// Ne garder que les rendez-vous du jour (date au format AAAA-MM-JJ)
if(data.date && data.date !== aujourdhui) return;

compteur++;

tbody.innerHTML += `

<tr>

<td>${escapeHtml(data.patientNom || data.nom || "")}</td>

<td>${escapeHtml(data.telephone || data.patientEmail || "—")}</td>

<td>${escapeHtml(data.date || "")}</td>

<td>${escapeHtml(data.heure || "")}</td>

<td>

<span class="badge badge-primary">

${escapeHtml(data.statut || "En attente")}

</span>

</td>

<td>

<button
class="btn btn-success"
onclick="accepterRdv('${rdv.id}')">
Accepter
</button>

<button
class="btn btn-danger"
onclick="refuserRdv('${rdv.id}')">
Refuser
</button>

</td>

</tr>

`;

});

}

// ===============================
// STATISTIQUES
// ===============================

async function chargerStatistiques(){

const patients = await getDocs(collection(db,"patients"));

const rdv = await getDocs(collection(db,"rendezvous"));

const ordonnances = await getDocs(collection(db,"ordonnances"));

const factures = await getDocs(collection(db,"factures"));

if(totalPatients)
totalPatients.innerHTML = patients.size;

if(totalRendezVous)
totalRendezVous.innerHTML = rdv.size;

if(totalOrdonnances)
totalOrdonnances.innerHTML = ordonnances.size;

if(totalFactures)
totalFactures.innerHTML = factures.size;

calculerRecettes();

}

// ===============================
// RECETTES
// ===============================

async function calculerRecettes(){

const snapshot = await getDocs(collection(db,"factures"));

let total = 0;

let jour = 0;

let semaine = 0;

let mois = 0;

let annee = 0;

const maintenant = new Date();

snapshot.forEach(docu=>{

const data = docu.data();

const montant = Number(data.montant || 0);

total += montant;

const dateDoc = getDateDocument(data);

if(!dateDoc) return;

if(memeJour(dateDoc, maintenant)) jour += montant;

if(memeSemaine(dateDoc, maintenant)) semaine += montant;

if(memeMois(dateDoc, maintenant)) mois += montant;

if(dateDoc.getFullYear() === maintenant.getFullYear()) annee += montant;

});

if(totalRecettes){

totalRecettes.innerHTML =
total.toLocaleString()+" FCFA";

}

const remplir = (id, valeur)=>{

const el = document.getElementById(id);

if(el) el.innerHTML = valeur.toLocaleString()+" FCFA";

};

remplir("todayIncome", jour);

remplir("weekIncome", semaine);

remplir("monthIncome", mois);

remplir("yearIncome", annee);

}

// ===============================
// HIGLIGHT DU MENU ACTIEF
// ===============================
function activerMenu(idBouton){
const boutons=document.querySelectorAll(".sidebar ul li");
boutons.forEach((li)=>{
const a=li.querySelector("a");
if(a && a.id===idBouton){
li.classList.add("active");
}else{
li.classList.remove("active");
}
});
}

window.activerMenu=activerMenu;

// ===============================
// MENU DASHBOARD
// ===============================

document.getElementById("dashboardBtn")
.addEventListener("click",(e)=>{

e.preventDefault();

location.reload();

});
// ==========================================
// DASHBOARD.JS - PARTIE 2
// MODULE PATIENTS
// ==========================================

// MENU PATIENTS

document.getElementById("patientsBtn").addEventListener("click", (e) => {

e.preventDefault();

afficherPatients();

});

// ===============================
// AFFICHER LES PATIENTS
// ===============================

async function afficherPatients(){

activerMenu("patientsBtn");

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

Gestion des Patients

</h2>

<button
class="btn-primary"
id="btnAjouterPatient">

+ Nouveau Patient

</button>

</div>

<div class="search-box">

<i class="fa-solid fa-search"></i>

<input
type="text"
id="recherchePatient"
placeholder="Rechercher un patient...">

</div>

<table>

<thead>

<tr>

<th>Nom</th>

<th>Téléphone</th>

<th>Email</th>

<th>Sexe</th>

<th>Actions</th>

</tr>

</thead>

<tbody id="patientsTable">

</tbody>

</table>

</section>

`;

chargerPatients();

}

// Exposé globalement : utilisé par les boutons onclick des gabarits
window.afficherPatients = afficherPatients;

// ===============================
// CHARGER LES PATIENTS
// ===============================

async function chargerPatients(){

const tbody=document.getElementById("patientsTable");

if(!tbody) return;

tbody.innerHTML="";

const q=query(

collection(db,"patients"),

orderBy("dateCreation","desc")

);

const snapshot=await getDocs(q);

snapshot.forEach((patient)=>{

const data=patient.data();

tbody.innerHTML+=`

<tr>

<td>${escapeHtml(data.nom || "")}</td>

<td>${escapeHtml(data.telephone || "")}</td>

<td>${escapeHtml(data.email || "")}</td>

<td>${escapeHtml(data.sexe || "")}</td>

<td>

<button
class="btn btn-success"
onclick="ouvrirDossierPatient('${patient.id}')">

Dossier

</button>

<button
class="btn btn-warning"
onclick="modifierPatient('${patient.id}')">

Modifier

</button>

<button
class="btn btn-danger"
onclick="supprimerPatient('${patient.id}')">

Supprimer

</button>

</td>

</tr>

`;

});

}

// ===============================
// RECHERCHE
// ===============================

window.addEventListener("input",(e)=>{

if(e.target.id!="recherchePatient") return;

const texte=e.target.value.toLowerCase();

document.querySelectorAll("#patientsTable tr")

.forEach((ligne)=>{

ligne.style.display=

ligne.innerText.toLowerCase().includes(texte)

? ""

: "none";

});

});
// ==========================================
// DASHBOARD.JS - PARTIE 3
// AJOUT / MODIFICATION / SUPPRESSION
// ==========================================

// ===============================
// AJOUTER PATIENT
// ===============================

window.ajouterPatient = async function(data){

    await addDoc(collection(db,"patients"),{

        nom:data.nom,

        telephone:data.telephone,

        email:data.email,

        sexe:data.sexe,

        adresse:data.adresse,

        naissance:data.naissance,

        dateCreation:serverTimestamp()

    });

    chargerPatients();

    chargerStatistiques();

}

// ===============================
// VOIR PATIENT
// ===============================

window.voirPatient = async function(id){

    const ref = doc(db,"patients",id);

    const patient = await getDoc(ref);

    if(!patient.exists()) return;

    const p = patient.data();

    pageContent.innerHTML = `

<section class="dashboard-box">

<h2>Dossier Patient</h2>

<br>

<p><b>Nom :</b> ${escapeHtml(p.nom)}</p>

<p><b>Téléphone :</b> ${escapeHtml(p.telephone)}</p>

<p><b>Email :</b> ${escapeHtml(p.email)}</p>

<p><b>Sexe :</b> ${escapeHtml(p.sexe)}</p>

<p><b>Adresse :</b> ${escapeHtml(p.adresse)}</p>

<p><b>Date de naissance :</b> ${escapeHtml(p.naissance || p.dateNaissance)}</p>

<br>

<button
class="btn btn-primary"
onclick="afficherPatients()">
Retour
</button>

<button
class="btn btn-primary"
onclick="nouveauTraitement('${id}')">
➕ Ajouter un traitement
</button>

<button
class="btn btn-info"
onclick="ajouterRadiographie('${id}')">
📷 Ajouter une radiographie
</button>

<div id="listeRadiographies"></div>

</section>

`;

}

// ===============================
// MODIFIER PATIENT
// ===============================

window.modifierPatient = async function(id){

    const ref = doc(db,"patients",id);

    const patient = await getDoc(ref);

    if(!patient.exists()) return;

    const p = patient.data();

    const nom = prompt("Nom",p.nom);

    if(nom===null) return;

    const telephone = prompt("Téléphone",p.telephone);

    const email = prompt("Email",p.email);

    await updateDoc(ref,{

        nom,

        telephone,

        email

    });

    chargerPatients();

}

// ===============================
// SUPPRIMER PATIENT
// ===============================

window.supprimerPatient = async function(id){

    if(!confirm("Supprimer ce patient ?"))

    return;

    await deleteDoc(doc(db,"patients",id));

    chargerPatients();

    chargerStatistiques();

}

// ===============================
// TEMPS RÉEL FIREBASE
// ===============================

onSnapshot(

collection(db,"patients"),

()=>{

    chargerPatients();

    chargerStatistiques();

}

);
// ==========================================
// DASHBOARD.JS - PARTIE 4
// MODULE RENDEZ-VOUS
// ==========================================

// MENU RENDEZ-VOUS

document.getElementById("rdvBtn").addEventListener("click",(e)=>{

e.preventDefault();

afficherRendezVous();

});

// ===============================
// AFFICHER LES RENDEZ-VOUS
// ===============================

async function afficherRendezVous(){

activerMenu("rdvBtn");

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

Gestion des Rendez-vous

</h2>

</div>

<table>

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

<tbody id="rdvTable">

</tbody>

</table>

</section>

`;

chargerRendezVous();

}

// ===============================
// CHARGER RENDEZ-VOUS
// ===============================

async function chargerRendezVous(){

const tbody=document.getElementById("rdvTable");

if(!tbody) return;

tbody.innerHTML="";

const q=query(

collection(db,"rendezvous"),

orderBy("dateCreation","desc")

);

const snapshot=await getDocs(q);

snapshot.forEach((rdv)=>{

const data=rdv.data();

tbody.innerHTML+=`

<tr>

<td>${escapeHtml(data.patientNom || data.nom || "")}</td>

<td>${escapeHtml(data.telephone || data.patientEmail || "—")}</td>

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
onclick="accepterRdv('${rdv.id}')">

Accepter

</button>

<button
class="btn btn-warning"
onclick="reporterRdv('${rdv.id}')">

Reporter

</button>

<button
class="btn btn-danger"
onclick="refuserRdv('${rdv.id}')">

Refuser

</button>

</td>

</tr>

`;

});

}

// ===============================
// ACCEPTER
// ===============================

window.accepterRdv=async(id)=>{

await updateDoc(

doc(db,"rendezvous",id),

{

statut:"Accepté"

}

);

chargerRendezVous();

chargerStatistiques();

}

// ===============================
// REPORTER
// ===============================

window.reporterRdv=async(id)=>{

await updateDoc(

doc(db,"rendezvous",id),

{

statut:"Reporté"

}

);

chargerRendezVous();

}

// ===============================
// REFUSER
// ===============================

window.refuserRdv=async(id)=>{

await updateDoc(

doc(db,"rendezvous",id),

{

statut:"Refusé"

}

);

chargerRendezVous();

}

// ===============================
// MODALES (PATIENT / RENDEZ-VOUS / ORDONNANCE / FACTURE)
// ===============================

let rdvEnCoursId = null;

// Ouvre un modal
function ouvrirModal(id){

const modal = document.getElementById(id);

if(modal) modal.classList.add("active");

}

// Ferme un modal
function fermerModal(id){

const modal = document.getElementById(id);

if(modal) modal.classList.remove("active");

}

// Fermeture générique via la croix de chaque modal
document.querySelectorAll(".closeModal").forEach((bouton)=>{

bouton.addEventListener("click",(e)=>{

const modal = e.target.closest(".modal");

if(modal) modal.classList.remove("active");

});

});

// --- Modal Nouveau Patient ---

const boutonAjouterPatient = document.getElementById("addPatient");

if(boutonAjouterPatient){

boutonAjouterPatient.addEventListener("click",()=>{

ouvrirModal("patientModal");

});

}

// Le bouton du gabarit Patients (créé dynamiquement) utilise window.btnAjouterPatient
window.btnAjouterPatient=function(){

ouvrirModal("patientModal");

};

document.getElementById("patientForm").addEventListener("submit",async(e)=>{

e.preventDefault();

const nom = document.getElementById("nomPatient").value.trim();

const telephone = document.getElementById("telephonePatient").value.trim();

const email = document.getElementById("emailPatient").value.trim();

const naissance = document.getElementById("dateNaissance").value;

const adresse = document.getElementById("adressePatient").value.trim();


await addDoc(collection(db,"patients"),{

nom:nom,
telephone:telephone,
email:email,
naissance:naissance,
adresse:adresse,
dateCreation:serverTimestamp()

});

fermerModal("patientModal");

document.getElementById("patientForm").reset();

chargerPatients();

chargerStatistiques();

});

// --- Modal Ordonnance (pré-rempli depuis le dossier patient) ---

window.nouvelleOrdonnance=function(patientId,patientNom){

const modal=document.getElementById("ordonnanceModal");

if(!modal) return;

document.getElementById("ordPatientNom").value=patientNom||"";

document.getElementById("ordDate").value=new Date().toISOString().split("T")[0];

modal.classList.add("active");

};

// --- Modal Facture (pré-rempli depuis le dossier patient) ---

window.nouvelleFacture=function(patientId,patientNom){

const modal=document.getElementById("factureModal");

if(!modal) return;

document.getElementById("factPatientNom").value=patientNom||"";

document.getElementById("factDate").value=new Date().toISOString().split("T")[0];

modal.classList.add("active");

};

// --- Modal Rendez-vous (réponse admin) ---

window.ouvrirRdvModal=function(id){

rdvEnCoursId = id;

const modal = document.getElementById("rdvModal");

if(!modal) return;

const inputDate = document.getElementById("nouvelleDate");

const inputHeure = document.getElementById("nouvelleHeure");

const inputMotif = document.getElementById("motifReport");

if(inputDate) inputDate.value = "";

if(inputHeure) inputHeure.value = "";

if(inputMotif) inputMotif.value = "";

modal.classList.add("active");

};

// Boutons de réponse du modal RDV

const btnAccepter = document.getElementById("btnAccepter");

if(btnAccepter) btnAccepter.addEventListener("click",async()=>{

if(!rdvEnCoursId) return;

await updateDoc(doc(db,"rendezvous",rdvEnCoursId),{statut:"Accepté"});

fermerModal("rdvModal");

rdvEnCoursId = null;

chargerRendezVous();

chargerStatistiques();

});

const btnReporter = document.getElementById("btnReporter");

if(btnReporter) btnReporter.addEventListener("click",async()=>{

if(!rdvEnCoursId) return;

const motif = document.getElementById("motifReport").value.trim();

await updateDoc(doc(db,"rendezvous",rdvEnCoursId),{

statut:"Reporté",
motif:motif

});

fermerModal("rdvModal");

rdvEnCoursId = null;

chargerRendezVous();

});

const btnRefuser = document.getElementById("btnRefuser");

if(btnRefuser) btnRefuser.addEventListener("click",async()=>{

if(!rdvEnCoursId) return;

const motif = document.getElementById("motifReport").value.trim();

await updateDoc(doc(db,"rendezvous",rdvEnCoursId),{

statut:"Refusé",
motif:motif

});

fermerModal("rdvModal");

rdvEnCoursId = null;

chargerRendezVous();

});

// --- Soumission des formulaires des modales fixes ---

document.getElementById("ordonnanceForm").addEventListener("submit",enregistrerOrdonnance);

document.getElementById("factureForm").addEventListener("submit",enregistrerFacture);

// ===============================
// TEMPS RÉEL
// ===============================

onSnapshot(

collection(db,"rendezvous"),

()=>{

chargerRendezVous();

chargerStatistiques();

}

);
// ==========================================
// DASHBOARD.JS - PARTIE 5
// MODULE ORDONNANCES
// ==========================================

// MENU ORDONNANCES

document.getElementById("ordonnanceBtn").addEventListener("click",(e)=>{

e.preventDefault();

afficherOrdonnances();

});

// ===============================
// AFFICHER ORDONNANCES
// ===============================

async function afficherOrdonnances(){

activerMenu("ordonnanceBtn");

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

Ordonnances

</h2>

<button
class="btn-primary"
id="btnNouvelleOrdonnance">

+ Nouvelle Ordonnance

</button>

</div>

<hr><br>

<h2>Historique des Ordonnances</h2>

<table>

<thead>

<tr>

<th>Patient</th>

<th>Dentiste</th>

<th>Date</th>

<th>Actions</th>

</tr>

</thead>

<tbody id="ordonnanceTable">

</tbody>

</table>

</section>

`;

chargerOrdonnances();

document.getElementById("btnNouvelleOrdonnance").addEventListener("click",()=>{

ouvrirModal("ordonnanceModal");

});

}

// ===============================
// ENREGISTRER
// ===============================

async function enregistrerOrdonnance(e){

e.preventDefault();

const patient = document.getElementById("ordPatientNom").value.trim();

const medecin = document.getElementById("ordMedecin").value.trim();

const diagnostic = document.getElementById("ordDiagnostic").value.trim();

const prescription = document.getElementById("ordTraitements").value.trim();

const date = document.getElementById("ordDate").value;


await addDoc(

collection(db,"ordonnances"),

{

patient:patient,

medecin:medecin,

diagnostic:diagnostic,

prescription:prescription,

date:date || new Date().toLocaleDateString(),

dateCreation:serverTimestamp()

}

);

fermerModal("ordonnanceModal");

document.getElementById("ordonnanceForm").reset();

chargerOrdonnances();

chargerStatistiques();

}

// ===============================
// CHARGER
// ===============================

async function chargerOrdonnances(){

const tbody=document.getElementById("ordonnanceTable");

if(!tbody) return;

tbody.innerHTML="";

const q=query(

collection(db,"ordonnances"),

orderBy("dateCreation","desc")

);

const snapshot=await getDocs(q);

snapshot.forEach((docu)=>{

const data=docu.data();

tbody.innerHTML+=`

<tr>

<td>${data.patient}</td>

<td>${data.medecin}</td>

<td>${data.date}</td>

<td>

<button
class="btn btn-success"
onclick="imprimerOrdonnance('${docu.id}')">

PDF

</button>

<button
class="btn btn-danger"
onclick="supprimerOrdonnance('${docu.id}')">

Supprimer

</button>

</td>

</tr>

`;

});

}

// ===============================
// IMPRIMER
// ===============================

window.imprimerOrdonnance=async(id)=>{

const docu=await getDoc(doc(db,"ordonnances",id));

if(!docu.exists()){

alert("Ordonnance introuvable.");

return;

}

const o=docu.data();

const win=window.open("","_blank");

if(!win){

alert("Veuillez autoriser les fenêtres pop-up pour imprimer.");

return;

}

win.document.write(`

<html>

<head>

<title>Ordonnance</title>

<style>

body{font-family:Arial,Helvetica,sans-serif;margin:40px;color:#1a1a1a;}

h1{font-size:22px;}

table{width:100%;border-collapse:collapse;margin-top:20px;}

td{padding:8px 4px;border-bottom:1px solid #ddd;}

.logo{font-size:14px;color:#0a66c2;}

</style>

</head>

<body>

<h1>NET SOURIRE — Ordonnance Médicale</h1>

<table>

<tr><td><b>Patient :</b></td><td>${escapeHtml(o.patient||"")}</td></tr>

<tr><td><b>Médecin :</b></td><td>${escapeHtml(o.medecin||"")}</td></tr>

<tr><td><b>Date :</b></td><td>${escapeHtml(o.date||"")}</td></tr>

<tr><td><b>Diagnostic :</b></td><td>${escapeHtml(o.diagnostic||"")}</td></tr>

</table>

<h3>Prescription</h3>

<p>${escapeHtml(o.prescription||"")}</p>

<p style="margin-top:60px;">_______________________<br>Le médecin</p>

<script>window.onload=function(){window.print();}<\/script>

</body>

</html>

`);

win.document.close();

}

// ===============================
// SUPPRIMER
// ===============================

window.supprimerOrdonnance=async(id)=>{

if(!confirm("Supprimer cette ordonnance ?")) return;

await deleteDoc(doc(db,"ordonnances",id));

chargerOrdonnances();

chargerStatistiques();

}

// ===============================
// TEMPS RÉEL
// ===============================

onSnapshot(

collection(db,"ordonnances"),

()=>{

chargerOrdonnances();

chargerStatistiques();

}

);
// ==========================================
// DASHBOARD.JS - PARTIE 6
// MODULE FACTURES
// ==========================================

// MENU FACTURES

document.getElementById("factureBtn").addEventListener("click",(e)=>{

e.preventDefault();

afficherFactures();

});

// ===============================
// AFFICHER FACTURES
// ===============================

async function afficherFactures(){

activerMenu("factureBtn");

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

Gestion des Factures

</h2>

<button
class="btn-primary"
id="btnNouvelleFacture">

+ Nouvelle Facture

</button>

</div>

<hr><br>

<h2>Historique des Factures</h2>

<table>

<thead>

<tr>

<th>Patient</th>

<th>Service</th>

<th>Montant</th>

<th>Paiement</th>

<th>Date</th>

<th>Actions</th>

</tr>

</thead>

<tbody id="factureTable">

</tbody>

</table>

</section>

`;

chargerFactures();

document.getElementById("btnNouvelleFacture").addEventListener("click",()=>{

ouvrirModal("factureModal");

});

}

// ===============================
// ENREGISTRER FACTURE
// ===============================

async function enregistrerFacture(e){

e.preventDefault();

const patient = document.getElementById("factPatientNom").value.trim();

const montant = Number(document.getElementById("factMontant").value);

const service = document.getElementById("factDescription").value.trim();

const date = document.getElementById("factDate").value;


await addDoc(

collection(db,"factures"),

{

patient:patient,

service:service,

montant:montant,

paiement:"Espèces",

date:date || new Date().toLocaleDateString(),

dateCreation:serverTimestamp()

}

);

fermerModal("factureModal");

document.getElementById("factureForm").reset();

chargerFactures();

chargerStatistiques();

}

// ===============================
// CHARGER FACTURES
// ===============================

async function chargerFactures(){

const tbody=document.getElementById("factureTable");

if(!tbody) return;

tbody.innerHTML="";

const q=query(

collection(db,"factures"),

orderBy("dateCreation","desc")

);

const snapshot=await getDocs(q);

snapshot.forEach((facture)=>{

const data=facture.data();

tbody.innerHTML+=`

<tr>

<td>${data.patient}</td>

<td>${data.service}</td>

<td>${Number(data.montant).toLocaleString()} FCFA</td>

<td>${data.paiement}</td>

<td>${data.date}</td>

<td>

<button
class="btn btn-success"
onclick="imprimerFacture('${facture.id}')">

PDF

</button>

<button
class="btn btn-danger"
onclick="supprimerFacture('${facture.id}')">

Supprimer

</button>

</td>

</tr>

`;

});

calculerRecettes();

}

// ===============================
// PDF
// ===============================

window.imprimerFacture=async(id)=>{

const docu=await getDoc(doc(db,"factures",id));

if(!docu.exists()){

alert("Facture introuvable.");

return;

}

const f=docu.data();

const win=window.open("","_blank");

if(!win){

alert("Veuillez autoriser les fenêtres pop-up pour imprimer.");

return;

}

win.document.write(`

<html>

<head>

<title>Facture</title>

<style>

body{font-family:Arial,Helvetica,sans-serif;margin:40px;color:#1a1a1a;}

h1{font-size:22px;}

table{width:100%;border-collapse:collapse;margin-top:20px;}

td{padding:8px 4px;border-bottom:1px solid #ddd;}

.montant{font-size:18px;font-weight:bold;color:#0a66c2;}

</style>

</head>

<body>

<h1>NET SOURIRE — Facture</h1>

<table>

<tr><td><b>Patient :</b></td><td>${escapeHtml(f.patient||"")}</td></tr>

<tr><td><b>Date :</b></td><td>${escapeHtml(f.date||"")}</td></tr>

<tr><td><b>Service :</b></td><td>${escapeHtml(f.service||"")}</td></tr>

<tr><td><b>Mode de paiement :</b></td><td>${escapeHtml(f.modePaiement||"")}</td></tr>

<tr><td><b>Montant :</b></td><td class="montant">${Number(f.montant||0).toLocaleString()} FCFA</td></tr>

</table>

<p style="margin-top:60px;">Merci de votre paiement.</p>

<script>window.onload=function(){window.print();}<\/script>

</body>

</html>

`);

win.document.close();

}

// ===============================
// SUPPRIMER
// ===============================

window.supprimerFacture=async(id)=>{

if(!confirm("Supprimer cette facture ?")) return;

await deleteDoc(doc(db,"factures",id));

chargerFactures();

chargerStatistiques();

}

// ===============================
// TEMPS RÉEL
// ===============================

onSnapshot(

collection(db,"factures"),

()=>{

chargerFactures();

chargerStatistiques();

}

);
// ==========================================
// DASHBOARD.JS - PARTIE 7
// MODULE PUBLICATIONS
// ==========================================

// MENU PUBLICATIONS

document.getElementById("publicationBtn").addEventListener("click",(e)=>{

e.preventDefault();

afficherPublications();

});

// ===============================
// AFFICHER
// ===============================

async function afficherPublications(){

activerMenu("publicationBtn");

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

Publications

</h2>

</div>

<form id="publicationForm">

<input
type="text"
id="titrePublication"
placeholder="Titre"
required>

<textarea
id="descriptionPublication"
rows="5"
placeholder="Description"></textarea>

<input
type="file"
id="imagePublication"
accept="image/*,video/*">

<button
class="btn-primary">

Publier

</button>

</form>

<hr><br>

<table>

<thead>

<tr>

<th>Titre</th>

<th>Description</th>

<th>Date</th>

<th>Actions</th>

</tr>

</thead>

<tbody id="publicationTable">

</tbody>

</table>

</section>

`;

chargerPublications();

document

.getElementById("publicationForm")

.addEventListener("submit",enregistrerPublication);

}

// ===============================
// ENREGISTRER
// ===============================

async function enregistrerPublication(e){

e.preventDefault();

const titre=document.getElementById("titrePublication").value.trim();

const description=document.getElementById("descriptionPublication").value.trim();

const fichier=document.getElementById("imagePublication").files[0];

let url="";

let type="image";


if(fichier){

const extension=fichier.name.split(".").pop().toLowerCase();

type=(["mp4","webm","mov"].includes(extension))?"video":"image";

const reference=ref(storage,`publications/${Date.now()}-${fichier.name}`);

await uploadBytes(reference,fichier);

url=await getDownloadURL(reference);

}


await addDoc(

collection(db,"publications"),

{

titre:titre,

description:description,

url:url,

type:type,

date:new Date().toLocaleDateString(),

dateCreation:serverTimestamp()

}

);

document.getElementById("publicationForm").reset();

chargerPublications();

}

// ===============================
// CHARGER
// ===============================

async function chargerPublications(){

const tbody=document.getElementById("publicationTable");

if(!tbody) return;

tbody.innerHTML="";

const q=query(

collection(db,"publications"),

orderBy("dateCreation","desc")

);

const snapshot=await getDocs(q);

snapshot.forEach((pub)=>{

const data=pub.data();

tbody.innerHTML+=`

<tr>

<td>${data.titre}</td>

<td>${data.description}</td>

<td>${data.date}</td>

<td>

<button
class="btn btn-success"
onclick="voirPublication('${pub.id}')">

Voir

</button>

<button
class="btn btn-danger"
onclick="supprimerPublication('${pub.id}')">

Supprimer

</button>

</td>

</tr>

`;

});

}

// ===============================
// VOIR
// ===============================

window.voirPublication=async(id)=>{

const ref=doc(db,"publications",id);

const publication=await getDoc(ref);

if(!publication.exists()) return;

const data=publication.data();

alert(

"Titre : "+data.titre+

"\n\n"+

data.description

);

}

// ===============================
// SUPPRIMER
// ===============================

window.supprimerPublication=async(id)=>{

if(!confirm("Supprimer cette publication ?"))

return;

await deleteDoc(doc(db,"publications",id));

chargerPublications();

}

// ===============================
// TEMPS RÉEL
// ===============================

onSnapshot(

collection(db,"publications"),

()=>{

chargerPublications();

}

);

// ==========================================
// FIN DU MODULE PUBLICATIONS
// ==========================================
// ==========================================
// DASHBOARD.JS - PARTIE 8
// PARAMÈTRES - DÉCONNEXION - INITIALISATION
// ==========================================

// ===============================
// MENU PARAMÈTRES
// ===============================

document.getElementById("parametreBtn")
.addEventListener("click",(e)=>{

e.preventDefault();

afficherParametres();

});

function afficherParametres(){

activerMenu("parametreBtn");

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

Paramètres du Cabinet

</h2>

</div>

<form id="cabinetForm">

<div class="form-group">

<label>Nom du cabinet</label>

<input
type="text"
id="paramNomCabinet"
placeholder="Nom du cabinet">

</div>

<div class="form-group">

<label>Nom du dentiste</label>

<input
type="text"
id="paramNomDentiste"
placeholder="Nom du dentiste">

</div>

<div class="form-group">

<label>Téléphone</label>

<input
type="text"
id="paramTelephone"
placeholder="Téléphone">

</div>

<div class="form-group">

<label>Adresse e-mail</label>

<input
type="email"
id="paramEmail"
placeholder="Adresse e-mail">

</div>

<div class="form-group">

<label>Adresse</label>

<input
type="text"
id="paramAdresse"
placeholder="Adresse">

</div>

<div class="form-group">

<label>Description du cabinet</label>

<textarea
id="paramDescription"
rows="5"
placeholder="Description du cabinet"></textarea>

</div>

<button
type="submit"
class="btn-primary">

Enregistrer

</button>

</form>

<div id="paramMessage"></div>

</section>

`;

// Câbler le formulaire (créé dynamiquement juste avant)

const cabinetForm=document.getElementById("cabinetForm");

if(cabinetForm){

cabinetForm.addEventListener("submit",sauvegarderParametres);

}

// Remplir le formulaire avec les valeurs existantes

chargerParametres();

}

// ===============================

// PARAMÈTRES DU CABINET

// ===============================

async function chargerParametres(){

try{

const snap=await getDoc(doc(db,"parametres","cabinet"));

if(snap.exists()){

const d=snap.data();

if(d.nomCabinet) document.getElementById("paramNomCabinet").value=d.nomCabinet;

if(d.nomDentiste) document.getElementById("paramNomDentiste").value=d.nomDentiste;

if(d.telephone) document.getElementById("paramTelephone").value=d.telephone;

if(d.email) document.getElementById("paramEmail").value=d.email;

if(d.adresse) document.getElementById("paramAdresse").value=d.adresse;

if(d.description) document.getElementById("paramDescription").value=d.description;

}

}catch(error){

console.error(error);

}

}

async function sauvegarderParametres(e){

e.preventDefault();

try{

await setDoc(doc(db,"parametres","cabinet"),{

nomCabinet:document.getElementById("paramNomCabinet").value.trim(),

nomDentiste:document.getElementById("paramNomDentiste").value.trim(),

telephone:document.getElementById("paramTelephone").value.trim(),

email:document.getElementById("paramEmail").value.trim(),

adresse:document.getElementById("paramAdresse").value.trim(),

description:document.getElementById("paramDescription").value.trim(),

dateModification:serverTimestamp()

});

const msg=document.getElementById("paramMessage");

if(msg){

msg.style.color="green";

msg.textContent="✅ Paramètres du cabinet enregistrés.";

}

}catch(error){

console.error(error);

const msg=document.getElementById("paramMessage");

if(msg){

msg.style.color="red";

msg.textContent="❌ Erreur : "+error.message;

}

}

}

// ===============================
// DÉCONNEXION
// ===============================

// Retour à l'accueil du dashboard (recharge la page)
window.afficherDashboard = function(){

location.reload();

};

const logout=document.getElementById("logoutBtn");

if(logout){

logout.addEventListener("click",async(e)=>{

e.preventDefault();

const ok=confirm(

"Voulez-vous vous déconnecter ?"

);

if(!ok) return;

await signOut(auth);

window.location.href="login.html";

});

}

// ===============================
// RAFRAÎCHISSEMENT AUTOMATIQUE
// ===============================

setInterval(()=>{

chargerStatistiques();

},30000);

// ===============================
// INITIALISATION
// ===============================

window.addEventListener("load",()=>{

chargerDashboard();

});

// ==========================================
// NET SOURIRE
// DASHBOARD.JS VERSION 1.0
// ==========================================
// ==========================================
// DOSSIER MÉDICAL DU PATIENT
// ==========================================

window.ouvrirDossierPatient = async function(id){

const ref = doc(db,"patients",id);

const patient = await getDoc(ref);

if(!patient.exists()) return;

const p = patient.data();

pageContent.innerHTML = `

<section class="dashboard-box">

<h2>Dossier Médical</h2>

<br>

<h3>${p.nom}</h3>

<p><b>Téléphone :</b> ${p.telephone}</p>

<p><b>Email :</b> ${p.email}</p>

<p><b>Sexe :</b> ${p.sexe}</p>

<p><b>Adresse :</b> ${p.adresse}</p>

<p><b>Date de naissance :</b> ${p.naissance}</p>

<hr><br>

<h3>Historique des soins</h3>

<div id="historiqueSoins">

Aucun traitement enregistré.

</div>

<hr><br>

<button
class="btn btn-primary"
onclick="nouvelleOrdonnance('${id}',${JSON.stringify(p.nom||"")})">

Nouvelle Ordonnance

</button>

<button
class="btn btn-success"
onclick="nouvelleFacture('${id}',${JSON.stringify(p.nom||"")})">

Nouvelle Facture

</button>

<button
class="btn btn-warning"
onclick="retourPatients()">

Retour

</button>

</section>

`;

}

// ==========================================
// RETOUR
// ==========================================

window.retourPatients = function(){

afficherPatients();

}
// ==========================================
// DASHBOARD.JS - PARTIE 10
// HISTORIQUE DES SOINS
// ==========================================

window.nouveauTraitement = async function(patientId){

const soin = prompt("Nom du soin");

if(!soin) return;

const observation = prompt("Observation");

await addDoc(collection(db,"traitements"),{

patientId: patientId,

soin: soin,

observation: observation,

date: new Date().toLocaleDateString(),

dateCreation: serverTimestamp()

});

alert("Traitement enregistré.");

}

window.chargerHistorique = async function(patientId){

const historique = document.getElementById("historiqueSoins");

if(!historique) return;

historique.innerHTML = "";

const q = query(

collection(db,"traitements"),

orderBy("dateCreation","desc")

);

const snapshot = await getDocs(q);

snapshot.forEach((docu)=>{

const data = docu.data();

if(data.patientId != patientId) return;

historique.innerHTML += `

<div class="card">

<h4>${data.soin}</h4>

<p>${data.observation}</p>

<small>${data.date}</small>

</div>

`;

});

}
// ==========================================
// DASHBOARD.JS - PARTIE 11
// RADIOGRAPHIES ET PHOTOS
// ==========================================

window.ajouterRadiographie = async function(patientId){

const input = document.createElement("input");

input.type = "file";

input.accept = "image/*";

input.onchange = async function(e){

const fichier = e.target.files[0];

if(!fichier) return;

const chemin = ref(

storage,

"radiographies/"+Date.now()+"_"+fichier.name

);

await uploadBytes(chemin,fichier);

const url = await getDownloadURL(chemin);

await addDoc(collection(db,"radiographies"),{

patientId,

image:url,

date:new Date().toLocaleDateString(),

dateCreation:serverTimestamp()

});

alert("Radiographie enregistrée.");

chargerRadiographies(patientId);

};

input.click();

};

window.chargerRadiographies = async function(patientId){

const zone = document.getElementById("listeRadiographies");

if(!zone) return;

zone.innerHTML="";

const snapshot = await getDocs(collection(db,"radiographies"));

snapshot.forEach(docu=>{

const data = docu.data();

if(data.patientId!==patientId) return;

zone.innerHTML += `

<img

src="${data.image}"

style="width:180px;height:180px;object-fit:cover;border-radius:12px;margin:10px;box-shadow:0 5px 15px rgba(0,0,0,.2);">

`;

});

};
// ==========================================
// DASHBOARD.JS - PARTIE 12
// CALENDRIER DES RENDEZ-VOUS
// ==========================================

window.afficherCalendrier = async function(){

activerMenu("calendrierRdvBtn");

pageContent.innerHTML = `

<section class="dashboard-box">

<h2>Calendrier des Rendez-vous</h2>

<table>

<thead>

<tr>

<th>Patient</th>

<th>Date</th>

<th>Heure</th>

<th>Statut</th>

</tr>

</thead>

<tbody id="calendrierTable">

</tbody>

</table>

</section>

`;

const tbody = document.getElementById("calendrierTable");

const q = query(
collection(db,"rendezvous"),
orderBy("dateCreation","desc")
);

const snapshot = await getDocs(q);

tbody.innerHTML = "";

snapshot.forEach((docu)=>{

const data = docu.data();

tbody.innerHTML += `

<tr>

<td>${escapeHtml(data.patientNom || data.nom || "")}</td>

<td>${escapeHtml(data.date || "")}</td>

<td>${escapeHtml(data.heure || "")}</td>

<td>${escapeHtml(data.statut || "En attente")}</td>

</tr>

`;

});

}
document.getElementById("calendrierBtn")
.addEventListener("click",(e)=>{

e.preventDefault();

afficherCalendrier();

});

// Bouton "Nouveau Rendez-vous" de l'accueil
const nouveauRdvBtn=document.getElementById("nouveauRdvBtn");

if(nouveauRdvBtn){

nouveauRdvBtn.addEventListener("click",(e)=>{

e.preventDefault();

nouveauRendezVous();

});

}

// Bouton "Calendrier" du menu (sidebar)
const calendrierRdvBtn=document.getElementById("calendrierRdvBtn");

if(calendrierRdvBtn){

calendrierRdvBtn.addEventListener("click",(e)=>{

e.preventDefault();

afficherCalendrier();

});

}

// Bell de notification
const notificationBtn=document.getElementById("notificationBtn");

if(notificationBtn){

notificationBtn.addEventListener("click",(e)=>{

e.preventDefault();

afficherNotifications();

});

}

// ===============================
// SECTION NOTIFICATIONS
// ===============================

async function afficherNotifications(){

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

Notifications

</h2>

<button
class="btn btn-warning"
onclick="afficherDashboard()">

↩ Retour au tableau de bord

</button>

</div>

<div class="notifications-list">

<h3>Rendez-vous en attente</h3>

<ul id="notificationsList">

<li>Chargement...</li>

</ul>

</div>

</section>

`;

chargerNotificationsList();

}

// ===============================
// NOUVEAU RENDEZ-VOUS
// ===============================

function nouveauRendezVous(){

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

Nouveau Rendez-vous

</h2>

<button
class="btn btn-warning"
onclick="afficherRendezVous()">

↩ Retour

</button>

</div>

<form id="nouveauRdvForm">

<div class="form-grid">

<div class="form-group">

<label>Nom du patient</label>

<input
type="text"
id="rdvNom"
placeholder="Nom du patient"
required>

</div>

<div class="form-group">

<label>Téléphone</label>

<input
type="tel"
id="rdvTelephone"
placeholder="Téléphone"
required>

</div>

<div class="form-group">

<label>Email</label>

<input
type="email"
id="rdvEmail"
placeholder="Adresse e-mail">

</div>

<div class="form-group">

<label>Date</label>

<input
type="date"
id="rdvDate"
required>

</div>

<div class="form-group">

<label>Heure</label>

<input
type="time"
id="rdvHeure"
required>

</div>

<div class="form-group">

<label>Type de consultation</label>

<select id="rdvType">

<option>Consultation</option>

<option>Détartrage</option>

<option>Soin dentaire</option>

<option>Extraction</option>

<option>Implant</option>

<option>Orthodontie</option>

<option>Contrôle</option>

<option>Urgence</option>

</select>

</div>

<div class="form-group full-width">

<label>Motif</label>

<textarea
id="rdvMotif"
rows="3"
placeholder="Motif du rendez-vous"></textarea>

</div>

</div>

<div class="actions">

<button
type="submit"
class="btn-primary">

Enregistrer

</button>

</div>

</form>

</section>

`;

document
.getElementById("nouveauRdvForm")
.addEventListener("submit",async(e)=>{

e.preventDefault();


const nom=document.getElementById("rdvNom").value.trim();

const telephone=document.getElementById("rdvTelephone").value.trim();

const email=document.getElementById("rdvEmail").value.trim();

const date=document.getElementById("rdvDate").value;

const heure=document.getElementById("rdvHeure").value;

const type=document.getElementById("rdvType").value;

const motif=document.getElementById("rdvMotif").value.trim();


// Lien au patient existant si possible

let patientId="";

if(nom){

try{

const qPatients=query(

collection(db,"patients"),

where("nom","==",nom)

);

const snapPatients=await getDocs(qPatients);

if(!snapPatients.empty){

patientId=snapPatients.docs[0].id;

}

}catch(error){

console.error(error);

}

}


await addDoc(

collection(db,"rendezvous"),

{

patientId:patientId,

patientNom:nom,

patientEmail:email,

telephone:telephone,

date:date,

heure:heure,

typeConsultation:type,

motif:motif,

statut:"En attente",

dateCreation:serverTimestamp()

}

);


alert("✅ Rendez-vous enregistré.");

afficherRendezVous();

chargerRendezVousDashboard();

chargerSectionsAccueil();

chargerStatistiques();

});

}
// ==========================================
// DASHBOARD.JS - PARTIE 13
// GESTION DES PAIEMENTS & CAISSE
// ==========================================

// MENU CAISSE

document.getElementById("caisseBtn").addEventListener("click",(e)=>{

e.preventDefault();

afficherCaisse();

});

// ===============================
// PAGE CAISSE
// ===============================

async function afficherCaisse(){

activerMenu("caisseBtn");

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

Gestion de la Caisse

</h2>

</div>

<div class="cards">

<div class="card">

<h3>Recettes du jour</h3>

<h1 id="recetteJour">0 FCFA</h1>

</div>

<div class="card">

<h3>Total encaissé</h3>

<h1 id="recetteTotale">0 FCFA</h1>

</div>

</div>

<br>

<table>

<thead>

<tr>

<th>Patient</th>

<th>Service</th>

<th>Montant</th>

<th>Paiement</th>

<th>Date</th>

</tr>

</thead>

<tbody id="tableCaisse">

</tbody>

</table>

</section>

`;

chargerCaisse();

}

// ===============================
// CHARGER CAISSE
// ===============================

async function chargerCaisse(){

const tbody=document.getElementById("tableCaisse");

if(!tbody) return;

tbody.innerHTML="";

const snapshot=await getDocs(

query(

collection(db,"factures"),

orderBy("dateCreation","desc")

)

);

let total=0;

let aujourdhui=0;

const maintenant=new Date();

snapshot.forEach((docu)=>{

const data=docu.data();

const montant=Number(data.montant||0);

total+=montant;

const dateDoc=getDateDocument(data);

if(dateDoc && memeJour(dateDoc,maintenant)){

aujourdhui+=montant;

}

tbody.innerHTML+=`

<tr>

<td>${escapeHtml(data.patient)}</td>

<td>${escapeHtml(data.service)}</td>

<td>${montant.toLocaleString()} FCFA</td>

<td>${escapeHtml(data.paiement)}</td>

<td>${escapeHtml(data.date)}</td>

</tr>

`;

});

document.getElementById("recetteJour").innerHTML=

aujourdhui.toLocaleString()+" FCFA";

document.getElementById("recetteTotale").innerHTML=

total.toLocaleString()+" FCFA";

}

// ===============================
// TEMPS RÉEL
// ===============================

onSnapshot(

collection(db,"factures"),

()=>{

const table=document.getElementById("tableCaisse");

if(table){

chargerCaisse();

}

}

);
// ==========================================
// DASHBOARD.JS - PARTIE 14
// RAPPORTS & STATISTIQUES FINANCIÈRES
// ==========================================

// MENU RAPPORTS

document.getElementById("rapportBtn").addEventListener("click",(e)=>{

e.preventDefault();

afficherRapports();

});

// ===============================
// RAPPORTS
// ===============================

async function afficherRapports(){

activerMenu("rapportBtn");

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

Rapports Financiers

</h2>

</div>

<div class="recettes">

<div class="recette-card">

<h3>Recettes du jour</h3>

<h1 id="rapportJour">0 FCFA</h1>

</div>

<div class="recette-card">

<h3>Cette semaine</h3>

<h1 id="rapportSemaine">0 FCFA</h1>

</div>

<div class="recette-card">

<h3>Ce mois</h3>

<h1 id="rapportMois">0 FCFA</h1>

</div>

<div class="recette-card">

<h3>Total Général</h3>

<h1 id="rapportTotal">0 FCFA</h1>

</div>

</div>

<br>

<button
class="btn btn-success"
onclick="imprimerRapport()">

🖨️ Imprimer le rapport

</button>

</section>

`;

calculerRapports();

}

// ===============================
// CALCUL DES RAPPORTS
// ===============================

async function calculerRapports(){

const snapshot=await getDocs(collection(db,"factures"));

let total=0;
let jour=0;
let semaine=0;
let mois=0;

const maintenant=new Date();

snapshot.forEach((docu)=>{

const data=docu.data();

const montant=Number(data.montant||0);

total+=montant;

// Filtre par date réelle du document (dateCreation ou date)
const dateDoc=getDateDocument(data);

if(!dateDoc) return;

if(memeJour(dateDoc,maintenant)) jour+=montant;

if(memeSemaine(dateDoc,maintenant)) semaine+=montant;

if(memeMois(dateDoc,maintenant)) mois+=montant;

});

document.getElementById("rapportJour").innerHTML=
jour.toLocaleString()+" FCFA";

document.getElementById("rapportSemaine").innerHTML=
semaine.toLocaleString()+" FCFA";

document.getElementById("rapportMois").innerHTML=
mois.toLocaleString()+" FCFA";

document.getElementById("rapportTotal").innerHTML=
total.toLocaleString()+" FCFA";

}

// ===============================
// IMPRESSION
// ===============================

window.imprimerRapport=function(){

window.print();

}

// ===============================
// TEMPS RÉEL
// ===============================

onSnapshot(

collection(db,"factures"),

()=>{

const zone=document.getElementById("rapportTotal");

if(zone){

calculerRapports();

}

}

);
