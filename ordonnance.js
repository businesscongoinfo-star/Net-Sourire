// ==========================================
// NET SOURIRE
// ORDONNANCES.JS
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
// Mode standalone : table #ordonnancesTable + modales fixes du HTML
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
// MENU ORDONNANCES
// ==========================================

const ordonnanceBtn=document.getElementById("ordonnanceBtn");

if(ordonnanceBtn){

ordonnanceBtn.addEventListener("click",(e)=>{
e.preventDefault();

ouvrirModuleOrdonnances();

});

}

// ==========================================
// OUVRIR MODULE
// ==========================================

export async function ouvrirModuleOrdonnances(){

if(estStandalone){

// Page ordonnance.html : la table existe déjà, on ne fait que la charger
chargerOrdonnances();

return;

}

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

💊 Gestion des Ordonnances

</h2>

<button
class="btn-primary"
id="btnNouvelleOrdonnance">

+ Nouvelle Ordonnance

</button>

</div>

<div id="listeOrdonnances">

<div class="loader"></div>

</div>

</section>

`;

chargerOrdonnances();

}

// ==========================================
// CHARGER LES ORDONNANCES
// ==========================================

async function chargerOrdonnances(){

const tbody=document.getElementById("ordonnancesTable");

if(!tbody) return;

// En mode dashboard, le gabarit est créé dynamiquement dans #listeOrdonnances
if(!estStandalone){

const zone=document.getElementById("listeOrdonnances");

if(zone){

zone.innerHTML=`

<table class="table">

<thead>

<tr>

<th>Patient</th>

<th>Dentiste</th>

<th>Date</th>

<th>Actions</th>

</tr>

</thead>

<tbody id="ordonnancesTable">

</tbody>

</table>

`;

}

}


const snapshot=await getDocs(

query(
collection(db,"ordonnances"),
orderBy("dateCreation","desc")
)

);

tbody.innerHTML="";

snapshot.forEach((docu)=>{

const data=docu.data();

tbody.innerHTML+=`

<tr>

<td>${escapeHtml(data.patient)}</td>

<td>${escapeHtml(data.medecin)}</td>

<td>${escapeHtml(data.date)}</td>

<td>

<button
class="btn btn-success"
onclick="voirOrdonnance('${docu.id}')">

Voir

</button>

<button
class="btn btn-warning"
onclick="modifierOrdonnance('${docu.id}')">

Modifier

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

if(snapshot.empty){

tbody.innerHTML=`

<tr>

<td colspan="4" style="text-align:center;padding:30px;">

Aucune ordonnance enregistrée.

</td>

</tr>

`;

}

}

// ==========================================
// TEMPS RÉEL
// ==========================================

onSnapshot(
collection(db,"ordonnances"),
()=>{

const table=document.getElementById("ordonnancesTable");

if(table){

chargerOrdonnances();

}

}

);

// ==========================================
// FIN PARTIE 1
// ==========================================
// ==========================================
// ORDONNANCES.JS - PARTIE 2
// NOUVELLE ORDONNANCE
// ==========================================

document.addEventListener("click",(e)=>{

if(e.target.id==="btnNouvelleOrdonnance"){

ouvrirFormulaireOrdonnance();

}

});

function ouvrirFormulaireOrdonnance(){

if(estStandalone){

// La page ordonnance.html possède déjà #ordonnanceModal et #ordonnanceForm
const modal=document.getElementById("ordonnanceModal");

if(modal) modal.style.display="flex";

return;

}

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

💊 Nouvelle Ordonnance

</h2>

</div>

<form id="ordonnanceFormDynamique">

<input
type="text"
id="patient"
placeholder="Nom du patient"
required>

<input
type="text"
id="medecin"
placeholder="Nom du dentiste"
required>

<input
type="text"
id="telephone"
placeholder="Téléphone du patient">

<textarea
id="diagnostic"
rows="4"
placeholder="Diagnostic"></textarea>

<textarea
id="prescription"
rows="8"
placeholder="Prescription médicale"></textarea>

<textarea
id="conseils"
rows="4"
placeholder="Conseils au patient"></textarea>

<button
type="submit"
class="btn-primary">

💾 Enregistrer

</button>

<button
type="button"
id="retourOrdonnance"
class="btn btn-warning">

↩ Retour

</button>

</form>

</section>

`;

document
.getElementById("ordonnanceFormDynamique")
.addEventListener("submit",enregistrerOrdonnance);

document
.getElementById("retourOrdonnance")
.addEventListener("click",ouvrirModuleOrdonnances);

}

// ==========================================
// ENREGISTRER
// ==========================================

async function enregistrerOrdonnance(e){

e.preventDefault();

let patient="",medecin="",telephone="",diagnostic="",prescription="",conseils="",date="";

if(estStandalone){

// Champs de ordonnance.html
patient=document.getElementById("patientNom").value.trim();

telephone=document.getElementById("patientTelephone").value.trim();

medecin=document.getElementById("medecinNom").value.trim();

date=document.getElementById("dateOrdonnance").value;

diagnostic=document.getElementById("diagnostic").value.trim();

prescription=document.getElementById("prescription").value.trim();

conseils=document.getElementById("conseils").value.trim();

}else{

patient=document.getElementById("patient").value.trim();

medecin=document.getElementById("medecin").value.trim();

telephone=document.getElementById("telephone").value.trim();

diagnostic=document.getElementById("diagnostic").value.trim();

prescription=document.getElementById("prescription").value.trim();

conseils=document.getElementById("conseils").value.trim();

}


await addDoc(

collection(db,"ordonnances"),

{

patient:patient,

medecin:medecin,

telephone:telephone,

diagnostic:diagnostic,

prescription:prescription,

conseils:conseils,

date:date || new Date().toLocaleDateString(),

dateCreation:serverTimestamp()

}

);

alert("✅ Ordonnance enregistrée.");

if(estStandalone){

fermerModalStandalone("ordonnanceModal");

}

ouvrirModuleOrdonnances();

}

// Ferme un modal en mode standalone
function fermerModalStandalone(id){

const modal=document.getElementById(id);

if(modal) modal.style.display="none";

}

// ==========================================
// FIN PARTIE 2
// ==========================================
// ==========================================
// ORDONNANCES.JS - PARTIE 3
// VOIR - MODIFIER - SUPPRIMER
// ==========================================

// ===============================
// VOIR ORDONNANCE
// ===============================

window.voirOrdonnance = async function(id){

const ref = doc(db,"ordonnances",id);

const snap = await getDoc(ref);

if(!snap.exists()){

alert("Ordonnance introuvable.");

return;

}

const o = snap.data();

if(estStandalone){

// Afficher dans la modale #ordonnanceDetails
const zone=document.getElementById("ordonnanceInfo");

if(zone){

zone.innerHTML=`

<div class="ordonnance">

<h3>Cabinet Dentaire Net Sourire</h3>

<hr>

<p><strong>Patient :</strong> ${escapeHtml(o.patient)}</p>

<p><strong>Dentiste :</strong> ${escapeHtml(o.medecin)}</p>

<p><strong>Téléphone :</strong> ${escapeHtml(o.telephone || "-")}</p>

<p><strong>Date :</strong> ${escapeHtml(o.date)}</p>

<br>

<h4>Diagnostic</h4>

<p>${escapeHtml(o.diagnostic)}</p>

<br>

<h4>Prescription</h4>

<p>${escapeHtml(o.prescription)}</p>

<br>

<h4>Conseils</h4>

<p>${escapeHtml(o.conseils)}</p>

<br>

<button
class="btn btn-success"
onclick="imprimerOrdonnance('${id}')">

🖨 Imprimer

</button>

<button
class="btn btn-primary"
onclick="envoyerWhatsAppOrdonnance('${id}')">

💬 WhatsApp

</button>

</div>

`;

}

const modal=document.getElementById("ordonnanceDetails");

if(modal) modal.style.display="flex";

return;

}

pageContent.innerHTML = `

<section class="dashboard-box">

<div class="box-header">

<h2>📄 Ordonnance Médicale</h2>

</div>

<div class="ordonnance">

<h3>Cabinet Dentaire Net Sourire</h3>

<hr>

<p><strong>Patient :</strong> ${escapeHtml(o.patient)}</p>

<p><strong>Dentiste :</strong> ${escapeHtml(o.medecin)}</p>

<p><strong>Téléphone :</strong> ${escapeHtml(o.telephone || "-")}</p>

<p><strong>Date :</strong> ${escapeHtml(o.date)}</p>

<br>

<h4>Diagnostic</h4>

<p>${escapeHtml(o.diagnostic)}</p>

<br>

<h4>Prescription</h4>

<p>${escapeHtml(o.prescription)}</p>

<br>

<h4>Conseils</h4>

<p>${escapeHtml(o.conseils)}</p>

<br>

<button
class="btn btn-success"
onclick="imprimerOrdonnance('${id}')">

🖨 Imprimer

</button>

<button
class="btn btn-primary"
onclick="envoyerWhatsAppOrdonnance('${id}')">

💬 WhatsApp

</button>

<button
class="btn btn-warning"
onclick="ouvrirModuleOrdonnances()">

↩ Retour

</button>

</div>

</section>

`;

}

// ===============================
// MODIFIER
// ===============================

window.modifierOrdonnance = async function(id){

const ref = doc(db,"ordonnances",id);

const snap = await getDoc(ref);

if(!snap.exists()) return;

const o = snap.data();

const nouvellePrescription = prompt(

"Modifier la prescription",

o.prescription

);

if(nouvellePrescription===null) return;

await updateDoc(ref,{

prescription:nouvellePrescription

});

alert("✅ Ordonnance modifiée.");

chargerOrdonnances();

}

// ===============================
// SUPPRIMER
// ===============================

window.supprimerOrdonnance = async function(id){

if(!confirm("Supprimer cette ordonnance ?"))

return;

await deleteDoc(doc(db,"ordonnances",id));

alert("Ordonnance supprimée.");

chargerOrdonnances();

}

// ==========================================
// FIN PARTIE 3
// ==========================================
// ==========================================
// ORDONNANCES.JS - PARTIE 4
// PDF - EMAIL - WHATSAPP
// ==========================================

// ===============================
// IMPRIMER
// ===============================

window.imprimerOrdonnance = async function(id){

const ref = doc(db,"ordonnances",id);

const snap = await getDoc(ref);

if(!snap.exists()) return;

const o = snap.data();

const w = window.open("","_blank");

if(!w){

alert("Veuillez autoriser les fenêtres pop-up pour imprimer.");

return;

}

w.document.write(`

<html>

<head>

<title>Ordonnance Net Sourire</title>

<style>

body{

font-family:Arial,sans-serif;

padding:40px;

line-height:1.8;

}

.header{

text-align:center;

margin-bottom:30px;

}

.header h1{

color:#0D6EFD;

margin:0;

}

hr{

margin:20px 0;

}

h3{

color:#0B2D57;

}

</style>

</head>

<body>

<div class="header">

<h1>NET SOURIRE</h1>

<p>Cabinet Dentaire</p>

</div>

<hr>

<p><strong>Patient :</strong> ${escapeHtml(o.patient)}</p>

<p><strong>Dentiste :</strong> ${escapeHtml(o.medecin)}</p>

<p><strong>Date :</strong> ${escapeHtml(o.date)}</p>

<p><strong>Téléphone :</strong> ${escapeHtml(o.telephone || "-")}</p>

<hr>

<h3>Diagnostic</h3>

<p>${escapeHtml(o.diagnostic)}</p>

<h3>Prescription</h3>

<p>${escapeHtml(o.prescription)}</p>

<h3>Conseils</h3>

<p>${escapeHtml(o.conseils)}</p>

<br><br>

<p>Signature du dentiste</p>

</body>

</html>

`);

w.document.close();

w.print();

};

// ===============================
// EMAIL
// ===============================

window.envoyerEmailOrdonnance = async function(id){

const snap = await getDoc(doc(db,"ordonnances",id));

if(!snap.exists()) return;

const o = snap.data();

window.location.href=

`mailto:?subject=Ordonnance Net Sourire&body=Bonjour ${o.patient},

Votre ordonnance est prête.

Date : ${o.date}

Merci de contacter le Cabinet Net Sourire pour toute question.`;

};

// ===============================
// WHATSAPP
// ===============================

window.envoyerWhatsAppOrdonnance = async function(id){

const snap = await getDoc(doc(db,"ordonnances",id));

if(!snap.exists()) return;

const o = snap.data();

const numero=(o.telephone||"").replace(/\s+/g,"");

if(!numero){

alert("Numéro de téléphone introuvable.");

return;

}

const texte=encodeURIComponent(

`Bonjour ${o.patient}

Votre ordonnance est disponible.

Date : ${o.date}

Cabinet Net Sourire.`

);

window.open(

`https://wa.me/${numero}?text=${texte}`,

"_blank"

);

};

// ===============================
// ARCHIVAGE
// ===============================

async function archiverOrdonnance(patientId,ordonnanceId){

await addDoc(

collection(db,"historiqueOrdonnances"),

{

patientId,

ordonnanceId,

dateArchivage:serverTimestamp()

}

);

}

// ==========================================
// FIN PARTIE 4
// ==========================================
// ==========================================
// ORDONNANCES.JS - PARTIE 5
// RECHERCHE - STATISTIQUES - TEMPS RÉEL
// ==========================================

// ===============================
// RECHERCHE
// ===============================

document.addEventListener("input",(e)=>{

if(e.target.id!=="rechercheOrdonnance") return;

const texte=e.target.value.toLowerCase();

document.querySelectorAll("#ordonnancesTable tr")

.forEach((ligne)=>{

ligne.style.display=

ligne.innerText.toLowerCase().includes(texte)

? ""

: "none";

});

});

// ===============================
// COMPTEUR
// ===============================

async function compteurOrdonnances(){

const snapshot=await getDocs(

collection(db,"ordonnances")

);

const total=document.getElementById("totalOrdonnances");

if(total){

total.innerHTML=snapshot.size;

}

}

// ===============================
// DERNIÈRES ORDONNANCES
// ===============================

async function dernieresOrdonnances(){

const zone=document.getElementById("dernieresOrdonnances");

if(!zone) return;

zone.innerHTML="";

const snapshot=await getDocs(

query(

collection(db,"ordonnances"),

orderBy("dateCreation","desc")

)

);

let i=0;

snapshot.forEach((docu)=>{

if(i>=5) return;

const data=docu.data();

zone.innerHTML+=`

<div class="activity-item">

<div class="activity-left">

<i class="fa-solid fa-file-prescription"></i>

<div>

<h4>${escapeHtml(data.patient)}</h4>

<p>${escapeHtml(data.date)}</p>

</div>

</div>

</div>

`;

i++;

});

}

// ===============================
// TEMPS RÉEL
// ===============================

onSnapshot(

collection(db,"ordonnances"),

()=>{

const table=document.getElementById("ordonnancesTable");

if(table){

chargerOrdonnances();

}

compteurOrdonnances();

dernieresOrdonnances();

}

);

// ===============================
// INITIALISATION
// ===============================

window.addEventListener("load",()=>{

compteurOrdonnances();

});

// Fermetures de modales sur la page standalone ordonnance.html
if(estStandalone){

const croixOrdonnance=document.getElementById("closeOrdonnanceModal");

if(croixOrdonnance) croixOrdonnance.addEventListener("click",()=>fermerModalStandalone("ordonnanceModal"));


const annulerOrdonnance=document.getElementById("annulerOrdonnance");

if(annulerOrdonnance) annulerOrdonnance.addEventListener("click",()=>fermerModalStandalone("ordonnanceModal"));


const croixDetails=document.getElementById("closeOrdonnanceDetails");

if(croixDetails) croixDetails.addEventListener("click",()=>fermerModalStandalone("ordonnanceDetails"));


// Câblage du formulaire de la page standalone
const form=document.getElementById("ordonnanceForm");

if(form) form.addEventListener("submit",enregistrerOrdonnance);

}

// ==========================================
// FIN DU MODULE ORDONNANCES
// NET SOURIRE V1.0
// ==========================================
