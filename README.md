# Net Sourire — Cabinet Dentaire

Application web statique pour la gestion d'un cabinet dentaire (Pointe-Noire, République du Congo), basée sur **HTML / CSS / JavaScript vanilla** et **Firebase** (Firestore, Auth, Storage).

## Espaces

- **Vitrine publique** (`index.html`) : présentation du cabinet, services, galerie, prise de rendez-vous.
- **Espace admin** (`login.html` → `dashboard.html`) : statistiques, patients, rendez-vous, ordonnances, factures, caisse, publications, paramètres, odontogramme.
- **Espace patient** (`patient-register.html` / `patient-login.html` → `patient-dashboard.html`) : rendez-vous, ordonnances, factures, profil.

## Structure

```
├── index.html            # Page vitrine publique
├── login.html            # Connexion administrateur
├── dashboard.html        # Back-office admin
├── patients.html         # Patients (admin, page autonome)
├── rendezvous.html       # Rendez-vous (admin, page autonome)
├── ordonnance.html       # Ordonnances (admin, page autonome)
├── facture.html          # Factures (admin, page autonome)
├── publications.html     # Publications (admin, page autonome)
├── parametres.html       # Paramètres du cabinet (admin, page autonome)
├── patient-login.html    # Connexion patient
├── patient-register.html # Inscription patient
├── patient-dashboard.html# Tableau de bord patient
├── patient-rendezvous.html
├── patient-ordonnances.html
├── patient-factures.html
├── patient-profil.html
├── firebase.js           # Configuration Firebase (clés publiques)
├── auth.js               # Authentification admin + protection des pages
├── patient-auth.js       # Authentification patient
├── patient-register.js   # Inscription patient
├── dashboard.js          # Cœur de l'admin (stats, caisse, rapports, PDF)
├── patients.js           # Module Patients
├── rendezvous.js         # Module Rendez-vous
├── ordonnance.js         # Module Ordonnances
├── facture.js            # Module Factures
├── publications.js       # Module Publications
├── parametres.js         # Module Paramètres
├── odontogramme.js       # Odontogramme (32 dents)
├── app.js                # Galerie publique (chargement Firestore)
└── firestore.rules       # Règles de sécurité Firestore
```

## Configuration Firebase

Les clés sont placées dans `firebase.js` (clés publiques, normales pour un site web). Pour utiliser l'application :

1. Créer un projet Firebase.
2. Activer **Firestore Database**, **Authentication** (email/password) et **Storage**.
3. Copier les identifiants du projet dans `firebase.js`.
4. Déployer les **règles Firestore** (voir `firestore.rules`) dans le console Firebase.

> Les comptes admin doivent exister dans Firebase Authentication (email/password).
> L'accès admin est vérifié à l'ouverture des pages admin via le document `utilisateurs/{uid}` avec `role: "admin"`.

## Collections Firestore

| Collection | Description |
|---|---|
| `patients` | Patients (ID auto pour les admins, UID Auth pour les comptes patients) |
| `rendezvous` | Rendez-vous |
| `ordonnances` | Ordonnances |
| `factures` | Factures |
| `publications` | Publications galerie |
| `soinsDentaires` | Soins par dent |
| `photosDents` | Photos de dents |
| `etatDents` | État des dents |
| `notesDent` | Notes de dents |
| `notifications` | Notifications patient |
| `configuration` | Paramètres du cabinet |
| `utilisateurs` | Utilisateurs admin (`role: "admin"`) |

## Sécurité

- Les données Firestore sont échappées avant injection HTML (anti-XSS).
- Les pages admin vérifient le rôle administrateur.
- Les règles Firestore restreignent l'accès aux collections selon le rôle.
- Aucun secret ne doit être committé : les clés Firebase sont publiques, mais les variables d'environnement sont ignorées via `.gitignore`.
