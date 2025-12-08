// App.jsx - WITH ENHANCED DEBUGGING
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useContext, useRef, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContext.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Sidebar from "./components/UI/Sidebar.jsx";
import CustomerSidebar from "./components/UI/CustomerSidebar.jsx";
import Header from "./components/UI/Headers.jsx";
import CustomerHeader from "./components/UI/CustomerHeader.jsx";
import { SidebarProvider, SidebarContext } from "./context/SidebarContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

// Import all auth components
import Register from "./components/login-signup/Register.jsx";
import Login from "./components/login-signup/Login.jsx";
import CustomerLogin from "./components/login-signup/CustomerLogin.jsx";
import CustomerRegister from "./components/login-signup/CustomerRegister.jsx";
import RoleSelection from "./components/login-signup/RoleSelection.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import Lobby from "./Pages/Lobby.jsx";
import Profile from "./Pages/Profile.jsx";
import CustomerProfile from "./Pages/CustomerProfile.jsx";
import UserApprovals from "./Pages/UserApprovals.jsx";
import ProductPage from "./Pages/ProductsPage.jsx";
import OrdersPage from "./Pages/OrdersPage.jsx";
import CustomerOrdersPage from "./Pages/CustomerOrdersPage.jsx";
import TransactionHistory from "./Pages/TransactionHistoryPage.jsx";
import CustomerTransactionHistory from "./Pages/CustomerTransactionHistory.jsx";
import CustomerSettingsPage from "./Pages/CustomerSettingsPage.jsx";
import LowStockPage from "./components/products/LowStockPage.jsx";
import CustomerManagement from "./Pages/CustomerManagement.jsx";
import UserManagement from "./Pages/UserManagement.jsx";
import SettingsPage from "./Pages/SettingsPage.jsx";
import Analytics from "./Pages/Analytics.jsx";
import CustomerDashboard from "./Pages/CustomerDashboard.jsx";

// Enhanced Debug component
function RouteDebugger() {
  const location = useLocation();
  const { role, isLoggedIn, user } = useContext(AuthContext);

  useEffect(() => {
    console.log("🔍 === ROUTE DEBUGGER ===");
    console.log("🔍 Current path:", location.pathname);
    console.log("🔍 User role:", role);
    console.log("🔍 User UID:", user?.uid);
    console.log("🔍 Is logged in:", isLoggedIn);
    console.log(
      "🔍 Layout should be:",
      role === "customer" ? "CustomerLayout" : "StaffLayout"
    );
    console.log(
      "🔍 Header should be:",
      role === "customer" ? "CustomerHeader" : "Header"
    );
    console.log("🔍 === END DEBUG ===");
  }, [location, role, isLoggedIn, user]);

  return null;
}

function HomeRedirect() {
  const { isLoggedIn, role, loading } = useContext(AuthContext);
  const location = useLocation();
  const hasRedirectedRef = useRef(false);

  if (loading) return null;

  const currentPath = location.pathname;

  if (hasRedirectedRef.current) return null;

  const publicRoutes = [
    "/login",
    "/register",
    "/customer-login",
    "/customer-register",
  ];

  // If logged in and on a public auth page, redirect to appropriate page
  if (isLoggedIn && publicRoutes.includes(currentPath)) {
    hasRedirectedRef.current = true;
    console.log("🔄 HomeRedirect: Redirecting based on role:", role);

    if (role === "customer") {
      console.log("🛒 Redirecting customer to /customer-dashboard");
      return <Navigate to="/customer-dashboard" replace />;
    } else if (role === "approved" || role === "admin") {
      console.log("👔 Redirecting staff to /dashboard");
      return <Navigate to="/dashboard" replace />;
    } else if (role === "pending") {
      console.log("⏳ Redirecting pending user to /lobby");
      return <Navigate to="/lobby" replace />;
    }
  }

  const protectedRoutes = [
    "/dashboard",
    "/profile",
    "/customer-profile",
    "/products",
    "/orderspage",
    "/transactionHistory",
    "/customer-transactions",
    "/customer-settings",
    "/settings",
    "/analytics",
    "/low-stock",
    "/user-approvals",
    "/customer-management",
    "/user-management",
    "/customer-dashboard",
    "/customer-orders",
  ];

  if (!isLoggedIn && protectedRoutes.includes(currentPath)) {
    console.log("🔒 Redirecting unauthenticated user to /");
    return <Navigate to="/" replace />;
  }

  return null;
}

/** Staff Layout - Uses Header.jsx (for staff/admin only) */
function StaffLayout() {
  const { isCollapsed } = useContext(SidebarContext);
  const { role } = useContext(AuthContext);

  useEffect(() => {
    console.log("👔 === STAFF LAYOUT ACTIVE ===");
    console.log("👔 User role in StaffLayout:", role);
    console.log("👔 This should only show for staff/admin users");
    console.log("👔 Using Header.jsx for staff");
  }, [role]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main
        className={`main-content ${isCollapsed ? "sidebar-collapsed" : ""}`}
      >
        <Header /> {/* Header.jsx for staff/admin */}
        <Outlet />
      </main>
    </div>
  );
}

/** Customer Layout - Uses CustomerHeader.jsx */
function CustomerLayout() {
  const { isCollapsed } = useContext(SidebarContext);
  const { role } = useContext(AuthContext);

  useEffect(() => {
    console.log("🛒 === CUSTOMER LAYOUT ACTIVE ===");
    console.log("🛒 User role in CustomerLayout:", role);
    console.log("🛒 This should only show for customer users");
    console.log("🛒 Using CustomerHeader.jsx for customer");
  }, [role]);

  return (
    <div className="app-layout">
      <CustomerSidebar />
      <main
        className={`main-content ${isCollapsed ? "sidebar-collapsed" : ""}`}
      >
        <CustomerHeader /> {/* CustomerHeader.jsx for customers */}
        <Outlet />
      </main>
    </div>
  );
}

// TEST: Add a temporary test route to see which layout is being used
function TestLayout() {
  const { role } = useContext(AuthContext);

  return (
    <div style={{ padding: "20px", background: "#f0f0f0" }}>
      <h2>Layout Test</h2>
      <p>
        Current role: <strong>{role}</strong>
      </p>
      <p>
        Should see:{" "}
        <strong>
          {role === "customer" ? "CustomerLayout" : "StaffLayout"}
        </strong>
      </p>
    </div>
  );
}

function App() {
  const { loading, role } = useContext(AuthContext);

  // Debug app mount
  useEffect(() => {
    console.log("🚀 App mounted");
    console.log("🚀 Initial role:", role);
  }, [role]);

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
          <RouteDebugger />
          <HomeRedirect />
          <Routes>
            {/* Root route - Role selection for unauthenticated users */}
            <Route path="/" element={<RoleSelection />} />

            {/* Staff auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Customer auth */}
            <Route path="/customer-login" element={<CustomerLogin />} />
            <Route path="/customer-register" element={<CustomerRegister />} />

            {/* Lobby - for pending approval */}
            <Route
              path="/lobby"
              element={
                <ProtectedRoute allowedRoles={["pending"]}>
                  <Lobby />
                </ProtectedRoute>
              }
            />

            {/* TEST ROUTE - Temporary */}
            <Route
              path="/test-layout"
              element={
                <ProtectedRoute
                  allowedRoles={["customer", "approved", "admin"]}
                >
                  <TestLayout />
                </ProtectedRoute>
              }
            />

            {/* Customer Area - Uses CustomerLayout with CustomerHeader */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CustomerLayout />
                </ProtectedRoute>
              }
            >
              <Route
                path="/customer-dashboard"
                element={<CustomerDashboard />}
              />
              <Route path="/customer-orders" element={<CustomerOrdersPage />} />
              <Route
                path="/customer-transactions"
                element={<CustomerTransactionHistory />}
              />
              <Route
                path="/customer-settings"
                element={<CustomerSettingsPage />}
              />
              <Route path="/customer-profile" element={<CustomerProfile />} />
            </Route>

            {/* Staff/Admin Area - Uses StaffLayout with Header */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["approved", "admin"]}>
                  <StaffLayout />
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

            {/* Fallback - If route not found */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SidebarProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
