// FirebaseApp
// firebaseApp.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA_zm4XcDNwBP3DpqWGhD-24l8PlhcUdpg",
    authDomain: "soundstation-8a6e7.firebaseapp.com",
    projectId: "soundstation-8a6e7",
    storageBucket: "soundstation-8a6e7.firebasestorage.app",
    messagingSenderId: "898982967840",
    appId: "1:898982967840:web:2fc34119b2cd1c73701a45",
    measurementId: "G-D6GTWWVXSC"
  };
// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = app.storage();