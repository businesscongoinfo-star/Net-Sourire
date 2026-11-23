// ==========================================
// NET SOURIRE
// patients.js
// PARTIE 1
// ==========================================

import { db, storage } from "./firebase.js";

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

import {
ref,
uploadBytes,
getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// ==========================================
// VARIABLES (contexte detectionné)
// ==========================================

// Mode dashboard : contenu dynamique dans #pageContent
// Mode standalone : table #patientsTable + modales fixes du HTML
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
// MENU PATIENTS
// ==========================================

const patientsBtn = document.getElementById("patientsBtn");

if(patientsBtn){

patientsBtn.addEventListener("click",(e)=>{
e.preventDefault();

ouvrirModulePatients();

});

}

// ==========================================
// OUVRIR LE MODULE
// ==========================================

export async function ouvrirModulePatients(){

if(estStandalone){

// Page patients.html : la table existe déjà, on ne fait que la charger
chargerPatients();

return;

}

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

👥 Gestion des Patients

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

<div id="listePatients">

<div class="loader"></div>

</div>

</section>

`;

chargerPatients();

}

// ==========================================
// FIN PARTIE 1
// ==========================================
// ==========================================
// CHARGER LES PATIENTS
// ==========================================

async function chargerPatients(){

const tbody=document.getElementById("patientsTable");

if(!tbody) return;

const q=query(
collection(db,"patients"),
orderBy("dateCreation","desc")
);

const snapshot=await getDocs(q);

tbody.innerHTML="";

snapshot.forEach((patient)=>{

const data=patient.data();

// En standalone, le tableau a 8 colonnes (N°, Photo, Nom, Téléphone, Sexe, Âge, Date, Actions)
// En dashboard, le gabarit est créé dynamiquement avec 5 colonnes.
if(estStandalone){

tbody.innerHTML+=`

<tr>

<td>${snapshot.indexOf(patient)+1}</td>

<td><img src="${data.photo || "images/docteur1.jpg"}" alt="Photo" style="width:40px;height:40px;border-radius:50%;object-fit:cover;"></td>

<td>${escapeHtml(data.nom || "")}</td>

<td>${escapeHtml(data.telephone || "")}</td>

<td>${escapeHtml(data.sexe || "")}</td>

<td>${age(data.naissance || data.dateNaissance)}</td>

<td>${formatDate(data.dateCreation)}</td>

<td>

<button
class="btn btn-success"
onclick="voirPatient('${patient.id}')">

👁 Voir

</button>

<button
class="btn btn-warning"
onclick="modifierPatient('${patient.id}')">

✏ Modifier

</button>

<button
class="btn btn-danger"
onclick="supprimerPatient('${patient.id}')">

🗑 Supprimer

</button>

</td>

</tr>

`;

}else{

tbody.innerHTML+=`

<tr>

<td>${escapeHtml(data.nom || "")}</td>

<td>${escapeHtml(data.telephone || "")}</td>

<td>${escapeHtml(data.email || "")}</td>

<td>${escapeHtml(data.sexe || "")}</td>

<td>

<button
class="btn btn-success"
onclick="voirPatient('${patient.id}')">

👁 Voir

</button>

<button
class="btn btn-warning"
onclick="modifierPatient('${patient.id}')">

✏ Modifier

</button>

<button
class="btn btn-danger"
onclick="supprimerPatient('${patient.id}')">

🗑 Supprimer

</button>

</td>

</tr>

`;

}

});

if(snapshot.empty){

tbody.innerHTML=`

<tr>

<td colspan="${estStandalone?8:5}" style="text-align:center;padding:30px;">

Aucun patient enregistré.

</td>

</tr>

`;

}

}

// Calcul d'âge depuis la date de naissance (format AAAA-MM-JJ)
function age(naissance){

if(!naissance) return "-";

const d=new Date(naissance);

if(isNaN(d)) return "-";

const maintenant=new Date();

let a=maintenant.getFullYear()-d.getFullYear();

const m=maintenant.getMonth()-d.getMonth();

if(m<0||(m===0&&maintenant.getDate()<d.getDate())) a--;

return a>=0?a:"-";

}

// Format de date pour les documents Firestore
function formatDate(valeur){

if(!valeur) return "-";

if(typeof valeur.toDate === "function"){

return valeur.toDate().toLocaleDateString();

}

return escapeHtml(valeur);

}

// ==========================================
// RAFRAÎCHISSEMENT TEMPS RÉEL
// ==========================================

onSnapshot(
collection(db,"patients"),
()=>{

const table=document.getElementById("patientsTable");

if(table){

chargerPatients();

}

}

);

// ==========================================
// FIN PARTIE 2
// ==========================================
// ==========================================
// AJOUT D'UN PATIENT
// ==========================================

document.addEventListener("click", async (e)=>{

if(e.target.id==="btnAjouterPatient"){

ouvrirFormulairePatient();

}

});

function ouvrirFormulairePatient(){

if(estStandalone){

// La page patients.html possède déjà #patientModal et #patientForm
const modal=document.getElementById("patientModal");

if(modal) modal.style.display="flex";

const form=document.getElementById("patientForm");

if(form){

form.onsubmit=enregistrerPatient;

}

return;

}

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

➕ Nouveau Patient

</h2>

</div>

<form id="patientForm">

<input
type="text"
id="nom"
placeholder="Nom complet"
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
id="naissance">

<select id="sexe">

<option value="">Sexe</option>

<option>Homme</option>

<option>Femme</option>

</select>

<input
type="text"
id="profession"
placeholder="Profession">

<textarea
id="adresse"
placeholder="Adresse complète"></textarea>

<button
type="submit"
class="btn-primary">

💾 Enregistrer

</button>

<button
type="button"
class="btn btn-warning"
id="retourListe">

↩ Retour

</button>

</form>

</section>

`;

document
.getElementById("patientForm")
.addEventListener("submit",enregistrerPatient);

document
.getElementById("retourListe")
.addEventListener("click",ouvrirModulePatients);

}

// ==========================================
// ENREGISTRER
// ==========================================

async function enregistrerPatient(e){

e.preventDefault();

let nom="",telephone="",email="",naissance="",sexe="",profession="",adresse="";

if(estStandalone){

// Champs de patients.html : nom, telephone, email, sexe, dateNaissance, profession, adresse
nom=document.getElementById("nom").value.trim();

telephone=document.getElementById("telephone").value.trim();

email=document.getElementById("email").value.trim();

naissance=document.getElementById("dateNaissance").value;

sexe=document.getElementById("sexe").value;

profession=document.getElementById("profession").value.trim();

adresse=document.getElementById("adresse").value.trim();

}else{

nom=document.getElementById("nom").value.trim();

telephone=document.getElementById("telephone").value.trim();

email=document.getElementById("email").value.trim();

naissance=document.getElementById("naissance").value;

sexe=document.getElementById("sexe").value;

profession=document.getElementById("profession").value.trim();

adresse=document.getElementById("adresse").value.trim();

}


await addDoc(
collection(db,"patients"),
{
nom:nom,
telephone:telephone,
email:email,
naissance:naissance,
sexe:sexe,
profession:profession,
adresse:adresse,
dateCreation:serverTimestamp()
}
);

alert("✅ Patient enregistré avec succès.");

if(estStandalone){

fermerModalStandalone("patientModal");

}

ouvrirModulePatients();

}

// Ferme un modal en mode standalone (patients.html utilise display:flex)
function fermerModalStandalone(id){

const modal=document.getElementById(id);

if(modal) modal.style.display="none";

}

// ==========================================
// FIN PARTIE 3
// ==========================================
// ==========================================
// MODIFIER UN PATIENT
// ==========================================

window.modifierPatient = async function(id){

const ref = doc(db,"patients",id);

const snap = await getDoc(ref);

if(!snap.exists()){

alert("Patient introuvable.");

return;

}

const p = snap.data();

if(estStandalone){

// Pré-remplir le formulaire de modification dans la modale patient
const form=document.getElementById("patientForm");

if(form){

document.getElementById("nom").value=p.nom||"";

document.getElementById("telephone").value=p.telephone||"";

document.getElementById("email").value=p.email||"";

if(document.getElementById("dateNaissance")) document.getElementById("dateNaissance").value=p.naissance||"";

if(document.getElementById("sexe")) document.getElementById("sexe").value=p.sexe||"";

if(document.getElementById("profession")) document.getElementById("profession").value=p.profession||"";

if(document.getElementById("adresse")) document.getElementById("adresse").value=p.adresse||"";


const modal=document.getElementById("patientModal");

if(modal){

const titre=modal.querySelector("h2");

if(titre) titre.innerHTML="<i class=\"fa-solid fa-user-pen\"></i> Modifier le patient";

modal.style.display="flex";

}

// Sauvegarde de l'id pour la mise à jour
form.dataset.patientId=id;

}

return;

}

pageContent.innerHTML = `

<section class="dashboard-box">

<div class="box-header">

<h2>

✏ Modifier le Patient

</h2>

</div>

<form id="modifierPatientForm">

<input
type="text"
id="nom"
value="${p.nom || ""}"
required>

<input
type="text"
id="telephone"
value="${p.telephone || ""}"
required>

<input
type="email"
id="email"
value="${p.email || ""}">

<input
type="date"
id="naissance"
value="${p.naissance || ""}">

<select id="sexe">

<option ${p.sexe==="Homme"?"selected":""}>Homme</option>

<option ${p.sexe==="Femme"?"selected":""}>Femme</option>

</select>

<input
type="text"
id="profession"
value="${p.profession || ""}">

<textarea
id="adresse">${p.adresse || ""}</textarea>

<button
class="btn-primary"
type="submit">

💾 Enregistrer les modifications

</button>

<button
type="button"
class="btn btn-warning"
id="annulerModification">

↩ Annuler

</button>

</form>

</section>

`;

document
.getElementById("modifierPatientForm")
.addEventListener("submit",async(e)=>{
e.preventDefault();

await updateDoc(ref,{
nom:nom.value,
telephone:telephone.value,
email:email.value,
naissance:naissance.value,
sexe:sexe.value,
profession:profession.value,
adresse:adresse.value
});

alert("✅ Patient modifié.");

ouvrirModulePatients();

});

document
.getElementById("annulerModification")
.addEventListener("click",ouvrirModulePatients);

}

// ==========================================
// FIN PARTIE 4
// ==========================================
// ==========================================
// SUPPRIMER UN PATIENT
// ==========================================

window.supprimerPatient = async function(id){

const confirmation = confirm(

"Voulez-vous vraiment supprimer ce patient ?"

);

if(!confirmation) return;

try{

await deleteDoc(doc(db,"patients",id));

alert("✅ Patient supprimé avec succès.");

ouvrirModulePatients();

}catch(error){

console.error(error);

alert("Erreur lors de la suppression.");

}

}

// ==========================================
// DOSSIER PATIENT
// ==========================================

window.voirPatient = async function(id){

const ref = doc(db,"patients",id);

const snap = await getDoc(ref);

if(!snap.exists()){

alert("Patient introuvable.");

return;

}

const p = snap.data();

if(estStandalone){

// Afficher le dossier dans la modale #patientDetails
const zone=document.getElementById("patientInfo");

if(zone){

zone.innerHTML=`

<div class="profile-card">

<h2>${escapeHtml(p.nom)}</h2>

<p><b>Téléphone :</b> ${escapeHtml(p.telephone)}</p>

<p><b>Email :</b> ${escapeHtml(p.email||"-")}</p>

<p><b>Sexe :</b> ${escapeHtml(p.sexe||"-")}</p>

<p><b>Date de naissance :</b> ${escapeHtml(p.naissance||"-")}</p>

<p><b>Profession :</b> ${escapeHtml(p.profession||"-")}</p>

<p><b>Adresse :</b> ${escapeHtml(p.adresse||"-")}</p>

</div>

<br>

<div class="quick-actions">

<div class="quick-card" onclick="nouvelleOrdonnance('${id}')">

<i class="fa-solid fa-file-prescription"></i>

<h3>Ordonnance</h3>

<p>Créer une ordonnance</p>

</div>

<div class="quick-card" onclick="nouvelleFacture('${id}')">

<i class="fa-solid fa-file-invoice-dollar"></i>

<h3>Facture</h3>

<p>Créer une facture</p>

</div>

</div>

`;

}

const modal=document.getElementById("patientDetails");

if(modal) modal.style.display="flex";

return;

}

pageContent.innerHTML = `

<section class="dashboard-box">

<div class="box-header">

<h2>

📂 Dossier du Patient

</h2>

<button
class="btn btn-warning"
onclick="ouvrirModulePatients()">

← Retour

</button>

</div>

<div class="profile-card">

<div>

<h2>${escapeHtml(p.nom)}</h2>

<p><b>Téléphone :</b> ${escapeHtml(p.telephone)}</p>

<p><b>Email :</b> ${escapeHtml(p.email||"-")}</p>

<p><b>Sexe :</b> ${escapeHtml(p.sexe||"-")}</p>

<p><b>Date de naissance :</b> ${escapeHtml(p.naissance||"-")}</p>

<p><b>Profession :</b> ${escapeHtml(p.profession||"-")}</p>

<p><b>Adresse :</b> ${escapeHtml(p.adresse||"-")}</p>

</div>

</div>

<br>

<div class="quick-actions">

<div class="quick-card" onclick="nouvelleOrdonnance('${id}')">

<i class="fa-solid fa-file-prescription"></i>

<h3>Ordonnance</h3>

<p>Créer une ordonnance</p>

</div>

<div class="quick-card" onclick="nouvelleFacture('${id}')">

<i class="fa-solid fa-file-invoice-dollar"></i>

<h3>Facture</h3>

<p>Créer une facture</p>

</div>

<div class="quick-card" onclick="nouveauTraitement('${id}')">

<i class="fa-solid fa-tooth"></i>

<h3>Traitement</h3>

<p>Ajouter un soin</p>

</div>

<div class="quick-card" onclick="ajouterRadiographie('${id}')">

<i class="fa-solid fa-x-ray"></i>

<h3>Radiographie</h3>

<p>Ajouter une image</p>

</div>

</div>

<hr>

<h3>🦷 Historique des traitements</h3>

<div id="historiqueSoins">

<div class="loader"></div>

</div>

<hr>

<h3>🩻 Radiographies</h3>

<div id="listeRadiographies">

<div class="loader"></div>

</div>

</section>

`;

chargerHistorique(id);

chargerRadiographies(id);

}

// ==========================================
// FIN PARTIE 5
// ==========================================
// ==========================================
// RECHERCHE PATIENTS
// ==========================================

document.addEventListener("input",(e)=>{

if(e.target.id!=="recherchePatient") return;

const texte=e.target.value.toLowerCase();

const lignes=document.querySelectorAll("#patientsTable tr");

lignes.forEach((ligne)=>{

const contenu=ligne.innerText.toLowerCase();

ligne.style.display=contenu.includes(texte) ? "" : "none";

});

});

// ==========================================
// STATISTIQUES PATIENTS
// ==========================================

async function chargerStatistiquesPatients(){

const snapshot=await getDocs(collection(db,"patients"));

const total=snapshot.size;

const compteur=document.getElementById("totalPatients");

if(compteur){

compteur.innerHTML=total;

}

}

// ==========================================
// DERNIÈRES VISITES
// ==========================================

async function chargerDerniersPatients(){

const zone=document.getElementById("derniersPatients");

if(!zone) return;

zone.innerHTML="";

const q=query(
collection(db,"patients"),
orderBy("dateCreation","desc")
);

const snapshot=await getDocs(q);

let i=0;

snapshot.forEach((docu)=>{

if(i>=5) return;

const data=docu.data();

zone.innerHTML+=`

<div class="activity-item">

<div class="activity-left">

<i class="fa-solid fa-user"></i>

<div>

<h4>${escapeHtml(data.nom)}</h4>

<p>${escapeHtml(data.telephone)}</p>

</div>

</div>

<span class="activity-time">

Nouveau

</span>

</div>

`;

i++;

});

}

// ==========================================
// EXPORT CSV
// ==========================================

window.exporterPatientsCSV = async function(){

const snapshot=await getDocs(collection(db,"patients"));

let csv="Nom,Téléphone,Email,Sexe,Profession\n";

snapshot.forEach((docu)=>{

const p=docu.data();

csv+=`"${p.nom}","${p.telephone}","${p.email}","${p.sexe}","${p.profession}"\n`;

});

const blob=new Blob([csv],{
type:"text/csv;charset=utf-8;"
});

const lien=document.createElement("a");

lien.href=URL.createObjectURL(blob);

lien.download="patients.csv";

lien.click();

};

// ==========================================
// ACTUALISATION
// ==========================================

chargerStatistiquesPatients();

chargerDerniersPatients();

// ==========================================
// FIN PARTIE 6
// ==========================================
// ==========================================
// HISTORIQUE COMPLET DU PATIENT
// PARTIE 7
// ==========================================

window.afficherHistoriquePatient = async function(patientId){

const historique=document.getElementById("historiqueComplet");

if(!historique) return;

historique.innerHTML="<div class='loader'></div>";

let html="";

// ===============================
// RENDEZ-VOUS
// ===============================

const rdv=await getDocs(

query(
collection(db,"rendezvous"),
where("patientId","==",patientId)
)

);

html+=`

<h3>📅 Rendez-vous</h3>

`;

if(rdv.empty){

html+="<p>Aucun rendez-vous.</p>";

}else{

rdv.forEach((docu)=>{

const d=docu.data();

html+=`

<div class="activity-item">

<div class="activity-left">

<i class="fa-solid fa-calendar-check"></i>

<div>

<h4>${escapeHtml(d.date)}</h4>

<p>${escapeHtml(d.heure)}</p>

</div>

</div>

<span class="badge badge-primary">

${escapeHtml(d.statut||"En attente")}

</span>

</div>

`;

});

}

// ===============================
// ORDONNANCES
// ===============================

const ordonnances=await getDocs(

query(
collection(db,"ordonnances"),
where("patientId","==",patientId)
)

);

html+=`

<hr>

<h3>💊 Ordonnances</h3>

`;

if(ordonnances.empty){

html+="<p>Aucune ordonnance.</p>";

}else{

ordonnances.forEach((docu)=>{

const d=docu.data();

html+=`

<div class="activity-item">

<div class="activity-left">

<i class="fa-solid fa-file-prescription"></i>

<div>

<h4>${escapeHtml(d.date)}</h4>

<p>${escapeHtml(d.medecin)}</p>

</div>

</div>

</div>

`;

});

}

// ===============================
// FACTURES
// ===============================

const factures=await getDocs(

query(
collection(db,"factures"),
where("patientId","==",patientId)
)

);

html+=`

<hr>

<h3>🧾 Factures</h3>

`;

if(factures.empty){

html+="<p>Aucune facture.</p>";

}else{

factures.forEach((docu)=>{

const d=docu.data();

html+=`

<div class="activity-item">

<div class="activity-left">

<i class="fa-solid fa-file-invoice-dollar"></i>

<div>

<h4>${Number(d.montant).toLocaleString()} FCFA</h4>

<p>${escapeHtml(d.date)}</p>

</div>

</div>

</div>

`;

});

}

historique.innerHTML=html;

}

// ==========================================
// FIN PARTIE 7
// ==========================================
// ==========================================
// PARTIE 8
// IMPRESSION - EMAIL - WHATSAPP
// ==========================================

// ===============================
// PDF
// ===============================

window.imprimerDossierPatient = function(){

window.print();

}

// ===============================
// EMAIL
// ===============================

window.envoyerEmailPatient = function(email){

if(!email){

alert("Adresse e-mail introuvable.");

return;

}

window.location.href=
"mailto:"+email+
"?subject=Dossier médical Net Sourire";

}

// ===============================
// WHATSAPP
// ===============================

window.envoyerWhatsAppPatient = function(numero){

if(!numero){

alert("Numéro introuvable.");

return;

}

numero=numero.replace(/\s+/g,"");

window.open(
"https://wa.me/"+numero,
"_blank"
);

}

// ===============================
// EXPORT JSON
// ===============================

window.exportPatientJSON = async function(id){

const ref=doc(db,"patients",id);

const snap=await getDoc(ref);

if(!snap.exists()) return;

const data=snap.data();

const blob=new Blob(
[JSON.stringify(data,null,2)],
{
type:"application/json"
}
);

const lien=document.createElement("a");

lien.href=URL.createObjectURL(blob);

lien.download=data.nom+".json";

lien.click();

}

// ===============================
// SYNCHRONISATION FIREBASE
// ===============================

onSnapshot(
collection(db,"patients"),
()=>{

const table=document.getElementById("patientsTable");

if(table){

chargerPatients();

}

const compteur=document.getElementById("totalPatients");

if(compteur){

chargerStatistiquesPatients();

}

}

);

// ===============================
// INITIALISATION
// ===============================

window.addEventListener("load",()=>{

chargerStatistiquesPatients();

});

// Fermetures de modales sur la page standalone patients.html
if(estStandalone){

const fermer=(id)=>{

const modal=document.getElementById(id);

if(modal) modal.style.display="none";

};


const croixPatient=document.getElementById("closeModal");

if(croixPatient) croixPatient.addEventListener("click",()=>fermer("patientModal"));


const annuler=document.getElementById("annulerPatient");

if(annuler) annuler.addEventListener("click",()=>fermer("patientModal"));


const croixDetails=document.getElementById("closePatientDetails");

if(croixDetails) croixDetails.addEventListener("click",()=>fermer("patientDetails"));

}

// ==========================================
// FIN DU MODULE PATIENTS
// NET SOURIRE
// VERSION 1.0
// ==========================================
