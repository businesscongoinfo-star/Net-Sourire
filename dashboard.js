// ==========================================
// DASHBOARD.JS - PARTIE 1
// NET SOURIRE
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
serverTimestamp,
onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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
// TABLEAU DE BORD
// ===============================

async function chargerDashboard(){

chargerStatistiques();

chargerPatientsDashboard();

chargerRendezVousDashboard();

}

chargerDashboard();

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

snapshot.forEach(doc=>{

const data = doc.data();

total += Number(data.montant || 0);

});

if(totalRecettes){

totalRecettes.innerHTML =
total.toLocaleString()+" FCFA";

}

}

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

<td>${data.nom || ""}</td>

<td>${data.telephone || ""}</td>

<td>${data.email || ""}</td>

<td>${data.sexe || ""}</td>

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

<p><b>Nom :</b> ${p.nom}</p>

<p><b>Téléphone :</b> ${p.telephone}</p>

<p><b>Email :</b> ${p.email}</p>

<p><b>Sexe :</b> ${p.sexe}</p>

<p><b>Adresse :</b> ${p.adresse}</p>

<p><b>Date de naissance :</b> ${p.naissance}</p>

<br>

<button
class="btn btn-primary"
onclick="afficherPatients()">

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

Retour

</button>

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

<td>${data.nom}</td>

<td>${data.telephone}</td>

<td>${data.date}</td>

<td>${data.heure}</td>

<td>${data.motif}</td>

<td>

<span class="badge badge-primary">

${data.statut || "En attente"}

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

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

Nouvelle Ordonnance

</h2>

</div>

<form id="ordonnanceForm">

<input
type="text"
id="patientNom"
placeholder="Nom du patient"
required>

<input
type="text"
id="medecin"
placeholder="Nom du dentiste"
required>

<textarea
id="diagnostic"
placeholder="Diagnostic"
rows="4"></textarea>

<textarea
id="prescription"
placeholder="Prescription"
rows="8"></textarea>

<button
class="btn-primary">

Enregistrer l'ordonnance

</button>

</form>

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

const form=document.getElementById("ordonnanceForm");

form.addEventListener("submit",enregistrerOrdonnance);

}

// ===============================
// ENREGISTRER
// ===============================

async function enregistrerOrdonnance(e){

e.preventDefault();

await addDoc(

collection(db,"ordonnances"),

{

patient:patientNom.value,

medecin:medecin.value,

diagnostic:diagnostic.value,

prescription:prescription.value,

date:new Date().toLocaleDateString(),

dateCreation:serverTimestamp()

}

);

alert("Ordonnance enregistrée.");

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

alert("La génération PDF sera ajoutée dans le module PDF.");

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

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

Gestion des Factures

</h2>

</div>

<form id="factureForm">

<input
type="text"
id="clientNom"
placeholder="Nom du patient"
required>

<input
type="number"
id="montant"
placeholder="Montant (FCFA)"
required>

<input
type="text"
id="service"
placeholder="Service effectué"
required>

<select id="modePaiement">

<option>Espèces</option>

<option>Mobile Money</option>

<option>Carte Bancaire</option>

<option>Virement</option>

</select>

<button class="btn-primary">

Créer la facture

</button>

</form>

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

document
.getElementById("factureForm")
.addEventListener("submit",enregistrerFacture);

}

// ===============================
// ENREGISTRER FACTURE
// ===============================

async function enregistrerFacture(e){

e.preventDefault();

await addDoc(

collection(db,"factures"),

{

patient:clientNom.value,

service:service.value,

montant:Number(montant.value),

paiement:modePaiement.value,

date:new Date().toLocaleDateString(),

dateCreation:serverTimestamp()

}

);

alert("Facture créée.");

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

alert("Le module PDF sera ajouté ensuite.");

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

await addDoc(

collection(db,"publications"),

{

titre:titrePublication.value,

description:descriptionPublication.value,

date:new Date().toLocaleDateString(),

dateCreation:serverTimestamp()

}

);

alert("Publication enregistrée.");

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

import { auth } from "./firebase.js";

import {
signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// ===============================
// MENU PARAMÈTRES
// ===============================

document.getElementById("parametreBtn")
.addEventListener("click",(e)=>{

e.preventDefault();

afficherParametres();

});

function afficherParametres(){

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

Paramètres du Cabinet

</h2>

</div>

<form id="cabinetForm">

<input
type="text"
placeholder="Nom du cabinet">

<input
type="text"
placeholder="Nom du dentiste">

<input
type="text"
placeholder="Téléphone">

<input
type="email"
placeholder="Adresse e-mail">

<input
type="text"
placeholder="Adresse">

<textarea
rows="5"
placeholder="Description du cabinet"></textarea>

<button
class="btn-primary">

Enregistrer

</button>

</form>

</section>

`;

}

// ===============================
// DÉCONNEXION
// ===============================

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
onclick="nouvelleOrdonnance('${id}')">

Nouvelle Ordonnance

</button>

<button
class="btn btn-success"
onclick="nouvelleFacture('${id}')">

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

import { storage } from "./firebase.js";

import {

ref,

uploadBytes,

getDownloadURL

} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

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

<td>${data.nom}</td>

<td>${data.date}</td>

<td>${data.heure}</td>

<td>${data.statut || "En attente"}</td>

</tr>

`;

});

}
document.getElementById("calendrierBtn")
.addEventListener("click",(e)=>{

e.preventDefault();

afficherCalendrier();

});
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

const dateJour=new Date().toLocaleDateString();

snapshot.forEach((docu)=>{

const data=docu.data();

const montant=Number(data.montant||0);

total+=montant;

if(data.date===dateJour){

aujourdhui+=montant;

}

tbody.innerHTML+=`

<tr>

<td>${data.patient}</td>

<td>${data.service}</td>

<td>${montant.toLocaleString()} FCFA</td>

<td>${data.paiement}</td>

<td>${data.date}</td>

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

// Pour l'instant, on ajoute tout.
// Plus tard, on filtrera par date réelle.

jour+=montant;
semaine+=montant;
mois+=montant;

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
