import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyC88e7ZZFcd9YjPVFp2YvdQLRpR24Jqlnk",
  authDomain: "net-sourire.firebaseapp.com",
  projectId: "net-sourire",
  storageBucket: "net-sourire.firebasestorage.app",
  messagingSenderId: "1083343559458",
  appId: "1:1083343559458:web:a6f8228610568fac1fa37b"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

export const storage = getStorage(app);
