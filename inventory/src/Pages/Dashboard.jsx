import React, { useEffect, useState, useContext, useCallback } from "react";
import { collection, getDocs, doc, onSnapshot } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { useSidebar } from "../context/SidebarContext.jsx";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/dashboard.scss";
import Header from "../components/UI/Headers";
import { useAssociationRules } from "../hooks/useAssociationRules";

export default function Dashboard() {
  const { isCollapsed } = useSidebar();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    totalOrders: 0,
    lowStock: 0,
    popularItems: [],
    totalRevenue: 0,
    loading: true,
  });
  const [userSettings, setUserSettings] = useState({
    lowStockThreshold: 5, // Default value
  });
  const {
    rules: associationRules,
    loading: mlLoading,
    getRecommendations,
    refreshRules,
  } = useAssociationRules();
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);

  // Fetch user settings
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      doc(db, "userSettings", user.uid),
      (doc) => {
        if (doc.exists()) {
          const settings = doc.data();
          setUserSettings((prev) => ({
            ...prev,
            ...settings,
          }));
        }
      },
      (error) => {
        console.error("Error listening to settings:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Generate recommendations based on popular items
  useEffect(() => {
    if (dashboardData.popularItems.length > 0 && associationRules.length > 0) {
      const popularItemNames = dashboardData.popularItems
        .slice(0, 3)
        .map((item) => item.name);

      const recs = getRecommendations(popularItemNames);
      console.log("Generated recommendations:", recs);
      setRecommendations(recs);
    } else {
      setRecommendations([]);
    }
  }, [dashboardData.popularItems, associationRules, getRecommendations]);

  // Debug useEffect to see what's happening
  useEffect(() => {
    console.log("Association Rules:", associationRules);
    console.log("Popular Items:", dashboardData.popularItems);
    console.log("Recommendations:", recommendations);
  }, [associationRules, dashboardData.popularItems, recommendations]);

  const fetchDashboardData = useCallback(async () => {
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

      const orders = ordersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const lowStockCount = products.filter(
        (p) => p.stock <= userSettings.lowStockThreshold
      ).length;

      let totalRevenue = 0;
      const itemCounts = {};

      orders.forEach((order) => {
        totalRevenue += order.totalAmount || order.total || 0;
        order.items?.forEach((item) => {
          const itemName = item.name || item.productName || "Unknown Item";
          itemCounts[itemName] =
            (itemCounts[itemName] || 0) + (item.quantity || 1);
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
  }, [userSettings.lowStockThreshold]);

  // NEW: Enhanced strength calculation with lift
  const getRecommendationStrength = (confidence, lift) => {
    if (confidence >= 0.7 && lift >= 2.0) return "very-high";
    if (confidence >= 0.7 && lift >= 1.5) return "high";
    if (confidence >= 0.5 && lift >= 1.2) return "medium";
    if (confidence >= 0.3 && lift >= 1.0) return "low";
    return "very-low";
  };

  // NEW: Get lift interpretation text
  const getLiftInterpretation = (lift) => {
    if (lift > 3.0) return "Exceptional association 🚀";
    if (lift > 2.0) return "Strong positive association ✅";
    if (lift > 1.5) return "Positive association 👍";
    if (lift > 1.2) return "Moderate association 📈";
    if (lift > 1.0) return "Slight association ➕";
    if (lift === 1.0) return "Independent items ➖";
    return "Negative association ❌";
  };

  const handleApplyRecommendation = (recommendation) => {
    navigate("/products", {
      state: {
        recommendedItems: recommendation.consequent,
        recommendationSource: `Based on association rules (${(
          recommendation.confidence * 100
        ).toFixed(1)}% confidence, ${recommendation.lift.toFixed(2)} lift)`,
      },
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Navigation handlers (unchanged)
  const handleAddProduct = () => {
    navigate("/products");
  };

  const handleViewInventory = () => {
    navigate("/products");
  };

  const handleManageOrders = () => {
    navigate("/transactionHistory");
  };

  const handleViewLowStock = () => {
    navigate("/low-stock");
  };

  const handleViewAssociationRules = () => {
    navigate("/association-rules");
  };

  const handleRefreshRules = () => {
    refreshRules();
    fetchDashboardData();
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
        <div className="header-info">
          <span className="threshold-info">
            Low Stock Threshold:{" "}
            <strong>{userSettings.lowStockThreshold}</strong> items
          </span>
          <span className="ml-info">
            Association Rules: <strong>{associationRules.length}</strong> active
          </span>
          <button
            onClick={handleRefreshRules}
            className="refresh-btn"
            disabled={dashboardData.loading || mlLoading}
          >
            {dashboardData.loading || mlLoading
              ? "Refreshing..."
              : "Refresh Data"}
          </button>
        </div>
      </div>

      {dashboardData.loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          <div className="stats-cards">
            {/* ... your existing stat cards remain the same ... */}
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
              <span className="stock-warning">
                Below {userSettings.lowStockThreshold} items
              </span>
            </div>
          </div>

          <div className="dashboard-content">
            <div className="ml-recommendations main-section">
              <div className="section-header">
                <h2>💡 Smart Recommendations</h2>
              </div>

              {mlLoading ? (
                <div className="ml-loading">
                  <div className="loading-spinner small"></div>
                  <span>Analyzing transaction patterns...</span>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="recommendations-list">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="recommendation-card">
                      <div className="recommendation-header">
                        <span className="confidence-badge">
                          {(rec.confidence * 100).toFixed(1)}% Confidence
                        </span>
                        <span className={`strength-indicator ${rec.strength}`}>
                          {rec.strength.replace("-", " ")} confidence
                        </span>
                        {/* NEW: Lift badge */}
                        <span
                          className={`lift-badge ${
                            rec.lift > 2
                              ? "high-lift"
                              : rec.lift > 1
                              ? "medium-lift"
                              : "low-lift"
                          }`}
                        >
                          Lift: {rec.lift?.toFixed(2) || "N/A"}
                        </span>
                      </div>

                      <div className="recommendation-content">
                        <p className="recommendation-text">
                          <strong>Pattern: </strong>
                          Customers who buy{" "}
                          <strong>{rec.antecedent.join(", ")}</strong> often
                          also purchase:
                        </p>

                        <div className="recommended-products">
                          {rec.consequent.map((productName, productIndex) => (
                            <span key={productIndex} className="product-tag">
                              {productName}
                            </span>
                          ))}
                        </div>

                        <div className="recommendation-stats">
                          <span>
                            Support: {(rec.support * 100).toFixed(1)}%
                          </span>
                          <span>
                            Lift: {rec.lift?.toFixed(2) || "N/A"} -{" "}
                            {getLiftInterpretation(rec.lift)}
                          </span>
                          <span>
                            Based on {dashboardData.totalOrders} transactions
                          </span>
                        </div>

                        {/* NEW: Lift visualization */}
                        <div className="lift-visualization">
                          <div className="lift-scale">
                            <span className="scale-label">Negative</span>
                            <div className="scale-bar">
                              <div
                                className="lift-indicator"
                                style={{
                                  left: `${Math.min(
                                    Math.max(rec.lift * 20, 0),
                                    100
                                  )}%`,
                                  backgroundColor:
                                    rec.lift > 1 ? "#10b981" : "#ef4444",
                                }}
                              ></div>
                            </div>
                            <span className="scale-label">Positive</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-recommendations">
                  <p>No recommendations available yet.</p>
                  <small>
                    {associationRules.length === 0
                      ? "Association rules will appear after analyzing transaction patterns. Make sure you have orders with items."
                      : "Try adding more popular items or the system needs more transaction data to generate recommendations."}
                  </small>
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    Debug: {associationRules.length} rules loaded,{" "}
                    {dashboardData.popularItems.length} popular items,{" "}
                    {dashboardData.totalOrders} total orders
                  </div>
                </div>
              )}
            </div>

            {/* Popular Products Section */}
            <div className="popular-items side-section">
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
                <span>Threshold: {userSettings.lowStockThreshold} items</span>
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
