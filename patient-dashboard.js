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

// Rendez-vous

const rdvQuery=query(

collection(db,"rendezvous"),

where("patientId","==",uid)

);

const rdvSnap=await getDocs(rdvQuery);

document.getElementById("totalRendezvous").textContent=

rdvSnap.size;

// Ordonnances

const ordonnanceQuery=query(

collection(db,"ordonnances"),

where("patientId","==",uid)

);

const ordonnanceSnap=await getDocs(ordonnanceQuery);

document.getElementById("totalOrdonnances").textContent=

ordonnanceSnap.size;

// Factures

const factureQuery=query(

collection(db,"factures"),

where("patientId","==",uid)

);

const factureSnap=await getDocs(factureQuery);

document.getElementById("totalFactures").textContent=

factureSnap.size;

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

const rdvQuery=query(

collection(db,"rendezvous"),

where("patientId","==",uid),

orderBy("date","asc"),

limit(1)

);

const snap=await getDocs(rdvQuery);

const container=document.getElementById("prochainRendezvous");

container.innerHTML="";

if(snap.empty){

container.innerHTML="<p>Aucun rendez-vous programmé.</p>";

return;

}

snap.forEach(doc=>{

const rdv=doc.data();

container.innerHTML=`

<div class="rdv-card">

<h3>${rdv.date}</h3>

<p><strong>Heure :</strong> ${rdv.heure}</p>

<p><strong>Dentiste :</strong> ${rdv.dentiste}</p>

<p><strong>Statut :</strong> ${rdv.statut}</p>

</div>

`;

});

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

<h4>${notification.titre}</h4>

<p>${notification.message}</p>

<small>${notification.date}</small>

</div>

</div>

`;

});

}

// ==========================================
// HISTORIQUE DES RENDEZ-VOUS
// ==========================================

async function chargerHistorique(uid){

const historiqueQuery=query(

collection(db,"rendezvous"),

where("patientId","==",uid),

orderBy("date","desc"),

limit(10)

);

const snap=await getDocs(historiqueQuery);

const tbody=document.getElementById("historiqueRendezvous");

tbody.innerHTML="";

if(snap.empty){

tbody.innerHTML=`

<tr>

<td colspan="5">

Aucun rendez-vous trouvé.

</td>

</tr>

`;

return;

}

snap.forEach(doc=>{

const rdv=doc.data();

tbody.innerHTML+=`

<tr>

<td>${rdv.date}</td>

<td>${rdv.heure}</td>

<td>${rdv.dentiste}</td>

<td>

<span class="status ${rdv.statut.toLowerCase()}">

${rdv.statut}

</span>

</td>

<td>

<button

class="btn-primary"

onclick="voirRendezVous('${doc.id}')">

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