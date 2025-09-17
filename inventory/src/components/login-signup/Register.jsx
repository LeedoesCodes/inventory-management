import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GuestHeader } from "../UI/Headers";
import Footer from "../UI/Footer";
import "../../styles/register.scss";

// Firebase imports
import { auth } from "../../Firebase/firebase";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";

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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User registered:", userCredential.user);

        await signOut(auth);

        
        navigate("/login", {
          state: { successMessage: " Account created successfully! Please login." }
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
    <div className="RegisterPage">
      
      <div className="main-container">
        <form onSubmit={handle_submit}>
          <h1>Register</h1>

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => set_email(e.target.value)}
          />

          <input
            type={passwordReveal ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => set_password(e.target.value)}
          />

          <input
            type={passwordReveal ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => set_confirmPassword(e.target.value)}
          />

          <div className="show-password">
            <input
              type="checkbox"
              id="showPassword"
              checked={passwordReveal}
              onChange={() => set_passwordReveal(!passwordReveal)}
            />
            <label htmlFor="showPassword">Show Password</label>
          </div>

          <button type="submit" className="create-account-btn">
            <span>Create Account</span>
          </button>

          <p className="login-redirect">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
          <p className="prompt">{prompt}</p>
        </form>
      </div>
     
    </div>
  );
}
