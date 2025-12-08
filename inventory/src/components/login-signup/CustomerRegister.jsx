// components/login-signup/CustomerRegister.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import "../../styles/register.scss";
import freddieLogo from "../../assets/images/freddie-logo.png";

import { auth, db } from "../../Firebase/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function CustomerRegister() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [passwordReveal, setPasswordReveal] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Back button handler
  const handleBackToRoleSelection = () => {
    navigate("/");
  };

  async function handleCustomerRegister(e) {
    e.preventDefault();
    setPrompt("");
    setLoading(true);

    // Validation
    if (!email || !password || !confirmPassword || !displayName.trim()) {
      setPrompt("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (displayName.trim().length < 2) {
      setPrompt("Display name must be at least 2 characters long.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setPrompt("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setPrompt("Passwords do not match.");
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setPrompt("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      console.log("Customer registered:", user);

      // Create customer profile in Firestore with customer role
      await setDoc(doc(db, "users", user.uid), {
        email: user.email.toLowerCase(),
        displayName: displayName.trim(),
        role: "customer", // Direct customer role, no approval needed
        userType: "customer",
        isActive: true,
        createdAt: new Date(),
        lastLogin: new Date(),
        customerProfile: {
          bookingCount: 0,
          preferences: {},
        },
      });

      // Auto-login after registration and redirect to orders page
      navigate("/orderspage", {
        state: {
          successMessage:
            "Welcome! Your customer account has been created successfully.",
          isNewCustomer: true,
        },
      });
    } catch (err) {
      console.error("Registration error:", err);

      let errorMessage = "Registration failed. Please try again.";

      if (err.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection.";
      }

      setPrompt(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
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
          <form onSubmit={handleCustomerRegister}>
            <h1>Customer Registration</h1>

            {/* Customer badge */}
            <div className="customer-badge">
              <span>Customer</span>
            </div>

            <input
              type="text"
              placeholder="Full Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              required
              disabled={loading}
            />

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
            <input
              type={passwordReveal ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
            <div className="show-password">
              <input
                type="checkbox"
                checked={passwordReveal}
                onChange={() => setPasswordReveal(!passwordReveal)}
                disabled={loading}
              />
              <label>Show Password</label>
            </div>

            <button
              type="submit"
              className="create-account-btn"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <div className="customer-links">
              <p className="login-redirect">
                Already have an account?{" "}
                <Link to="/customer-login">Login here</Link>
              </p>
            </div>

            {prompt && (
              <p
                className={`prompt ${
                  prompt.includes("Welcome") ? "success" : "error"
                }`}
              >
                {prompt}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
