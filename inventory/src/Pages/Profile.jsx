import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import avatar from "../assets/images/avatar-default.png";
import "../styles/profile.scss";
import ConfirmModal from "../components/UI/ConfirmModal.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import Sidebar from "../components/UI/Sidebar.jsx";
import UserAccountDeletion from "../components/UI/UserAccountDeletion.jsx";

//fontawesome para sa edit button
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPen } from "@fortawesome/free-solid-svg-icons";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, role } = useContext(AuthContext);

  const [showConfirm, setShowConfirm] = useState(null);

  const handleLogoutClick = () => setShowConfirm("logout");
  const confirmLogout = () => {
    logout();
    setShowConfirm(null);
    navigate("/login");
  };

  return (
    <div className="profile-page">
      <Sidebar />

      <div className="profile-card">
        <h1 className="profile-title">Profile</h1>
        <div className="avatar-wrapper">
          <img
            src={user?.photoURL || avatar}
            alt="User Avatar"
            className="profile-avatar"
          />
          <FontAwesomeIcon icon={faUserPen} className="edit-icon" />
        </div>
        <h2 className="profile-name">{user?.displayName || user?.email}</h2>
        <p className="role">{role === "admin" ? "Admin" : "User"}</p>
        <div className="spacer"></div>

        <div className="button-group">
          <button className="logout-btn" onClick={handleLogoutClick}>
            Logout
          </button>

          <UserAccountDeletion user={user} />
        </div>
      </div>

      {showConfirm === "logout" && (
        <ConfirmModal
          message="Are you sure you want to log out?"
          onConfirm={confirmLogout}
          onCancel={() => setShowConfirm(null)}
        />
      )}
    </div>
  );
}
