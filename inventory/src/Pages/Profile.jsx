import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import avatar from "../assets/images/avatar-default.png";
import "../styles/profile.scss";
import ConfirmModal from "../components/UI/ConfirmModal.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import Sidebar from "../components/UI/sidebar.jsx";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogoutClick = () => setShowConfirm(true);
  const confirmLogout = () => {
    logout();
    setShowConfirm(false);
    navigate("/login");
  };
  const cancelLogout = () => setShowConfirm(false);

  return (
    <div className="profile-page">
      <Sidebar />

      <div className="profile-card">
        <img
          src={user?.photoURL || avatar}
          alt="User Avatar"
          className="profile-avatar"
        />
        <h2 className="profile-name">{user?.displayName || user?.email}</h2>
        <p className="profile-role">Admin</p>

        <button className="logout-btn" onClick={handleLogoutClick}>
          Logout
        </button>
      </div>

      {showConfirm && (
        <ConfirmModal
          message="Are you sure you want to log out?"
          onConfirm={confirmLogout}
          onCancel={cancelLogout}
        />
      )}
    </div>
  );
}
