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
  faTimes,
  faChartLine, // Add analytics icon
  faChartBar, // Alternative analytics icon
} from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useSidebar } from "../../context/SidebarContext.jsx";

export default function Sidebar() {
  const { role } = useContext(AuthContext);
  const {
    isCollapsed,
    toggleSidebar,
    isMobile,
    isMobileSidebarOpen,
    closeMobileSidebar,
  } = useSidebar();

  // Close sidebar when clicking on a link (mobile)
  const handleNavClick = () => {
    if (isMobile) {
      closeMobileSidebar();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeMobileSidebar}
          onKeyDown={(e) => e.key === "Escape" && closeMobileSidebar()}
          tabIndex={-1}
          role="button"
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <div
        className={`sidebar ${isCollapsed ? "collapsed" : ""} ${
          isMobileSidebarOpen ? "mobile-open" : ""
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="sidebar-header">
          <button
            className="toggle-btn"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          {/* Mobile Close Button */}
          {isMobile && (
            <button
              className="mobile-close-btn"
              onClick={closeMobileSidebar}
              aria-label="Close sidebar"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
        {/*       <div className="sidebar-brand">
        <h1 className="app-title" aria-label="Freddie's Goodies">
          FREDDIE'S GOODIES 
        </h1> */}

        <nav aria-label="Sidebar menu">
          <ul className="menu">
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
                onClick={handleNavClick}
                end
              >
                <FontAwesomeIcon icon={faHouse} aria-hidden="true" />
                <span className="menu-text">Dashboard</span>
              </NavLink>
            </li>

            {/* NEW Analytics Link */}
            <li>
              <NavLink
                to="/analytics"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
                onClick={handleNavClick}
              >
                <FontAwesomeIcon icon={faChartLine} aria-hidden="true" />
                <span className="menu-text">Analytics</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
                onClick={handleNavClick}
              >
                <FontAwesomeIcon icon={faBoxOpen} aria-hidden="true" />
                <span className="menu-text">Products</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/orderspage"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
                onClick={handleNavClick}
              >
                <FontAwesomeIcon icon={faClipboardList} aria-hidden="true" />
                <span className="menu-text">Orders</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/transactionHistory"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
                onClick={handleNavClick}
              >
                <FontAwesomeIcon icon={faMoneyBill} aria-hidden="true" />
                <span className="menu-text">Transactions</span>
              </NavLink>
            </li>

            {(role === "admin" || role === "owner") && (
              <>
                <li className="menu-section" role="separator">
                  <span className="section-label">ADMIN</span>
                </li>

                <li>
                  <NavLink
                    to="/user-approvals"
                    className={({ isActive }) =>
                      isActive ? "nav-link active" : "nav-link"
                    }
                    onClick={handleNavClick}
                  >
                    <FontAwesomeIcon icon={faUserCheck} aria-hidden="true" />
                    <span className="menu-text">User Approvals</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/customer-management"
                    className={({ isActive }) =>
                      isActive ? "nav-link active" : "nav-link"
                    }
                    onClick={handleNavClick}
                  >
                    <FontAwesomeIcon icon={faUsers} aria-hidden="true" />
                    <span className="menu-text">Customer Management</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/user-management"
                    className={({ isActive }) =>
                      isActive ? "nav-link active" : "nav-link"
                    }
                    onClick={handleNavClick}
                  >
                    <FontAwesomeIcon icon={faUserCog} aria-hidden="true" />
                    <span className="menu-text">User Management</span>
                  </NavLink>
                </li>
              </>
            )}

            <li className="menu-section" role="separator">
              <span className="section-label">PREFERENCES</span>
            </li>

            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
                onClick={handleNavClick}
              >
                <FontAwesomeIcon icon={faGear} aria-hidden="true" />
                <span className="menu-text">Settings</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
