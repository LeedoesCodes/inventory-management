// context/AuthContext.jsx
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
  const [isCustomer, setIsCustomer] = useState(false);

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
          // First check the 'users' collection (for staff)
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userRole = userDoc.data().role || "user";
            setRole((prev) => (prev !== userRole ? userRole : prev));
            setIsCustomer(false); // This is a staff user

            setFirestoreAccess(true);

            // Attach one listener for this user
            unsubscribeSnapshot = onSnapshot(
              userDocRef,
              (docSnap) => {
                if (docSnap.exists()) {
                  const newRole = docSnap.data().role || "user";
                  setRole((prev) => (prev !== newRole ? newRole : prev));
                  setIsCustomer(false);
                }
              },
              (error) => {
                console.error("Firestore listener error", error);
                setFirestoreAccess(false);
              }
            );
          } else {
            // User not found in 'users' collection, check 'customers' collection
            console.log(
              "User not in 'users' collection, checking 'customers'..."
            );

            const customerDocRef = doc(db, "customers", currentUser.uid);
            const customerDoc = await getDoc(customerDocRef);

            if (customerDoc.exists()) {
              console.log("✅ Found customer in 'customers' collection");
              setRole("customer");
              setIsCustomer(true);

              // Listen for customer updates
              unsubscribeSnapshot = onSnapshot(
                customerDocRef,
                (docSnap) => {
                  if (docSnap.exists()) {
                    // Customer document exists, keep role as customer
                    setRole("customer");
                    setIsCustomer(true);
                  } else {
                    // Customer document was deleted
                    setRole(null);
                    setIsCustomer(false);
                  }
                },
                (error) => {
                  console.error("Customer Firestore listener error", error);
                  setFirestoreAccess(false);
                }
              );
            } else {
              // User not in either collection
              console.log(
                "⚠️ User not found in 'users' or 'customers' collection"
              );
              setRole("customer"); // Default to customer if not in any collection
              setIsCustomer(true);
            }
            setFirestoreAccess(true);
          }
        } catch (error) {
          console.error("Error accessing Firestore", error);
          setRole(null);
          setIsCustomer(false);
          setFirestoreAccess(false);
        }
      } else {
        console.log("No user logged in");
        setRole(null);
        setIsCustomer(false);
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
      setIsCustomer(false);
      setFirestoreAccess(true);
    });
  }

  async function updateProfile(updates) {
    if (!auth.currentUser) throw new Error("No authenticated user");
    await firebaseUpdateProfile(auth.currentUser, updates);
    setUser({ ...auth.currentUser, ...updates });
  }

  // For backward compatibility - currentUser is the same as user
  const currentUser = user;

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser, // For customer components
        role,
        isCustomer,
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
