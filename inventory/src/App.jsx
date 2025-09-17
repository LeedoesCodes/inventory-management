// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext.jsx";

import Register from "./components/login-signup/register.jsx";
import Login from "./components/login-signup/login.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import Lobby from "./Pages/Lobby.jsx";
import Profile from "./Pages/Profile.jsx";
import UserApprovals from "./Pages/UserApprovals.jsx";

function App() {
  const { isLoggedIn, role, loading } = useContext(AuthContext);

  // Wait until auth state & role are known
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Helper: decide default route after login
  const getDefaultRoute = () => {
    if (!isLoggedIn) return "/login";
    if (role === "admin" || role === "approved") return "/dashboard";
    return "/lobby"; // pending users
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Root: redirect based on role */}
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />

        {/* Auth routes */}
        <Route
          path="/login"
          element={
            isLoggedIn ? <Navigate to={getDefaultRoute()} replace /> : <Login />
          }
        />
        <Route
          path="/register"
          element={
            isLoggedIn ? (
              <Navigate to={getDefaultRoute()} replace />
            ) : (
              <Register />
            )
          }
        />

        {/* Protected routes */}
        <Route
          path="/lobby"
          element={
            isLoggedIn && role === "pending" ? (
              <Lobby />
            ) : (
              <Navigate to={getDefaultRoute()} replace />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isLoggedIn && (role === "approved" || role === "admin") ? (
              <Dashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={isLoggedIn ? <Profile /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/user-approvals"
          element={
            isLoggedIn ? (
              role === "admin" ? (
                <UserApprovals />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
