import React, { useState, useEffect, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faCalendarAlt,
  faHistory,
  faArrowUp,
  faArrowDown,
  faSpinner,
  faExclamationTriangle,
  faFlask,
} from "@fortawesome/free-solid-svg-icons";
import {
  getProductChangesForDate,
  getProductChangesForDateRange,
  getProductAuditHistory,
  setAuditLogTestingStatus,
} from "../../utils/productAuditUtils";
import { AuthContext } from "../../context/AuthContext";
import "./ProductAuditHistory.scss";

const ProductAuditHistory = ({ productId, productName, onClose }) => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("date"); // date, range, all
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [showTestingLogs, setShowTestingLogs] = useState(false);
  const [updatingTestingLogId, setUpdatingTestingLogId] = useState("");

  // Fetch audit logs based on active tab
  useEffect(() => {
    fetchAuditLogs();
  }, [activeTab, selectedDate, startDate, endDate, showTestingLogs]);

  const isLogTesting = (log) => {
    if (log?.isTesting === true) return true;

    const productNameLower = log?.productName?.toLowerCase() || "";
    return (
      productNameLower === "sample" ||
      productNameLower === "sample bag" ||
      productNameLower.includes(" sample") ||
      productNameLower.includes("sample ")
    );
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    console.log(
      "🟡 [AUDIT MODAL] Fetching logs for product:",
      productId,
      "Tab:",
      activeTab,
    );
    try {
      let logs = [];

      if (activeTab === "date") {
        console.log("🟡 [AUDIT MODAL] Fetching by date:", selectedDate);
        logs = await getProductChangesForDate(
          productId,
          new Date(selectedDate),
        );
      } else if (activeTab === "range") {
        if (startDate && endDate) {
          console.log(
            "🟡 [AUDIT MODAL] Fetching by range:",
            startDate,
            "to",
            endDate,
          );
          logs = await getProductChangesForDateRange(
            productId,
            new Date(startDate),
            new Date(endDate),
          );
        } else {
          console.warn(
            "🟠 [AUDIT MODAL] Start/end dates not set for range query",
          );
        }
      } else if (activeTab === "all") {
        console.log("🟡 [AUDIT MODAL] Fetching all history");
        logs = await getProductAuditHistory(productId, 100);
      }

      if (!showTestingLogs) {
        logs = logs.filter((log) => !isLogTesting(log));
      }

      console.log("✅ [AUDIT MODAL] Received logs:", logs.length, "logs");
      setAuditLogs(logs);

      // Calculate summary if in date view
      if (activeTab === "date" && logs.length > 0) {
        const chronological = [...logs].reverse();
        const startStock = chronological[0].changes.before;
        const endStock = chronological[chronological.length - 1].changes.after;
        const netChange = endStock - startStock;

        console.log("✅ [AUDIT MODAL] Summary:", {
          startStock,
          endStock,
          netChange,
        });

        setSummary({
          startStock,
          endStock,
          netChange,
          totalChanges: logs.length,
        });
      } else {
        setSummary(null);
      }
    } catch (error) {
      console.error("❌ [AUDIT MODAL] Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLogTesting = async (log) => {
    if (!log?.id || updatingTestingLogId) return;

    const nextState = !isLogTesting(log);
    setUpdatingTestingLogId(log.id);

    try {
      await setAuditLogTestingStatus(
        log.id,
        nextState,
        user?.displayName || user?.email || "Unknown User",
      );

      setAuditLogs((prev) => {
        const updated = prev.map((item) =>
          item.id === log.id ? { ...item, isTesting: nextState } : item,
        );
        return showTestingLogs
          ? updated
          : updated.filter((item) => !isLogTesting(item));
      });
    } catch (error) {
      console.error("❌ [AUDIT MODAL] Failed to toggle testing status:", error);
      alert("Failed to update testing status. Please try again.");
    } finally {
      setUpdatingTestingLogId("");
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case "stock_add":
        return "Stock Added";
      case "stock_edit":
        return "Stock Changed";
      case "price_change":
        return "Price Changed";
      default:
        return action;
    }
  };

  const getActionIcon = (action) => {
    if (action === "stock_add") return faArrowUp;
    if (action === "price_change") return faArrowUp;
    return faArrowDown;
  };

  const getActionColor = (difference) => {
    if (difference > 0) return "positive";
    if (difference < 0) return "negative";
    return "neutral";
  };

  return (
    <div className="product-audit-history">
      <div className="audit-header">
        <h2>
          <FontAwesomeIcon icon={faHistory} /> Audit History: {productName}
        </h2>
        <button className="close-btn" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* Tabs */}
      <div className="audit-tabs">
        <button
          className={`tab ${activeTab === "date" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("date");
            setStartDate("");
            setEndDate("");
          }}
        >
          By Date
        </button>
        <button
          className={`tab ${activeTab === "range" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("range");
            setSelectedDate("");
          }}
        >
          By Range
        </button>
        <button
          className={`tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("all");
            setSelectedDate("");
            setStartDate("");
            setEndDate("");
          }}
        >
          All History
        </button>
      </div>

      {/* Filter Controls */}
      <div className="audit-filters">
        {activeTab === "date" && (
          <div className="filter-group">
            <label>Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-input"
            />
          </div>
        )}

        {activeTab === "range" && (
          <div className="filter-group">
            <div className="range-inputs">
              <div>
                <label>From:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-input"
                />
              </div>
              <div>
                <label>To:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-input"
                />
              </div>
            </div>
            {startDate && endDate && (
              <button
                className="refresh-btn"
                onClick={fetchAuditLogs}
                disabled={loading}
              >
                {loading ? "Loading..." : "Apply Filter"}
              </button>
            )}
          </div>
        )}

        <div className="filter-group">
          <label>
            <FontAwesomeIcon icon={faFlask} /> Testing Logs
          </label>
          <button
            type="button"
            className={`testing-toggle-btn ${showTestingLogs ? "active" : ""}`}
            onClick={() => setShowTestingLogs((prev) => !prev)}
          >
            {showTestingLogs ? "Hide Testing Logs" : "Show Testing Logs"}
          </button>
        </div>
      </div>

      {/* Summary Section (Date view) */}
      {activeTab === "date" && summary && (
        <div className="audit-summary">
          <div className="summary-card">
            <span className="label">Starting Stock:</span>
            <span className="value">{summary.startStock}</span>
          </div>
          <div className="summary-card">
            <span className="label">Ending Stock:</span>
            <span className="value">{summary.endStock}</span>
          </div>
          <div
            className={`summary-card net-change ${getActionColor(summary.netChange)}`}
          >
            <span className="label">Net Change:</span>
            <span className="value">
              {summary.netChange > 0 ? "+" : ""}
              {summary.netChange}
            </span>
          </div>
          <div className="summary-card">
            <span className="label">Total Changes:</span>
            <span className="value">{summary.totalChanges}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Loading audit history...</p>
        </div>
      )}

      {/* Audit Logs List */}
      {!loading && auditLogs.length > 0 && (
        <div className="audit-logs">
          <div className="logs-header">
            <span>{auditLogs.length} change(s) found</span>
          </div>
          {auditLogs.map((log, index) => (
            <div key={log.id || index} className="audit-log-entry">
              <div className="log-icon">
                <FontAwesomeIcon
                  icon={getActionIcon(log.action)}
                  className={`icon ${getActionColor(log.changes.difference)}`}
                />
              </div>
              <div className="log-content">
                <div className="log-header">
                  <span className="action">{getActionLabel(log.action)}</span>
                  {isLogTesting(log) && (
                    <span className="action testing">Testing</span>
                  )}
                  <span className="time">
                    {log.timestamp?.toLocaleTimeString?.() || "N/A"}
                  </span>
                </div>
                <div className="log-details">
                  <span className="change">
                    {log.changes.before} → {log.changes.after}
                  </span>
                  <span
                    className={`difference ${getActionColor(log.changes.difference)}`}
                  >
                    {log.changes.difference > 0 ? "+" : ""}
                    {log.changes.difference}
                  </span>
                  {typeof log.price === "number" && (
                    <span className="price">Cost: ₱{log.price.toFixed(2)}</span>
                  )}
                  {typeof log.totalPrice === "number" && (
                    <span className="total-price">
                      Total: ₱{log.totalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="log-meta">
                  <span className="user">By: {log.userName || "Unknown"}</span>
                  {log.notes && (
                    <span className="notes">Note: {log.notes}</span>
                  )}
                  <button
                    type="button"
                    className="testing-log-action"
                    onClick={() => handleToggleLogTesting(log)}
                    disabled={updatingTestingLogId === log.id}
                  >
                    {updatingTestingLogId === log.id
                      ? "Updating..."
                      : isLogTesting(log)
                        ? "Undo Testing"
                        : "Mark as Testing"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && auditLogs.length === 0 && (
        <div className="empty-state">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <p>No audit logs found</p>
          {activeTab === "range" && (!startDate || !endDate) && (
            <small>Please select both start and end dates</small>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductAuditHistory;
