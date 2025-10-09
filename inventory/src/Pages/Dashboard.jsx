import React, { useEffect, useState, useContext, useCallback } from "react";
import { collection, getDocs, doc, onSnapshot } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { useSidebar } from "../context/SidebarContext.jsx";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/dashboard.scss";
import Header from "../components/UI/Headers";
import { useAssociationRules } from "../hooks/useAssociationRules";
import Chatbot from "../components/Chatbot/Chatbot";
import ChatbotToggle from "../components/Chatbot/ChatbotToggle";
import CSVUploader from "../components/CSVUploader";

// FontAwesome imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faShoppingCart,
  faDollarSign,
  faExclamationTriangle,
  faLightbulb,
  faChartLine,
  faRocket,
  faThumbsUp,
  faChartBar,
  faPlus,
  faWarehouse,
  faReceipt,
  faRobot,
  faFileCsv,
  faCrown,
  faSpinner,
  faRefresh,
  faDatabase,
  faArrowRight,
  faCube,
} from "@fortawesome/free-solid-svg-icons";

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

  // FIXED: Add default values for association rule thresholds
  const [userSettings, setUserSettings] = useState({
    lowStockThreshold: 5,
    minSupport: 0.05,
    minConfidence: 0.3,
    minLift: 1.0,
  });

  // FIXED: Pass userSettings thresholds to the hook
  const {
    rules: associationRules,
    loading: mlLoading,
    getRecommendations,
    refreshRules,
  } = useAssociationRules({
    minSupport: userSettings.minSupport,
    minConfidence: userSettings.minConfidence,
    minLift: userSettings.minLift,
  });

  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [uploadedResults, setUploadedResults] = useState([]);

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
            // Ensure all threshold values have defaults
            lowStockThreshold: settings.lowStockThreshold || 5,
            minSupport: settings.minSupport || 0.05,
            minConfidence: settings.minConfidence || 0.3,
            minLift: settings.minLift || 1.0,
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
    console.log("Current Thresholds:", {
      support: userSettings.minSupport,
      confidence: userSettings.minConfidence,
      lift: userSettings.minLift,
    });
  }, [
    associationRules,
    dashboardData.popularItems,
    recommendations,
    userSettings,
  ]);

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

      // UPDATED: Calculate low stock count considering both custom and global thresholds
      const lowStockCount = products.filter((p) => {
        // Use custom threshold if set, otherwise use global threshold
        const threshold =
          p.lowStockThreshold !== null && p.lowStockThreshold !== undefined
            ? p.lowStockThreshold
            : userSettings.lowStockThreshold;

        return p.stock <= threshold;
      }).length;

      let totalRevenue = 0;
      const itemCounts = {};

      orders.forEach((order) => {
        totalRevenue += order.totalAmount || order.total || 0;
        order.items?.forEach((item) => {
          const itemName =
            item.name || item.productName || item.itemName || "Unknown Item";
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

      // Debug: Log threshold usage
      console.log("📊 DASHBOARD LOW STOCK CALCULATION:");
      console.log("Global threshold:", userSettings.lowStockThreshold);
      console.log(
        "Products with custom thresholds:",
        products.filter(
          (p) =>
            p.lowStockThreshold !== null && p.lowStockThreshold !== undefined
        ).length
      );
      console.log("Total low stock items:", lowStockCount);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
      setDashboardData((prev) => ({ ...prev, loading: false }));
    }
  }, [userSettings.lowStockThreshold]); // Added dependency

  // Enhanced strength calculation with lift - ADD SAFE ACCESS
  const getRecommendationStrength = (confidence, lift) => {
    const conf = confidence || 0;
    const liftValue = lift || 0;

    if (conf >= 0.7 && liftValue >= 2.0) return "very-high";
    if (conf >= 0.7 && liftValue >= 1.5) return "high";
    if (conf >= 0.5 && liftValue >= 1.2) return "medium";
    if (conf >= 0.3 && liftValue >= 1.0) return "low";
    return "very-low";
  };

  // Get lift interpretation text - ADD SAFE ACCESS
  const getLiftInterpretation = (lift) => {
    const liftValue = lift || 0;

    if (liftValue > 3.0) return "Exceptional association";
    if (liftValue > 2.0) return "Strong positive association";
    if (liftValue > 1.5) return "Positive association";
    if (liftValue > 1.2) return "Moderate association";
    if (liftValue > 1.0) return "Slight association";
    if (liftValue === 1.0) return "Independent items";
    return "Negative association";
  };

  const handleApplyRecommendation = (recommendation) => {
    navigate("/products", {
      state: {
        recommendedItems: recommendation.consequent,
        recommendationSource: `Based on association rules (${(
          (recommendation.confidence || 0) * 100
        ).toFixed(1)}% confidence, ${(recommendation.lift || 0).toFixed(
          2
        )} lift)`,
      },
    });
  };

  // FIXED: Update refreshRules to use current thresholds
  const handleRefreshRules = () => {
    refreshRules({
      minSupport: userSettings.minSupport,
      minConfidence: userSettings.minConfidence,
      minLift: userSettings.minLift,
    });
    fetchDashboardData();
  };

  const handleUploadComplete = (uploadData) => {
    setUploadedResults((prev) => [uploadData, ...prev.slice(0, 4)]); // Keep last 5
    setShowCSVUpload(false);

    // Refresh the association rules to include uploaded data
    refreshRules({
      minSupport: userSettings.minSupport,
      minConfidence: userSettings.minConfidence,
      minLift: userSettings.minLift,
    });

    // Show success message
    alert(
      `CSV processed successfully! Found ${uploadData.results.rules.length} rules from ${uploadData.results.transactions} transactions.`
    );
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
    navigate("/association-rules");
  };

  // Chatbot functions
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  if (error) {
    return (
      <div className={`dashboard-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />
        <div className="error-state">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="error-icon"
          />
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-btn">
            Try Again
          </button>
        </div>

        {/* Chatbot Components */}
        <ChatbotToggle onClick={toggleChat} isOpen={isChatOpen} />
        <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
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
            Default Low Stock Threshold: {userSettings.lowStockThreshold}
          </span>
          <span className="ml-info">
            <FontAwesomeIcon icon={faChartLine} className="info-icon" />
            Association Rules: {associationRules.length} active
          </span>

          <button
            onClick={handleRefreshRules}
            className="refresh-btn"
            disabled={dashboardData.loading || mlLoading}
          >
            <FontAwesomeIcon icon={faRefresh} className="refresh-icon" />
            {dashboardData.loading || mlLoading
              ? "Refreshing..."
              : "Refresh Data"}
          </button>
        </div>
      </div>

      {dashboardData.loading ? (
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} className="loading-spinner" spin />
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
              <div className="card-icon">
                <FontAwesomeIcon icon={faBox} />
              </div>
              <h2>{dashboardData.totalProducts.toLocaleString()}</h2>
              <p>Total Products</p>
            </div>

            <div
              className="card orders-card"
              onClick={handleManageOrders}
              style={{ cursor: "pointer" }}
            >
              <div className="card-icon">
                <FontAwesomeIcon icon={faShoppingCart} />
              </div>
              <h2>{dashboardData.totalOrders.toLocaleString()}</h2>
              <p>Total Orders</p>
            </div>

            <div className="card revenue-card">
              <div className="card-icon">
                <FontAwesomeIcon icon={faDollarSign} />
              </div>
              <h2>₱{dashboardData.totalRevenue.toLocaleString()}</h2>
              <p>Total Revenue</p>
            </div>

            <div
              className="card low-stock"
              onClick={handleViewLowStock}
              style={{ cursor: "pointer" }}
            >
              <div className="card-icon">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              <h2>{dashboardData.lowStock}</h2>
              <p>Low Stock Items</p>
              <span className="stock-warning">
                Below threshold (Global + Custom)
              </span>
            </div>
          </div>

          {/* Rest of your dashboard content remains the same */}
          <div className="dashboard-content">
            <div className="ml-recommendations main-section">
              <div className="section-header">
                <h2>
                  <FontAwesomeIcon
                    icon={faLightbulb}
                    className="section-icon"
                  />
                  Smart Recommendations
                </h2>
                <div className="threshold-info">
                  <small>
                    Current Thresholds: Support ≥{" "}
                    {(userSettings.minSupport * 100).toFixed(1)}%, Confidence ≥{" "}
                    {(userSettings.minConfidence * 100).toFixed(1)}%, Lift ≥{" "}
                    {userSettings.minLift.toFixed(2)}
                  </small>
                </div>
              </div>

              {mlLoading ? (
                <div className="ml-loading">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="loading-spinner small"
                    spin
                  />
                  <span>Analyzing transaction patterns...</span>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="recommendations-list">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="recommendation-card">
                      <div className="recommendation-header">
                        <span className="confidence-badge">
                          {((rec.confidence || 0) * 100).toFixed(1)}% Confidence
                        </span>
                        <span className={`strength-indicator ${rec.strength}`}>
                          {rec.strength?.replace("-", " ") || "unknown"}{" "}
                          confidence
                        </span>
                        <span
                          className={`lift-badge ${
                            (rec.lift || 0) > 2
                              ? "high-lift"
                              : (rec.lift || 0) > 1
                              ? "medium-lift"
                              : "low-lift"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={faChartBar}
                            className="lift-icon"
                          />
                          Lift: {(rec.lift || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="recommendation-content">
                        <p className="recommendation-text">
                          <strong>Pattern: </strong>
                          Customers who buy{" "}
                          <strong>
                            {rec.antecedent?.join(", ") || "items"}
                          </strong>{" "}
                          often also purchase:
                        </p>

                        <div className="recommended-products">
                          {rec.consequent?.map((productName, productIndex) => (
                            <span key={productIndex} className="product-tag">
                              {productName}
                            </span>
                          ))}
                        </div>

                        <div className="recommendation-stats">
                          <span>
                            <FontAwesomeIcon
                              icon={faDatabase}
                              className="stat-icon"
                            />
                            Support: {((rec.support || 0) * 100).toFixed(1)}%
                          </span>
                          <span>
                            <FontAwesomeIcon
                              icon={faChartLine}
                              className="stat-icon"
                            />
                            Lift: {(rec.lift || 0).toFixed(2)} -{" "}
                            {getLiftInterpretation(rec.lift)}
                          </span>
                          <span>
                            <FontAwesomeIcon
                              icon={faShoppingCart}
                              className="stat-icon"
                            />
                            Based on {dashboardData.totalOrders} transactions
                          </span>
                        </div>

                        <div className="lift-visualization">
                          <div className="lift-scale">
                            <span className="scale-label">Negative</span>
                            <div className="scale-bar">
                              <div
                                className="lift-indicator"
                                style={{
                                  left: `${Math.min(
                                    Math.max((rec.lift || 0) * 20, 0),
                                    100
                                  )}%`,
                                  backgroundColor:
                                    (rec.lift || 0) > 1 ? "#10b981" : "#ef4444",
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

            {/* Uploaded CSV Results Section */}
            {uploadedResults.length > 0 && (
              <div className="uploaded-results main-section">
                <div className="section-header">
                  <h2>
                    <FontAwesomeIcon
                      icon={faFileCsv}
                      className="section-icon"
                    />
                    Recently Uploaded CSV Analyses
                  </h2>
                </div>
                <div className="results-list">
                  {uploadedResults.map((result, index) => (
                    <div key={index} className="upload-result-card">
                      <div className="result-header">
                        <span className="file-name">{result.fileName}</span>
                        <span className="result-stats">
                          {result.results.transactions} transactions,{" "}
                          {result.results.rules.length} rules
                        </span>
                      </div>
                      <div className="result-preview">
                        {result.results.rules
                          .slice(0, 3)
                          .map((rule, ruleIndex) => (
                            <div key={ruleIndex} className="rule-preview">
                              <FontAwesomeIcon
                                icon={faArrowRight}
                                className="rule-arrow"
                              />
                              <strong>{rule.antecedent.join(" + ")}</strong> →{" "}
                              {rule.consequent.join(" + ")}(
                              {(rule.confidence * 100).toFixed(1)}% confidence)
                            </div>
                          ))}
                        {result.results.rules.length > 3 && (
                          <div className="more-rules">
                            + {result.results.rules.length - 3} more rules
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                      <span className="rank">
                        <FontAwesomeIcon
                          icon={faCrown}
                          className={`rank-icon rank-${index + 1}`}
                        />
                        #{index + 1}
                      </span>
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
                <span>
                  Threshold: {userSettings.lowStockThreshold} items (Global)
                </span>
              </div>
              <div className="action-buttons">
                <button
                  className="action-btn primary"
                  onClick={handleAddProduct}
                >
                  <FontAwesomeIcon icon={faPlus} className="btn-icon" />
                  Add New Product
                </button>
                <button
                  className="action-btn secondary"
                  onClick={handleViewInventory}
                >
                  <FontAwesomeIcon icon={faWarehouse} className="btn-icon" />
                  View Inventory
                </button>
                <button
                  className="action-btn secondary"
                  onClick={handleManageOrders}
                >
                  <FontAwesomeIcon icon={faReceipt} className="btn-icon" />
                  Create Orders
                </button>
                <button
                  className="action-btn ai-btn"
                  onClick={toggleChat}
                  title="Get AI assistance"
                >
                  <FontAwesomeIcon icon={faRobot} className="btn-icon" />
                  Assistant
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CSV Uploader Modal */}
      {showCSVUpload && (
        <CSVUploader
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowCSVUpload(false)}
        />
      )}

      {/* Chatbot Components */}
      <ChatbotToggle onClick={toggleChat} isOpen={isChatOpen} />
      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
