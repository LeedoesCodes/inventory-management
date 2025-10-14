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
  faFilter,
  faChartArea,
} from "@fortawesome/free-solid-svg-icons";

// Chart components
import RevenueChart from "../components/Analytics/RevenueChart";
import SalesTrendChart from "../components/Analytics/SalesTrendChart";
import ProductPerformance from "../components/Analytics/ProductPerformance";
import ProductComparisonChart from "../components/Analytics/ProductComparisonChart";
import DummyDataButton from "../components/Analytics/DummyDataButton";

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

      const transactions = transactionsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate
          ? data.createdAt.toDate()
          : new Date(data.createdAt);

        return {
          id: doc.id,
          ...data,
          createdAt: createdAt,
        };
      });

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
        revenueData,
        salesTrends,
        topProducts,
        allProducts,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setAnalyticsData((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load analytics data",
      }));
    }
  };

  // Process all products for comparison
  const processAllProducts = (transactions, products, range) => {
    const filteredTransactions = filterTransactionsByTimeRange(
      transactions,
      range
    );

    const productPerformance = {};

    // Calculate performance for each product
    filteredTransactions.forEach((transaction) => {
      transaction.items?.forEach((item) => {
        const productId = item.productId || item.id;
        const productName = item.name || item.productName;
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        const date = transaction.createdAt.toLocaleDateString("en-CA");

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
          sales: data.sales,
          revenue: data.revenue,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
    }));
  };

  // Filter transactions by time range
  const filterTransactionsByTimeRange = (transactions, range) => {
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
      (transaction) => transaction.createdAt >= startDate
    );
  };

  const processRevenueData = (transactions, range) => {
    const filteredTransactions = filterTransactionsByTimeRange(
      transactions,
      range
    );

    const dailyRevenue = {};
    filteredTransactions.forEach((transaction) => {
      const date = transaction.createdAt.toLocaleDateString("en-CA");
      const revenue = transaction.totalAmount || transaction.total || 0;

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
  };

  const processSalesTrends = (transactions, range) => {
    const filteredTransactions = filterTransactionsByTimeRange(
      transactions,
      range
    );

    const dailyOrders = {};
    filteredTransactions.forEach((transaction) => {
      const date = transaction.createdAt.toLocaleDateString("en-CA");
      dailyOrders[date] = (dailyOrders[date] || 0) + 1;
    });

    return Object.entries(dailyOrders)
      .map(([date, orders]) => ({
        date,
        orders,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const processTopProducts = (transactions, products, range) => {
    const filteredTransactions = filterTransactionsByTimeRange(
      transactions,
      range
    );

    const productSales = {};
    filteredTransactions.forEach((transaction) => {
      transaction.items?.forEach((item) => {
        const productName = item.name || item.productName;
        const quantity = item.quantity || 1;
        const price = item.price || 0;

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
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
  };

  const calculateSummaryMetrics = () => {
    const { revenueData, salesTrends, topProducts } = analyticsData;

    const totalRevenue = revenueData.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = salesTrends.reduce((sum, day) => sum + day.orders, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const bestSellingProduct = topProducts[0]?.name || "No data";

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      bestSellingProduct,
    };
  };

  // Memoize summary metrics to prevent recalculation on every render
  const summaryMetrics = useMemo(() => {
    return calculateSummaryMetrics();
  }, [analyticsData]);

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
            <RevenueChart data={analyticsData.revenueData} />
          </div>

          {/* Product Comparison Chart */}
          <div className="analytics-card full-width">
            <div className="card-header">
              <span className="chart-subtitle"></span>
            </div>
            <ProductComparisonChart
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
            <SalesTrendChart data={analyticsData.salesTrends} />
          </div>

          {/* Product Performance */}
          <div className="analytics-card">
            <div className="card-header">
              <h3>
                <FontAwesomeIcon icon={faTrophy} className="card-icon" />
                Top Products
              </h3>
            </div>
            <ProductPerformance data={analyticsData.topProducts} />
          </div>
        </div>
      </div>
    </div>
  );
}
