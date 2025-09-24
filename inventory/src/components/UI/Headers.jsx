import React, { useContext } from "react";
import { useLocation, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useSidebar } from "../../context/SidebarContext";
import avatar from "../../assets/images/avatar-default.png";
import "../../styles/header.scss";

export default function Header() {
  const { user, role } = useContext(AuthContext);
  const { isCollapsed } = useSidebar();
  const location = useLocation();

  const pageTitles = {
    "/dashboard": "Dashboard",
    "/products": "Products",
    "/settings": "Settings",
    "/orderspage": "Orders",
    "/user-approvals": "User Approvals",
    "/profile": "My Profile",
    "/transactionHistory": "Transaction History",
  };

  const title = pageTitles[location.pathname] || "Welcome";

  return (
    <header className={`app-header ${isCollapsed ? "collapsed" : ""}`}>
      <div className="header-left">
        <h2 className="page-title">{title}</h2>
      </div>

      <Link to="/profile" className="header-profile">
        <img
          src={user?.photoURL || avatar}
          alt="User"
          className="profile-pic"
        />
        <div className="profile-info">
          <p className="role">{role === "admin" ? "Admin" : "User"}</p>
        </div>
      </Link>
    </header>
  );
}
