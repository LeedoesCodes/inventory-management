import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import "../../styles/sidebar.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faHouse,
  faBoxOpen,
  faGear,
  faClipboardList,
  faMoneyBill,
  faUsers,
  faUserCheck,
  faUserCog,
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

      <h1 className="app-title">{!isCollapsed && "FREDDIE'S GOODIES"}</h1>

      <ul className="menu">
        <li>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <FontAwesomeIcon icon={faHouse} />
            {!isCollapsed && <span className="menu-text">Dashboard</span>}
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <FontAwesomeIcon icon={faBoxOpen} />
            {!isCollapsed && <span className="menu-text">Products</span>}
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/orderspage"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <FontAwesomeIcon icon={faClipboardList} />
            {!isCollapsed && <span className="menu-text">Orders</span>}
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/transactionHistory"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <FontAwesomeIcon icon={faMoneyBill} />
            {!isCollapsed && <span className="menu-text">Transactions</span>}
          </NavLink>
        </li>

        {(role === "admin" || role === "owner") && (
          <>
            <li className="menu-section">
              {!isCollapsed && <span className="section-label">ADMIN</span>}
            </li>
            <li>
              <NavLink
                to="/user-approvals"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                <FontAwesomeIcon icon={faUserCheck} />
                {!isCollapsed && (
                  <span className="menu-text">User Approvals</span>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/customer-management"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                <FontAwesomeIcon icon={faUsers} />
                {!isCollapsed && (
                  <span className="menu-text">Customer Management</span>
                )}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/user-management"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                <FontAwesomeIcon icon={faUserCog} />
                {!isCollapsed && (
                  <span className="menu-text">User Management</span>
                )}
              </NavLink>
            </li>
          </>
        )}

        <li className="menu-section">
          {!isCollapsed && <span className="section-label">PREFERENCES</span>}
        </li>
        <li>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <FontAwesomeIcon icon={faGear} />
            {!isCollapsed && <span className="menu-text">Settings</span>}
          </NavLink>
        </li>
      </ul>
    </div>
  );
}
