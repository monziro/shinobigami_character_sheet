// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBwfbphjFCh4fl2rFaxs3D80abL4PQb9VE",
  authDomain: "shinobigamicharactersheet.firebaseapp.com",
  projectId: "shinobigamicharactersheet",
  storageBucket: "shinobigamicharactersheet.firebasestorage.app",
  messagingSenderId: "934826539894",
  appId: "1:934826539894:web:71ee3d31fd88e9752fd857",
  measurementId: "G-RE5DJ5K9FD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
