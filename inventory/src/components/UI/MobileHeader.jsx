// components/UI/MobileHeader.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { useSidebar } from "../../context/SidebarContext";

export default function MobileHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="mobile-header">
      <div className="mobile-header-content">
        <button className="mobile-menu-btn" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={faBars} />
        </button>
        <h1 className="mobile-app-title">FREDDIE'S GOODIES</h1>
        <div className="header-spacer"></div> {/* For balance */}
      </div>
    </header>
  );
}
