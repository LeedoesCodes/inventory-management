import { createContext, useState, useEffect } from "react";
import { auth } from "../Firebase/firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  function logout() {
    signOut(auth).then(() => setUser(null));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
