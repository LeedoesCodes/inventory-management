// src/components/Sidebar.jsx
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import "../../styles/sidebar.scss";
import fredLogo from "../../assets/images/fred-logo.png";
import avatar from "../../assets/images/avatar-default.png";
import { AuthContext } from "../../context/AuthContext.jsx";

export default function Sidebar() {
  const { user, role } = useContext(AuthContext);

  return (
    <div className="sidebar">
      <div className="company-logo-container">
        <img src={fredLogo} alt="Company Logo" className="company-logo" />
      </div>

      <h1 className="app-title">FREDDIE'S GOODIES</h1>

      <Link to="/profile" className="profile-link">
        <div className="profile">
          <img
            src={user?.photoURL || avatar}
            alt="User"
            className="profile-pic"
          />
          <div className="profile-info">
            <p className="name">{user?.displayName || user?.email}</p>
            <p className="role">{role === "admin" ? "Admin" : "User"}</p>
          </div>
        </div>
      </Link>

      <ul className="menu">
        <li>
          <Link to="/dashboard">Dashboard</Link>
        </li>
        <li>
          <Link to="/inventory">Inventory</Link>
        </li>
        <li>
          <Link to="/products">Products</Link>
        </li>
        <li>
          <Link to="/settings">Settings</Link>
        </li>

        {role === "admin" && (
          <li>
            <Link to="/user-approvals">User Approvals</Link>
          </li>
        )}
      </ul>
    </div>
  );
}
