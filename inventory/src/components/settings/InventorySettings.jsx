import "./InventorySettings.scss";
const InventorySettings = ({ settings, onSettingsChange }) => {
  return (
    <div className="settings-tab-panel">
      <div className="panel-header">
        <h3>Inventory Management</h3>
        <p>Configure inventory-related settings and thresholds</p>
      </div>

      <div className="settings-table">
        <div className="settings-row">
          <div className="setting-info">
            <label className="setting-name">Low Stock Alert Level</label>
            <span className="setting-description">
              Receive alerts when product quantity falls below this threshold
            </span>
          </div>
          <div className="setting-control">
            <div className="input-with-suffix">
              <input
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) =>
                  onSettingsChange(
                    "lowStockThreshold",
                    parseInt(e.target.value)
                  )
                }
                className="setting-input"
                min="1"
                max="100"
              />
              <span className="input-suffix">items</span>
            </div>
          </div>
        </div>

        <div className="settings-row">
          <div className="setting-info">
            <label className="setting-name">Auto-restock Notification</label>
            <span className="setting-description">
              Receive notifications when products need restocking
            </span>
          </div>
          <div className="setting-control">
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-row">
          <div className="setting-info">
            <label className="setting-name">Stock Update Alerts</label>
            <span className="setting-description">
              Get notified when stock levels change significantly
            </span>
          </div>
          <div className="setting-control">
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventorySettings;
