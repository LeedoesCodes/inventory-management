import React from "react";
import Sidebar from "../components/UI/Sidebar.jsx";

import "../styles/dashboard.scss";

const dummyData = {
  totalProducts: 120,
  totalSuppliers: 15,
  totalOrders: 32,
  lowStock: 8,
  popularItems: [
    { name: "Chicharron", sold: 50 },
    { name: "Piattos", sold: 42 },
    { name: "Nova", sold: 37 },
  ],
};

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-content">
        <h1>Inventory Dashboard</h1>

        <div className="stats-cards">
          <div className="card">
            <h2>{dummyData.totalProducts}</h2>
            <p>Total Products</p>
          </div>
          <div className="card">
            <h2>{dummyData.totalSuppliers}</h2>
            <p>Total Suppliers</p>
          </div>
          <div className="card">
            <h2>{dummyData.totalOrders}</h2>
            <p>Total Orders</p>
          </div>
          <div className="card low-stock">
            <h2>{dummyData.lowStock}</h2>
            <p>Low Stock Items</p>
          </div>
        </div>

        <div className="popular-items">
          <h2>Popular Items</h2>
          <ul>
            {dummyData.popularItems.map((item, index) => (
              <li key={index}>
                {item.name} - {item.sold} sold
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
