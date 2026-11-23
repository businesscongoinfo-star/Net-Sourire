// ==========================================
// NET SOURIRE
// SUPERADMIN.JS
// ESPACE SUPER ADMIN — Gestion des comptes administrateurs et rôles
// ==========================================

import { db, auth } from "./firebase.js";

import {
collection,
getDocs,
getDoc,
updateDoc,
deleteDoc,
setDoc,
doc,
query,
where,
orderBy,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
createUserWithEmailAndPassword,
updateProfile,
sendPasswordResetEmail,
deleteUser
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// ===============================
// HELPERS
// ===============================

function escapeHtml(valeur){

return String(valeur || "")

.replace(/&/g,"&amp;")

.replace(/</g,"&lt;")

.replace(/>/g,"&gt;")

.replace(/"/g,"&quot;")

.replace(/'/g,"&#039;");

}

const pageContent = document.getElementById("pageContent");

// Rôles administrateur valables
const ROLES = ["admin","superadmin"];

// ===============================
// ESPACE SUPER ADMIN
// ===============================

// Accès réservé aux superadmins
async function estSuperAdmin(){

try{

const user=auth.currentUser;

if(!user) return false;

const userDoc=await getDoc(doc(db,"utilisateurs",user.uid));

if(!userDoc.exists()) return false;

return userDoc.data().role==="superadmin";

}catch(error){

return false;

}

}

// Affiche l'espace Super Admin
async function afficherSuperAdmin(){

if(!(await estSuperAdmin())){

alert("⚠️ Vous n'avez pas les droits Super Admin pour accéder à cet espace.");

if(window.afficherDashboard){

window.afficherDashboard();

}else{

window.location.href="dashboard.html";

}

return;

}

pageContent.innerHTML=`

<section class="dashboard-box">

<div class="box-header">

<h2>

⚙️ Espace Super Admin

</h2>

<button
class="btn btn-warning"
onclick="window.afficherDashboard()">

↩ Retour au dashboard

</button>

</div>

<div class="sa-actions">

<button class="btn-primary" onclick="window.saOuvrirCreer()">

<i class="fa-solid fa-user-plus"></i> Nouvel administrateur

</button>

<button class="btn-secondary" onclick="window.saCharger()">

<i class="fa-solid fa-rotate-right"></i> Actualiser

</button>

</div>

<table class="sa-table">

<thead>

<tr>

<th>Administrateur</th>

<th>Email</th>

<th>Rôle</th>

<th>Statut</th>

<th>Créé le</th>

<th>Actions</th>

</tr>

</thead>

<tbody id="saTable">

<tr><td colspan="6" class="sa-empty">Chargement...</td></tr>

</tbody>

</table>

</section>

<div class="modal" id="saModal">

<div class="modal-content">

<div class="modal-header">

<h3 id="saModalTitre">Nouvel administrateur</h3>

<button class="closeModal" type="button" onclick="window.saFermerModal()">&times;</button>

</div>

<form id="saForm">

<input type="hidden" id="saUid">

<div class="form-group">

<label>Nom complet</label>

<input type="text" id="saNom" placeholder="Nom de l'administrateur" required>

</div>

<div class="form-group">

<label>Email</label>

<input type="email" id="saEmail" placeholder="admin@cabinet.com" required>

</div>

<div class="form-group">

<label>Mot de passe</label>

<input type="password" id="saPassword" placeholder="Mot de passe" required>

</div>

<div class="form-group">

<label>Rôle</label>

<select id="saRole">

<option value="admin">Admin</option>

<option value="superadmin">Super Admin</option>

</select>

</div>

<div class="sa-modal-actions">

<button type="button" class="btn btn-warning" onclick="window.saFermerModal()">Annuler</button>

<button type="submit" class="btn-primary" id="saEnregistrer">

Enregistrer

</button>

</div>

</form>

</div>

</div>

`;

window.saCharger();

// Câbler le formulaire (créé dynamiquement juste avant)
const saForm=document.getElementById("saForm");

if(saForm){

saForm.addEventListener("submit",saEnregistrer);

}

}

// ===============================
// CHARGEMENT DES COMPTES
// ===============================

async function saCharger(){

const tbody=document.getElementById("saTable");

if(!tbody) return;


tbody.innerHTML="<tr><td colspan='6' class='sa-empty'>Chargement...</td></tr>";


try{

const q=query(

collection(db,"utilisateurs"),

where("role","in",["admin","superadmin"]),

orderBy("dateCreation","desc")

);

const snapshot=await getDocs(q);


if(snapshot.empty){

tbody.innerHTML="<tr><td colspan='6' class='sa-empty'>Aucun compte administrateur. Créez le premier via « Nouvel administrateur ».</td></tr>";

return;

}


const moi=auth.currentUser;

tbody.innerHTML="";

snapshot.forEach((docu)=>{

const data=docu.data();

const estMoi=docu.id===moi?.uid;

const roleLabel=data.role==="superadmin"?"Super Admin":"Admin";

tbody.innerHTML+=`

<tr>

<td>

<strong>${escapeHtml(data.nom||"—")}</strong>

${estMoi?"<span class='sa-badge'>vous</span>":""}

</td>

<td>${escapeHtml(data.email||"—")}</td>

<td><span class="sa-role sa-role-${escapeHtml(data.role)}">${roleLabel}</span></td>

<td>${escapeHtml(data.actif?"Activé":"Désactivé")}</td>

<td>${escapeHtml(data.dateCreation&&data.dateCreation.toDate?data.dateCreation.toDate().toLocaleDateString():"—")}</td>

<td class="sa-row-actions">

<select onchange="window.saChangerRole('${docu.id}', this.value)" ${estMoi?"disabled":""}>

<option value="admin" ${data.role==="admin"?"selected":""}>Admin</option>

<option value="superadmin" ${data.role==="superadmin"?"selected":""}>Super Admin</option>

</select>

<button class="btn btn-sm btn-warning" onclick="window.saResetPwd('${escapeHtml(data.email||"")}')">Mot de passe</button>

<button class="btn btn-sm btn-danger" onclick="window.saSupprimer('${docu.id}')" ${estMoi?"disabled":""}>Supprimer</button>

</td>

</tr>

`;

});

}catch(error){

console.error(error);

tbody.innerHTML="<tr><td colspan='6' class='sa-empty'>Erreur de chargement : "+escapeHtml(error.message)+"</td></tr>";

}

}

// ===============================
// CRÉATION / MODIFICATION
// ===============================

function saOuvrirCreer(){

document.getElementById("saModalTitre").textContent="Nouvel administrateur";

document.getElementById("saUid").value="";

document.getElementById("saNom").value="";

document.getElementById("saEmail").value="";

document.getElementById("saPassword").value="";

document.getElementById("saRole").value="admin";

document.getElementById("saModal").classList.add("active");

}

function saFermerModal(){

const modal=document.getElementById("saModal");

if(modal) modal.classList.remove("active");

}

async function saEnregistrer(e){

e.preventDefault();


const uid=document.getElementById("saUid").value;

const nom=document.getElementById("saNom").value.trim();

const email=document.getElementById("saEmail").value.trim();

const password=document.getElementById("saPassword").value;

const role=document.getElementById("saRole").value;


try{

if(uid){

// Mise à jour du profil existant

await updateDoc(doc(db,"utilisateurs",uid),{

nom:nom,

role:role,

dateModification:serverTimestamp()

});

// Mettre à jour le profil Firebase si le nom a changé

if(auth.currentUser && auth.currentUser.uid===uid){

await updateProfile(auth.currentUser,{displayName:nom});

}

alert("✅ Compte administrateur mis à jour.");

}else{

// Création du compte Firebase

const credential=await createUserWithEmailAndPassword(auth,email,password);

await setDoc(doc(db,"utilisateurs",credential.user.uid),{

nom:nom,

email:email,

role:role,

actif:true,

dateCreation:serverTimestamp(),

dateModification:serverTimestamp()

});

alert("✅ Compte administrateur « "+nom+" » créé avec le rôle "+role+".");

}

saFermerModal();

saCharger();

}catch(error){

console.error(error);

alert("❌ "+error.message);

}

}

async function saChangerRole(uid, role){

if(!ROLES.includes(role)) return;

if(!confirm("Changer le rôle de cet administrateur en « "+role+" » ?")) return;

try{

await updateDoc(doc(db,"utilisateurs",uid),{

role:role,

dateModification:serverTimestamp()

});

alert("✅ Rôle mis à jour : "+role);

saCharger();

}catch(error){

alert("❌ "+error.message);

}

}

async function saResetPwd(email){

if(!email) return;

if(!confirm("Envoyer un e-mail de réinitialisation de mot de passe à "+email+" ?")) return;

try{

await sendPasswordResetEmail(auth,email);

alert("✅ E-mail de réinitialisation envoyé à "+email);

}catch(error){

alert("❌ "+error.message);

}

}

async function saSupprimer(uid){

if(!confirm("Supprimer définitivement ce compte administrateur ?")) return;

try{

// Supprimer le document Firestore

await deleteDoc(doc(db,"utilisateurs",uid));


// Si c'est le compte actuellement connecté, déconnecter et supprimer le compte Firebase

if(auth.currentUser && auth.currentUser.uid===uid){

try{

await deleteUser(auth.currentUser);

window.location.href="login.html";

return;

}catch(error){

console.error("Suppression compte Firebase impossible (déconnexion forcée) :",error);

}

}


alert("✅ Compte administrateur supprimé. Le compte Firebase associé peut être conservé (supprimez-le dans Firebase Console si besoin).");

saCharger();

}catch(error){

console.error(error);

alert("❌ "+error.message);

}

}

// ===============================
// CÂBLAGE DU MENUS DU DASHBOARD
// ===============================

const superAdminBtn=document.getElementById("superAdminBtn");

if(superAdminBtn){

superAdminBtn.addEventListener("click",(e)=>{

e.preventDefault();

afficherSuperAdmin();

});

}

// Formulaire du modal
const saForm=document.getElementById("saForm");

if(saForm){

saForm.addEventListener("submit",saEnregistrer);

}

// Exposition globale
window.saOuvrirCreer=saOuvrirCreer;

window.saFermerModal=saFermerModal;

window.saCharger=saCharger;

window.saChangerRole=saChangerRole;

window.saResetPwd=saResetPwd;

window.saSupprimer=saSupprimer;

window.afficherSuperAdmin=afficherSuperAdmin;
