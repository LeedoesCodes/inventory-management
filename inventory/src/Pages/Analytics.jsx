import React, { useState, useEffect, useContext } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { AuthContext } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import Header from "../components/UI/Headers";
import "../styles/analytics.scss";

import RevenueChart from "../components/Analytics/RevenueChart";
import SalesTrendChart from "../components/Analytics/SalesTrendChart";
import ProductPerformance from "../components/Analytics/ProductPerformance";
import DummyDataButton from "../components/Analytics/DummyDataButton";

export default function Analytics() {
  const { isCollapsed } = useSidebar();
  const { user } = useContext(AuthContext);
  const [timeRange, setTimeRange] = useState("all"); // Default to "all" to see all data
  const [analyticsData, setAnalyticsData] = useState({
    revenueData: [],
    salesTrends: [],
    topProducts: [],
    loading: true,
    error: null,
  });

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
        // Convert Firestore Timestamp to Date object
        const createdAt = data.createdAt?.toDate
          ? data.createdAt.toDate()
          : new Date(data.createdAt);

        return {
          id: doc.id,
          ...data,
          createdAt: createdAt,
        };
      });

      console.log("📦 Raw transactions:", transactions.length);
      transactions.forEach((t) =>
        console.log(
          "Order date:",
          t.createdAt,
          "Amount:",
          t.totalAmount || t.total,
          "Items:",
          t.items?.length
        )
      );

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

      console.log("📊 Processed data:", {
        revenueData,
        salesTrends,
        topProducts,
      });

      setAnalyticsData({
        revenueData,
        salesTrends,
        topProducts,
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
        startDate = new Date(0); // Beginning of time
        break;
    }

    return transactions.filter(
      (transaction) => transaction.createdAt >= startDate
    );
  };

  // Process revenue data for charts
  const processRevenueData = (transactions, range) => {
    const filteredTransactions = filterTransactionsByTimeRange(
      transactions,
      range
    );

    console.log(
      `💰 Processing ${filteredTransactions.length} transactions for revenue data`
    );

    // Group by date and calculate daily revenue
    const dailyRevenue = {};

    filteredTransactions.forEach((transaction) => {
      const date = transaction.createdAt.toLocaleDateString("en-CA"); // YYYY-MM-DD format

      // Use totalAmount (Transaction History) or total (Analytics) or fallback to 0
      const revenue = transaction.totalAmount || transaction.total || 0;

      if (!dailyRevenue[date]) {
        dailyRevenue[date] = 0;
      }
      dailyRevenue[date] += revenue;
    });

    // Convert to array format for charts and sort by date
    const result = Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue * 100) / 100, // Round to 2 decimal places
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log("📈 Revenue data result:", result);
    return result;
  };

  // Process sales trends
  const processSalesTrends = (transactions, range) => {
    const filteredTransactions = filterTransactionsByTimeRange(
      transactions,
      range
    );

    console.log(
      `📊 Processing ${filteredTransactions.length} transactions for sales trends`
    );

    // Calculate daily order counts
    const dailyOrders = {};

    filteredTransactions.forEach((transaction) => {
      const date = transaction.createdAt.toLocaleDateString("en-CA"); // YYYY-MM-DD format
      dailyOrders[date] = (dailyOrders[date] || 0) + 1;
    });

    const result = Object.entries(dailyOrders)
      .map(([date, orders]) => ({
        date,
        orders,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log("📊 Sales trends result:", result);
    return result;
  };

  // Process top products
  const processTopProducts = (transactions, products, range) => {
    const filteredTransactions = filterTransactionsByTimeRange(
      transactions,
      range
    );

    console.log(
      `🏆 Processing ${filteredTransactions.length} transactions for top products`
    );

    const productSales = {};

    // Count sales for each product
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

    // Convert to array and sort by sales
    const result = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10); // Top 10 products

    console.log("🏆 Top products result:", result);
    return result;
  };

  // Calculate summary metrics
  const calculateSummaryMetrics = () => {
    const { revenueData, salesTrends, topProducts } = analyticsData;

    const totalRevenue = revenueData.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = salesTrends.reduce((sum, day) => sum + day.orders, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const bestSellingProduct = topProducts[0]?.name || "No data";

    console.log("📋 Summary metrics:", {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      bestSellingProduct,
    });

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      bestSellingProduct,
    };
  };

  // Debug: Check data structure
  useEffect(() => {
    const checkDataStructure = async () => {
      const snapshot = await getDocs(collection(db, "orders"));
      const sampleOrder = snapshot.docs[0]?.data();
      console.log("📋 Sample Order Structure:", sampleOrder);
      console.log("💰 Available revenue fields:", {
        totalAmount: sampleOrder?.totalAmount,
        total: sampleOrder?.total,
        calculated: sampleOrder?.totalAmount || sampleOrder?.total || 0,
      });
    };

    if (!analyticsData.loading && analyticsData.revenueData.length > 0) {
      checkDataStructure();
    }
  }, [analyticsData.loading]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const summaryMetrics = calculateSummaryMetrics();

  if (analyticsData.loading) {
    return (
      <div className={`analytics-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />
        <div className="analytics-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (analyticsData.error) {
    return (
      <div className={`analytics-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />
        <div className="analytics-content">
          <div className="error-state">
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
    <div className={`analytics-page ${isCollapsed ? "collapsed" : ""}`}>
      <Header />

      <div className="analytics-content">
        <div className="analytics-header">
          <div className="header-content">
            <h1>📊 Business Analytics</h1>
            <p>Sales and revenue insights from your transactions</p>

            {/* <DummyDataButton /> */}
          </div>

          <div className="time-range-selector">
            <label htmlFor="time-range">Time Range:</label>
            <select
              id="time-range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Debug info - remove after testing */}
        <div
          style={{
            background: "var(--bg-secondary)",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
            fontSize: "14px",
            color: "var(--text-secondary)",
          }}
        >
          <strong>Debug Info:</strong> Showing{" "}
          {analyticsData.revenueData.length} days of data | Total Orders:{" "}
          {summaryMetrics.totalOrders} | Total Revenue: ₱
          {summaryMetrics.totalRevenue.toLocaleString()}
        </div>

        {/* Summary Metrics */}
        <div className="analytics-card full-width">
          <div className="card-header">
            <h3>📈 Key Performance Indicators</h3>
            <span className="time-range">{timeRange}</span>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">
                ₱{summaryMetrics.totalRevenue.toLocaleString()}
              </div>
              <div className="stat-label">Total Revenue</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{summaryMetrics.totalOrders}</div>
              <div className="stat-label">Total Orders</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                ₱{summaryMetrics.avgOrderValue.toFixed(2)}
              </div>
              <div className="stat-label">Avg Order Value</div>
            </div>
            <div className="stat-card">
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
              <h3>💰 Revenue Over Time</h3>
            </div>
            <RevenueChart data={analyticsData.revenueData} />
          </div>

          {/* Sales Trends */}
          <div className="analytics-card">
            <div className="card-header">
              <h3>📊 Daily Orders</h3>
            </div>
            <SalesTrendChart data={analyticsData.salesTrends} />
          </div>

          {/* Product Performance */}
          <div className="analytics-card">
            <div className="card-header">
              <h3>🏆 Top Products</h3>
            </div>
            <ProductPerformance data={analyticsData.topProducts} />
          </div>
        </div>
      </div>
    </div>
  );
}
