import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import "./ThemeSettings.scss";

const ThemeSettings = ({ theme, onThemeToggle }) => {
  return (
    <div className="settings-tab-panel theme-settings">
      <div className="panel-header">
        <h3>Appearance</h3>
        <p>Customize the look and feel of your application</p>
      </div>

      <div className="settings-table">
        <div className="settings-row">
          <div className="setting-info">
            <label className="setting-name">Theme</label>
            <span className="setting-description">
              Choose between light and dark interface themes
            </span>
          </div>
          <div className="setting-control">
            <div className="theme-toggle-container">
              <button
                className={`theme-toggle-btn ${
                  theme === "light" ? "active" : ""
                }`}
                onClick={() => theme !== "light" && onThemeToggle()}
              >
                <FontAwesomeIcon icon={faSun} className="theme-icon" />
                <span className="theme-label">Light</span>
              </button>

              <button
                className={`theme-toggle-btn ${
                  theme === "dark" ? "active" : ""
                }`}
                onClick={() => theme !== "dark" && onThemeToggle()}
              >
                <FontAwesomeIcon icon={faMoon} className="theme-icon" />
                <span className="theme-label">Dark</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
