// App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useContext, useEffect } from "react";
import { AuthContext } from "./context/AuthContext.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Sidebar from "./components/UI/Sidebar.jsx";
import { SidebarProvider, SidebarContext } from "./context/SidebarContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./fixProducts";

import Register from "./components/login-signup/register.jsx";
import Login from "./components/login-signup/login.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import Lobby from "./Pages/Lobby.jsx";
import Profile from "./Pages/Profile.jsx";
import UserApprovals from "./Pages/UserApprovals.jsx";
import ProductPage from "./Pages/ProductsPage.jsx";
import OrdersPage from "./Pages/OrdersPage.jsx";
import TransactionHistory from "./Pages/TransactionHistoryPage.jsx";
import LowStockPage from "./components/products/LowStockPage.jsx";
import CustomerManagement from "./Pages/CustomerManagement.jsx";
import UserManagement from "./Pages/UserManagement.jsx";
import SettingsPage from "./Pages/SettingsPage.jsx";
import MobileBottomNav from "./components/UI/MobileBottomNav.jsx";
import MobileHeader from "./components/UI/MobileHeader.jsx";
import Analytics from "./Pages/Analytics.jsx";

/**
 * HomeRedirect - Improved with better navigation logic
 */
function HomeRedirect() {
  const { isLoggedIn, role, loading, user } = useContext(AuthContext);
  const location = useLocation();

  // Don't redirect if we're already on a valid route
  const currentPath = location.pathname;

  if (loading) {
    console.log("HomeRedirect: Loading auth state...");
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  console.log("HomeRedirect - Auth state:", {
    isLoggedIn,
    role,
    userEmail: user?.email,
    currentPath,
  });

  // If not logged in, go to login
  if (!isLoggedIn) {
    if (currentPath !== "/login" && currentPath !== "/register") {
      console.log("HomeRedirect: Not logged in, redirecting to login");
      return <Navigate to="/login" replace />;
    }
    return null; // Stay on login/register page
  }

  // If logged in but on public pages, redirect based on role
  if (currentPath === "/login" || currentPath === "/register") {
    if (role === "admin" || role === "approved") {
      console.log(
        "HomeRedirect: On auth page as admin/approved, redirecting to dashboard"
      );
      return <Navigate to="/dashboard" replace />;
    } else {
      console.log(
        "HomeRedirect: On auth page as regular user, redirecting to lobby"
      );
      return <Navigate to="/lobby" replace />;
    }
  }

  // Handle root path redirect
  if (currentPath === "/") {
    if (role === "admin" || role === "approved") {
      console.log(
        "HomeRedirect: Root path as admin/approved, redirecting to dashboard"
      );
      return <Navigate to="/dashboard" replace />;
    } else {
      console.log(
        "HomeRedirect: Root path as regular user, redirecting to lobby"
      );
      return <Navigate to="/lobby" replace />;
    }
  }

  // If we're already on a valid route, don't redirect
  console.log("HomeRedirect: Staying on current route:", currentPath);
  return null;
}

/** SidebarLayout consumes SidebarContext to add collapsed class to main */
function SidebarLayout() {
  const { isCollapsed } = useContext(SidebarContext);

  return (
    <div className="app-layout">
      <Sidebar />
      <main
        className={`main-content ${isCollapsed ? "sidebar-collapsed" : ""}`}
      >
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  const { loading, isLoggedIn, role, user } = useContext(AuthContext);

  console.log("App - Auth state:", {
    loading,
    isLoggedIn,
    role,
    userEmail: user?.email,
  });

  // Keep UI stable while auth resolves
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <SidebarProvider>
          <Routes>
            {/* Root: do a single declarative redirect once */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Lobby - accessible to all logged-in users */}
            <Route
              path="/lobby"
              element={
                <ProtectedRoute>
                  <Lobby />
                </ProtectedRoute>
              }
            />

            {/* Protected area with sidebar - for approved users and admins */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["approved", "admin"]}>
                  <SidebarLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/products" element={<ProductPage />} />
              <Route path="/orderspage" element={<OrdersPage />} />
              <Route path="/low-stock" element={<LowStockPage />} />
              <Route
                path="/transactionHistory"
                element={<TransactionHistory />}
              />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Admin-only routes */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Outlet />
                  </ProtectedRoute>
                }
              >
                <Route path="/user-approvals" element={<UserApprovals />} />
                <Route
                  path="/customer-management"
                  element={<CustomerManagement />}
                />
                <Route path="/user-management" element={<UserManagement />} />
              </Route>
            </Route>

            {/* Fallback for unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SidebarProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
