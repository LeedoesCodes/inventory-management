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
          // Only load lowStockThreshold, ignore other settings
          setSettings({
            lowStockThreshold: userSettings.lowStockThreshold || 5,
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
