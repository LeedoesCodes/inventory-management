import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHistory,
  faCalendarAlt,
  faArrowUp,
  faArrowDown,
  faSpinner,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import {
  getAllProductChangesForDate,
  getProductChangesForDateRange,
  getProductAuditHistory,
  getAuditLogsByAction,
} from "../utils/productAuditUtils";
import Header from "../components/UI/Headers";
import Sidebar from "../components/UI/Sidebar";
import { useSidebar } from "../context/SidebarContext";
import "../styles/auditLog.scss";

export default function AuditLogPage() {
  const { isCollapsed } = useSidebar();

  const [activeTab, setActiveTab] = useState("date"); // date, range, action, all
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const actionOptions = [
    { value: "all", label: "All Actions" },
    { value: "stock_add", label: "Stock Added" },
    { value: "stock_edit", label: "Stock Changed" },
    { value: "price_change", label: "Price Changed" },
  ];

  // Fetch audit logs based on active tab
  useEffect(() => {
    fetchAuditLogs();
  }, [activeTab, selectedDate, startDate, endDate, selectedAction]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    console.log("🟡 [AUDIT LOG] Fetching logs. Tab:", activeTab);
    try {
      let logs = [];

      if (activeTab === "date") {
        console.log("🟡 [AUDIT LOG] Fetching by date:", selectedDate);
        logs = await getAllProductChangesForDate(new Date(selectedDate));
      } else if (activeTab === "range") {
        if (startDate && endDate) {
          console.log(
            "🟡 [AUDIT LOG] Fetching by range:",
            startDate,
            "to",
            endDate,
          );
          // null = fetch all products across the date range
          logs = await getProductChangesForDateRange(
            null,
            new Date(startDate),
            new Date(endDate),
          );
        } else {
          console.warn("🟠 [AUDIT LOG] Start/end dates not set");
        }
      } else if (activeTab === "action") {
        if (selectedAction !== "all") {
          console.log("🟡 [AUDIT LOG] Fetching by action:", selectedAction);
          logs = await getAuditLogsByAction(selectedAction);
        } else {
          logs = await getProductAuditHistory(null, 500);
        }
      } else if (activeTab === "all") {
        console.log("🟡 [AUDIT LOG] Fetching all history");
        logs = await getProductAuditHistory(null, 500);
      }

      // Filter by search term
      if (searchTerm) {
        logs = logs.filter((log) =>
          log.productName?.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }

      // Filter out test products (sample or sample bag)
      logs = logs.filter((log) => {
        const productNameLower = log.productName?.toLowerCase() || "";
        return (
          productNameLower !== "sample" &&
          productNameLower !== "sample bag" &&
          !productNameLower.includes(" sample") &&
          !productNameLower.includes("sample ")
        );
      });

      console.log("✅ [AUDIT LOG] Received logs:", logs.length);
      setAuditLogs(logs);

      // Calculate summary
      calculateSummary(logs);
    } catch (error) {
      console.error("❌ [AUDIT LOG] Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (logs) => {
    if (!logs || logs.length === 0) {
      setSummary(null);
      return;
    }

    // Group by product to find most changed
    const productChanges = {};
    let totalAdditions = 0;
    let totalRemoved = 0;

    logs.forEach((log) => {
      if (!productChanges[log.productName]) {
        productChanges[log.productName] = { count: 0, lastChange: null };
      }
      productChanges[log.productName].count += 1;
      productChanges[log.productName].lastChange = log.timestamp;

      if (log.changes?.difference > 0) {
        totalAdditions += log.changes.difference;
      } else if (log.changes?.difference < 0) {
        totalRemoved += Math.abs(log.changes.difference);
      }
    });

    const mostChanged = Object.entries(productChanges)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 3);

    setSummary({
      totalChanges: logs.length,
      totalProducts: Object.keys(productChanges).length,
      totalAdditions,
      totalRemoved,
      mostChanged: mostChanged.map(([name, data]) => ({ name, ...data })),
    });
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
    <div className="page-container">
      <Sidebar />
      <div className={`audit-log-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />

        <div className="audit-log-content">
          <div className="audit-log-header">
            <h1>
              <FontAwesomeIcon icon={faHistory} /> Global Audit Log
            </h1>
            <p>
              View all product changes and inventory modifications across your
              system
            </p>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="audit-summary-section">
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="label">Total Changes</span>
                  <span className="value">{summary.totalChanges}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Products Changed</span>
                  <span className="value">{summary.totalProducts}</span>
                </div>
                <div className="summary-item positive">
                  <span className="label">Total Added</span>
                  <span className="value">+{summary.totalAdditions}</span>
                </div>
                <div className="summary-item negative">
                  <span className="label">Total Removed</span>
                  <span className="value">-{summary.totalRemoved}</span>
                </div>
              </div>

              {summary.mostChanged.length > 0 && (
                <div className="most-changed">
                  <h3>Most Changed Products</h3>
                  <div className="product-list">
                    {summary.mostChanged.map((item, idx) => (
                      <div key={idx} className="product-item">
                        <span className="rank">#{idx + 1}</span>
                        <span className="name">{item.name}</span>
                        <span className="count">{item.count} changes</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
              className={`tab ${activeTab === "action" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("action");
                setSelectedDate("");
                setStartDate("");
                setEndDate("");
              }}
            >
              By Action
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

          {/* Filters */}
          <div className="audit-filters">
            <div className="filter-group">
              {activeTab === "date" && (
                <div>
                  <label>
                    <FontAwesomeIcon icon={faCalendarAlt} /> Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="date-input"
                  />
                </div>
              )}

              {activeTab === "range" && (
                <div className="range-inputs">
                  <div>
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="date-input"
                    />
                  </div>
                  <div>
                    <label>End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="date-input"
                    />
                  </div>
                </div>
              )}

              {activeTab === "action" && (
                <div>
                  <label>
                    <FontAwesomeIcon icon={faFilter} /> Filter by Action
                  </label>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="action-select"
                  >
                    {actionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Search all tabs */}
              <div>
                <label>Search Product</label>
                <input
                  type="text"
                  placeholder="Search by product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>

          {/* Logs List */}
          <div className="audit-logs-section">
            {loading ? (
              <div className="loading-state">
                <FontAwesomeIcon icon={faSpinner} spin />
                <p>Loading audit logs...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="empty-state">
                <FontAwesomeIcon icon={faHistory} />
                <p>No audit logs found</p>
                <small>Try adjusting your filters or date range</small>
              </div>
            ) : (
              <div className="logs-list">
                {auditLogs.map((log) => (
                  <div key={log.id} className="log-entry">
                    <div className="log-icon">
                      <div
                        className={`icon ${getActionColor(
                          log.changes?.difference || 0,
                        )}`}
                      >
                        <FontAwesomeIcon icon={getActionIcon(log.action)} />
                      </div>
                    </div>

                    <div className="log-content">
                      <div className="log-header">
                        <div className="product-info">
                          <h4 className="product-name">{log.productName}</h4>
                          <span className="action-badge">
                            {getActionLabel(log.action)}
                          </span>
                        </div>
                        <span className="time">
                          {log.timestamp?.toLocaleString() || "N/A"}
                        </span>
                      </div>

                      <div className="log-details">
                        <div className="change-info">
                          <span className="before">
                            Before: <strong>{log.changes?.before}</strong>
                          </span>
                          <span className="arrow">→</span>
                          <span className="after">
                            After: <strong>{log.changes?.after}</strong>
                          </span>
                          <span
                            className={`difference ${getActionColor(
                              log.changes?.difference || 0,
                            )}`}
                          >
                            {log.changes?.difference > 0 ? "+" : ""}
                            {log.changes?.difference}
                          </span>
                        </div>
                        {log.price != null && !isNaN(Number(log.price)) && (
                          <div className="price-info">
                            <span className="price-label">Cost:</span>
                            <span className="price-value">
                              ₱{Number(log.price).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {log.totalPrice != null && !isNaN(Number(log.totalPrice)) && (
                          <div className="total-price-info">
                            <span className="price-label">Total:</span>
                            <span className="price-value">
                              ₱{Number(log.totalPrice).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="log-meta">
                        <span className="user">
                          <strong>User:</strong> {log.userName || "Unknown"}
                        </span>
                        {log.notes && (
                          <span className="notes">
                            <strong>Notes:</strong> {log.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
