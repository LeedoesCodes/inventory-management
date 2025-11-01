import React, { useState, useMemo, useEffect, useCallback, memo } from "react";
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

// Custom hooks
import { useChartResize } from "../../hooks/useChartResize";

// Safe data accessor functions
const getProductName = (product) => {
  if (!product || typeof product !== "object") return "Unknown Product";
  return product.name || "Unknown Product";
};

const getProductTotalSales = (product) => {
  if (!product || typeof product !== "object") return 0;
  return typeof product.totalSales === "number" ? product.totalSales : 0;
};

const getProductTotalRevenue = (product) => {
  if (!product || typeof product !== "object") return 0;
  return typeof product.totalRevenue === "number" ? product.totalRevenue : 0;
};

const getProductComparisonData = (product) => {
  if (!product || typeof product !== "object") return [];
  return Array.isArray(product.comparisonData) ? product.comparisonData : [];
};

const ProductComparisonChart = memo(
  ({ products, timeRange }) => {
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [metricType, setMetricType] = useState("sales");
    const [isSelectionOpen, setIsSelectionOpen] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [savedCombinations, setSavedCombinations] = useState([]);
    const [isChartMinimized, setIsChartMinimized] = useState(false);

    // Use resize hook
    const { containerRef, dimensions } = useChartResize(200);

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
            setSelectedProducts(mostRecent.productIds || []);
            setMetricType(mostRecent.metricType || "sales");
            setIsLocked(true);
          }
        } catch (error) {
          console.error("Error loading saved selections:", error);
        }
      }
    }, []);

    // Memoized event handlers
    const saveCurrentSelection = useCallback(() => {
      if (selectedProducts.length === 0) return;

      const newCombination = {
        id: Date.now(),
        name: `Comparison ${savedCombinations.length + 1}`,
        productIds: [...selectedProducts],
        metricType,
        createdAt: new Date().toISOString(),
        productNames: selectedProducts.map((id) => {
          const product = products.find((p) => p.id === id);
          return getProductName(product);
        }),
      };

      const updatedCombinations = [...savedCombinations, newCombination];
      setSavedCombinations(updatedCombinations);

      localStorage.setItem(
        "productComparisonSelections",
        JSON.stringify(updatedCombinations)
      );
      setIsLocked(true);
    }, [selectedProducts, savedCombinations.length, metricType, products]);

    const loadSavedCombination = useCallback((combination) => {
      setSelectedProducts(combination.productIds || []);
      setMetricType(combination.metricType || "sales");
      setIsLocked(true);
      setIsSelectionOpen(false);
    }, []);

    const deleteSavedCombination = useCallback(
      (id, e) => {
        e.stopPropagation();
        const updated = savedCombinations.filter((comb) => comb.id !== id);
        setSavedCombinations(updated);
        localStorage.setItem(
          "productComparisonSelections",
          JSON.stringify(updated)
        );
      },
      [savedCombinations]
    );

    const toggleProduct = useCallback(
      (productId) => {
        if (isLocked) return;

        setSelectedProducts((prev) => {
          if (prev.includes(productId)) {
            return prev.filter((id) => id !== productId);
          } else if (prev.length < 4) {
            return [...prev, productId];
          }
          return prev;
        });
      },
      [isLocked]
    );

    const removeProduct = useCallback(
      (productId) => {
        if (isLocked) return;
        setSelectedProducts((prev) => prev.filter((id) => id !== productId));
      },
      [isLocked]
    );

    const clearAllProducts = useCallback(() => {
      if (isLocked) return;
      setSelectedProducts([]);
      setIsLocked(false);
    }, [isLocked]);

    const unlockSelection = useCallback(() => {
      setIsLocked(false);
      setIsSelectionOpen(true);
    }, []);

    const toggleChartMinimized = useCallback(() => {
      setIsChartMinimized(!isChartMinimized);
    }, [isChartMinimized]);

    const toggleSelectionPanel = useCallback(() => {
      setIsSelectionOpen(!isSelectionOpen);
    }, [isSelectionOpen]);

    const handleMetricTypeChange = useCallback((e) => {
      setMetricType(e.target.value);
    }, []);

    // Memoized data calculations
    const availableProducts = useMemo(() => {
      const safeProducts = Array.isArray(products) ? products : [];

      return safeProducts
        .filter((product) => getProductTotalSales(product) > 0)
        .sort((a, b) => getProductTotalSales(b) - getProductTotalSales(a))
        .slice(0, 20);
    }, [products]);

    const comparisonData = useMemo(() => {
      if (selectedProducts.length === 0) return [];

      const allDates = new Set();
      const safeProducts = Array.isArray(products) ? products : [];

      selectedProducts.forEach((productId) => {
        const product = safeProducts.find((p) => p.id === productId);
        const comparisonData = getProductComparisonData(product);

        comparisonData?.forEach((day) => {
          if (day && day.date) {
            allDates.add(day.date);
          }
        });
      });

      const datesArray = Array.from(allDates).sort();

      return datesArray.map((date) => {
        const dataPoint = { date };
        selectedProducts.forEach((productId) => {
          const product = safeProducts.find((p) => p.id === productId);
          const productName = getProductName(product);
          const comparisonData = getProductComparisonData(product);
          const dayData = comparisonData?.find((d) => d && d.date === date);

          if (metricType === "sales") {
            dataPoint[productName] = dayData ? dayData.sales || 0 : 0;
          } else {
            dataPoint[productName] = dayData
              ? Math.round((dayData.revenue || 0) * 100) / 100
              : 0;
          }
        });
        return dataPoint;
      });
    }, [selectedProducts, products, metricType]);

    // Memoized chart configuration
    const chartConfig = useMemo(
      () => ({
        margin: {
          top: 20,
          right: 30,
          left: 20,
          bottom: isChartMinimized ? 40 : 60,
        },
        xAxis: {
          tick: { fontSize: isChartMinimized ? 10 : 12 },
          angle: isChartMinimized ? -90 : -45,
          textAnchor: isChartMinimized ? "end" : "end",
          height: isChartMinimized ? 60 : 80,
          interval: isChartMinimized ? "preserveStartEnd" : 0,
        },
        yAxis: {
          tick: { fontSize: isChartMinimized ? 10 : 12 },
        },
        line: {
          strokeWidth: isChartMinimized ? 1.5 : 2,
          dot: isChartMinimized ? false : { r: 3 },
          activeDot: isChartMinimized ? false : { r: 6 },
        },
      }),
      [isChartMinimized]
    );

    // Memoized chart colors
    const chartColors = useMemo(
      () => ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"],
      []
    );

    // Memoized Custom Tooltip
    const CustomTooltip = useCallback(
      ({ active, payload, label }) => {
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
      },
      [metricType]
    );

    // Memoized empty state
    const emptyState = useMemo(
      () => (
        <div className="empty-state">
          <FontAwesomeIcon icon={faChartLine} size="3x" />
          <p>Select products to compare their performance</p>
          <small>Choose up to 4 products from the selection panel</small>
        </div>
      ),
      []
    );

    // Memoized selected products tags
    const selectedProductsTags = useMemo(() => {
      if (selectedProducts.length === 0) return null;

      return (
        <div className="selected-products-tags">
          <div className="tags-header">Currently Comparing:</div>
          <div className="tags-container">
            {selectedProducts.map((productId, index) => {
              const product = Array.isArray(products)
                ? products.find((p) => p.id === productId)
                : null;
              const productName = getProductName(product);

              return (
                <div
                  key={productId}
                  className="product-tag"
                  style={{ borderLeftColor: chartColors[index] }}
                >
                  <span className="product-tag-name">{productName}</span>
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
      );
    }, [selectedProducts, products, chartColors, isLocked, removeProduct]);

    // Memoized product selection grid
    const productSelectionGrid = useMemo(() => {
      if (availableProducts.length === 0) {
        return (
          <div className="no-products-message">
            No product data available for the selected time range.
          </div>
        );
      }

      return availableProducts.map((product) => {
        const productName = getProductName(product);
        const totalSales = getProductTotalSales(product);
        const totalRevenue = getProductTotalRevenue(product);

        return (
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
              <span className="product-name">{productName}</span>
              <span className="product-stats">
                {totalSales} sales • ₱{totalRevenue.toFixed(2)}
              </span>
            </div>
          </div>
        );
      });
    }, [availableProducts, selectedProducts, isLocked, toggleProduct]);

    // Memoized saved combinations
    const savedCombinationsList = useMemo(() => {
      if (savedCombinations.length === 0) return null;

      return (
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
                  {combination.productNames?.slice(0, 2).join(", ") ||
                    "No products"}
                  {combination.productNames?.length > 2 &&
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
      );
    }, [
      savedCombinations,
      selectedProducts,
      loadSavedCombination,
      deleteSavedCombination,
    ]);

    return (
      <div className="product-comparison-chart" ref={containerRef}>
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
              onClick={toggleSelectionPanel}
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
        {savedCombinationsList}

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
                    <button
                      onClick={clearAllProducts}
                      className="clear-all-btn"
                    >
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
                onChange={handleMetricTypeChange}
                className="metric-select"
                disabled={isLocked}
              >
                <option value="sales">Daily Sales (Units)</option>
                <option value="revenue">Daily Revenue (₱)</option>
              </select>
            </div>

            <div className="product-selection-grid">{productSelectionGrid}</div>

            {/* Selected Products Tags */}
            {selectedProductsTags}
          </div>
        )}

        {/* Comparison Chart */}
        <div
          className={`comparison-chart-container ${
            isChartMinimized ? "minimized" : ""
          }`}
        >
          {selectedProducts.length === 0 ? (
            emptyState
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
                key={dimensions.width}
              >
                <LineChart data={comparisonData} margin={chartConfig.margin}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={chartConfig.xAxis.tick}
                    angle={chartConfig.xAxis.angle}
                    textAnchor={chartConfig.xAxis.textAnchor}
                    height={chartConfig.xAxis.height}
                    interval={chartConfig.xAxis.interval}
                  />
                  <YAxis
                    tick={chartConfig.yAxis.tick}
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
                    const product = Array.isArray(products)
                      ? products.find((p) => p.id === productId)
                      : null;
                    const productName = getProductName(product);

                    return (
                      <Line
                        key={productId}
                        type="monotone"
                        dataKey={productName}
                        stroke={chartColors[index]}
                        strokeWidth={chartConfig.line.strokeWidth}
                        dot={chartConfig.line.dot}
                        activeDot={chartConfig.line.activeDot}
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
  },
  (prevProps, nextProps) => {
    // Custom comparison function for memo
    if (prevProps.timeRange !== nextProps.timeRange) {
      return false;
    }

    if (prevProps.products === nextProps.products) {
      return true;
    }

    if (prevProps.products?.length !== nextProps.products?.length) {
      return false;
    }

    // Deep compare products array
    return (
      JSON.stringify(prevProps.products) === JSON.stringify(nextProps.products)
    );
  }
);

ProductComparisonChart.displayName = "ProductComparisonChart";

export default ProductComparisonChart;
