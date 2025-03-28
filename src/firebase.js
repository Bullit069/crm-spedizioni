import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAU29LG8iN9d3zxkftpbSc2GyjVU6lh9B8",
    authDomain: "crm-spedizioni-cb90a.firebaseapp.com",
    projectId: "crm-spedizioni-cb90a",
    storageBucket: "crm-spedizioni-cb90a.firebasestorage.app",
    messagingSenderId: "8221133049",
    appId: "1:8221133049:web:dc3bb278980726a3f43a28"
  };

// Inizializza l'app Firebase
const app = initializeApp(firebaseConfig);

// Esporta il database Firestore
export const db = getFirestore(app);
