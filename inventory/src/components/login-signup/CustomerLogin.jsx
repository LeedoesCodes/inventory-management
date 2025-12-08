// components/login-signup/CustomerLogin.jsx
import React, { useState } from "react";
import { auth, db } from "../../Firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "../../styles/login.scss";
import freddieLogo from "../../assets/images/freddie-logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function CustomerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordReveal, setPasswordReveal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.successMessage;

  // Back button handler - goes back to role selection
  const handleBackToRoleSelection = () => {
    navigate("/");
  };

  const handleUserRedirect = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      // Customers go directly to orders page
      navigate("/orderspage");
    } else {
      // This shouldn't happen for customers, but just in case
      navigate("/orderspage");
    }
  };

  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      await handleUserRedirect(userCredential.user);
    } catch (err) {
      let errorMessage = "Login failed. Please try again.";

      if (err.code === "auth/user-not-found") {
        errorMessage = "No account found with this email.";
      } else if (err.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (err.code === "auth/invalid-credential") {
        errorMessage =
          "Invalid login credentials. Please check your email and password.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (err.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="split-container">
        <div className="logo-side">
          {/* Back Button */}
          <button
            className="back-button"
            onClick={handleBackToRoleSelection}
            aria-label="Go back to role selection"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back</span>
          </button>
          <img src={freddieLogo} alt="Company Logo" className="company-logo" />
        </div>

        <div className="form-side">
          <form onSubmit={handleCustomerLogin}>
            <h1>Customer Login</h1>

            {/* Customer badge */}
            <div className="customer-badge">
              <span>Customer</span>
            </div>

            {successMessage && (
              <p className="prompt success">{successMessage}</p>
            )}

            <div className="inputbox">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <input
                type={passwordReveal ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <label className="show-password">
              <input
                type="checkbox"
                checked={passwordReveal}
                onChange={() => setPasswordReveal(!passwordReveal)}
                disabled={loading}
              />
              Show Password
            </label>

            <button type="submit" className="email-login" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="or-text">or</p>

            {/* Links section */}
            <div className="customer-links">
              <Link to="/customer-register" className="register-link">
                Create An Account
              </Link>
              <Link to="/forgot-password" className="forgot-password">
                Forgot Password?
              </Link>
            </div>

            {error && <p className="prompt error">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
