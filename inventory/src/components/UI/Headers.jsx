import React, { useContext, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useSidebar } from "../../context/SidebarContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import avatar from "../../assets/images/avatar-default.png";
import "../../styles/header.scss";

export default function Header() {
  const { user, role } = useContext(AuthContext);
  const { isCollapsed, isMobile, toggleSidebar } = useSidebar();
  const location = useLocation();

  const pageTitles = {
    "/dashboard": "Dashboard",
    "/products": "Products",
    "/settings": "Settings",
    "/orderspage": "Orders",
    "/user-approvals": "User Approvals",
    "/profile": "My Profile",
    "/transactionHistory": "Transaction History",
    "/customer-management": "Customer Management",
    "/user-management": "User Management",
  };

  const title = pageTitles[location.pathname] || "Welcome";

  // Debug log to see header state on each render
  useEffect(() => {
    console.log(
      "Header rendered - isMobile:",
      isMobile,
      "path:",
      location.pathname
    );
  }, [isMobile, location.pathname]);

  return (
    <header className={`app-header ${isCollapsed ? "collapsed" : ""}`}>
      <div className="header-left">
        {/* Mobile Hamburger Icon (left side) - ALWAYS show if mobile */}
        {isMobile && (
          <button
            className="mobile-menu-btn"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            style={{ display: "block" }} // Force display
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        )}

        {/* Show page title for both mobile and desktop */}
        <h2 className="page-title">{title}</h2>
      </div>

      <Link to="/profile" className="header-profile">
        <img
          src={user?.photoURL || avatar}
          alt="User"
          className="profile-pic"
        />
        {!isMobile && (
          <div className="profile-info">
            <p className="display-name">
              {user?.displayName || user?.name || "User"}
            </p>
            <p className="role">
              {role === "admin"
                ? "Administrator"
                : role === "developer"
                ? "Developer"
                : "Employee"}
            </p>
          </div>
        )}
      </Link>
    </header>
  );
}
