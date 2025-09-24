import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/sidebar.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faHouse,
  faBoxOpen,
  faGear,
  faClipboardList,
  faMoneyBill,
} from "@fortawesome/free-solid-svg-icons";
import fredLogo from "../../assets/images/fred-logo.png";
import { AuthContext } from "../../context/AuthContext.jsx";

export default function Sidebar() {
  const { role } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <button className="toggle-btn" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>

      {/* Logo only visible when NOT collapsed */}
      {!collapsed && (
        <div className="company-logo-container">
          <img src={fredLogo} alt="Company Logo" className="company-logo" />
        </div>
      )}

      <h1 className="app-title">{!collapsed && "FREDDIE'S GOODIES"}</h1>

      <ul className="menu">
        <li>
          <Link to="/dashboard">
            <FontAwesomeIcon icon={faHouse} />
            {!collapsed && <span className="menu-text">Dashboard</span>}
          </Link>
        </li>
        <li>
          <Link to="/products">
            <FontAwesomeIcon icon={faBoxOpen} />
            {!collapsed && <span className="menu-text">Products</span>}
          </Link>
        </li>
        <li>
          <Link to="/settings">
            <FontAwesomeIcon icon={faGear} />
            {!collapsed && <span className="menu-text">Settings</span>}
          </Link>
        </li>
        <li>
          <Link to="/orderspage">
            <FontAwesomeIcon icon={faClipboardList} />
            {!collapsed && <span className="menu-text">Orders</span>}
          </Link>
        </li>
        <li>
          <Link to="/transactionHistory">
            <FontAwesomeIcon icon={faMoneyBill} />
            {!collapsed && <span className="menu-text">Transactions</span>}
          </Link>
        </li>

        {role === "admin" && (
          <li>
            <Link to="/user-approvals">
              <FontAwesomeIcon icon={faClipboardList} />
              {!collapsed && <span className="menu-text">User Approvals</span>}
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
