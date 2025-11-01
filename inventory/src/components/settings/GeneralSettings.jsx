import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSave,
  faClock,
  faInfoCircle,
  faDownload,
  faFileExport,
  faFileExcel,
} from "@fortawesome/free-solid-svg-icons";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../Firebase/firebase";

const GeneralSettings = ({ settings, onSettingsChange, onSave }) => {
  const [showAutoSaveModal, setShowAutoSaveModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  const handleAutoSaveToggle = (enabled) => {
    onSettingsChange("autoSave", enabled);

    // Show modal when toggling auto-save
    setShowAutoSaveModal(true);

    // Auto-hide modal after 3 seconds
    setTimeout(() => {
      setShowAutoSaveModal(false);
    }, 3000);

    // If turning off auto-save, trigger manual save
    if (!enabled) {
      onSave();
    }
  };

  const handleDelayChange = (delay) => {
    onSettingsChange("autoSaveDelay", parseInt(delay));

    // Show modal when changing delay
    setShowAutoSaveModal(true);

    // Auto-hide modal after 3 seconds
    setTimeout(() => {
      setShowAutoSaveModal(false);
    }, 3000);
  };

  const closeModal = () => {
    setShowAutoSaveModal(false);
  };

  // Export data function
  const handleExportData = async () => {
    try {
      setExportLoading(true);
      setExportMessage("");

      // Collect all data from Firebase
      const collections = ["products", "categories", "orders", "userSettings"];
      const exportData = {};

      for (const collectionName of collections) {
        try {
          const querySnapshot = await getDocs(collection(db, collectionName));
          const data = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          exportData[collectionName] = data;
        } catch (error) {
          console.error(`Error fetching ${collectionName}:`, error);
          exportData[collectionName] = { error: error.message };
        }
      }

      // Add metadata
      const metadata = {
        exportedAt: new Date().toISOString(),
        version: "1.0.0",
        collections: collections,
        recordCounts: Object.keys(exportData).reduce((acc, key) => {
          acc[key] = Array.isArray(exportData[key])
            ? exportData[key].length
            : "error";
          return acc;
        }, {}),
      };

      const finalExportData = {
        metadata,
        ...exportData,
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(finalExportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inventory-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportMessage("✅ Data exported successfully!");
      setTimeout(() => setExportMessage(""), 5000);
    } catch (error) {
      console.error("Export error:", error);
      setExportMessage("❌ Export failed: " + error.message);
      setTimeout(() => setExportMessage(""), 5000);
    } finally {
      setExportLoading(false);
    }
  };

  // Export specific data types
  const handleExportProducts = async () => {
    try {
      setExportLoading(true);
      setExportMessage("");

      const productsSnapshot = await getDocs(collection(db, "products"));
      const productsData = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const exportData = {
        metadata: {
          type: "products",
          exportedAt: new Date().toISOString(),
          recordCount: productsData.length,
        },
        products: productsData,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `products-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportMessage("✅ Products exported successfully!");
      setTimeout(() => setExportMessage(""), 5000);
    } catch (error) {
      console.error("Products export error:", error);
      setExportMessage("❌ Products export failed: " + error.message);
      setTimeout(() => setExportMessage(""), 5000);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportTransactions = async () => {
    try {
      setExportLoading(true);
      setExportMessage("");

      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const ordersData = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const exportData = {
        metadata: {
          type: "transactions",
          exportedAt: new Date().toISOString(),
          recordCount: ordersData.length,
        },
        orders: ordersData,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transactions-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportMessage("✅ Transactions exported successfully!");
      setTimeout(() => setExportMessage(""), 5000);
    } catch (error) {
      console.error("Transactions export error:", error);
      setExportMessage("❌ Transactions export failed: " + error.message);
      setTimeout(() => setExportMessage(""), 5000);
    } finally {
      setExportLoading(false);
    }
  };

  // Export transactions to Excel
  const handleExportTransactionsToExcel = async () => {
    try {
      setExportLoading(true);
      setExportMessage("");

      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const ordersData = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Convert orders data to CSV format for Excel
      const csvData = convertOrdersToCSV(ordersData);

      // Create and download CSV file (Excel can open CSV files)
      const dataBlob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transactions-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportMessage("✅ Transactions exported to Excel successfully!");
      setTimeout(() => setExportMessage(""), 5000);
    } catch (error) {
      console.error("Excel export error:", error);
      setExportMessage("❌ Excel export failed: " + error.message);
      setTimeout(() => setExportMessage(""), 5000);
    } finally {
      setExportLoading(false);
    }
  };

  // Convert orders data to CSV format
  const convertOrdersToCSV = (orders) => {
    if (!orders.length) return "No data available";

    const headers = [
      "Order ID",
      "Customer Name",
      "Date",
      "Total Amount",
      "Payment Method",
      "Payment Status",
      "Remaining Balance",
      "Status",
      "Total Items",
      "Items",
    ];

    // Create CSV header
    let csv = headers.join(",") + "\n";

    // Add each order as a row
    orders.forEach((order) => {
      const row = [
        `"${order.id || ""}"`,
        `"${order.customerName || "N/A"}"`,
        `"${formatDateForExcel(order.createdAt)}"`,
        `"${order.totalAmount || 0}"`,
        `"${order.paymentMethod || "N/A"}"`,
        `"${order.paymentStatus || "N/A"}"`,
        `"${order.remainingBalance || 0}"`,
        `"${order.status || "N/A"}"`,
        `"${order.totalItems || 0}"`,
        `"${formatItemsForExcel(order.items)}"`,
      ];
      csv += row.join(",") + "\n";
    });

    return csv;
  };

  // Format date for Excel
  const formatDateForExcel = (date) => {
    if (!date) return "N/A";

    try {
      let formattedDate;
      if (date.toDate && typeof date.toDate === "function") {
        formattedDate = date.toDate();
      } else if (date.seconds) {
        formattedDate = new Date(date.seconds * 1000);
      } else if (date._seconds) {
        formattedDate = new Date(date._seconds * 1000);
      } else {
        formattedDate = new Date(date);
      }

      return formattedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  };

  // Format items for Excel
  const formatItemsForExcel = (items) => {
    if (!items || !Array.isArray(items)) return "No items";

    return items
      .map(
        (item) =>
          `${item.name || "Unknown"} (Qty: ${item.quantity || 0}, Price: ${
            item.price || 0
          })`
      )
      .join("; ");
  };

  return (
    <div className="settings-tab-panel">
      {/* Auto-save Status Modal */}
      {showAutoSaveModal && (
        <div className="auto-save-modal-overlay">
          <div className="auto-save-modal">
            <div className="modal-header">
              <FontAwesomeIcon icon={faInfoCircle} className="modal-icon" />
              <h4>Auto-save Settings</h4>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-content">
              <div
                className={`status-indicator ${
                  settings.autoSave ? "enabled" : "disabled"
                }`}
              >
                <div className="status-dot"></div>
                <span className="status-text">
                  Auto-save: {settings.autoSave ? "ENABLED" : "DISABLED"}
                </span>
              </div>
              {settings.autoSave && (
                <div className="status-description">
                  Changes will be saved automatically after{" "}
                  {settings.autoSaveDelay}ms delay
                </div>
              )}
              {!settings.autoSave && (
                <div className="status-description">
                  Manual save required. Click "Save Now" to save changes.
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={closeModal}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="panel-header">
        <h3>General Settings</h3>
        <p>Configure basic application preferences and auto-save behavior</p>
      </div>

      {/* Export Message */}
      {exportMessage && (
        <div
          className={`export-message ${
            exportMessage.includes("✅") ? "success" : "error"
          }`}
        >
          <FontAwesomeIcon
            icon={exportMessage.includes("✅") ? faDownload : faFileExport}
            className="export-icon"
          />
          {exportMessage}
        </div>
      )}

      <div className="settings-table">
        <div className="settings-row">
          <div className="setting-info">
            <label className="setting-name">Application Version</label>
            <span className="setting-description">
              Current version of your inventory management system
            </span>
          </div>
          <div className="setting-control">
            <span className="version-text">v1.0.0</span>
          </div>
        </div>

        <div className="settings-row">
          <div className="setting-info">
            <label className="setting-name">Auto-save</label>
            <span className="setting-description">
              Automatically save changes to settings without manual confirmation
            </span>
          </div>
          <div className="setting-control">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.autoSave || false}
                onChange={(e) => handleAutoSaveToggle(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {settings.autoSave && (
          <div className="settings-row">
            <div className="setting-info">
              <label className="setting-name">
                <FontAwesomeIcon icon={faClock} className="setting-icon" />
                Auto-save Delay
              </label>
              <span className="setting-description">
                Delay before automatically saving changes (in milliseconds)
              </span>
            </div>
            <div className="setting-control">
              <div className="input-with-suffix">
                <input
                  type="number"
                  value={settings.autoSaveDelay || 2000}
                  onChange={(e) => handleDelayChange(e.target.value)}
                  className="setting-input"
                  min="500"
                  max="10000"
                  step="500"
                />
                <span className="input-suffix">ms</span>
              </div>
            </div>
          </div>
        )}

        {/* Data Backup Section */}
        <div className="settings-row">
          <div className="setting-info">
            <label className="setting-name">Data Backup</label>
            <span className="setting-description">
              Export your inventory data for backup purposes. Choose between
              full backup or specific data types.
            </span>
          </div>
          <div className="setting-control">
            <div className="backup-actions">
              <button
                className="btn-secondary"
                onClick={handleExportData}
                disabled={exportLoading}
              >
                <FontAwesomeIcon icon={faDownload} />
                {exportLoading ? "Exporting..." : "Full Backup"}
              </button>
            </div>
          </div>
        </div>

        {/* Specific Export Options */}
        <div className="settings-row">
          <div className="setting-info">
            <label className="setting-name">Export Specific Data</label>
            <span className="setting-description">
              Export specific data types for targeted backups and analysis
            </span>
          </div>
          <div className="setting-control">
            <div className="specific-backup-actions">
              <button
                className="btn-secondary btn-sm"
                onClick={handleExportProducts}
                disabled={exportLoading}
              >
                <FontAwesomeIcon icon={faFileExport} />
                Products (JSON)
              </button>
              <button
                className="btn-secondary btn-sm"
                onClick={handleExportTransactions}
                disabled={exportLoading}
              >
                <FontAwesomeIcon icon={faFileExport} />
                Transactions (JSON)
              </button>
              <button
                className="btn-secondary btn-sm excel-export"
                onClick={handleExportTransactionsToExcel}
                disabled={exportLoading}
              >
                <FontAwesomeIcon icon={faFileExcel} />
                Transactions (Excel)
              </button>
            </div>
          </div>
        </div>

        {/* Manual save button for when auto-save is off */}
        {!settings.autoSave && (
          <div className="settings-row">
            <div className="setting-info">
              <label className="setting-name">Manual Save</label>
              <span className="setting-description">
                Save your settings manually (auto-save is disabled)
              </span>
            </div>
            <div className="setting-control">
              <button onClick={onSave} className="btn-primary">
                <FontAwesomeIcon icon={faSave} />
                Save Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick status indicator (small, non-intrusive) */}
      <div className="quick-status">
        <div
          className={`quick-status-indicator ${
            settings.autoSave ? "enabled" : "disabled"
          }`}
        >
          <div className="quick-status-dot"></div>
          <span className="quick-status-text">
            Auto-save: {settings.autoSave ? "ON" : "OFF"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
