// ==========================================
// NET SOURIRE
// PATIENT-DASHBOARD.JS
// PARTIE 1
// ==========================================

import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
doc,
getDoc,
collection,
query,
where,
orderBy,
limit,
getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Échappement anti-XSS
function escapeHtml(valeur){

return String(valeur ?? "")

.replace(/&/g,"&amp;")

.replace(/</g,"&lt;")

.replace(/>/g,"&gt;")

.replace(/"/g,"&quot;")

.replace(/'/g,"&#39;");

}

// Vérifie si un document rendez-vous/ordonnance/facture appartient au patient
// (par patientId, ou par correspondance du nom du patient)
function documentEstPourPatient(data,uid,nomPatient){

if(data.patientId && data.patientId===uid) return true;

if(!nomPatient) return false;

const nomDoc=data.patientNom||data.patient;

return typeof nomDoc==="string" &&

nomDoc.trim().toLowerCase()===nomPatient.trim().toLowerCase();

}

// ==========================================
// VERIFICATION CONNEXION
// ==========================================

onAuthStateChanged(auth,async(user)=>{

if(!user){

window.location.href="patient-login.html";

return;

}

chargerPatient(user.uid);

chargerStatistiques(user.uid);

chargerProchainRendezvous(user.uid);

chargerNotifications(user.uid);

chargerHistorique(user.uid);

});

// ==========================================
// INFORMATIONS PATIENT
// ==========================================

async function chargerPatient(uid){

const snap=await getDoc(

doc(db,"patients",uid)

);

if(!snap.exists()) return;

const patient=snap.data();

document.getElementById("patientNom").textContent=

patient.nom || "Patient";

}

// ==========================================
// FIN PARTIE 1
// ==========================================
// ==========================================
// NET SOURIRE
// PATIENT-DASHBOARD.JS
// PARTIE 2
// ==========================================

// ==========================================
// STATISTIQUES
// ==========================================

async function chargerStatistiques(uid){

// Nom du patient pour correspondance
const patientSnap=await getDoc(doc(db,"patients",uid));
const nomPatient=patientSnap.exists()?patientSnap.data().nom:"";

// Rendez-vous

const rdvQuery=query(

collection(db,"rendezvous"),

where("patientId","==",uid)

);

const rdvSnap=await getDocs(rdvQuery);

let totalRdv=rdvSnap.size;

// Compat : documents sans patientId mais liés au nom

if(nomPatient){

const rdvTout=await getDocs(collection(db,"rendezvous"));

rdvTout.forEach(d=>{

if(!d.data().patientId && documentEstPourPatient(d.data(),uid,nomPatient)) totalRdv++;

});

}

document.getElementById("totalRendezvous").textContent=

totalRdv;

// Ordonnances

const ordonnanceQuery=query(

collection(db,"ordonnances"),

where("patientId","==",uid)

);

const ordonnanceSnap=await getDocs(ordonnanceQuery);

let totalOrdonnances=ordonnanceSnap.size;

if(nomPatient){

const oTout=await getDocs(collection(db,"ordonnances"));

oTout.forEach(d=>{

if(!d.data().patientId && documentEstPourPatient(d.data(),uid,nomPatient)) totalOrdonnances++;

});

}

document.getElementById("totalOrdonnances").textContent=

totalOrdonnances;

// Factures

const factureQuery=query(

collection(db,"factures"),

where("patientId","==",uid)

);

const factureSnap=await getDocs(factureQuery);

let totalFactures=factureSnap.size;

if(nomPatient){

const fTout=await getDocs(collection(db,"factures"));

fTout.forEach(d=>{

if(!d.data().patientId && documentEstPourPatient(d.data(),uid,nomPatient)) totalFactures++;

});

}

document.getElementById("totalFactures").textContent=

totalFactures;

// Notifications

const notificationQuery=query(

collection(db,"notifications"),

where("patientId","==",uid)

);

const notificationSnap=await getDocs(notificationQuery);

document.getElementById("totalNotifications").textContent=

notificationSnap.size;

}

// ==========================================
// PROCHAIN RENDEZ-VOUS
// ==========================================

async function chargerProchainRendezvous(uid){

// Priorité : patientId, sinon correspondance par nom
const patientSnap=await getDoc(doc(db,"patients",uid));
const nomPatient=patientSnap.exists()?patientSnap.data().nom:"";

const rdvQuery=query(

collection(db,"rendezvous"),

where("patientId","==",uid),

orderBy("date","asc"),

limit(1)

);

const snap=await getDocs(rdvQuery);

let prochain=null;

if(!snap.empty){

prochain=snap.docs[0].data();

}else if(nomPatient){

// Compat : documents sans patientId

const tout=await getDocs(collection(db,"rendezvous"));

const valides=tout.docs

.map(d=>({id:d.id,data:d.data()}))

.filter(d=>documentEstPourPatient(d.data,uid,nomPatient))

.sort((a,b)=>String(a.data.date||"").localeCompare(String(b.data.date||"")));

if(valides.length>0){

prochain=valides[0].data;

}

}


const container=document.getElementById("prochainRendezvous");

container.innerHTML="";

if(!prochain){

container.innerHTML="<p>Aucun rendez-vous programmé.</p>";

return;

}

container.innerHTML=`

<div class="rdv-card">

<h3>${escapeHtml(prochain.date)}</h3>

<p><strong>Heure :</strong> ${escapeHtml(prochain.heure)}</p>

<p><strong>Dentiste :</strong> ${escapeHtml(prochain.dentiste||"-")}</p>

<p><strong>Statut :</strong> ${escapeHtml(prochain.statut||"En attente")}</p>

</div>

`;

}

// ==========================================
// FIN PARTIE 2
// ==========================================
// ==========================================
// NET SOURIRE
// PATIENT-DASHBOARD.JS
// PARTIE 3
// ==========================================

// ==========================================
// NOTIFICATIONS
// ==========================================

async function chargerNotifications(uid){

const notificationQuery=query(

collection(db,"notifications"),

where("patientId","==",uid),

orderBy("date","desc"),

limit(5)

);

const snap=await getDocs(notificationQuery);

const container=document.getElementById("listeNotifications");

container.innerHTML="";

if(snap.empty){

container.innerHTML="<p>Aucune notification disponible.</p>";

return;

}

snap.forEach(doc=>{

const notification=doc.data();

container.innerHTML+=`

<div class="notification-card">

<div class="notification-icon">

<i class="fa-solid fa-bell"></i>

</div>

<div class="notification-content">

<h4>${escapeHtml(notification.titre)}</h4>

<p>${escapeHtml(notification.message)}</p>

<small>${escapeHtml(notification.date)}</small>

</div>

</div>

`;

});

}

// ==========================================
// HISTORIQUE DES RENDEZ-VOUS
// ==========================================

async function chargerHistorique(uid){

const patientSnap=await getDoc(doc(db,"patients",uid));
const nomPatient=patientSnap.exists()?patientSnap.data().nom:"";

const historiqueQuery=query(

collection(db,"rendezvous"),

where("patientId","==",uid),

orderBy("date","desc"),

limit(10)

);

const snap=await getDocs(historiqueQuery);

const tbody=document.getElementById("historiqueRendezvous");

tbody.innerHTML="";


// Liste complete : patientId + correspondance par nom

let liste=snap.docs.map(d=>({id:d.id,data:d.data()}));


if(nomPatient){

const tout=await getDocs(collection(db,"rendezvous"));

tout.docs.forEach(d=>{

if(d.data().patientId!==uid && documentEstPourPatient(d.data(),uid,nomPatient)){

liste.push({id:d.id,data:d.data()});

}

});

}


liste=liste

.sort((a,b)=>String(b.data.date||"").localeCompare(String(a.data.date||"")))

.slice(0,10);


if(liste.length===0){

tbody.innerHTML=`

<tr>

<td colspan="5">

Aucun rendez-vous trouvé.

</td>

</tr>

`;

return;

}

liste.forEach((item)=>{

const rdv=item.data;

const statut=(rdv.statut||"En attente").toLowerCase();

tbody.innerHTML+=`

<tr>

<td>${escapeHtml(rdv.date)}</td>

<td>${escapeHtml(rdv.heure)}</td>

<td>${escapeHtml(rdv.dentiste||"-")}</td>

<td>

<span class="status ${statut}">

${escapeHtml(rdv.statut||"En attente")}

</span>

</td>

<td>

<button
class="btn-primary"
onclick="voirRendezVous('${item.id}')">

Voir

</button>

</td>

</tr>

`;

});

}

// ==========================================
// VOIR LE RENDEZ-VOUS
// ==========================================

window.voirRendezVous=function(id){

window.location.href=

"patient-rendezvous.html?id="+id;

}

// ==========================================
// FIN PATIENT-DASHBOARD.JS
// NET SOURIRE V2.0
// ==========================================