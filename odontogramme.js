// ==========================================
// NET SOURIRE
// ODONTOGRAMME.JS
// PARTIE 1
// ==========================================

import { db } from "./firebase.js";

import {
collection,
addDoc,
getDocs,
doc,
query,
where,
serverTimestamp
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const pageContent=document.getElementById("pageContent");

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
// MENU ODONTOGRAMME
// ==========================================

const odontogrammeBtn=document.getElementById("odontogrammeBtn");

if(odontogrammeBtn){

odontogrammeBtn.addEventListener("click",(e)=>{

e.preventDefault();

ouvrirOdontogramme();

});

}

// ==========================================
// OUVRIR ODONTOGRAMME
// ==========================================

export function ouvrirOdontogramme(patientId=""){

if(window.activerMenu){

window.activerMenu("odontogrammeBtn");

}

let dents="";

for(let i=1;i<=32;i++){

dents+=`

<button

class="dent"

onclick="selectionnerDent(${i},'${escapeHtml(patientId)}')">

${i}

</button>

`;

}

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

🦷 Odontogramme

</h2>

</div>

<div class="odontogramme">

${dents}

</div>

<hr>

<div id="detailDent">

<p>

Cliquez sur une dent pour afficher les informations.

</p>

</div>

</section>

`;

}

// ==========================================
// SÉLECTION D'UNE DENT
// ==========================================



// ==========================================
// FIN PARTIE 1
// ==========================================
// ==========================================
// ODONTOGRAMME.JS - PARTIE 2
// AJOUT DES SOINS PAR DENT
// ==========================================

// ===============================
// AJOUTER UN SOIN
// ===============================

window.ajouterSoin = async function(patientId,numeroDent){

const type = prompt(
"Type de soin (Carie, Détartrage, Extraction, Dévitalisation, Implant...)"
);

if(!type) return;

const observation = prompt("Observation");

await addDoc(

collection(db,"soinsDentaires"),

{

patientId,

dent:numeroDent,

type,

observation,

date:new Date().toLocaleDateString(),

dateCreation:serverTimestamp()

}

);

alert("✅ Soin enregistré.");

chargerSoinsDent(patientId,numeroDent);

}

// ===============================
// CHARGER LES SOINS
// ===============================

async function chargerSoinsDent(patientId,numeroDent){

const zone=document.getElementById("listeSoinsDent");

if(!zone) return;

zone.innerHTML="";

const snapshot=await getDocs(

query(

collection(db,"soinsDentaires"),

where("patientId","==",patientId),

where("dent","==",numeroDent)

)

);

if(snapshot.empty){

zone.innerHTML="<p>Aucun soin enregistré pour cette dent.</p>";

return;

}

snapshot.forEach((docu)=>{

const soin=docu.data();

zone.innerHTML+=`

<div class="activity-item">

<div class="activity-left">

<i class="fa-solid fa-tooth"></i>

<div>

<h4>${escapeHtml(soin.type)}</h4>

<p>${escapeHtml(soin.observation || "")}</p>

<small>${escapeHtml(soin.date)}</small>

</div>

</div>

</div>

`;

});

}

// ===============================
// COLORATION DES DENTS
// ===============================

window.colorerDent=function(numero,couleur){

const boutons=document.querySelectorAll(".dent");

boutons.forEach((dent)=>{

if(dent.textContent==numero){

dent.style.background=couleur;

dent.style.color="#fff";

}

});

}

// ==========================================
// FIN PARTIE 2
// ==========================================
// ==========================================
// ODONTOGRAMME.JS - PARTIE 3
// ETAT DES DENTS
// ==========================================

// ===============================
// MODIFIER L'ÉTAT D'UNE DENT
// ===============================

window.changerEtatDent = async function(patientId,dent){

const etat = prompt(

"État de la dent :\n\nSaine\nCarie\nExtraction\nCouronne\nImplant\nDévitalisée"

);

if(!etat) return;

let couleur="#28a745";

switch(etat){

case "Carie":
couleur="#dc3545";
break;

case "Extraction":
couleur="#6c757d";
break;

case "Couronne":
couleur="#ffc107";
break;

case "Implant":
couleur="#0dcaf0";
break;

case "Dévitalisée":
couleur="#6f42c1";
break;

default:
couleur="#198754";

}

await addDoc(

collection(db,"etatDents"),

{

patientId,

dent,

etat,

couleur,

date:new Date().toLocaleDateString(),

dateCreation:serverTimestamp()

}

);

colorerDent(dent,couleur);

alert("État enregistré.");

}

// ===============================
// CHARGER LES ÉTATS
// ===============================

async function chargerEtatDents(patientId){

const snapshot = await getDocs(

query(

collection(db,"etatDents"),

where("patientId","==",patientId)

)

);

snapshot.forEach((docu)=>{

const d=docu.data();

colorerDent(

d.dent,

d.couleur

);

});

}

// ===============================
// DÉTAIL D'UNE DENT
// ===============================



// ===============================
// INITIALISATION
// ===============================

window.addEventListener("load",()=>{

if(window.patientActuel){

chargerEtatDents(window.patientActuel);

}

});

// ==========================================
// FIN PARTIE 3
// ==========================================
// ==========================================
// ODONTOGRAMME.JS - PARTIE 4
// PHOTOS - NOTES - HISTORIQUE
// ==========================================

import { storage } from "./firebase.js";

import {
ref,
uploadBytes,
getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// ===============================
// AJOUTER PHOTO
// ===============================

window.ajouterPhotoDent = async function(patientId,dent){

const input=document.createElement("input");

input.type="file";

input.accept="image/*";

input.onchange=async(e)=>{

const fichier=e.target.files[0];

if(!fichier) return;

const chemin=ref(

storage,

`dents/${patientId}/${dent}/${Date.now()}_${fichier.name}`

);

await uploadBytes(chemin,fichier);

const url=await getDownloadURL(chemin);

await addDoc(

collection(db,"photosDents"),

{

patientId,

dent,

photo:url,

date:new Date().toLocaleDateString(),

dateCreation:serverTimestamp()

}

);

alert("📷 Photo enregistrée.");

chargerPhotosDent(patientId,dent);

};

input.click();

};

// ===============================
// CHARGER PHOTOS
// ===============================

async function chargerPhotosDent(patientId,dent){

const zone=document.getElementById("photosDent");

if(!zone) return;

zone.innerHTML="";

const snapshot=await getDocs(

query(

collection(db,"photosDents"),

where("patientId","==",patientId),

where("dent","==",dent)

)

);

snapshot.forEach((docu)=>{

const d=docu.data();

zone.innerHTML+=`

<img

src="${escapeHtml(d.photo)}"

style="width:150px;height:150px;object-fit:cover;border-radius:12px;margin:8px;">

`;

});

}

// ===============================
// NOTE CLINIQUE
// ===============================

window.ajouterNoteDent = async function(patientId,dent){

const note=prompt("Note clinique");

if(!note) return;

await addDoc(

collection(db,"notesDent"),

{

patientId,

dent,

note,

date:new Date().toLocaleDateString(),

dateCreation:serverTimestamp()

}

);

alert("📝 Note enregistrée.");

};

// ===============================
// HISTORIQUE COMPLET
// ===============================

window.afficherHistoriqueDent = async function(patientId,dent){

const zone=document.getElementById("historiqueDent");

if(!zone) return;

zone.innerHTML="";

const snapshot=await getDocs(

query(

collection(db,"soinsDentaires"),

where("patientId","==",patientId),

where("dent","==",dent)

)

);

snapshot.forEach((docu)=>{

const soin=docu.data();

zone.innerHTML+=`

<div class="activity-item">

<div class="activity-left">

<i class="fa-solid fa-tooth"></i>

<div>

<h4>${escapeHtml(soin.type)}</h4>

<p>${escapeHtml(soin.observation)}</p>

<small>${escapeHtml(soin.date)}</small>

</div>

</div>

</div>

`;

});

};

// ==========================================
// MISE À JOUR DE LA FONCTION
// selectionnerDent()
// ==========================================

window.selectionnerDent = async function(numero,patientId){

const detail=document.getElementById("detailDent");

detail.innerHTML=`

<h3>🦷 Dent N° ${numero}</h3>

<br>

<button class="btn btn-success"
onclick="ajouterSoin('${patientId}',${numero})">

➕ Ajouter un soin

</button>

<button class="btn btn-warning"
onclick="changerEtatDent('${patientId}',${numero})">

🎨 État

</button>

<button class="btn btn-primary"
onclick="ajouterPhotoDent('${patientId}',${numero})">

📷 Photo

</button>

<button class="btn btn-info"
onclick="ajouterNoteDent('${patientId}',${numero})">

📝 Note

</button>

<hr>

<h4>Historique</h4>

<div id="historiqueDent"></div>

<hr>

<h4>Photos</h4>

<div id="photosDent"></div>

`;

chargerSoinsDent(patientId,numero);

chargerPhotosDent(patientId,numero);

afficherHistoriqueDent(patientId,numero);

};

// ==========================================
// FIN DU MODULE ODONTOGRAMME
// NET SOURIRE V1.0
// ==========================================
