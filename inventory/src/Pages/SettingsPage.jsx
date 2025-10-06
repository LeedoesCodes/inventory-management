import { useState, useEffect, useContext } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { AuthContext } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { useTheme } from "../context/ThemeContext";
import "../styles/settings.scss";
import Header from "../components/UI/Headers";

const SettingsPage = () => {
  const { user } = useContext(AuthContext);
  const { isCollapsed } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({
    lowStockThreshold: 5,
    // NEW: Association Rule Thresholds
    minSupport: 0.05, // 5%
    minConfidence: 0.3, // 30%
    minLift: 1.0, // Minimum lift value
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Load settings
  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "userSettings", user.uid));
        if (settingsDoc.exists()) {
          const userSettings = settingsDoc.data();
          setSettings({
            lowStockThreshold: userSettings.lowStockThreshold || 5,
            // NEW: Load association rule thresholds with defaults
            minSupport: userSettings.minSupport || 0.05,
            minConfidence: userSettings.minConfidence || 0.3,
            minLift: userSettings.minLift || 1.0,
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        setMessage("Error loading settings");
      }
      setLoading(false);
    };

    loadSettings();
  }, [user]);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      await setDoc(doc(db, "userSettings", user.uid), settings);
      setMessage("Settings saved successfully!");
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
              <div className="theme-toggle-container">
                <button
                  className={`theme-toggle-btn ${
                    theme === "light" ? "active" : ""
                  }`}
                  onClick={() => theme !== "light" && toggleTheme()}
                >
                  <span className="theme-icon">🌞</span>
                  <span className="theme-label">Light</span>
                </button>

                <button
                  className={`theme-toggle-btn ${
                    theme === "dark" ? "active" : ""
                  }`}
                  onClick={() => theme !== "dark" && toggleTheme()}
                >
                  <span className="theme-icon">🌙</span>
                  <span className="theme-label">Dark</span>
                </button>
              </div>
              <span className="setting-description">
                Switch between light and dark interface themes
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

        {/* NEW: Association Rules Settings */}
        <div className="settings-section">
          <h2 className="section-title">
            <span className="section-icon">📊</span>
            Association Rules & Recommendations
          </h2>
          <div className="settings-grid">
            <div className="setting-item">
              <label className="setting-label">Minimum Support Threshold</label>
              <div className="input-group">
                <input
                  type="range"
                  value={settings.minSupport}
                  onChange={(e) =>
                    handleChange("minSupport", parseFloat(e.target.value))
                  }
                  className="setting-slider"
                  min="0.01"
                  max="0.3"
                  step="0.01"
                />
                <span className="input-suffix">
                  {(settings.minSupport * 100).toFixed(1)}%
                </span>
              </div>
              <span className="setting-description">
                Minimum frequency of itemset occurrence in transactions (1% -
                30%)
              </span>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                Minimum Confidence Threshold
              </label>
              <div className="input-group">
                <input
                  type="range"
                  value={settings.minConfidence}
                  onChange={(e) =>
                    handleChange("minConfidence", parseFloat(e.target.value))
                  }
                  className="setting-slider"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                />
                <span className="input-suffix">
                  {(settings.minConfidence * 100).toFixed(1)}%
                </span>
              </div>
              <span className="setting-description">
                Minimum probability that consequent items are bought when
                antecedent items are purchased (10% - 80%)
              </span>
            </div>

            <div className="setting-item">
              <label className="setting-label">Minimum Lift Threshold</label>
              <div className="input-group">
                <input
                  type="range"
                  value={settings.minLift}
                  onChange={(e) =>
                    handleChange("minLift", parseFloat(e.target.value))
                  }
                  className="setting-slider"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                />
                <span className="input-suffix">
                  {settings.minLift.toFixed(2)}
                </span>
              </div>
              <span className="setting-description">
                Minimum lift value indicating association strength (0.5 - 3.0).
                Values above 1.0 indicate positive association.
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="settings-actions">
          <button onClick={handleSave} className="btn-primary">
            💾 Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
