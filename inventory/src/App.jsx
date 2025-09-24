import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext.jsx";

// Components
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Pages
import Register from "./components/login-signup/register.jsx";
import Login from "./components/login-signup/login.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import Lobby from "./Pages/Lobby.jsx";
import Profile from "./Pages/Profile.jsx";
import UserApprovals from "./Pages/UserApprovals.jsx";
import ProductPage from "./Pages/ProductsPage.jsx";
import OrdersPage from "./Pages/OrdersPage.jsx";
import TransactionHistory from "./Pages/TransactionHistoryPage.jsx";

function App() {
  const { isLoggedIn, role, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  const getDefaultRoute = () => {
    if (!isLoggedIn) return "/login";
    if (role === "admin" || role === "approved") return "/dashboard";
    return "/lobby";
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/lobby"
          element={
            <ProtectedRoute allowedRoles={["pending"]}>
              <Lobby />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["approved", "admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={["approved", "admin"]}>
              <ProductPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orderspage"
          element={
            <ProtectedRoute allowedRoles={["approved", "admin"]}>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactionHistory"
          element={
            <ProtectedRoute allowedRoles={["approved", "admin"]}>
              <TransactionHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user-approvals"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UserApprovals />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
