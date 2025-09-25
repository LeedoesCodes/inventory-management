import { useState, useEffect, useContext } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { AuthContext } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import "../styles/settings.scss";
import Header from "../components/UI/Headers";

const SettingsPage = () => {
  const { user } = useContext(AuthContext);
  const { isCollapsed } = useSidebar(); // ✅ Sidebar collapse state
  const [settings, setSettings] = useState({
    theme: "light",
    lowStockThreshold: 5,
    dashboard: {
      showSales: true,
      showLowStock: true,
      showRecentOrders: true,
    },
    notifications: {
      lowStockAlerts: true,
      newOrders: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [themeChanged, setThemeChanged] = useState(false);

  // Load settings
  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "userSettings", user.uid));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data());
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        setMessage("Error loading settings");
      }
      setLoading(false);
    };

    loadSettings();
  }, [user]);

  // REMOVED: Automatic theme application when settings load
  // This was causing the theme to change immediately when opening settings page

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    // Track if theme was changed
    if (key === "theme") {
      setThemeChanged(true);
    }
  };

  const handleNestedChange = (parent, child, value) => {
    setSettings((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [child]: value },
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      await setDoc(doc(db, "userSettings", user.uid), settings);

      // Apply theme ONLY after user clicks save
      document.documentElement.setAttribute("data-theme", settings.theme);

      setMessage("Settings saved successfully!");
      setThemeChanged(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("Error saving settings");
    }
  };

  if (loading) {
    return (
      <div
        className={`settings-page ${isCollapsed ? "sidebar-collapsed" : ""}`}
      >
        <div className="loading-container">
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`settings-page ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <Header />
      <div className="page-header">
        <p className="page-subtitle">
          Manage your application preferences and appearance
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`message-alert ${
            message.includes("Error") ? "error" : "success"
          }`}
        >
          {message}
        </div>
      )}

      {/* Settings Container */}
      <div className="settings-container">
        {/* Theme Section */}
        <div className="settings-section">
          <h2 className="section-title">
            <span className="section-icon">🎨</span>
            Appearance
          </h2>
          <div className="settings-grid">
            <div className="setting-item">
              <label className="setting-label">Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => handleChange("theme", e.target.value)}
                className="setting-input"
              >
                <option value="light">🌞 Light Mode</option>
                <option value="dark">🌙 Dark Mode</option>
              </select>
              <span className="setting-description">
                Choose between light and dark interface themes
                {themeChanged && (
                  <span
                    style={{
                      color: "#007bff",
                      fontWeight: "bold",
                      display: "block",
                      marginTop: "5px",
                    }}
                  >
                    ⚠️ Theme change pending save
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Settings */}
        <div className="settings-section">
          <h2 className="section-title">
            <span className="section-icon">📦</span>
            Inventory Management
          </h2>
          <div className="settings-grid">
            <div className="setting-item">
              <label className="setting-label">Low Stock Alert Level</label>
              <div className="input-group">
                <input
                  type="number"
                  value={settings.lowStockThreshold}
                  onChange={(e) =>
                    handleChange("lowStockThreshold", parseInt(e.target.value))
                  }
                  className="setting-input"
                  min="1"
                  max="100"
                />
                <span className="input-suffix">items remaining</span>
              </div>
              <span className="setting-description">
                Receive alerts when product quantity falls below this number
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Preferences */}
        <div className="settings-section">
          <h2 className="section-title">
            <span className="section-icon">📊</span>
            Dashboard Display
          </h2>
          <div className="settings-grid">
            <div className="checklist-group">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={settings.dashboard.showSales}
                  onChange={(e) =>
                    handleNestedChange(
                      "dashboard",
                      "showSales",
                      e.target.checked
                    )
                  }
                />
                <span className="check-label">Sales Overview Chart</span>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={settings.dashboard.showLowStock}
                  onChange={(e) =>
                    handleNestedChange(
                      "dashboard",
                      "showLowStock",
                      e.target.checked
                    )
                  }
                />
                <span className="check-label">Low Stock Products</span>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={settings.dashboard.showRecentOrders}
                  onChange={(e) =>
                    handleNestedChange(
                      "dashboard",
                      "showRecentOrders",
                      e.target.checked
                    )
                  }
                />
                <span className="check-label">Recent Orders</span>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="settings-section">
          <h2 className="section-title">
            <span className="section-icon">🔔</span>
            Notifications
          </h2>
          <div className="settings-grid">
            <div className="checklist-group">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={settings.notifications.lowStockAlerts}
                  onChange={(e) =>
                    handleNestedChange(
                      "notifications",
                      "lowStockAlerts",
                      e.target.checked
                    )
                  }
                />
                <span className="check-label">Low Stock Alerts</span>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={settings.notifications.newOrders}
                  onChange={(e) =>
                    handleNestedChange(
                      "notifications",
                      "newOrders",
                      e.target.checked
                    )
                  }
                />
                <span className="check-label">New Order Notifications</span>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="settings-actions">
          <button onClick={handleSave} className="btn-primary">
            💾 Save Settings
          </button>
          {themeChanged && (
            <p
              style={{
                color: "#6c757d",
                fontSize: "0.9rem",
                marginTop: "10px",
                textAlign: "center",
              }}
            >
              Theme changes will be applied after saving
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
