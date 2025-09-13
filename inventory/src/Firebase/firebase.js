// src/Firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // ✅ lowercase 'firebase'
import { getAuth } from "firebase/auth"; // ✅ add this for authentication

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD30eN40VyYMxTkXzI6IGVLaxAtEU1u9v8",
  authDomain: "inventory-management-eb8f4.firebaseapp.com",
  projectId: "inventory-management-eb8f4",
  storageBucket: "inventory-management-eb8f4.firebasestorage.app",
  messagingSenderId: "427942968184",
  appId: "1:427942968184:web:803fc9c71bfe6feecca68d",
  measurementId: "G-8FP8X3DPEW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ✅ Exports
export const auth = getAuth(app);       // for Login/Register
export const firestore = getFirestore(app); // for storing inventory items
