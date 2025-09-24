import React, { useContext } from "react";
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
import { useSidebar } from "../../context/SidebarContext.jsx";

export default function Sidebar() {
  const { role } = useContext(AuthContext);
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <button className="toggle-btn" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>

      {!isCollapsed && (
        <div className="company-logo-container">
          <img src={fredLogo} alt="Company Logo" className="company-logo" />
        </div>
      )}

      <h1 className="app-title">{!isCollapsed && "FREDDIE'S GOODIES"}</h1>

      <ul className="menu">
        <li>
          <Link to="/dashboard">
            <FontAwesomeIcon icon={faHouse} />
            {!isCollapsed && <span className="menu-text">Dashboard</span>}
          </Link>
        </li>
        <li>
          <Link to="/products">
            <FontAwesomeIcon icon={faBoxOpen} />
            {!isCollapsed && <span className="menu-text">Products</span>}
          </Link>
        </li>
        <li>
          <Link to="/settings">
            <FontAwesomeIcon icon={faGear} />
            {!isCollapsed && <span className="menu-text">Settings</span>}
          </Link>
        </li>
        <li>
          <Link to="/orderspage">
            <FontAwesomeIcon icon={faClipboardList} />
            {!isCollapsed && <span className="menu-text">Orders</span>}
          </Link>
        </li>
        <li>
          <Link to="/transactionHistory">
            <FontAwesomeIcon icon={faMoneyBill} />
            {!isCollapsed && <span className="menu-text">Transactions</span>}
          </Link>
        </li>

        {role === "admin" && (
          <li>
            <Link to="/user-approvals">
              <FontAwesomeIcon icon={faClipboardList} />
              {!isCollapsed && (
                <span className="menu-text">User Approvals</span>
              )}
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
