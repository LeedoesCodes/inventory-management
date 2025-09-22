// src/components/UI/UserAccountDeletion.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../Firebase/firebase";
import "../../styles/UserAccountDeletion.scss";

import {
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import ConfirmModal from "./ConfirmModal.jsx";

export default function UserAccountDeletion() {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleDeleteClick = () => {
    setError("");
    setPassword("");
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      if (!auth.currentUser) return;

      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        password
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      await deleteDoc(doc(db, "users", auth.currentUser.uid));

      await deleteUser(auth.currentUser);

      navigate("/login", {
        state: {
          successMessage: "Your account has been deleted successfully.",
        },
      });
    } catch (err) {
      console.error("Error deleting account:", err);
      if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else {
        setError("Failed to delete account. Please try again.");
      }
    } finally {
      setPassword("");
    }
  };

  return (
    <>
      <button className="delete-btn" onClick={handleDeleteClick}>
        Delete Account
      </button>

      {showConfirm && (
        <ConfirmModal
          message={
            <div className="delete-confirmation">
              <p
                style={{ color: "black", fontWeight: "bold", fontSize: "1rem" }}
              >
                Enter your password to confirm account deletion. This action
                cannot be undone.
              </p>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="password-input"
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  marginTop: "1rem",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {error && (
                <p style={{ color: "red" }} className="prompt error">
                  {error}
                </p>
              )}
            </div>
          }
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowConfirm(false);
            setPassword("");
            setError("");
          }}
        />
      )}
    </>
  );
}
