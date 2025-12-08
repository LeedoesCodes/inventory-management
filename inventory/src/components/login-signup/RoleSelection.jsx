// components/login-signup/RoleSelection.jsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { auth, db } from "../../Firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faBriefcase,
  faSync,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";
import "./RoleSelection.scss";

function RoleSelection() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const hasCheckedAuthRef = useRef(false);

  useEffect(() => {
    // Only check auth once
    if (hasCheckedAuthRef.current) {
      setLoading(false);
      setShowRoleSelection(true);
      return;
    }

    hasCheckedAuthRef.current = true;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userQuery = query(
            collection(db, "users"),
            where("email", "==", user.email)
          );
          const querySnapshot = await getDocs(userQuery);

          let userRole = "pending";

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            userRole = userData.role || "pending";
          }

          console.log(
            `User ${user.email} with role ${userRole} is already logged in`
          );

          // Determine route based on role - USE REPLACE TO PREVENT BACK BUTTON ISSUES
          if (userRole === "customer") {
            navigate("/orderspage", { replace: true });
          } else if (userRole === "approved" || userRole === "admin") {
            navigate("/dashboard", { replace: true });
          } else if (userRole === "pending") {
            navigate("/lobby", { replace: true });
          } else {
            navigate("/lobby", { replace: true });
          }
        } catch (error) {
          console.error("Error checking user role:", error);
          setLoading(false);
          setShowRoleSelection(true);
        }
      } else {
        // No user logged in
        setLoading(false);
        setShowRoleSelection(true);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Simple button handlers
  const handleCustomerClick = () => {
    navigate("/customer-login");
  };

  const handleEmployeeClick = () => {
    navigate("/login");
  };

  // Handle email click - opens Gmail compose window
  const handleEmailClick = () => {
    const email = "leesingeon@gmail.com";
    const subject = "Role Selection Help - Freddie's GOODIES";
    const body =
      "Hello, I need help with selecting the appropriate role for my account.";

    // Open Gmail compose window
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  // Show loading state
  if (loading) {
    return (
      <div className="role-selection-page">
        <div className="role-selection-modal">
          <div className="loading-spinner">
            <FontAwesomeIcon icon={faSync} className="spinning" />
          </div>
          <p>Checking your account...</p>
        </div>
      </div>
    );
  }

  // Show simple role selection
  if (showRoleSelection) {
    return (
      <div className="role-selection-page">
        <div className="role-selection-modal">
          <h1>Welcome to Freddie's GOODIES</h1>
          <p>Please select your role to continue</p>

          <div className="role-buttons">
            <button
              onClick={handleCustomerClick}
              className="role-button customer-role"
            >
              <FontAwesomeIcon icon={faUser} className="role-icon" />
              <span>I'm a Customer</span>
            </button>

            <button
              onClick={handleEmployeeClick}
              className="role-button worker-role"
            >
              <FontAwesomeIcon icon={faBriefcase} className="role-icon" />
              <span>I'm an Employee</span>
            </button>
          </div>

          <div className="role-help-section">
            <p className="role-help-text">Not sure which role to select?</p>
            <div className="contact-admin">
              <FontAwesomeIcon icon={faEnvelope} className="email-icon" />
              <p className="help-text">
                Need help? Contact admin at{" "}
                <button
                  onClick={handleEmailClick}
                  className="email-link"
                  aria-label="Contact admin via email"
                >
                  <strong>leesingeon@gmail.com</strong>
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="role-selection-page">
      <div className="role-selection-modal">
        <div className="loading-spinner">
          <FontAwesomeIcon icon={faSync} className="spinning" />
        </div>
        <p>Loading...</p>
      </div>
    </div>
  );
}

export default RoleSelection;
