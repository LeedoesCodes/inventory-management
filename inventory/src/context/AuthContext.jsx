import { createContext, useState, useEffect } from "react";
import { auth, db } from "../Firebase/firebase";
import {
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
} from "firebase/auth";
import { doc, onSnapshot, getDoc } from "firebase/firestore";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firestoreAccess, setFirestoreAccess] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser?.email);

      // Only update if user actually changes
      setUser((prev) => (prev?.uid !== currentUser?.uid ? currentUser : prev));

      // Clean up old snapshot if switching users
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userRole = userDoc.data().role || "user";
            setRole((prev) => (prev !== userRole ? userRole : prev));
          } else {
            setRole("user");
          }

          setFirestoreAccess(true);

          // Attach one listener for this user
          unsubscribeSnapshot = onSnapshot(
            userDocRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const newRole = docSnap.data().role || "user";
                setRole((prev) => (prev !== newRole ? newRole : prev));
              } else {
                setRole("user");
              }
            },
            (error) => {
              console.error("Firestore listener error", error);
              setFirestoreAccess(false);
            }
          );
        } catch (error) {
          console.error("Error accessing Firestore", error);
          setRole("user");
          setFirestoreAccess(false);
        }
      } else {
        console.log("No user logged in");
        setRole(null);
        setFirestoreAccess(true);
      }

      // ✅ Only mark loading false *once*, after initial check
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  function logout() {
    auth.signOut().then(() => {
      setUser(null);
      setRole(null);
      setFirestoreAccess(true);
    });
  }

  async function updateProfile(updates) {
    if (!auth.currentUser) throw new Error("No authenticated user");
    await firebaseUpdateProfile(auth.currentUser, updates);
    setUser({ ...auth.currentUser, ...updates });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoggedIn: !!user,
        loading,
        firestoreAccess,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
