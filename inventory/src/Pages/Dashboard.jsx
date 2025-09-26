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
      const popularItemIds = dashboardData.popularItems
        .slice(0, 3)
        .map((item) => item.name);
      const recs = getRecommendations(popularItemIds);
      setRecommendations(recs);
    }
  }, [dashboardData.popularItems, associationRules, getRecommendations]);

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

      const lowStockCount = products.filter(
        (p) => p.stock <= userSettings.lowStockThreshold
      ).length;

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

  const getRecommendationStrength = (confidence) => {
    if (confidence >= 0.7) return "high";
    if (confidence >= 0.4) return "medium";
    return "low";
  };

  const handleApplyRecommendation = (recommendation) => {
    // Navigate to products page with recommendation filter
    navigate("/products", {
      state: {
        recommendedItems: recommendation.products.map((p) => p.id),
        recommendationSource: `Based on association rules (${(
          recommendation.confidence * 100
        ).toFixed(1)}% confidence)`,
      },
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userSettings.lowStockThreshold, associationRules]); // Re-fetch when threshold or rules change

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

  const handleViewAssociationRules = () => {
    navigate("/association-rules"); // You can create this page later
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
            onClick={fetchDashboardData}
            className="refresh-btn"
            disabled={dashboardData.loading}
          >
            {dashboardData.loading ? "Refreshing..." : "Refresh Data"}
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

            {/* Machine Learning Recommendations Section */}
            <div className="ml-recommendations">
              <div className="section-header">
                <h2>💡 Smart Recommendations</h2>
                <span>Based on association rules mining</span>
                <button
                  onClick={handleViewAssociationRules}
                  className="view-rules-btn"
                >
                  View All Rules
                </button>
              </div>

              {mlLoading ? (
                <div className="ml-loading">
                  <div className="loading-spinner small"></div>
                  <span>Analyzing patterns...</span>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="recommendations-list">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="recommendation-card">
                      <div className="recommendation-header">
                        <span className="confidence-badge">
                          {(rec.confidence * 100).toFixed(1)}% Confidence
                        </span>
                        <span
                          className={`strength-indicator ${getRecommendationStrength(
                            rec.confidence
                          )}`}
                        >
                          {getRecommendationStrength(rec.confidence)} confidence
                        </span>
                      </div>

                      <div className="recommendation-content">
                        <p className="recommendation-text">
                          <strong>Pattern: </strong>
                          Customers who buy popular items often also purchase:
                        </p>

                        <div className="recommended-products">
                          {rec.products.map((product, productIndex) => (
                            <span key={productIndex} className="product-tag">
                              {product.name}
                            </span>
                          ))}
                        </div>

                        <div className="recommendation-stats">
                          <span>
                            Support: {(rec.support * 100).toFixed(1)}%
                          </span>
                          <span>
                            Lift: {rec.rule.lift?.toFixed(2) || "N/A"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleApplyRecommendation(rec)}
                        className="apply-recommendation-btn"
                      >
                        View Recommended Products
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-recommendations">
                  <p>No recommendations available yet.</p>
                  <small>
                    Association rules will appear after analyzing transaction
                    patterns.
                  </small>
                </div>
              )}
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
