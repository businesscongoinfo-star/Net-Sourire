// ==========================================
// NET SOURIRE
// PUBLICATIONS.JS
// PARTIE 1
// ==========================================

import { db } from "./firebase.js";
import { storage } from "./firebase.js";

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

const pageContent=document.getElementById("pageContent");

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

const zone=document.getElementById("listePublications");

if(!zone) return;

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

const tbody=document.getElementById("publicationTable");

const snapshot=await getDocs(

query(

collection(db,"publications"),

orderBy("dateCreation","desc")

)

);

tbody.innerHTML="";

snapshot.forEach((publication)=>{

const p=publication.data();

tbody.innerHTML+=`

<tr>

<td>

<img

src="${p.image}"

style="width:80px;height:80px;object-fit:cover;border-radius:10px;">

</td>

<td>${p.titre}</td>

<td>${p.date}</td>

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

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

📸 Nouvelle Publication

</h2>

</div>

<form id="publicationForm">

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
accept="image/*"
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

.getElementById("publicationForm")

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

const fichier=image.files[0];

if(!fichier){

alert("Veuillez choisir une image.");

return;

}

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

titre:titre.value,

description:description.value,

categorie:categorie.value,

image:url,

storagePath:"publications/"+nomFichier,

date:new Date().toLocaleDateString(),

dateCreation:serverTimestamp()

}

);

alert("✅ Publication enregistrée.");

ouvrirModulePublications();

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

pageContent.innerHTML = `

<section class="dashboard-box">

<div class="box-header">

<h2>📸 ${p.titre}</h2>

</div>

<img

src="${p.image}"

style="width:100%;max-height:500px;object-fit:cover;border-radius:15px;">

<br><br>

<p><strong>Catégorie :</strong> ${p.categorie}</p>

<p><strong>Date :</strong> ${p.date}</p>

<hr>

<p>${p.description}</p>

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

${p.description}

${p.image}`

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

window.open(

`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(p.image)}`,

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

<h4>${p.titre}</h4>

<p>${p.date}</p>

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

// ==========================================
// FIN DU MODULE PUBLICATIONS
// NET SOURIRE V1.0
// ==========================================
