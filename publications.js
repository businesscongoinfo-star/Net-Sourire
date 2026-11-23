// ==========================================
// NET SOURIRE
// PUBLICATIONS.JS
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
serverTimestamp,
onSnapshot
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {

ref,
uploadBytes,
getDownloadURL,
deleteObject

}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// ==========================================
// VARIABLES (contexte détecté)
// ==========================================

// Mode dashboard : contenu dynamique dans #pageContent
// Mode standalone : table #publicationTable + modales fixes du HTML
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
// MENU PUBLICATIONS
// ==========================================

const publicationBtn=document.getElementById("publicationBtn");

if(publicationBtn){

publicationBtn.addEventListener("click",(e)=>{
e.preventDefault();

ouvrirModulePublications();

});

}

// ==========================================
// OUVRIR MODULE
// ==========================================

export async function ouvrirModulePublications(){

if(estStandalone){

// Page publications.html : la table existe déjà, on ne fait que la charger
chargerPublications();

return;

}

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

📸 Gestion des Publications

</h2>

<button

id="btnNouvellePublication"

class="btn-primary">

+ Nouvelle Publication

</button>

</div>

<div class="search-box">

<i class="fa-solid fa-search"></i>

<input
id="recherchePublication"
placeholder="Rechercher une publication...">

</div>

<div id="listePublications">

<div class="loader"></div>

</div>

</section>

`;

chargerPublications();

}

// ==========================================
// CHARGER PUBLICATIONS
// ==========================================

async function chargerPublications(){

const tbody=document.getElementById("publicationTable");

if(!tbody) return;

// En mode dashboard, le gabarit est créé dynamiquement dans #listePublications
if(!estStandalone){

const zone=document.getElementById("listePublications");

if(zone){

zone.innerHTML=`

<table class="table">

<thead>

<tr>

<th>Image</th>

<th>Titre</th>

<th>Date</th>

<th>Actions</th>

</tr>

</thead>

<tbody id="publicationTable">

</tbody>

</table>

`;

}

}


const snapshot=await getDocs(

query(
collection(db,"publications"),
orderBy("dateCreation","desc")
)

);

tbody.innerHTML="";

snapshot.forEach((publication)=>{

const p=publication.data();

const url=p.url || p.image;

tbody.innerHTML+=`

<tr>

<td>

${url?`<img src="${escapeHtml(url)}" style="width:80px;height:80px;object-fit:cover;border-radius:10px;" alt="">`:"-"}

</td>

<td>${escapeHtml(p.titre)}</td>

<td>${escapeHtml(p.date)}</td>

<td>

<button
class="btn btn-success"
onclick="voirPublication('${publication.id}')">

Voir

</button>

<button
class="btn btn-warning"
onclick="modifierPublication('${publication.id}')">

Modifier

</button>

<button
class="btn btn-danger"
onclick="supprimerPublication('${publication.id}')">

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

Aucune publication enregistrée.

</td>

</tr>

`;

}

}

// ==========================================
// SYNCHRONISATION FIREBASE
// ==========================================

onSnapshot(
collection(db,"publications"),
()=>{

const table=document.getElementById("publicationTable");

if(table){

chargerPublications();

}

}

);

// ==========================================
// FIN PARTIE 1
// ==========================================
// ==========================================
// PUBLICATIONS.JS - PARTIE 2
// NOUVELLE PUBLICATION
// ==========================================

document.addEventListener("click",(e)=>{

if(e.target.id==="btnNouvellePublication"){

ouvrirFormulairePublication();

}

});

// ==========================================
// FORMULAIRE
// ==========================================

function ouvrirFormulairePublication(){

if(estStandalone){

// La page publications.html possède déjà #publicationModal et #publicationForm
const modal=document.getElementById("publicationModal");

if(modal) modal.style.display="flex";

return;

}

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

📸 Nouvelle Publication

</h2>

</div>

<form id="publicationFormDynamique">

<input
type="text"
id="titre"
placeholder="Titre de la publication"
required>

<textarea
id="description"
rows="6"
placeholder="Description"></textarea>

<select id="categorie">

<option>Avant / Après</option>

<option>Conseil dentaire</option>

<option>Promotion</option>

<option>Actualité</option>

</select>

<input
type="file"
id="image"
accept="image/*,video/*"
required>

<button
type="submit"
class="btn-primary">

Publier

</button>

<button
type="button"
class="btn btn-warning"
id="retourPublication">

Retour

</button>

</form>

</section>

`;

document
.getElementById("publicationFormDynamique")
.addEventListener("submit",enregistrerPublication);

document
.getElementById("retourPublication")
.addEventListener("click",ouvrirModulePublications);

}

// ==========================================
// ENREGISTRER
// ==========================================

async function enregistrerPublication(e){

e.preventDefault();

let titre="",description="",categorie="",fichier;

if(estStandalone){

// Champs de publications.html
titre=document.getElementById("titre").value.trim();

description=document.getElementById("description").value.trim();

categorie=document.getElementById("categorie").value;

fichier=document.getElementById("image").files[0];

}else{

titre=document.getElementById("titre").value.trim();

description=document.getElementById("description").value.trim();

categorie=document.getElementById("categorie").value;

fichier=document.getElementById("image").files[0];

}


if(!fichier){

alert("Veuillez choisir une image ou une vidéo.");

return;

}


const extension=fichier.name.split(".").pop().toLowerCase();

const type=(["mp4","webm","mov"].includes(extension))?"video":"image";

const nomFichier=
Date.now()+"_"+fichier.name;

const chemin=
ref(storage,"publications/"+nomFichier);

await uploadBytes(
chemin,
fichier
);

const url=
await getDownloadURL(chemin);

await addDoc(

collection(db,"publications"),

{

titre:titre,

description:description,

categorie:categorie,

url:url,

image:url,

type:type,

storagePath:"publications/"+nomFichier,

date:new Date().toLocaleDateString(),

dateCreation:serverTimestamp()

}

);

alert("✅ Publication enregistrée.");

if(estStandalone){

fermerModalStandalone("publicationModal");

}

ouvrirModulePublications();

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
// PUBLICATIONS.JS - PARTIE 3
// VOIR - MODIFIER - SUPPRIMER
// ==========================================

// ===============================
// VOIR PUBLICATION
// ===============================

window.voirPublication = async function(id){

const snap = await getDoc(doc(db,"publications",id));

if(!snap.exists()){

alert("Publication introuvable.");

return;

}

const p = snap.data();

const url=p.url || p.image;

if(estStandalone){

// Afficher dans la modale #publicationDetails
const zone=document.getElementById("publicationInfo");

if(zone){

zone.innerHTML=`

<h2>📸 ${escapeHtml(p.titre)}</h2>

${url?`<img src="${escapeHtml(url)}" style="width:100%;max-height:500px;object-fit:cover;border-radius:15px;" alt="">`:""}

<br><br>

<p><strong>Catégorie :</strong> ${escapeHtml(p.categorie || "-")}</p>

<p><strong>Date :</strong> ${escapeHtml(p.date)}</p>

<hr>

<p>${escapeHtml(p.description)}</p>

<br>

<button
class="btn btn-success"
onclick="partagerWhatsApp('${id}')">

💬 WhatsApp

</button>

<button
class="btn btn-primary"
onclick="partagerFacebook('${id}')">

📘 Facebook

</button>

`;

}

const modal=document.getElementById("publicationDetails");

if(modal) modal.style.display="flex";

return;

}

pageContent.innerHTML = `

<section class="dashboard-box">

<div class="box-header">

<h2>📸 ${escapeHtml(p.titre)}</h2>

</div>

${url?`<img src="${escapeHtml(url)}" style="width:100%;max-height:500px;object-fit:cover;border-radius:15px;" alt="">`:""}

<br><br>

<p><strong>Catégorie :</strong> ${escapeHtml(p.categorie || "-")}</p>

<p><strong>Date :</strong> ${escapeHtml(p.date)}</p>

<hr>

<p>${escapeHtml(p.description)}</p>

<br>

<button
class="btn btn-success"
onclick="partagerWhatsApp('${id}')">

💬 WhatsApp

</button>

<button
class="btn btn-primary"
onclick="partagerFacebook('${id}')">

📘 Facebook

</button>

<button
class="btn btn-warning"
onclick="ouvrirModulePublications()">

↩ Retour

</button>

</section>

`;

}

// ===============================
// MODIFIER
// ===============================

window.modifierPublication = async function(id){

const snap = await getDoc(doc(db,"publications",id));

if(!snap.exists()) return;

const p = snap.data();

const nouveauTitre = prompt(

"Titre",

p.titre

);

if(nouveauTitre===null) return;

const nouvelleDescription = prompt(

"Description",

p.description

);

if(nouvelleDescription===null) return;

await updateDoc(

doc(db,"publications",id),

{

titre:nouveauTitre,

description:nouvelleDescription

}

);

alert("✅ Publication modifiée.");

chargerPublications();

}

// ===============================
// SUPPRIMER
// ===============================

window.supprimerPublication = async function(id){

if(!confirm("Supprimer cette publication ?"))

return;

const snap = await getDoc(doc(db,"publications",id));

if(!snap.exists()) return;

const p = snap.data();

if(p.storagePath){

try{

await deleteObject(ref(storage,p.storagePath));

}catch(error){

console.log(error);

}

}

await deleteDoc(doc(db,"publications",id));

alert("Publication supprimée.");

chargerPublications();

}

// ===============================
// FIN PARTIE 3
// ===============================
// ==========================================
// PUBLICATIONS.JS - PARTIE 4
// PARTAGE - RECHERCHE - STATISTIQUES
// ==========================================

// ===============================
// PARTAGE WHATSAPP
// ===============================

window.partagerWhatsApp = async function(id){

const snap = await getDoc(doc(db,"publications",id));

if(!snap.exists()) return;

const p = snap.data();

const texte = encodeURIComponent(

`${p.titre}

${p.description}`

);

window.open(

`https://wa.me/?text=${texte}`,

"_blank"

);

};

// ===============================
// PARTAGE FACEBOOK
// ===============================

window.partagerFacebook = async function(id){

const snap = await getDoc(doc(db,"publications",id));

if(!snap.exists()) return;

const p = snap.data();

const url=p.url || p.image;

window.open(

`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,

"_blank"

);

};

// ===============================
// RECHERCHE
// ===============================

document.addEventListener("input",(e)=>{

if(e.target.id!=="recherchePublication") return;

const texte=e.target.value.toLowerCase();

document.querySelectorAll("#publicationTable tr")

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

async function compteurPublications(){

const snapshot=await getDocs(collection(db,"publications"));

const total=document.getElementById("totalPublications");

if(total){

total.innerHTML=snapshot.size;

}

}

// ===============================
// DERNIÈRES PUBLICATIONS
// ===============================

async function dernieresPublications(){

const zone=document.getElementById("dernieresPublications");

if(!zone) return;

zone.innerHTML="";

const snapshot=await getDocs(

query(

collection(db,"publications"),

orderBy("dateCreation","desc")

)

);

let i=0;

snapshot.forEach((docu)=>{

if(i>=5) return;

const p=docu.data();

zone.innerHTML+=`

<div class="activity-item">

<div class="activity-left">

<i class="fa-solid fa-image"></i>

<div>

<h4>${escapeHtml(p.titre)}</h4>

<p>${escapeHtml(p.date)}</p>

</div>

</div>

</div>

`;

i++;

});

}

// ===============================
// INITIALISATION
// ===============================

window.addEventListener("load",()=>{

compteurPublications();

dernieresPublications();

});

// Fermetures de modales sur la page standalone publications.html
if(estStandalone){

const croixPublication=document.getElementById("closePublicationModal");

if(croixPublication) croixPublication.addEventListener("click",()=>fermerModalStandalone("publicationModal"));


const annulerPublication=document.getElementById("annulerPublication");

if(annulerPublication) annulerPublication.addEventListener("click",()=>fermerModalStandalone("publicationModal"));


const croixDetails=document.getElementById("closePublicationDetails");

if(croixDetails) croixDetails.addEventListener("click",()=>fermerModalStandalone("publicationDetails"));


// Câblage du formulaire de la page standalone
const form=document.getElementById("publicationForm");

if(form) form.addEventListener("submit",enregistrerPublication);

}

// ==========================================
// FIN DU MODULE PUBLICATIONS
// NET SOURIRE V1.0
// ==========================================
