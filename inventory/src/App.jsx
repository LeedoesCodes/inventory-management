// App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useContext } from "react";
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

/**
 * HomeRedirect (declarative)
 * - Reads auth state from context and returns a <Navigate/>
 * - IMPORTANT: returns null while loading to avoid redirect loops
 */
function HomeRedirect() {
  const { isLoggedIn, role, loading } = useContext(AuthContext);

  if (loading) {
    return null; // wait until auth resolves
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  if (role === "admin" || role === "approved")
    return <Navigate to="/dashboard" replace />;

  return <Navigate to="/lobby" replace />;
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
  const { loading } = useContext(AuthContext);

  // Keep UI stable while auth resolves
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
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

            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Lobby (no ProtectedRoute here anymore) */}
            <Route path="/lobby" element={<Lobby />} />

            {/* Protected area with sidebar */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["approved", "admin"]}>
                  <SidebarLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/products" element={<ProductPage />} />
              <Route path="/orderspage" element={<OrdersPage />} />
              <Route path="/low-stock" element={<LowStockPage />} />
              <Route
                path="/transactionHistory"
                element={<TransactionHistory />}
              />
              <Route path="/user-approvals" element={<UserApprovals />} />
              <Route
                path="/customer-management"
                element={<CustomerManagement />}
              />
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SidebarProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
