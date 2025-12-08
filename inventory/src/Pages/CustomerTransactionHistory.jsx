// CustomerTransactionHistory.jsx - UPDATED WITH ORDER APPROVAL SYSTEM
import React, { useState, useEffect, useContext } from "react";
import CustomerSidebar from "../components/UI/CustomerSidebar";
import Header from "../components/UI/Headers";
import { useSidebar } from "../context/SidebarContext";
import { AuthContext } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faReceipt,
  faHistory,
  faSearch,
  faClock,
  faBoxOpen,
  faTruck,
  faCheckDouble,
  faTimesCircle,
  faExclamationCircle,
  faCalendar,
  faFilter,
  faUser,
  faCreditCard,
  faStore,
  faPrint,
  faEye,
  faQuestionCircle,
} from "@fortawesome/free-solid-svg-icons";

// Import Firestore
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../Firebase/firebase";

import "../styles/CustomerTransactionHistory.scss";

// Order status definitions
const ORDER_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  READY: "ready",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

export default function CustomerTransactionHistory() {
  const { isCollapsed } = useSidebar();
  const { currentUser } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dateFilter, setDateFilter] = useState("all");
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
    processingOrders: 0,
    readyOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  });

  // Fetch only the current customer's orders
  useEffect(() => {
    const fetchCustomerOrders = async () => {
      if (!currentUser?.email) return;

      try {
        setLoading(true);

        // Query orders for this specific customer by email
        const ordersQuery = query(
          collection(db, "orders"),
          where("customerEmail", "==", currentUser.email)
        );

        const querySnapshot = await getDocs(ordersQuery);
        const ordersData = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          ordersData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate()
              : new Date(data.createdAt),
          });
        });

        // Sort by date, newest first
        ordersData.sort((a, b) => b.createdAt - a.createdAt);

        setOrders(ordersData);

        // Calculate statistics
        calculateStatistics(ordersData);
      } catch (error) {
        console.error("Error fetching customer orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerOrders();
  }, [currentUser]);

  // Calculate statistics
  const calculateStatistics = (ordersData) => {
    let totalSpent = 0;
    let statusCounts = {
      pending: 0,
      processing: 0,
      ready: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    ordersData.forEach((order) => {
      // Add to total spent if order is delivered
      if (order.status === ORDER_STATUS.DELIVERED && order.totalAmount) {
        totalSpent += order.totalAmount;
      }

      // Count orders by status
      if (order.status in statusCounts) {
        statusCounts[order.status]++;
      }
    });

    setStats({
      totalOrders: ordersData.length,
      totalSpent,
      pendingOrders: statusCounts.pending,
      processingOrders: statusCounts.processing,
      readyOrders: statusCounts.ready,
      shippedOrders: statusCounts.shipped,
      deliveredOrders: statusCounts.delivered,
      cancelledOrders: statusCounts.cancelled,
    });
  };

  // Apply filters
  const filteredOrders = orders.filter((order) => {
    // Apply status filter
    if (filterStatus !== "all") {
      if (
        filterStatus === ORDER_STATUS.PENDING &&
        order.status !== ORDER_STATUS.PENDING
      )
        return false;
      if (
        filterStatus === ORDER_STATUS.PROCESSING &&
        order.status !== ORDER_STATUS.PROCESSING
      )
        return false;
      if (
        filterStatus === ORDER_STATUS.READY &&
        order.status !== ORDER_STATUS.READY
      )
        return false;
      if (
        filterStatus === ORDER_STATUS.SHIPPED &&
        order.status !== ORDER_STATUS.SHIPPED
      )
        return false;
      if (
        filterStatus === ORDER_STATUS.DELIVERED &&
        order.status !== ORDER_STATUS.DELIVERED
      )
        return false;
      if (
        filterStatus === ORDER_STATUS.CANCELLED &&
        order.status !== ORDER_STATUS.CANCELLED
      )
        return false;
      if (filterStatus === "paid" && order.paymentStatus !== "paid")
        return false;
      if (
        filterStatus === "unpaid" &&
        (order.paymentStatus === "paid" || order.paymentMethod !== "credit")
      )
        return false;
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const orderDate = order.createdAt;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      switch (dateFilter) {
        case "today":
          return orderDate >= today;
        case "yesterday":
          return orderDate >= yesterday && orderDate < today;
        case "week":
          return orderDate >= weekAgo;
        case "month":
          return orderDate >= monthAgo;
        default:
          return true;
      }
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.id?.toLowerCase().includes(searchLower) ||
        order.customerName?.toLowerCase().includes(searchLower) ||
        order.paymentMethod?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "N/A";

    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return "badge-pending";
      case ORDER_STATUS.PROCESSING:
        return "badge-processing";
      case ORDER_STATUS.READY:
        return "badge-ready";
      case ORDER_STATUS.SHIPPED:
        return "badge-shipped";
      case ORDER_STATUS.DELIVERED:
        return "badge-delivered";
      case ORDER_STATUS.CANCELLED:
        return "badge-cancelled";
      default:
        return "badge-default";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return faClock;
      case ORDER_STATUS.PROCESSING:
        return faClock;
      case ORDER_STATUS.READY:
        return faBoxOpen;
      case ORDER_STATUS.SHIPPED:
        return faTruck;
      case ORDER_STATUS.DELIVERED:
        return faCheckDouble;
      case ORDER_STATUS.CANCELLED:
        return faTimesCircle;
      default:
        return faQuestionCircle;
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return "Pending Approval";
      case ORDER_STATUS.PROCESSING:
        return "Processing";
      case ORDER_STATUS.READY:
        return "Ready for Pickup";
      case ORDER_STATUS.SHIPPED:
        return "Shipped";
      case ORDER_STATUS.DELIVERED:
        return "Delivered";
      case ORDER_STATUS.CANCELLED:
        return "Cancelled";
      default:
        return status;
    }
  };

  // Get status description
  const getStatusDescription = (status, order) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return "Your order is waiting for approval from our team.";
      case ORDER_STATUS.PROCESSING:
        return "Your order has been approved and is being prepared.";
      case ORDER_STATUS.READY:
        if (order.deliveryMethod === "pickup") {
          return "Your order is ready for pickup at our store.";
        } else {
          return "Your order is ready and will be shipped soon.";
        }
      case ORDER_STATUS.SHIPPED:
        return "Your order is on its way to you!";
      case ORDER_STATUS.DELIVERED:
        return "Your order has been delivered. Thank you for shopping with us!";
      case ORDER_STATUS.CANCELLED:
        return "This order has been cancelled.";
      default:
        return "";
    }
  };

  // Get estimated time for status
  const getEstimatedTime = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return "Usually approved within 24 hours";
      case ORDER_STATUS.PROCESSING:
        return "1-2 business days";
      case ORDER_STATUS.READY:
        return "Ready now";
      case ORDER_STATUS.SHIPPED:
        return "1-3 business days";
      case ORDER_STATUS.DELIVERED:
        return "Completed";
      default:
        return "";
    }
  };

  // Print receipt function
  const printReceipt = (order) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - Order #${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .receipt { max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .info { margin-bottom: 20px; }
            .items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items th { border-bottom: 1px solid #000; padding: 8px; text-align: left; }
            .items td { padding: 8px; border-bottom: 1px solid #ddd; }
            .total { text-align: right; font-weight: bold; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            .status-badge {
              padding: 5px 10px;
              border-radius: 15px;
              font-size: 0.9em;
              font-weight: 500;
              display: inline-block;
              margin-top: 5px;
            }
            .status-pending { background: #fff3cd; color: #856404; }
            .status-processing { background: #cce5ff; color: #004085; }
            .status-ready { background: #d4edda; color: #155724; }
            .status-shipped { background: #d1ecf1; color: #0c5460; }
            .status-delivered { background: #d4edda; color: #155724; }
            .status-cancelled { background: #f8d7da; color: #721c24; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>ORDER RECEIPT</h2>
              <p>Order #${order.id}</p>
              <p>Date: ${formatDate(order.createdAt)}</p>
              <span class="status-badge status-${order.status}">
                ${getStatusText(order.status)}
              </span>
            </div>
            
            <div class="info">
              <p><strong>Customer:</strong> ${order.customerName}</p>
              <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
              <p><strong>Status:</strong> ${getStatusText(order.status)}</p>
              ${
                order.deliveryMethod
                  ? `<p><strong>Delivery:</strong> ${
                      order.deliveryMethod === "delivery"
                        ? "Delivery"
                        : "Pickup"
                    }</p>`
                  : ""
              }
            </div>
            
            <table class="items">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${
                  order.items
                    ?.map(
                      (item) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₱${item.price?.toFixed(2)}</td>
                    <td>₱${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `
                    )
                    .join("") || ""
                }
              </tbody>
            </table>
            
            <div class="total">
              <p>Total Items: ${order.totalItems || 0}</p>
              <p>Total Amount: ₱${order.totalAmount?.toFixed(2) || "0.00"}</p>
              ${
                order.paymentMethod === "credit"
                  ? `
                <p>Paid: ₱${order.paidAmount?.toFixed(2) || "0.00"}</p>
                <p>Remaining: ₱${
                  order.remainingBalance?.toFixed(2) || "0.00"
                }</p>
              `
                  : ""
              }
            </div>
            
            <div class="footer">
              <p>Thank you for your order!</p>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  // Calculate order summary
  const calculateOrderSummary = (order) => {
    const items = order.items || [];
    const itemCount = items.length;
    const totalItems = items.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );

    return {
      itemCount,
      totalItems,
    };
  };

  // Get status progress percentage
  const getStatusProgress = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return 20;
      case ORDER_STATUS.PROCESSING:
        return 40;
      case ORDER_STATUS.READY:
        return 60;
      case ORDER_STATUS.SHIPPED:
        return 80;
      case ORDER_STATUS.DELIVERED:
        return 100;
      case ORDER_STATUS.CANCELLED:
        return 0;
      default:
        return 0;
    }
  };

  // Get next expected status
  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case ORDER_STATUS.PENDING:
        return "Processing";
      case ORDER_STATUS.PROCESSING:
        return "Ready";
      case ORDER_STATUS.READY:
        return currentUser.deliveryMethod === "delivery"
          ? "Shipped"
          : "Delivered";
      case ORDER_STATUS.SHIPPED:
        return "Delivered";
      default:
        return "";
    }
  };

  return (
    <div className="page-container">
      <CustomerSidebar />
      <div
        className={`customer-transactions-page ${
          isCollapsed ? "collapsed" : ""
        }`}
      >
        <Header />

        <div className="transactions-content">
          <div className="page-header">
            <h1>My Orders</h1>
            <p>Track your order history and status</p>
          </div>

          {/* Customer Statistics */}
          <div className="customer-stats">
            <div className="stat-card total-orders">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faReceipt} />
              </div>
              <div className="stat-info">
                <h3>Total Orders</h3>
                <p className="stat-number">{stats.totalOrders}</p>
              </div>
            </div>

            <div className="stat-card total-spent">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faCreditCard} />
              </div>
              <div className="stat-info">
                <h3>Total Spent</h3>
                <p className="stat-number">₱{stats.totalSpent.toFixed(2)}</p>
              </div>
            </div>

            <div className="stat-card pending-orders">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <div className="stat-info">
                <h3>Pending</h3>
                <p className="stat-number">{stats.pendingOrders}</p>
              </div>
            </div>

            <div className="stat-card processing-orders">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <div className="stat-info">
                <h3>Processing</h3>
                <p className="stat-number">{stats.processingOrders}</p>
              </div>
            </div>

            <div className="stat-card ready-orders">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faBoxOpen} />
              </div>
              <div className="stat-info">
                <h3>Ready</h3>
                <p className="stat-number">{stats.readyOrders}</p>
              </div>
            </div>

            <div className="stat-card delivered-orders">
              <div className="stat-icon">
                <FontAwesomeIcon icon={faCheckDouble} />
              </div>
              <div className="stat-info">
                <h3>Delivered</h3>
                <p className="stat-number">{stats.deliveredOrders}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="customer-filters">
            <div className="search-box">
              <FontAwesomeIcon icon={faSearch} />
              <input
                type="text"
                placeholder="Search orders by ID or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <div className="filter-item">
                <FontAwesomeIcon icon={faFilter} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value={ORDER_STATUS.PENDING}>Pending Approval</option>
                  <option value={ORDER_STATUS.PROCESSING}>Processing</option>
                  <option value={ORDER_STATUS.READY}>Ready</option>
                  <option value={ORDER_STATUS.SHIPPED}>Shipped</option>
                  <option value={ORDER_STATUS.DELIVERED}>Delivered</option>
                  <option value={ORDER_STATUS.CANCELLED}>Cancelled</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>

              <div className="filter-item">
                <FontAwesomeIcon icon={faCalendar} />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="orders-list">
            {loading ? (
              <div className="loading">
                <p>Loading your orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="no-orders">
                <FontAwesomeIcon icon={faReceipt} size="3x" />
                <p>No orders found matching your criteria</p>
                {(searchTerm ||
                  filterStatus !== "all" ||
                  dateFilter !== "all") && (
                  <button
                    className="clear-filters"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterStatus("all");
                      setDateFilter("all");
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              filteredOrders.map((order) => {
                const summary = calculateOrderSummary(order);
                const progress = getStatusProgress(order.status);
                const nextStatus = getNextStatus(order.status);

                return (
                  <div
                    key={order.id}
                    className={`order-card ${
                      selectedOrder?.id === order.id ? "selected" : ""
                    } status-${order.status}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="order-header">
                      <div className="order-id">
                        <div className="order-id-number">
                          <FontAwesomeIcon icon={faReceipt} />
                          <strong>Order #{order.id.substring(0, 8)}</strong>
                        </div>
                        <span
                          className={`status-badge ${getStatusBadgeClass(
                            order.status
                          )}`}
                        >
                          <FontAwesomeIcon icon={getStatusIcon(order.status)} />
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <div className="order-date">
                        <FontAwesomeIcon icon={faCalendar} />
                        {formatDate(order.createdAt)}
                      </div>
                    </div>

                    <div className="order-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="progress-labels">
                        <span className="current-status">
                          {getStatusText(order.status)}
                        </span>
                        {nextStatus && (
                          <span className="next-status">
                            Next: {nextStatus}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="order-details">
                      <div className="order-summary">
                        <div className="summary-item">
                          <FontAwesomeIcon icon={faBoxOpen} />
                          <div>
                            <span>Items:</span>
                            <strong>
                              {summary.itemCount} ({summary.totalItems} pcs)
                            </strong>
                          </div>
                        </div>
                        <div className="summary-item">
                          <FontAwesomeIcon icon={faCreditCard} />
                          <div>
                            <span>Total:</span>
                            <strong className="order-total">
                              ₱{order.totalAmount?.toFixed(2)}
                            </strong>
                          </div>
                        </div>
                        <div className="summary-item">
                          <FontAwesomeIcon
                            icon={
                              order.deliveryMethod === "delivery"
                                ? faTruck
                                : faStore
                            }
                          />
                          <div>
                            <span>Delivery:</span>
                            <strong
                              className={`delivery-method ${order.deliveryMethod}`}
                            >
                              {order.deliveryMethod === "delivery"
                                ? "Delivery"
                                : "Pickup"}
                            </strong>
                          </div>
                        </div>
                        <div className="summary-item">
                          <FontAwesomeIcon icon={faCreditCard} />
                          <div>
                            <span>Payment:</span>
                            <strong
                              className={`payment-method ${order.paymentMethod}`}
                            >
                              {order.paymentMethod?.charAt(0).toUpperCase() +
                                order.paymentMethod?.slice(1)}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {order.paymentMethod === "credit" && (
                        <div className="credit-info">
                          <div className="balance-info">
                            <span>
                              <strong>Paid:</strong> ₱
                              {order.paidAmount?.toFixed(2) || "0.00"}
                            </span>
                            <span>
                              <strong>Remaining:</strong> ₱
                              {order.remainingBalance?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="order-status-info">
                      <div className="status-description">
                        <FontAwesomeIcon icon={faInfoCircle} />
                        <span>{getStatusDescription(order.status, order)}</span>
                      </div>
                      {getEstimatedTime(order.status) && (
                        <div className="estimated-time">
                          <FontAwesomeIcon icon={faClock} />
                          <span>
                            Estimated: {getEstimatedTime(order.status)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="order-actions">
                      <button
                        className="view-details-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                      >
                        <FontAwesomeIcon icon={faEye} />
                        View Details
                      </button>
                      <button
                        className="print-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          printReceipt(order);
                        }}
                      >
                        <FontAwesomeIcon icon={faPrint} />
                        Print Receipt
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FontAwesomeIcon icon={faReceipt} />
                Order Details
              </h2>
              <button
                className="close-btn"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="order-info-grid">
                <div className="info-section">
                  <h3>
                    <FontAwesomeIcon icon={faUser} />
                    Customer Information
                  </h3>
                  <div className="info-item">
                    <span>Name:</span>
                    <strong>{selectedOrder.customerName}</strong>
                  </div>
                  {selectedOrder.customerEmail && (
                    <div className="info-item">
                      <span>Email:</span>
                      <span>{selectedOrder.customerEmail}</span>
                    </div>
                  )}
                  {selectedOrder.customerPhone && (
                    <div className="info-item">
                      <span>Phone:</span>
                      <span>{selectedOrder.customerPhone}</span>
                    </div>
                  )}
                  {selectedOrder.customerAddress && (
                    <div className="info-item">
                      <span>Address:</span>
                      <span>{selectedOrder.customerAddress}</span>
                    </div>
                  )}
                </div>

                <div className="info-section">
                  <h3>
                    <FontAwesomeIcon icon={faReceipt} />
                    Order Information
                  </h3>
                  <div className="info-item">
                    <span>Order ID:</span>
                    <span>{selectedOrder.id}</span>
                  </div>
                  <div className="info-item">
                    <span>Date Placed:</span>
                    <span>{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  <div className="info-item">
                    <span>Status:</span>
                    <span
                      className={`status-badge ${getStatusBadgeClass(
                        selectedOrder.status
                      )}`}
                    >
                      <FontAwesomeIcon
                        icon={getStatusIcon(selectedOrder.status)}
                      />
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span>Delivery Method:</span>
                    <span
                      className={`delivery-method ${selectedOrder.deliveryMethod}`}
                    >
                      <FontAwesomeIcon
                        icon={
                          selectedOrder.deliveryMethod === "delivery"
                            ? faTruck
                            : faStore
                        }
                      />
                      {selectedOrder.deliveryMethod === "delivery"
                        ? "Delivery"
                        : "Pickup"}
                    </span>
                  </div>
                  <div className="info-item">
                    <span>Payment Method:</span>
                    <span
                      className={`payment-method ${selectedOrder.paymentMethod}`}
                    >
                      {selectedOrder.paymentMethod === "credit"
                        ? "Credit"
                        : "Cash"}
                    </span>
                  </div>
                  <div className="info-item">
                    <span>Payment Status:</span>
                    <span
                      className={`payment-status ${selectedOrder.paymentStatus}`}
                    >
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="order-items-section">
                <h3>
                  <FontAwesomeIcon icon={faBoxOpen} />
                  Order Items
                </h3>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>₱{item.price?.toFixed(2)}</td>
                        <td>₱{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3">
                        <strong>Total Items</strong>
                      </td>
                      <td>
                        <strong>{selectedOrder.totalItems || 0}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="3">
                        <strong>Total Amount</strong>
                      </td>
                      <td>
                        <strong className="total-amount">
                          ₱{selectedOrder.totalAmount?.toFixed(2) || "0.00"}
                        </strong>
                      </td>
                    </tr>
                    {selectedOrder.paymentMethod === "credit" && (
                      <>
                        <tr>
                          <td colSpan="3">Paid Amount</td>
                          <td>
                            ₱{selectedOrder.paidAmount?.toFixed(2) || "0.00"}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="3">Remaining Balance</td>
                          <td className="remaining-balance">
                            ₱
                            {selectedOrder.remainingBalance?.toFixed(2) ||
                              "0.00"}
                          </td>
                        </tr>
                      </>
                    )}
                  </tfoot>
                </table>
              </div>

              {/* Status History */}
              {selectedOrder.statusHistory &&
                selectedOrder.statusHistory.length > 0 && (
                  <div className="status-history">
                    <h3>
                      <FontAwesomeIcon icon={faHistory} />
                      Status History
                    </h3>
                    <div className="timeline">
                      {selectedOrder.statusHistory.map((history, index) => (
                        <div key={index} className="timeline-item">
                          <div className="timeline-marker"></div>
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <span
                                className={`status ${getStatusBadgeClass(
                                  history.status
                                )}`}
                              >
                                {getStatusText(history.status)}
                              </span>
                              <span className="time">
                                {formatDate(history.timestamp)}
                              </span>
                            </div>
                            {history.note && (
                              <p className="timeline-note">{history.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Order Notes */}
              {selectedOrder.orderNotes && (
                <div className="order-notes">
                  <h3>
                    <FontAwesomeIcon icon={faReceipt} />
                    Order Notes
                  </h3>
                  <p>{selectedOrder.orderNotes}</p>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="print-receipt-btn"
                  onClick={() => {
                    printReceipt(selectedOrder);
                    setSelectedOrder(null);
                  }}
                >
                  <FontAwesomeIcon icon={faPrint} />
                  Print Receipt
                </button>
                <button
                  className="close-modal-btn"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
