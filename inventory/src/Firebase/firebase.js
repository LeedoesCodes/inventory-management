import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

let analytics;

const firebaseConfig = {
  apiKey: "AIzaSyD30eN40VyYMxTkXzI6IGVLaxAtEU1u9v8",
  authDomain: "inventory-management-eb8f4.firebaseapp.com",
  projectId: "inventory-management-eb8f4",
  storageBucket: "inventory-management-eb8f4.firebasestorage.app",
  messagingSenderId: "427942968184",
  appId: "1:427942968184:web:803fc9c71bfe6feecca68d",
  measurementId: "G-8FP8X3DPEW",
};

const app = initializeApp(firebaseConfig);

if (typeof window !== "undefined") {
  import("firebase/analytics").then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  });
}

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export { firebaseConfig };
export const storage = getStorage(app);
