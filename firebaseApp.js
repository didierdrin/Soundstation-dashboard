// FirebaseApp
// firebaseApp.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; 


const firebaseConfig = {
  apiKey: "AIzaSyDlfeVwzbjeM2oxK6XL2hmDAyB-y-FMNLM",
  authDomain: "passtrack-3e434.firebaseapp.com",
  projectId: "passtrack-3e434",
  storageBucket: "passtrack-3e434.appspot.com",
  messagingSenderId: "491220286264",
  appId: "1:491220286264:web:eb0c1e8e7f994aa72e9fcd",
  measurementId: "G-GY5N76LQCH"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);