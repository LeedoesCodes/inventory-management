import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isLoggedIn, role, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return null; // Or a spinner

  if (!isLoggedIn) {
    // if already at /login, don't redirect again
    if (location.pathname === "/login") {
      return children;
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // if already at "/", don't redirect again
    if (location.pathname === "/") {
      return children;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
