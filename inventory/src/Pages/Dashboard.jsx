import React from "react";
import Sidebar from "../components/UI/sidebar.jsx";



export default function Dashboard() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <h1>Welcome to the Dashboard</h1>
        {/* Later replace this with routes or page content */}
      </div>
    </div>
  );
}
