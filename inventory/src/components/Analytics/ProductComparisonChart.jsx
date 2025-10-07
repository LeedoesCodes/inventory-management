import React, { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faChartLine,
  faTimes,
  faChartArea,
  faChevronDown,
  faChevronUp,
  faLock,
  faUnlock,
  faSave,
  faExpand,
  faCompress,
} from "@fortawesome/free-solid-svg-icons";

const ProductComparisonChart = ({ products, timeRange }) => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [metricType, setMetricType] = useState("sales");
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [savedCombinations, setSavedCombinations] = useState([]);
  const [isChartMinimized, setIsChartMinimized] = useState(false);

  // Auto-minimize chart when no products are selected
  useEffect(() => {
    setIsChartMinimized(selectedProducts.length === 0);
  }, [selectedProducts.length]);

  // Load saved selections from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("productComparisonSelections");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedCombinations(parsed);

        // Auto-load the most recent saved combination
        if (parsed.length > 0) {
          const mostRecent = parsed[parsed.length - 1];
          setSelectedProducts(mostRecent.productIds);
          setMetricType(mostRecent.metricType);
          setIsLocked(true);
        }
      } catch (error) {
        console.error("Error loading saved selections:", error);
      }
    }
  }, []);

  // Save current selection
  const saveCurrentSelection = () => {
    if (selectedProducts.length === 0) return;

    const newCombination = {
      id: Date.now(),
      name: `Comparison ${savedCombinations.length + 1}`,
      productIds: [...selectedProducts],
      metricType,
      createdAt: new Date().toISOString(),
      productNames: selectedProducts.map(
        (id) => products.find((p) => p.id === id)?.name || "Unknown"
      ),
    };

    const updatedCombinations = [...savedCombinations, newCombination];
    setSavedCombinations(updatedCombinations);

    // Save to localStorage
    localStorage.setItem(
      "productComparisonSelections",
      JSON.stringify(updatedCombinations)
    );
    setIsLocked(true);
  };

  // Load a saved combination
  const loadSavedCombination = (combination) => {
    setSelectedProducts(combination.productIds);
    setMetricType(combination.metricType);
    setIsLocked(true);
    setIsSelectionOpen(false); // Collapse after loading
  };

  // Delete a saved combination
  const deleteSavedCombination = (id, e) => {
    e.stopPropagation();
    const updated = savedCombinations.filter((comb) => comb.id !== id);
    setSavedCombinations(updated);
    localStorage.setItem(
      "productComparisonSelections",
      JSON.stringify(updated)
    );
  };

  // Available products for selection
  const availableProducts = useMemo(() => {
    return products
      .filter((product) => product.totalSales > 0)
      .sort((a, b) => b.totalSales - a.sales)
      .slice(0, 20);
  }, [products]);

  // Toggle product selection (only works when unlocked)
  const toggleProduct = (productId) => {
    if (isLocked) return;

    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else if (prev.length < 4) {
        return [...prev, productId];
      }
      return prev;
    });
  };

  // Remove a product from comparison
  const removeProduct = (productId) => {
    if (isLocked) return;
    setSelectedProducts((prev) => prev.filter((id) => id !== productId));
  };

  // Clear all selected products
  const clearAllProducts = () => {
    if (isLocked) return;
    setSelectedProducts([]);
    setIsLocked(false);
  };

  // Unlock for editing
  const unlockSelection = () => {
    setIsLocked(false);
    setIsSelectionOpen(true);
  };

  // Toggle chart minimization
  const toggleChartMinimized = () => {
    setIsChartMinimized(!isChartMinimized);
  };

  // Generate comparison data
  const comparisonData = useMemo(() => {
    if (selectedProducts.length === 0) return [];

    const allDates = new Set();
    selectedProducts.forEach((productId) => {
      const product = products.find((p) => p.id === productId);
      product?.comparisonData?.forEach((day) => {
        allDates.add(day.date);
      });
    });

    const datesArray = Array.from(allDates).sort();

    return datesArray.map((date) => {
      const dataPoint = { date };

      selectedProducts.forEach((productId) => {
        const product = products.find((p) => p.id === productId);
        const dayData = product?.comparisonData?.find((d) => d.date === date);

        if (metricType === "sales") {
          dataPoint[product.name] = dayData ? dayData.sales : 0;
        } else {
          dataPoint[product.name] = dayData
            ? Math.round(dayData.revenue * 100) / 100
            : 0;
        }
      });

      return dataPoint;
    });
  }, [selectedProducts, products, metricType]);

  // Chart colors
  const chartColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <div className="tooltip-header">{`Date: ${label}`}</div>
          {payload.map((entry, index) => (
            <div
              key={index}
              className="tooltip-item"
              style={{ color: entry.color }}
            >
              {`${entry.dataKey}: ${entry.value} ${
                metricType === "sales" ? "sales" : "₱"
              }`}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="product-comparison-chart">
      {/* Header with controls */}
      <div className="comparison-header">
        <div className="header-left">
          <FontAwesomeIcon icon={faChartArea} />
          <h3>Product Performance Comparison</h3>
          {selectedProducts.length > 0 && (
            <span className="product-count">
              ({selectedProducts.length} product
              {selectedProducts.length !== 1 ? "s" : ""})
            </span>
          )}
        </div>

        <div className="header-controls">
          {/* Chart Minimize/Expand Control */}
          {selectedProducts.length > 0 && (
            <button
              onClick={toggleChartMinimized}
              className="control-btn minimize-btn"
              title={isChartMinimized ? "Expand chart" : "Minimize chart"}
            >
              <FontAwesomeIcon
                icon={isChartMinimized ? faExpand : faCompress}
              />
              {isChartMinimized ? "Expand" : "Minimize"}
            </button>
          )}

          {/* Save/Lock Controls */}
          {selectedProducts.length > 0 && (
            <>
              {!isLocked ? (
                <button
                  onClick={saveCurrentSelection}
                  className="control-btn save-btn"
                  title="Save this combination"
                >
                  <FontAwesomeIcon icon={faSave} />
                  Save
                </button>
              ) : (
                <button
                  onClick={unlockSelection}
                  className="control-btn unlock-btn"
                  title="Edit selection"
                >
                  <FontAwesomeIcon icon={faUnlock} />
                  Edit
                </button>
              )}

              <div
                className="lock-indicator"
                title={isLocked ? "Selection locked" : "Selection unlocked"}
              >
                <FontAwesomeIcon icon={isLocked ? faLock : faUnlock} />
              </div>
            </>
          )}

          {/* Toggle Selection Panel */}
          <button
            onClick={() => setIsSelectionOpen(!isSelectionOpen)}
            className="control-btn toggle-btn"
            title={isSelectionOpen ? "Hide selection" : "Show selection"}
          >
            <FontAwesomeIcon
              icon={isSelectionOpen ? faChevronUp : faChevronDown}
            />
            {isSelectionOpen ? "Hide" : "Show"} Selection
          </button>
        </div>
      </div>

      {/* Saved Combinations Quick Access */}
      {savedCombinations.length > 0 && (
        <div className="saved-combinations">
          <div className="saved-header">Saved Comparisons:</div>
          <div className="saved-list">
            {savedCombinations.map((combination) => (
              <div
                key={combination.id}
                className={`saved-item ${
                  selectedProducts.join() === combination.productIds.join()
                    ? "active"
                    : ""
                }`}
                onClick={() => loadSavedCombination(combination)}
              >
                <span className="saved-name">{combination.name}</span>
                <span className="saved-products">
                  {combination.productNames.slice(0, 2).join(", ")}
                  {combination.productNames.length > 2 &&
                    ` +${combination.productNames.length - 2} more`}
                </span>
                <button
                  onClick={(e) => deleteSavedCombination(combination.id, e)}
                  className="delete-saved-btn"
                  title="Delete this saved combination"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible Product Selection */}
      {isSelectionOpen && (
        <div className="product-selection-panel">
          <div className="selection-header">
            <div className="selection-title">
              <FontAwesomeIcon icon={faFilter} />
              <span>Select Products to Compare {isLocked && "(Locked)"}</span>
            </div>

            {selectedProducts.length > 0 && (
              <div className="selection-controls">
                <span className="selected-count">
                  {selectedProducts.length} selected
                </span>
                {!isLocked && (
                  <button onClick={clearAllProducts} className="clear-all-btn">
                    Clear All
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Metric Type Selector */}
          <div className="metric-selector">
            <label>Compare by:</label>
            <select
              value={metricType}
              onChange={(e) => setMetricType(e.target.value)}
              className="metric-select"
              disabled={isLocked}
            >
              <option value="sales">Daily Sales (Units)</option>
              <option value="revenue">Daily Revenue (₱)</option>
            </select>
          </div>

          <div className="product-selection-grid">
            {availableProducts.length === 0 ? (
              <div className="no-products-message">
                No product data available for the selected time range.
              </div>
            ) : (
              availableProducts.map((product, index) => (
                <div
                  key={product.id}
                  className={`product-selection-item ${
                    selectedProducts.includes(product.id) ? "selected" : ""
                  } ${
                    (selectedProducts.length >= 4 &&
                      !selectedProducts.includes(product.id)) ||
                    isLocked
                      ? "disabled"
                      : ""
                  }`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <div className="product-checkbox">
                    {selectedProducts.includes(product.id) && (
                      <div className="checkbox-indicator" />
                    )}
                  </div>
                  <div className="product-info">
                    <span className="product-name">{product.name}</span>
                    <span className="product-stats">
                      {product.totalSales} sales • ₱
                      {product.totalRevenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected Products Tags */}
          {selectedProducts.length > 0 && (
            <div className="selected-products-tags">
              <div className="tags-header">Currently Comparing:</div>
              <div className="tags-container">
                {selectedProducts.map((productId, index) => {
                  const product = products.find((p) => p.id === productId);
                  return (
                    <div
                      key={productId}
                      className="product-tag"
                      style={{ borderLeftColor: chartColors[index] }}
                    >
                      <span className="product-tag-name">{product?.name}</span>
                      {!isLocked && (
                        <button
                          onClick={() => removeProduct(productId)}
                          className="remove-tag-btn"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comparison Chart */}
      <div
        className={`comparison-chart-container ${
          isChartMinimized ? "minimized" : ""
        }`}
      >
        {selectedProducts.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faChartLine} size="3x" />
            <p>Select products to compare their performance</p>
            <small>Choose up to 4 products from the selection panel</small>
          </div>
        ) : (
          <>
            <div className="chart-header">
              <h4>Product Performance Comparison</h4>
              <span className="metric-info">
                Showing daily{" "}
                {metricType === "sales" ? "sales (units)" : "revenue (₱)"}
                {isLocked && " • Locked"}
              </span>
            </div>
            <ResponsiveContainer
              width="100%"
              height={isChartMinimized ? 200 : 400}
            >
              <LineChart
                data={comparisonData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: isChartMinimized ? 40 : 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: isChartMinimized ? 10 : 12 }}
                  angle={isChartMinimized ? -90 : -45}
                  textAnchor={isChartMinimized ? "end" : "end"}
                  height={isChartMinimized ? 60 : 80}
                  interval={isChartMinimized ? "preserveStartEnd" : 0}
                />
                <YAxis
                  tick={{ fontSize: isChartMinimized ? 10 : 12 }}
                  label={
                    !isChartMinimized
                      ? {
                          value:
                            metricType === "sales"
                              ? "Daily Sales"
                              : "Daily Revenue (₱)",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle" },
                          offset: -10,
                        }
                      : null
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                {!isChartMinimized && (
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ paddingBottom: "20px" }}
                  />
                )}
                {selectedProducts.map((productId, index) => {
                  const product = products.find((p) => p.id === productId);
                  return (
                    <Line
                      key={productId}
                      type="monotone"
                      dataKey={product?.name}
                      stroke={chartColors[index]}
                      strokeWidth={isChartMinimized ? 1.5 : 2}
                      dot={isChartMinimized ? false : { r: 3 }}
                      activeDot={isChartMinimized ? false : { r: 6 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductComparisonChart;
