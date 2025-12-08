// Pages/CustomerDashboard.jsx (create this file)
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CustomerDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    // Simply redirect customers to their orders page
    navigate("/orderspage", { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="loading-spinner mb-4"></div>
        <p>Redirecting to your orders...</p>
      </div>
    </div>
  );
}
