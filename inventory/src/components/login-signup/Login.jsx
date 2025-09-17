import React, { useState } from "react";
import { auth, db } from "../../Firebase/firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate, Link, useLocation } from "react-router-dom";
import googleLogo from "../../assets/images/google-logo.png";
import "../../styles/login.scss";
import Footer from "../UI/Footer";
import { GuestHeader } from "../UI/Headers";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordReveal, setPasswordReveal] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.successMessage;

  const handleUserRedirect = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();

      if (data.role === "admin") {
        navigate("/admin");
      } else if (data.role === "approved") {
        navigate("/dashboard");
      } else {
        navigate("/lobby");
      }
    } else {
      await setDoc(userRef, {
        email: user.email,
        role: "pending",
        permissions: [],
        createdAt: new Date(),
      });
      navigate("/lobby");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      await handleUserRedirect(userCredential.user);
    } catch (err) {
      if (err.code === "auth/invalid-credential") {
        setError(
          "This email is registered with Google. Please use 'Continue with Google' to sign in."
        );
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else {
        setError(err.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handleUserRedirect(result.user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <div className="main-container">
        <form onSubmit={handleLogin}>
          <h1>Login</h1>
          {successMessage && (
            <p
              className="prompt"
              style={{ color: "green", textAlign: "center" }}
            >
              {successMessage}
            </p>
          )}

          <div className="inputbox">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type={passwordReveal ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <label className="show-password">
            <input
              type="checkbox"
              checked={passwordReveal}
              onChange={() => setPasswordReveal(!passwordReveal)}
            />
            Show Password
          </label>

          <button type="submit" className="email-login">
            Login
          </button>

          <button
            type="button"
            className="google-login"
            onClick={handleGoogleLogin}
          >
            <img src={googleLogo} alt="Google Logo" />
            Continue with Google
          </button>

          {error && (
            <p className="prompt" style={{ color: "red" }}>
              {error}
            </p>
          )}

          <p className="redirect">
            Don’t have an account? <Link to="/register">Register here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
