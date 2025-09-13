// firebase.js (plain JS, no JSX here)
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD30eN40VyYMxTkXzI6IGVLaxAtEU1u9v8",
  authDomain: "inventory-management-eb8f4.firebaseapp.com",
  projectId: "inventory-management-eb8f4",
  storageBucket: "inventory-management-eb8f4.firebasestorage.app",
  messagingSenderId: "427942968184",
  appId: "1:427942968184:web:803fc9c71bfe6feecca68d",
  measurementId: "G-8FP8X3DPEW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);