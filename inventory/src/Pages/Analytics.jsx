import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { AuthContext } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import Header from "../components/UI/Headers";
import "../styles/analytics.scss";

// Custom hooks
import { useDebounce } from "../hooks/useDebounce";

// FontAwesome imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartBar,
  faChartLine,
  faChartPie,
  faTrophy,
  faDollarSign,
  faShoppingCart,
  faReceipt,
  faCrown,
  faSpinner,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

// Chart components
import RevenueChart from "../components/Analytics/RevenueChart";
import SalesTrendChart from "../components/Analytics/SalesTrendChart";
import ProductPerformance from "../components/Analytics/ProductPerformance";
import ProductComparisonChart from "../components/Analytics/ProductComparisonChart";

// Error Boundary for Chart Components
class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Chart Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="chart-error"
          style={{
            padding: "40px 20px",
            textAlign: "center",
            background: "#f8f9fa",
            borderRadius: "8px",
            border: "1px dashed #dee2e6",
            color: "#6c757d",
          }}
        >
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            size="2x"
            style={{ color: "#6c757d", marginBottom: "15px", opacity: 0.5 }}
          />
          <h4 style={{ margin: "10px 0", color: "#495057" }}>
            {this.props.chartName} Unavailable
          </h4>
          <p style={{ margin: "0 0 15px 0" }}>
            This chart failed to load due to a technical issue.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: "8px 16px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Safe chart wrapper components
const SafeRevenueChart = ({ data }) => (
  <ChartErrorBoundary chartName="Revenue Chart">
    <RevenueChart data={data || []} />
  </ChartErrorBoundary>
);

const SafeProductComparisonChart = ({ products, timeRange }) => (
  <ChartErrorBoundary chartName="Product Comparison Chart">
    <ProductComparisonChart products={products || []} timeRange={timeRange} />
  </ChartErrorBoundary>
);

const SafeSalesTrendChart = ({ data }) => (
  <ChartErrorBoundary chartName="Sales Trends Chart">
    <SalesTrendChart data={data || []} />
  </ChartErrorBoundary>
);

const SafeProductPerformance = ({ data }) => (
  <ChartErrorBoundary chartName="Product Performance Chart">
    <ProductPerformance data={data || []} />
  </ChartErrorBoundary>
);

// Safe data accessor functions
const getItemName = (item) => {
  if (!item || typeof item !== "object") return "Unknown Product";
  return item.name || item.productName || "Unknown Product";
};

const getItemQuantity = (item) => {
  if (!item || typeof item !== "object") return 1;
  return typeof item.quantity === "number" ? item.quantity : 1;
};

const getItemPrice = (item) => {
  if (!item || typeof item !== "object") return 0;
  return typeof item.price === "number" ? item.price : 0;
};

const getItemProductId = (item) => {
  if (!item || typeof item !== "object") return "unknown";
  return item.id || item.productId || "unknown";
};

const getTransactionTotal = (transaction) => {
  if (!transaction || typeof transaction !== "object") return 0;
  return typeof transaction.totalAmount === "number"
    ? transaction.totalAmount
    : 0;
};

const getTransactionDate = (transaction) => {
  if (!transaction || !transaction.createdAt) return new Date();

  try {
    if (transaction.createdAt?.toDate) {
      return transaction.createdAt.toDate();
    }
    if (transaction.createdAt instanceof Date) {
      return transaction.createdAt;
    }
    return new Date(transaction.createdAt);
  } catch (error) {
    console.error("Error parsing transaction date:", error);
    return new Date();
  }
};

const safeArray = (array) => {
  return Array.isArray(array) ? array : [];
};

export default function Analytics() {
  const { isCollapsed } = useSidebar();
  const { user } = useContext(AuthContext);
  const [timeRange, setTimeRange] = useState("all");

  // Debounce sidebar collapse to prevent excessive re-renders
  const debouncedIsCollapsed = useDebounce(isCollapsed, 300);

  const [analyticsData, setAnalyticsData] = useState({
    revenueData: [],
    salesTrends: [],
    topProducts: [],
    allProducts: [],
    loading: true,
    error: null,
  });

  // Memoized time range handler
  const handleTimeRangeChange = useCallback((e) => {
    setTimeRange(e.target.value);
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsData((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch transactions (orders)
      const transactionsQuery = query(
        collection(db, "orders"),
        orderBy("createdAt", "desc")
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);

      const transactions = transactionsSnapshot.docs
        .map((doc) => {
          try {
            const data = doc.data();
            const createdAt = getTransactionDate(data);

            return {
              id: doc.id,
              ...data,
              createdAt: createdAt,
              // Ensure items is always an array
              items: safeArray(data.items),
            };
          } catch (error) {
            console.error("Error processing transaction:", doc.id, error);
            return null;
          }
        })
        .filter((transaction) => transaction !== null); // Remove null transactions

      // Fetch products for product performance
      const productsSnapshot = await getDocs(collection(db, "products"));
      const products = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Process the data with time range filtering
      const revenueData = processRevenueData(transactions, timeRange);
      const salesTrends = processSalesTrends(transactions, timeRange);
      const topProducts = processTopProducts(transactions, products, timeRange);
      const allProducts = processAllProducts(transactions, products, timeRange);

      setAnalyticsData({
        revenueData: revenueData || [],
        salesTrends: salesTrends || [],
        topProducts: topProducts || [],
        allProducts: allProducts || [],
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setAnalyticsData((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load analytics data",
        revenueData: [],
        salesTrends: [],
        topProducts: [],
        allProducts: [],
      }));
    }
  };

  // Process all products for comparison
  const processAllProducts = (transactions, products, range) => {
    try {
      const filteredTransactions = filterTransactionsByTimeRange(
        transactions,
        range
      );

      // Create a Set of current product names for quick lookup
      const currentProductNames = new Set(
        products.map((product) => getItemName(product))
      );

      const productPerformance = {};

      // Calculate performance for each product
      filteredTransactions.forEach((transaction) => {
        const items = safeArray(transaction?.items);

        items.forEach((item) => {
          if (!item || typeof item !== "object") return;

          const productId = getItemProductId(item);
          const productName = getItemName(item);

          // Skip if product doesn't exist in current catalog
          if (!currentProductNames.has(productName)) {
            return;
          }

          const quantity = getItemQuantity(item);
          const price = getItemPrice(item);
          const date =
            getTransactionDate(transaction).toLocaleDateString("en-CA");

          if (!productPerformance[productId]) {
            productPerformance[productId] = {
              id: productId,
              name: productName,
              dailySales: {},
              totalSales: 0,
              totalRevenue: 0,
            };
          }

          // Track daily sales
          if (!productPerformance[productId].dailySales[date]) {
            productPerformance[productId].dailySales[date] = {
              sales: 0,
              revenue: 0,
            };
          }

          productPerformance[productId].dailySales[date].sales += quantity;
          productPerformance[productId].dailySales[date].revenue +=
            price * quantity;
          productPerformance[productId].totalSales += quantity;
          productPerformance[productId].totalRevenue += price * quantity;
        });
      });

      // Convert to array format
      return Object.values(productPerformance).map((product) => ({
        ...product,
        // Format data for comparison chart
        comparisonData: Object.entries(product.dailySales)
          .map(([date, data]) => ({
            date,
            sales: data?.sales || 0,
            revenue: data?.revenue || 0,
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date)),
      }));
    } catch (error) {
      console.error("Error in processAllProducts:", error);
      return [];
    }
  };

  // Filter transactions by time range
  const filterTransactionsByTimeRange = (transactions, range) => {
    try {
      const now = new Date();
      let startDate;

      switch (range) {
        case "7days":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30days":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90days":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "1year":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case "all":
        default:
          startDate = new Date(0);
          break;
      }

      return transactions.filter(
        (transaction) =>
          transaction && getTransactionDate(transaction) >= startDate
      );
    } catch (error) {
      console.error("Error in filterTransactionsByTimeRange:", error);
      return [];
    }
  };

  const processRevenueData = (transactions, range) => {
    try {
      const filteredTransactions = filterTransactionsByTimeRange(
        transactions,
        range
      );

      const dailyRevenue = {};
      filteredTransactions.forEach((transaction) => {
        if (!transaction) return;
        const date =
          getTransactionDate(transaction).toLocaleDateString("en-CA");
        const revenue = getTransactionTotal(transaction);

        if (!dailyRevenue[date]) {
          dailyRevenue[date] = 0;
        }
        dailyRevenue[date] += revenue;
      });

      return Object.entries(dailyRevenue)
        .map(([date, revenue]) => ({
          date,
          revenue: Math.round(revenue * 100) / 100,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
      console.error("Error in processRevenueData:", error);
      return [];
    }
  };

  const processSalesTrends = (transactions, range) => {
    try {
      const filteredTransactions = filterTransactionsByTimeRange(
        transactions,
        range
      );

      const dailyOrders = {};
      filteredTransactions.forEach((transaction) => {
        if (!transaction) return;
        const date =
          getTransactionDate(transaction).toLocaleDateString("en-CA");
        dailyOrders[date] = (dailyOrders[date] || 0) + 1;
      });

      return Object.entries(dailyOrders)
        .map(([date, orders]) => ({
          date,
          orders,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
      console.error("Error in processSalesTrends:", error);
      return [];
    }
  };

  const processTopProducts = (transactions, products, range) => {
    try {
      const filteredTransactions = filterTransactionsByTimeRange(
        transactions,
        range
      );

      // Create a Set of current product names for quick lookup
      const currentProductNames = new Set(
        products.map((product) => getItemName(product))
      );

      const productSales = {};
      filteredTransactions.forEach((transaction) => {
        const items = safeArray(transaction?.items);
        items.forEach((item) => {
          if (!item || typeof item !== "object") return;

          const productName = getItemName(item);

          // Skip if product doesn't exist in current catalog
          if (!currentProductNames.has(productName)) {
            return;
          }

          const quantity = getItemQuantity(item);
          const price = getItemPrice(item);

          if (!productSales[productName]) {
            productSales[productName] = {
              name: productName,
              sales: 0,
              revenue: 0,
            };
          }

          productSales[productName].sales += quantity;
          productSales[productName].revenue += price * quantity;
        });
      });

      return Object.values(productSales)
        .sort((a, b) => (b.sales || 0) - (a.sales || 0))
        .slice(0, 10);
    } catch (error) {
      console.error("Error in processTopProducts:", error);
      return [];
    }
  };

  const calculateSummaryMetrics = () => {
    try {
      const { revenueData, salesTrends, topProducts } = analyticsData;

      const safeRevenueData = safeArray(revenueData);
      const safeSalesTrends = safeArray(salesTrends);
      const safeTopProducts = safeArray(topProducts);

      const totalRevenue = safeRevenueData.reduce(
        (sum, day) => sum + (day.revenue || 0),
        0
      );
      const totalOrders = safeSalesTrends.reduce(
        (sum, day) => sum + (day.orders || 0),
        0
      );
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // FIXED: Safe access to best selling product
      const bestSellingProduct =
        safeTopProducts.length > 0 && safeTopProducts[0]?.name
          ? safeTopProducts[0].name
          : "No data";

      return {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        bestSellingProduct,
      };
    } catch (error) {
      console.error("Error in calculateSummaryMetrics:", error);
      return {
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        bestSellingProduct: "No data",
      };
    }
  };

  // Memoize summary metrics to prevent recalculation on every render
  const summaryMetrics = useMemo(() => {
    return calculateSummaryMetrics();
  }, [
    analyticsData.revenueData,
    analyticsData.salesTrends,
    analyticsData.topProducts,
  ]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  // Loading state
  if (analyticsData.loading) {
    return (
      <div
        className={`analytics-page ${debouncedIsCollapsed ? "collapsed" : ""}`}
      >
        <Header />
        <div className="analytics-content">
          <div className="loading-state">
            <FontAwesomeIcon
              icon={faSpinner}
              className="loading-spinner"
              spin
            />
            <p>Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (analyticsData.error) {
    return (
      <div
        className={`analytics-page ${debouncedIsCollapsed ? "collapsed" : ""}`}
      >
        <Header />
        <div className="analytics-content">
          <div className="error-state">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="error-icon"
            />
            <p>{analyticsData.error}</p>
            <button onClick={fetchAnalyticsData} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`analytics-page ${debouncedIsCollapsed ? "collapsed" : ""}`}
    >
      <Header />

      <div className="analytics-content">
        <div className="analytics-header">
          <div className="header-content">
            <h1>
              <FontAwesomeIcon icon={faChartBar} className="header-icon" />
              Business Analytics
            </h1>
            <p>Sales and revenue insights from your transactions</p>
          </div>

          <div className="time-range-selector">
            <label htmlFor="time-range">Time Range:</label>
            <select
              id="time-range"
              value={timeRange}
              onChange={handleTimeRangeChange}
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="analytics-card full-width">
          <div className="card-header">
            <h3>
              <FontAwesomeIcon icon={faChartLine} className="card-icon" />
              Key Performance Indicators
            </h3>
            <span className="time-range">{timeRange}</span>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faDollarSign} />
              </div>
              <div className="stat-value">
                ₱{summaryMetrics.totalRevenue.toLocaleString()}
              </div>
              <div className="stat-label">Total Revenue</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faShoppingCart} />
              </div>
              <div className="stat-value">{summaryMetrics.totalOrders}</div>
              <div className="stat-label">Total Orders</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faReceipt} />
              </div>
              <div className="stat-value">
                ₱{summaryMetrics.avgOrderValue.toFixed(2)}
              </div>
              <div className="stat-label">Avg Order Value</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faCrown} />
              </div>
              <div className="stat-value" style={{ fontSize: "1.1rem" }}>
                {summaryMetrics.bestSellingProduct}
              </div>
              <div className="stat-label">Best Selling Product</div>
            </div>
          </div>
        </div>

        <div className="analytics-grid">
          {/* Revenue Chart */}
          <div className="analytics-card full-width">
            <div className="card-header">
              <h3>
                <FontAwesomeIcon icon={faDollarSign} className="card-icon" />
                Revenue Over Time
              </h3>
            </div>
            <SafeRevenueChart data={analyticsData.revenueData} />
          </div>

          {/* Product Comparison Chart */}
          <div className="analytics-card full-width">
            <div className="card-header">
              <h3>
                <FontAwesomeIcon icon={faChartBar} className="card-icon" />
                Product Performance Comparison
              </h3>
            </div>
            <SafeProductComparisonChart
              products={analyticsData.allProducts}
              timeRange={timeRange}
            />
          </div>

          {/* Sales Trends */}
          <div className="analytics-card">
            <div className="card-header">
              <h3>
                <FontAwesomeIcon icon={faChartPie} className="card-icon" />
                Daily Orders
              </h3>
            </div>
            <SafeSalesTrendChart data={analyticsData.salesTrends} />
          </div>

          {/* Product Performance */}
          <div className="analytics-card">
            <div className="card-header">
              <h3>
                <FontAwesomeIcon icon={faTrophy} className="card-icon" />
                Top Products
              </h3>
            </div>
            <SafeProductPerformance data={analyticsData.topProducts} />
          </div>
        </div>
      </div>
    </div>
  );
}
