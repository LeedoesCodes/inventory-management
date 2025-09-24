import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { useSidebar } from "../context/SidebarContext.jsx";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.scss";
import Header from "../components/UI/Headers";

export default function Dashboard() {
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    totalOrders: 0,
    lowStock: 0,
    popularItems: [],
    totalRevenue: 0,
    loading: true,
  });
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [productsSnap, ordersSnap] = await Promise.all([
        getDocs(collection(db, "products")),
        getDocs(collection(db, "orders")),
      ]);

      const products = productsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const orders = ordersSnap.docs.map((doc) => doc.data());

      // Calculate metrics
      const lowStockCount = products.filter((p) => p.stock <= 5).length;

      // Calculate revenue and popular items
      let totalRevenue = 0;
      const itemCounts = {};

      orders.forEach((order) => {
        totalRevenue += order.total || 0;
        order.items?.forEach((item) => {
          itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
        });
      });

      const sortedItems = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, sold]) => ({ name, sold }));

      setDashboardData({
        totalProducts: products.length,
        totalOrders: orders.length,
        lowStock: lowStockCount,
        popularItems: sortedItems,
        totalRevenue,
        loading: false,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
      setDashboardData((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Navigation handlers
  const handleAddProduct = () => {
    navigate("/products");
  };

  const handleViewInventory = () => {
    navigate("/products");
  };

  const handleManageOrders = () => {
    navigate("/orderspage");
  };

  const handleViewLowStock = () => {
    navigate("/low-stock");
  };

  if (error) {
    return (
      <div className={`dashboard-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-page ${isCollapsed ? "collapsed" : ""}`}>
      <Header />

      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <button
          onClick={fetchDashboardData}
          className="refresh-btn"
          disabled={dashboardData.loading}
        >
          {dashboardData.loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {dashboardData.loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          <div className="stats-cards">
            <div
              className="card products-card"
              onClick={handleViewInventory}
              style={{ cursor: "pointer" }}
            >
              <div className="card-icon">📦</div>
              <h2>{dashboardData.totalProducts.toLocaleString()}</h2>
              <p>Total Products</p>
            </div>

            <div
              className="card orders-card"
              onClick={handleManageOrders}
              style={{ cursor: "pointer" }}
            >
              <div className="card-icon">🛒</div>
              <h2>{dashboardData.totalOrders.toLocaleString()}</h2>
              <p>Total Orders</p>
            </div>

            <div className="card revenue-card">
              <div className="card-icon">💰</div>
              <h2>${dashboardData.totalRevenue.toLocaleString()}</h2>
              <p>Total Revenue</p>
            </div>

            <div
              className="card low-stock"
              onClick={handleViewLowStock}
              style={{ cursor: "pointer" }}
            >
              <div className="card-icon">⚠️</div>
              <h2>{dashboardData.lowStock}</h2>
              <p>Low Stock Items</p>
              <span className="stock-warning">Reorder needed</span>
            </div>
          </div>

          <div className="dashboard-content">
            <div className="popular-items">
              <div className="section-header">
                <h2>Most Popular Products</h2>
                <span>Top 5 best sellers</span>
              </div>
              <div className="items-list">
                {dashboardData.popularItems.length > 0 ? (
                  dashboardData.popularItems.map((item, index) => (
                    <div key={index} className="item-row">
                      <span className="rank">#{index + 1}</span>
                      <span className="item-name">{item.name}</span>
                      <span className="sold-count">{item.sold} sold</span>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No sales data available</p>
                )}
              </div>
            </div>

            <div className="quick-actions">
              <div className="section-header">
                <h2>Quick Actions</h2>
              </div>
              <div className="action-buttons">
                <button
                  className="action-btn primary"
                  onClick={handleAddProduct}
                >
                  Add New Product
                </button>
                <button
                  className="action-btn secondary"
                  onClick={handleViewInventory}
                >
                  View Inventory
                </button>
                <button
                  className="action-btn secondary"
                  onClick={handleManageOrders}
                >
                  Manage Orders
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
