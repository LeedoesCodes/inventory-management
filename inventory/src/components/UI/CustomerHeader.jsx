// components/UI/CustomerHeader.jsx - UPDATED TO MATCH Header.jsx STRUCTURE
import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useSidebar } from "../../context/SidebarContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../Firebase/firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import avatar from "../../assets/images/avatar-default.png";
import "../../styles/header.scss";

export default function CustomerHeader() {
  const { user, role, isLoggedIn } = useContext(AuthContext);
  const { isCollapsed, isMobile, toggleSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Real-time listener for current user data
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Handle profile click - FOR CUSTOMER ONLY
  const handleProfileClick = () => {
    if (!isLoggedIn) {
      navigate("/");
      return;
    }

    console.log("🛒 CustomerHeader.jsx: Customer profile clicked, role:", role);

    // IMPORTANT: Only customers should use this header
    if (role !== "customer") {
      console.log("❌ Staff in customer header! Redirecting to /profile");
      navigate("/profile");
      return;
    }

    // Customers go to /customer-profile
    navigate("/customer-profile");
  };

  // Customer-specific page titles
  const pageTitles = {
    "/customer-dashboard": "Dashboard",
    "/customer-orders": "Place Order",
    "/customer-transactions": "My Orders",
    "/customer-settings": "Settings",
    "/customer-profile": "My Profile",
  };

  const title = pageTitles[location.pathname] || "Customer Portal";

  // Get profile picture
  const getProfilePicture = () => {
    if (userData?.photoURL) return userData.photoURL;
    if (user?.photoURL) return user.photoURL;
    return avatar;
  };

  const profilePicture = getProfilePicture();

  // Get role display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case "customer":
        return "Customer";
      default:
        return "User";
    }
  };

  // If user is not customer, don't show this header at all
  if (role !== "customer") {
    console.log(
      "⚠️ CustomerHeader.jsx: Non-customer detected, this header should not be shown!"
    );
    return null;
  }

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

      {isLoggedIn ? (
        <button
          onClick={handleProfileClick}
          className="header-profile"
          aria-label="Go to profile"
          disabled={loading}
        >
          <img
            src={loading ? avatar : profilePicture}
            alt="User"
            className="profile-pic"
            onError={(e) => {
              e.target.src = avatar;
            }}
          />
          {!isMobile && (
            <div className="profile-info">
              <p className="display-name">
                {loading
                  ? "Loading..."
                  : userData?.displayName || user?.displayName || "Customer"}
              </p>
              <p className="role">
                {loading ? "..." : getRoleDisplayName(role)}
              </p>
            </div>
          )}
        </button>
      ) : (
        <button
          onClick={() => navigate("/")}
          className="header-profile login-prompt"
          aria-label="Login or select role"
        >
          <img src={avatar} alt="Guest" className="profile-pic" />
          {!isMobile && (
            <div className="profile-info">
              <p className="display-name">Guest</p>
              <p className="role">Click to login</p>
            </div>
          )}
        </button>
      )}
    </header>
  );
}
