import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext.jsx";

// Components
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Sidebar from "./components/UI/Sidebar.jsx";
import { SidebarProvider } from "./context/SidebarContext.jsx";

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

function SidebarLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

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
      <SidebarProvider>
        <Routes>
          <Route
            path="/"
            element={<Navigate to={getDefaultRoute()} replace />}
          />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/lobby"
            element={
              <ProtectedRoute allowedRoles={["pending"]}>
                <Lobby />
              </ProtectedRoute>
            }
          />

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
            <Route
              path="/transactionHistory"
              element={<TransactionHistory />}
            />
            <Route path="/user-approvals" element={<UserApprovals />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default App;
