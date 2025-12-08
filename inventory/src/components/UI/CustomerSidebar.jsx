// components/UI/CustomerHeader.jsx - FIXED NAVIGATION
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faUser,
  faBell,
  faSun,
  faMoon,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useSidebar } from "../../context/SidebarContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import ConfirmModal from "./ConfirmModal.jsx";
import { useState } from "react";

export default function CustomerHeader() {
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const [showConfirm, setShowConfirm] = useState(null);

  const handleProfileClick = () => {
    console.log("🚀 CustomerHeader: Profile button clicked");
    console.log("📝 Navigating to /customer-profile");

    // IMPORTANT: Use navigate with replace: false
    navigate("/customer-profile");
  };

  const handleLogoutClick = () => setShowConfirm("logout");
  const confirmLogout = async () => {
    await logout();
    setShowConfirm(null);
    navigate("/");
  };

  return (
    <>
      <header className="header">
        <div className="header-left">
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          <h1 className="header-title">Customer Portal</h1>
        </div>

        <div className="header-right">
          {/* Theme Toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${
              theme === "light" ? "dark" : "light"
            } mode`}
          >
            <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} />
          </button>

          {/* Profile Button - SIMPLIFIED */}
          <button
            className="profile-btn"
            onClick={handleProfileClick}
            aria-label="View profile"
          >
            <div className="profile-avatar">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User avatar" />
              ) : (
                <FontAwesomeIcon icon={faUser} />
              )}
            </div>
            <div className="profile-info">
              <span className="profile-name">
                {user?.displayName || user?.email?.split("@")[0] || "Customer"}
              </span>
              <span className="profile-role">Customer</span>
            </div>
          </button>

          {/* Logout Button */}
          <button
            className="logout-btn"
            onClick={handleLogoutClick}
            aria-label="Logout"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
          </button>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showConfirm === "logout" && (
        <ConfirmModal
          message="Are you sure you want to log out?"
          onConfirm={confirmLogout}
          onCancel={() => setShowConfirm(null)}
        />
      )}
    </>
  );
}
