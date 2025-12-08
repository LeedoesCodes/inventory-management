// src/Pages/CustomerSettingsPage.jsx
import { useState, useEffect, useContext } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { AuthContext } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { useTheme } from "../context/ThemeContext";
import CustomerSidebar from "../components/UI/CustomerSidebar";
import Header from "../components/UI/Headers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faBell,
  faEye,
  faMoon,
  faSun,
  faCheckCircle,
  faExclamationTriangle,
  faSave,
  faSpinner,
  faSignInAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

import "../styles/customer-settings.scss";

const CustomerSettingsPage = () => {
  const { currentUser, role, isLoggedIn } = useContext(AuthContext);
  const { isCollapsed } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    notifications: true,
    lowStockNotifications: false,
    orderConfirmation: true,
    showDiscounts: true,
    autoSaveCart: false,
    showPrices: true,
    showStock: true,
    compactView: false,
    fontSize: "medium",
    showProfile: true,
    allowMarketing: false,
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Debug logging
  useEffect(() => {
    console.log("🔍 CustomerSettingsPage - Debug Info:");
    console.log("🔍 currentUser:", currentUser);
    console.log("🔍 role:", role);
    console.log("🔍 isLoggedIn:", isLoggedIn);
    console.log("🔍 loading:", loading);
  }, [currentUser, role, isLoggedIn, loading]);

  // Load customer settings from Firestore
  useEffect(() => {
    const loadSettings = async () => {
      console.log("🔄 Starting to load settings...");

      // If no user is logged in or not a customer, stop loading
      if (!currentUser?.uid || role !== "customer") {
        console.log("⛔ No user or not a customer, stopping load");
        setLoading(false);
        return;
      }

      try {
        console.log("📥 Fetching settings from Firestore...");
        const settingsDoc = await getDoc(
          doc(db, "customerSettings", currentUser.uid)
        );

        console.log(
          "📄 Firestore response:",
          settingsDoc.exists() ? "Document exists" : "Document doesn't exist"
        );

        if (settingsDoc.exists()) {
          const userSettings = settingsDoc.data();
          console.log("📋 Retrieved settings:", userSettings);
          setSettings({
            notifications: userSettings.notifications ?? true,
            lowStockNotifications: userSettings.lowStockNotifications ?? false,
            orderConfirmation: userSettings.orderConfirmation ?? true,
            showDiscounts: userSettings.showDiscounts ?? true,
            autoSaveCart: userSettings.autoSaveCart ?? false,
            showPrices: userSettings.showPrices ?? true,
            showStock: userSettings.showStock ?? true,
            compactView: userSettings.compactView ?? false,
            fontSize: userSettings.fontSize ?? "medium",
            showProfile: userSettings.showProfile ?? true,
            allowMarketing: userSettings.allowMarketing ?? false,
          });
        } else {
          console.log("📝 No settings found, using defaults");
          // Don't need to setSettings here as defaults are already set
        }
      } catch (error) {
        console.error("❌ Error loading customer settings:", error);
        showMessage("Error loading settings", "error");
      } finally {
        console.log("✅ Finished loading settings");
        setLoading(false);
      }
    };

    // Small delay to ensure auth state is settled
    const timer = setTimeout(() => {
      loadSettings();
    }, 100);

    return () => clearTimeout(timer);
  }, [currentUser, role]);

  // Show message helper
  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);
  };

  // Handle settings change
  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Save settings to Firestore
  const saveSettings = async () => {
    if (!currentUser?.uid) {
      showMessage("Please log in to save settings", "error");
      navigate("/customer-login");
      return;
    }

    try {
      await setDoc(doc(db, "customerSettings", currentUser.uid), {
        ...settings,
        updatedAt: new Date(),
      });
      showMessage("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      showMessage("Error saving settings", "error");
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    if (
      window.confirm("Are you sure you want to reset all settings to defaults?")
    ) {
      setSettings({
        notifications: true,
        lowStockNotifications: false,
        orderConfirmation: true,
        showDiscounts: true,
        autoSaveCart: false,
        showPrices: true,
        showStock: true,
        compactView: false,
        fontSize: "medium",
        showProfile: true,
        allowMarketing: false,
      });
      showMessage("Settings reset to defaults");
    }
  };

  // Check if user is properly authenticated as customer
  useEffect(() => {
    if (!loading && (!currentUser || role !== "customer")) {
      console.log("⚠️ Not authenticated as customer, redirecting...");
      // You might want to redirect or show a message
    }
  }, [loading, currentUser, role]);

  // Loading state
  if (loading) {
    return (
      <div className="page-container">
        <CustomerSidebar />
        <div
          className={`customer-settings-page ${isCollapsed ? "collapsed" : ""}`}
        >
          <Header />
          <div className="loading-container">
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              className="loading-spinner"
            />
            <p>Loading your settings...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated state
  if (!currentUser || role !== "customer") {
    return (
      <div className="page-container">
        <CustomerSidebar />
        <div
          className={`customer-settings-page ${isCollapsed ? "collapsed" : ""}`}
        >
          <Header />
          <div className="auth-required">
            <div className="auth-message">
              <FontAwesomeIcon icon={faExclamationTriangle} size="3x" />
              <h2>Access Denied</h2>
              <p>Please log in as a customer to access settings</p>
              <button
                className="login-btn"
                onClick={() => navigate("/customer-login")}
              >
                <FontAwesomeIcon icon={faSignInAlt} />
                Go to Customer Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <CustomerSidebar />
      <div
        className={`customer-settings-page ${isCollapsed ? "collapsed" : ""}`}
      >
        <Header />

        <div className="customer-settings-content">
          <div className="page-header">
            <h1>
              <FontAwesomeIcon icon={faUser} /> My Settings
            </h1>
            <p>Customize your shopping experience</p>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`message-alert ${messageType}`}>
              <FontAwesomeIcon
                icon={
                  messageType === "error"
                    ? faExclamationTriangle
                    : faCheckCircle
                }
              />
              <span>{message}</span>
            </div>
          )}

          {/* Theme Toggle */}
          <div className="settings-section theme-section">
            <h2>
              <FontAwesomeIcon icon={theme === "dark" ? faMoon : faSun} />
              Appearance
            </h2>
            <div className="theme-toggle">
              <button
                className={`theme-btn ${theme === "light" ? "active" : ""}`}
                onClick={() => theme !== "light" && toggleTheme()}
              >
                <FontAwesomeIcon icon={faSun} />
                <span>Light</span>
              </button>
              <button
                className={`theme-btn ${theme === "dark" ? "active" : ""}`}
                onClick={() => theme !== "dark" && toggleTheme()}
              >
                <FontAwesomeIcon icon={faMoon} />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Notifications Settings */}
          <div className="settings-section">
            <h2>
              <FontAwesomeIcon icon={faBell} /> Notifications
            </h2>
            <div className="settings-grid">
              <div className="setting-item toggle-setting">
                <div className="setting-info">
                  <h3>Order Notifications</h3>
                  <p>Receive notifications about your order status</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) =>
                      handleSettingChange("notifications", e.target.checked)
                    }
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item toggle-setting">
                <div className="setting-info">
                  <h3>Order Confirmation</h3>
                  <p>Show confirmation when placing orders</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.orderConfirmation}
                    onChange={(e) =>
                      handleSettingChange("orderConfirmation", e.target.checked)
                    }
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item toggle-setting">
                <div className="setting-info">
                  <h3>Show Discounts</h3>
                  <p>Display your available discounts on products</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.showDiscounts}
                    onChange={(e) =>
                      handleSettingChange("showDiscounts", e.target.checked)
                    }
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="settings-section">
            <h2>
              <FontAwesomeIcon icon={faEye} /> Display Preferences
            </h2>
            <div className="settings-grid">
              <div className="setting-item toggle-setting">
                <div className="setting-info">
                  <h3>Show Prices</h3>
                  <p>Display product prices</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.showPrices}
                    onChange={(e) =>
                      handleSettingChange("showPrices", e.target.checked)
                    }
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item toggle-setting">
                <div className="setting-info">
                  <h3>Show Stock Levels</h3>
                  <p>Display available stock quantities</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.showStock}
                    onChange={(e) =>
                      handleSettingChange("showStock", e.target.checked)
                    }
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item toggle-setting">
                <div className="setting-info">
                  <h3>Compact View</h3>
                  <p>Use compact product cards</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.compactView}
                    onChange={(e) =>
                      handleSettingChange("compactView", e.target.checked)
                    }
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item select-setting">
                <div className="setting-info">
                  <h3>Font Size</h3>
                  <p>Adjust text size for better readability</p>
                </div>
                <select
                  value={settings.fontSize}
                  onChange={(e) =>
                    handleSettingChange("fontSize", e.target.value)
                  }
                  className="font-size-select"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="settings-section">
            <h2>
              <FontAwesomeIcon icon={faUser} /> Privacy
            </h2>
            <div className="settings-grid">
              <div className="setting-item toggle-setting">
                <div className="setting-info">
                  <h3>Show Profile</h3>
                  <p>Display your name on orders</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.showProfile}
                    onChange={(e) =>
                      handleSettingChange("showProfile", e.target.checked)
                    }
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item toggle-setting">
                <div className="setting-info">
                  <h3>Marketing Communications</h3>
                  <p>Receive promotional emails and offers</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.allowMarketing}
                    onChange={(e) =>
                      handleSettingChange("allowMarketing", e.target.checked)
                    }
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="settings-actions">
            <button className="save-btn" onClick={saveSettings}>
              <FontAwesomeIcon icon={faSave} />
              Save Settings
            </button>
            <button className="reset-btn" onClick={resetToDefaults}>
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSettingsPage;
