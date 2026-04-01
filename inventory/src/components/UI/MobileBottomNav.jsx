// components/UI/MobileBottomNav.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faBoxOpen,
  faClipboardList,
  faMoneyBill,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

export default function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav">
      <NavLink
        to="/dashboard"
        className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
      >
        <FontAwesomeIcon icon={faHouse} />
        <span>Dashboard</span>
      </NavLink>

      <NavLink
        to="/products"
        className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
      >
        <FontAwesomeIcon icon={faBoxOpen} />
        <span>Products</span>
      </NavLink>

      <NavLink
        to="/orderspage"
        className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
      >
        <FontAwesomeIcon icon={faClipboardList} />
        <span>Orders</span>
      </NavLink>

      <NavLink
        to="/transactionHistory"
        className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
      >
        <FontAwesomeIcon icon={faMoneyBill} />
        <span>Transactions</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
      >
        <FontAwesomeIcon icon={faUser} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}
