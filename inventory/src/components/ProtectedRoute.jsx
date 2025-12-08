// components/ProtectedRoute.jsx - FIXED VERSION
import React, { useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isLoggedIn, role, loading } = useContext(AuthContext);
  const location = useLocation();
  const [hasChecked, setHasChecked] = useState(false);

  // Debug log - only once
  useEffect(() => {
    if (!hasChecked) {
      console.log("🔒 ProtectedRoute check:", {
        path: location.pathname,
        isLoggedIn,
        role,
        allowedRoles,
        isAllowed: allowedRoles ? allowedRoles.includes(role) : true,
      });
      setHasChecked(true);
    }
  }, [hasChecked, location.pathname, isLoggedIn, role, allowedRoles]);

  if (loading) {
    console.log("⏳ ProtectedRoute: Loading...");
    return null;
  }

  if (!isLoggedIn) {
    console.log("❌ ProtectedRoute: Not logged in, redirecting to /");
    return <Navigate to="/" replace />;
  }

  // CRITICAL FIX: Check if we're already on a valid route to prevent loops
  const currentPath = location.pathname;

  // If no role restriction, allow access
  if (!allowedRoles) {
    console.log("✅ ProtectedRoute: No role restriction, access granted");
    return children;
  }

  // Check if role is allowed
  if (!allowedRoles.includes(role)) {
    console.log(
      `❌ ProtectedRoute: Role ${role} not allowed for ${currentPath}`
    );

    // Determine where to redirect based on role
    let redirectTo = "/";

    if (role === "customer") {
      // Customer trying to access staff route
      redirectTo = "/customer-dashboard";
      console.log(`🔄 ProtectedRoute: Customer redirected to ${redirectTo}`);
    } else if (role === "pending") {
      redirectTo = "/lobby";
      console.log(
        `🔄 ProtectedRoute: Pending user redirected to ${redirectTo}`
      );
    } else if (role === "approved" || role === "admin") {
      // Staff trying to access customer route
      redirectTo = "/dashboard";
      console.log(`🔄 ProtectedRoute: Staff redirected to ${redirectTo}`);
    }

    // IMPORTANT: Only redirect if we're not already on the correct path
    if (currentPath !== redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    // If we're already on the correct path, just show children
    return children;
  }

  console.log("✅ ProtectedRoute: Access granted for role", role);
  return children;
}
