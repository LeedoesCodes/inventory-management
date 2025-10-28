import React, { useContext, useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useSidebar } from "../../context/SidebarContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../Firebase/firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import avatar from "../../assets/images/avatar-default.png";
import "../../styles/header.scss";

export default function Header() {
  const { user, role } = useContext(AuthContext);
  const { isCollapsed, isMobile, toggleSidebar } = useSidebar();
  const location = useLocation();
  const [userData, setUserData] = useState(null);

  // Real-time listener for current user data
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        }
      },
      (error) => {
        console.error("Error fetching user data:", error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

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

  // Get profile picture with priority: Firestore -> Auth -> default
  const getProfilePicture = () => {
    // First try Firestore data (most up-to-date)
    if (userData?.photoURL) {
      return userData.photoURL;
    }
    // Then try Auth context
    if (user?.photoURL) {
      return user.photoURL;
    }
    // Fallback to default
    return avatar;
  };

  const profilePicture = getProfilePicture();

  return (
    <header className={`app-header ${isCollapsed ? "collapsed" : ""}`}>
      <div className="header-left">
        {isMobile && (
          <button
            className="mobile-menu-btn"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            style={{ display: "block" }}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        )}

        <h2 className="page-title">{title}</h2>
      </div>

      <Link to="/profile" className="header-profile">
        <img
          src={profilePicture}
          alt="User"
          className="profile-pic"
          onError={(e) => {
            // Fallback if image fails to load
            e.target.src = avatar;
          }}
        />
        {!isMobile && (
          <div className="profile-info">
            <p className="display-name">
              {userData?.displayName ||
                user?.displayName ||
                user?.name ||
                "User"}
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
