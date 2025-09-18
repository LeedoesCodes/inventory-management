import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GuestHeader } from "../UI/Headers";
import Footer from "../UI/Footer";
import "../../styles/register.scss";
import freddielogo from "../../assets/images/freddie-logo.png";

// Firebase imports
import { auth } from "../../Firebase/firebase";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../Firebase/firebase";

export default function Register() {
  const [email, set_email] = useState("");
  const [password, set_password] = useState("");
  const [confirmPassword, set_confirmPassword] = useState("");
  const [passwordReveal, set_passwordReveal] = useState(false);
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  function setPromptColor(msgType) {
    const promptElement = document.querySelector(".prompt");
    if (!promptElement) return;

    if (msgType === "error") promptElement.style.color = "red";
    else if (msgType === "success") promptElement.style.color = "green";
    else promptElement.style.color = "black";
  }

  async function handle_submit(e) {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      setPromptColor("error");
      setPrompt("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setPromptColor("error");
      setPrompt("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setPromptColor("error");
      setPrompt("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      console.log("User registered:", user);

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "pending", // default role (admin will approve later)
        permissions: [],
        createdAt: new Date(),
      });

      await signOut(auth);

      navigate("/login", {
        state: {
          successMessage: "Account created! Please wait for admin approval.",
        },
      });
    } catch (err) {
      console.error("Error:", err.message);
      setPromptColor("error");

      if (err.code === "auth/email-already-in-use") {
        setPrompt("This email is already in use.");
      } else if (err.code === "auth/invalid-email") {
        setPrompt("Invalid email format.");
      } else if (err.code === "auth/weak-password") {
        setPrompt("Password is too weak (min 6 characters).");
      } else {
        setPrompt(err.message);
      }
    }
  }

  return (
    <div className="register-page">
      <div className="split-container">
        <div className="logo-side">
          <img src={freddielogo} alt="Company Logo" className="company-logo" />
        </div>
        <div className="form-side">
          <form onSubmit={handle_submit}>
            <h1>Register</h1>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => set_email(e.target.value)}
            />
            <input
              type={passwordReveal ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => set_password(e.target.value)}
            />
            <input
              type={passwordReveal ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => set_confirmPassword(e.target.value)}
            />
            <div className="show-password">
              <input
                type="checkbox"
                checked={passwordReveal}
                onChange={() => set_passwordReveal(!passwordReveal)}
              />
              <label>Show Password</label>
            </div>
            <button type="submit" className="create-account-btn">
              Create Account
            </button>
            <p className="login-redirect">
              Already have an account? <Link to="/login">Login here</Link>
            </p>
            <p className="prompt">{prompt}</p>
          </form>
        </div>
      </div>
    </div>
  );
}
