import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

let analytics;

// Your NEW web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAu2ptqVY9HP7p_InOBwIpZ6iShxRtBajs",
  authDomain: "inventory-management-bb525.firebaseapp.com",
  projectId: "inventory-management-bb525",
  storageBucket: "inventory-management-bb525.firebasestorage.app",
  messagingSenderId: "632078673003",
  appId: "1:632078673003:web:a9ea2bf660a30d9c9dfd2e",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (optional - only if you need it)
if (typeof window !== "undefined") {
  import("firebase/analytics").then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  });
}

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { firebaseConfig };
export default app;
