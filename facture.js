// ==========================================
// NET SOURIRE
// FACTURES.JS
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
// Mode standalone : table #facturesTable + modales fixes du HTML
const pageContent = document.getElementById("pageContent");
const estStandalone = !pageContent;

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
// MENU FACTURES
// ==========================================

const factureBtn = document.getElementById("factureBtn");

if(factureBtn){

factureBtn.addEventListener("click",(e)=>{
e.preventDefault();

ouvrirModuleFactures();

});

}

// ==========================================
// OUVRIR LE MODULE FACTURES
// ==========================================

export async function ouvrirModuleFactures(){

if(estStandalone){

// Page facture.html : la table existe déjà, on ne fait que la charger
chargerFactures();

return;

}

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

🧾 Gestion des Factures

</h2>

<button
class="btn-primary"
id="btnNouvelleFacture">

+ Nouvelle Facture

</button>

</div>

<div class="search-box">

<i class="fa-solid fa-search"></i>

<input
type="text"
id="rechercheFacture"
placeholder="Rechercher une facture...">

</div>

<div id="listeFactures">

<div class="loader"></div>

</div>

</section>

`;

chargerFactures();

}

// ==========================================
// CHARGER LES FACTURES
// ==========================================

async function chargerFactures(){

const tbody=document.getElementById("facturesTable");

if(!tbody) return;

// En mode dashboard, le gabarit est créé dynamiquement dans #listeFactures
if(!estStandalone){

const zone=document.getElementById("listeFactures");

if(zone){

zone.innerHTML=`

<table class="table">

<thead>

<tr>

<th>N° Facture</th>

<th>Patient</th>

<th>Service</th>

<th>Montant</th>

<th>Paiement</th>

<th>Date</th>

<th>Actions</th>

</tr>

</thead>

<tbody id="facturesTable">

</tbody>

</table>

`;

}

}


const snapshot=await getDocs(

query(
collection(db,"factures"),
orderBy("dateCreation","desc")
)

);

tbody.innerHTML="";

snapshot.forEach((facture)=>{

const data=facture.data();

tbody.innerHTML+=`

<tr>

<td>${escapeHtml(data.numero || "-")}</td>

<td>${escapeHtml(data.patient || "-")}</td>

<td>${escapeHtml(data.service || "-")}</td>

<td>${Number(data.montant || 0).toLocaleString()} FCFA</td>

<td>${escapeHtml(data.modePaiement || data.paiement || "-")}</td>

<td>${escapeHtml(data.date || "-")}</td>

<td>

<button
class="btn btn-success"
onclick="voirFacture('${facture.id}')">

👁 Voir

</button>

<button
class="btn btn-warning"
onclick="modifierFacture('${facture.id}')">

✏ Modifier

</button>

<button
class="btn btn-danger"
onclick="supprimerFacture('${facture.id}')">

🗑 Supprimer

</button>

</td>

</tr>

`;

});

if(snapshot.empty){

tbody.innerHTML=`

<tr>

<td colspan="7" style="text-align:center;padding:30px;">

Aucune facture enregistrée.

</td>

</tr>

`;

}

}

// ==========================================
// TEMPS RÉEL
// ==========================================

onSnapshot(
collection(db,"factures"),
()=>{

const table=document.getElementById("facturesTable");

if(table){

chargerFactures();

}

}

);

// ==========================================
// FIN PARTIE 1
// ==========================================
// ==========================================
// FACTURES.JS - PARTIE 2
// NOUVELLE FACTURE
// ==========================================

document.addEventListener("click",(e)=>{

if(e.target.id==="btnNouvelleFacture" || e.target.id==="btnNouvelleFactureStandalone"){

ouvrirFormulaireFacture();

}

});

// ==========================================
// FORMULAIRE
// ==========================================

function ouvrirFormulaireFacture(){

if(estStandalone){

// La page facture.html possède déjà #factureModal et #factureForm
const modal=document.getElementById("factureModal");

if(modal) modal.style.display="flex";

return;

}

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

🧾 Nouvelle Facture

</h2>

</div>

<form id="factureFormDynamique">

<input
type="text"
id="patient"
placeholder="Nom du patient"
required>

<input
type="text"
id="telephone"
placeholder="Téléphone">

<input
type="text"
id="service"
placeholder="Service effectué"
required>

<input
type="number"
id="montant"
placeholder="Montant (FCFA)"
required>

<select id="modePaiement">

<option>Espèces</option>

<option>Mobile Money</option>

<option>Carte Bancaire</option>

<option>Virement</option>

</select>

<textarea
id="observation"
placeholder="Observation"></textarea>

<button
type="submit"
class="btn-primary">

💾 Enregistrer la facture

</button>

<button
type="button"
id="retourFacture"
class="btn btn-warning">

↩ Retour

</button>

</form>

</section>

`;

document
.getElementById("factureFormDynamique")
.addEventListener("submit",enregistrerFacture);

document
.getElementById("retourFacture")
.addEventListener("click",ouvrirModuleFactures);

}

// ==========================================
// NUMÉRO AUTOMATIQUE
// ==========================================

async function genererNumeroFacture(){

const snapshot=await getDocs(collection(db,"factures"));

const numero=(snapshot.size+1)

.toString()

.padStart(6,"0");

return "FAC-"+

new Date().getFullYear()

+"-"+numero;

}

// ==========================================
// ENREGISTRER
// ==========================================

async function enregistrerFacture(e){

e.preventDefault();

let patient="",telephone="",service="",montant=0,modePaiement="Espèces",observation="";

if(estStandalone){

// Champs de facture.html
patient=document.getElementById("patientNom").value.trim();

telephone=document.getElementById("patientTelephone").value.trim();

service=document.getElementById("service").value.trim();

montant=Number(document.getElementById("montant").value);

modePaiement=document.getElementById("modePaiement").value;

observation=document.getElementById("observation").value.trim();

}else{

patient=document.getElementById("patient").value.trim();

telephone=document.getElementById("telephone").value.trim();

service=document.getElementById("service").value.trim();

montant=Number(document.getElementById("montant").value);

modePaiement=document.getElementById("modePaiement").value;

observation=document.getElementById("observation").value.trim();

}


const numero=
await genererNumeroFacture();

await addDoc(

collection(db,"factures"),

{

numero:numero,

patient:patient,

telephone:telephone,

service:service,

montant:montant,

modePaiement:modePaiement,

paiement:modePaiement,

observation:observation,

date:new Date().toLocaleDateString(),

dateCreation:serverTimestamp()

}

);

alert("✅ Facture enregistrée.");

if(estStandalone){

fermerModalStandalone("factureModal");

}

ouvrirModuleFactures();

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
// FACTURES.JS - PARTIE 3
// VOIR - MODIFIER - SUPPRIMER
// ==========================================

// ===============================
// VOIR FACTURE
// ===============================

window.voirFacture = async function(id){

const ref = doc(db,"factures",id);

const snap = await getDoc(ref);

if(!snap.exists()){

alert("Facture introuvable.");

return;

}

const f = snap.data();

if(estStandalone){

// Afficher dans la modale #factureDetails
const zone=document.getElementById("factureInfo");

if(zone){

zone.innerHTML=`

<div class="facture">

<h3>Cabinet Dentaire Net Sourire</h3>

<hr>

<p><strong>N° Facture :</strong> ${escapeHtml(f.numero)}</p>

<p><strong>Patient :</strong> ${escapeHtml(f.patient)}</p>

<p><strong>Téléphone :</strong> ${escapeHtml(f.telephone || "-")}</p>

<p><strong>Service :</strong> ${escapeHtml(f.service)}</p>

<p><strong>Montant :</strong> ${Number(f.montant).toLocaleString()} FCFA</p>

<p><strong>Mode de paiement :</strong> ${escapeHtml(f.modePaiement || f.paiement || "-")}</p>

<p><strong>Date :</strong> ${escapeHtml(f.date)}</p>

<p><strong>Observation :</strong> ${escapeHtml(f.observation || "-")}</p>

<br>

<button
class="btn btn-success"
onclick="imprimerFacture('${id}')">

🖨 Imprimer

</button>

<button
class="btn btn-primary"
onclick="envoyerWhatsAppFacture('${id}')">

💬 WhatsApp

</button>

</div>

`;

}

const modal=document.getElementById("factureDetails");

if(modal) modal.style.display="flex";

return;

}

pageContent.innerHTML = `

<section class="dashboard-box">

<div class="box-header">

<h2>🧾 Facture ${escapeHtml(f.numero)}</h2>

</div>

<div class="facture">

<h3>Cabinet Dentaire Net Sourire</h3>

<hr>

<p><strong>N° Facture :</strong> ${escapeHtml(f.numero)}</p>

<p><strong>Patient :</strong> ${escapeHtml(f.patient)}</p>

<p><strong>Téléphone :</strong> ${escapeHtml(f.telephone || "-")}</p>

<p><strong>Service :</strong> ${escapeHtml(f.service)}</p>

<p><strong>Montant :</strong> ${Number(f.montant).toLocaleString()} FCFA</p>

<p><strong>Mode de paiement :</strong> ${escapeHtml(f.modePaiement || f.paiement || "-")}</p>

<p><strong>Date :</strong> ${escapeHtml(f.date)}</p>

<p><strong>Observation :</strong> ${escapeHtml(f.observation || "-")}</p>

<br>

<button
class="btn btn-success"
onclick="imprimerFacture('${id}')">

🖨 Imprimer

</button>

<button
class="btn btn-primary"
onclick="envoyerWhatsAppFacture('${id}')">

💬 WhatsApp

</button>

<button
class="btn btn-warning"
onclick="ouvrirModuleFactures()">

↩ Retour

</button>

</div>

</section>

`;

}

// ===============================
// MODIFIER
// ===============================

window.modifierFacture = async function(id){

const ref = doc(db,"factures",id);

const snap = await getDoc(ref);

if(!snap.exists()) return;

const f = snap.data();

const nouveauMontant = prompt(

"Nouveau montant",

f.montant

);

if(nouveauMontant===null) return;

await updateDoc(ref,{

montant:Number(nouveauMontant)

});

alert("✅ Facture modifiée.");

chargerFactures();

}

// ===============================
// SUPPRIMER
// ===============================

window.supprimerFacture = async function(id){

if(!confirm("Supprimer cette facture ?"))

return;

await deleteDoc(doc(db,"factures",id));

alert("Facture supprimée.");

chargerFactures();

}

// ===============================
// IMPRIMER
// ===============================

window.imprimerFacture = async function(id){

const snap = await getDoc(doc(db,"factures",id));

if(!snap.exists()) return;

const f = snap.data();

const w = window.open("","_blank");

if(!w){

alert("Veuillez autoriser les fenêtres pop-up pour imprimer.");

return;

}

w.document.write(`

<html>

<head>

<title>Facture ${escapeHtml(f.numero)}</title>

<style>

body{

font-family:Arial,sans-serif;

padding:40px;

}

h1{

color:#0D6EFD;

}

table{

width:100%;

border-collapse:collapse;

margin-top:20px;

}

td{

padding:10px;

border-bottom:1px solid #ddd;

}

</style>

</head>

<body>

<h1>NET SOURIRE</h1>

<hr>

<h2>FACTURE</h2>

<table>

<tr><td>Numéro</td><td>${escapeHtml(f.numero)}</td></tr>

<tr><td>Patient</td><td>${escapeHtml(f.patient)}</td></tr>

<tr><td>Service</td><td>${escapeHtml(f.service)}</td></tr>

<tr><td>Montant</td><td>${Number(f.montant).toLocaleString()} FCFA</td></tr>

<tr><td>Paiement</td><td>${escapeHtml(f.modePaiement || f.paiement)}</td></tr>

<tr><td>Date</td><td>${escapeHtml(f.date)}</td></tr>

</table>

<br><br>

<h2>Total : ${Number(f.montant).toLocaleString()} FCFA</h2>

</body>

</html>

`);

w.document.close();

w.print();

}

// ==========================================
// FIN PARTIE 3
// ==========================================
// ==========================================
// FACTURES.JS - PARTIE 4
// EMAIL - WHATSAPP - STATISTIQUES
// ==========================================

// ===============================
// ENVOI PAR EMAIL
// ===============================

window.envoyerEmailFacture = async function(id){

const snap = await getDoc(doc(db,"factures",id));

if(!snap.exists()) return;

const f = snap.data();

const sujet = encodeURIComponent("Facture " + f.numero);

const message = encodeURIComponent(

`Bonjour ${f.patient},

Votre facture est disponible.

Numéro : ${f.numero}
Montant : ${Number(f.montant).toLocaleString()} FCFA
Date : ${f.date}

Cabinet Dentaire Net Sourire`

);

window.location.href =

`mailto:?subject=${sujet}&body=${message}`;

};

// ===============================
// ENVOI WHATSAPP
// ===============================

window.envoyerWhatsAppFacture = async function(id){

const snap = await getDoc(doc(db,"factures",id));

if(!snap.exists()) return;

const f = snap.data();

const numero = (f.telephone || "").replace(/\s+/g,"");

if(!numero){

alert("Numéro du patient introuvable.");

return;

}

const texte = encodeURIComponent(

`Bonjour ${f.patient}

Votre facture ${f.numero} est disponible.

Montant : ${Number(f.montant).toLocaleString()} FCFA

Cabinet Dentaire Net Sourire`

);

window.open(

`https://wa.me/${numero}?text=${texte}`,

"_blank"

);

};

// ===============================
// RECETTES
// ===============================

async function calculerRecettes(){

const snapshot = await getDocs(collection(db,"factures"));

let total = 0;

snapshot.forEach((docu)=>{

const data = docu.data();

total += Number(data.montant || 0);

});

const recette = document.getElementById("totalRecettes");

if(recette){

recette.innerHTML = total.toLocaleString()+" FCFA";

}

}

// ===============================
// COMPTEUR
// ===============================

async function compteurFactures(){

const snapshot = await getDocs(collection(db,"factures"));

const total = document.getElementById("totalFactures");

if(total){

total.innerHTML = snapshot.size;

}

}

// ===============================
// TEMPS RÉEL
// ===============================

onSnapshot(
collection(db,"factures"),
()=>{

const table = document.getElementById("facturesTable");

if(table){

chargerFactures();

}

calculerRecettes();

compteurFactures();

}

);

// ===============================
// INITIALISATION
// ===============================

window.addEventListener("load",()=>{

calculerRecettes();

compteurFactures();

});

// ==========================================
// FIN PARTIE 4
// ==========================================
// ==========================================
// FACTURES.JS - PARTIE 5
// RECHERCHE - RAPPORTS - FINAL
// ==========================================

// ===============================
// RECHERCHE
// ===============================

document.addEventListener("input",(e)=>{

if(e.target.id!=="rechercheFacture") return;

const texte=e.target.value.toLowerCase();

document.querySelectorAll("#facturesTable tr")

.forEach((ligne)=>{

ligne.style.display=

ligne.innerText.toLowerCase().includes(texte)

? ""

: "none";

});

});

// ===============================
// RAPPORT JOURNALIER
// ===============================

window.rapportJournalier = async function(){

const snapshot=await getDocs(collection(db,"factures"));

let total=0;

const maintenant=new Date();

snapshot.forEach((docu)=>{

const data=docu.data();

if(data.date && data.date===maintenant.toLocaleDateString()){

total+=Number(data.montant||0);

}

});

alert(

"💰 Recettes du jour : "+

total.toLocaleString()+" FCFA"

);

}

// ===============================
// RAPPORT MENSUEL
// ===============================

window.rapportMensuel = async function(){

const snapshot=await getDocs(collection(db,"factures"));

let total=0;

const maintenant=new Date();

const mois=maintenant.getMonth()+1;

const annee=maintenant.getFullYear();

snapshot.forEach((docu)=>{

const d=docu.data();

if(!d.date) return;

const parts=d.date.split("/");

if(parts.length!==3) return;

const m=parseInt(parts[1],10);

const a=parseInt(parts[2],10);

if(m===mois && a===annee){

total+=Number(d.montant||0);

}

});

alert(

"📊 Recettes du mois : "+

total.toLocaleString()+" FCFA"

);

}

// ===============================
// EXPORT JSON
// ===============================

window.exportFactureJSON = async function(id){

const snap=await getDoc(doc(db,"factures",id));

if(!snap.exists()) return;

const facture=snap.data();

const blob=new Blob(

[JSON.stringify(facture,null,2)],

{
type:"application/json"
}

);

const lien=document.createElement("a");

lien.href=URL.createObjectURL(blob);

lien.download=facture.numero+".json";

lien.click();

}

// ===============================
// DERNIÈRES FACTURES
// ===============================

async function dernieresFactures(){

const zone=document.getElementById("dernieresFactures");

if(!zone) return;

zone.innerHTML="";

const snapshot=await getDocs(

query(
collection(db,"factures"),
orderBy("dateCreation","desc")
)

);

let i=0;

snapshot.forEach((docu)=>{

if(i>=5) return;

const f=docu.data();

zone.innerHTML+=`

<div class="activity-item">

<div class="activity-left">

<i class="fa-solid fa-file-invoice-dollar"></i>

<div>

<h4>${escapeHtml(f.numero)}</h4>

<p>${escapeHtml(f.patient)}</p>

</div>

</div>

<span>

${Number(f.montant).toLocaleString()} FCFA

</span>

</div>

`;

i++;

});

}

// ===============================
// INITIALISATION
// ===============================

window.addEventListener("load",()=>{

calculerRecettes();

compteurFactures();

dernieresFactures();

});

// Fermetures de modales sur la page standalone facture.html
if(estStandalone){

const croixFacture=document.getElementById("closeFactureModal");

if(croixFacture) croixFacture.addEventListener("click",()=>fermerModalStandalone("factureModal"));


const annulerFacture=document.getElementById("annulerFacture");

if(annulerFacture) annulerFacture.addEventListener("click",()=>fermerModalStandalone("factureModal"));


const croixDetails=document.getElementById("closeFactureDetails");

if(croixDetails) croixDetails.addEventListener("click",()=>fermerModalStandalone("factureDetails"));


// Câblage du formulaire de la page standalone
const form=document.getElementById("factureForm");

if(form) form.addEventListener("submit",enregistrerFacture);

}

// ==========================================
// FIN DU MODULE FACTURES
// NET SOURIRE V1.0
// ==========================================
