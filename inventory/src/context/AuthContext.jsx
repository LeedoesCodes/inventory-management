import { createContext, useState, useEffect } from "react";
import { auth, db } from "../Firebase/firebase";
import {
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setRole(docSnap.data().role || "pending");
          } else {
            setRole("pending");
          }
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  function logout() {
    auth.signOut().then(() => {
      setUser(null);
      setRole(null);
    });
  }

  // NEW: wrapper to update Firebase Auth profile
  async function updateProfile(updates) {
    if (!auth.currentUser) throw new Error("No authenticated user");
    await firebaseUpdateProfile(auth.currentUser, updates);
    // Optionally update local user state
    setUser({ ...auth.currentUser, ...updates });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoggedIn: !!user,
        loading,
        logout,
        updateProfile, // <-- add this here
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
