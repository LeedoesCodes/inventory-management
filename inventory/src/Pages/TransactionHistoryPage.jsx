import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../components/UI/Sidebar";
import Header from "../components/UI/Headers";
import { useSidebar } from "../context/SidebarContext";
import { useLocation } from "react-router-dom";

// Import TransactionHistory Components
import StatisticsCards from "../components/TransactionHistory/Components/StatisticsCards";
import ControlsBar from "../components/TransactionHistory/Components/ControlsBar";
import TransactionList from "../components/TransactionHistory/Components/TransactionList";

// Import Modals
import OrderDetailsModal from "../components/TransactionHistory/Modals/OrderDetailsModal";
import PaymentModal from "../components/TransactionHistory/Modals/PaymentModal";
import BadOrderModal from "../components/TransactionHistory/Modals/BadOrderModal";
import CancelOrderModal from "../components/TransactionHistory/Modals/CancelOrderModal";
import DeleteOrderModal from "../components/TransactionHistory/Modals/DeleteOrderModal";
import MarkAsPaidModal from "../components/TransactionHistory/Modals/MarkAsPaidModal";

// Import Hooks
import { useOrders } from "../components/TransactionHistory/Hooks/useOrders";
import { usePaymentTracking } from "../components/TransactionHistory/Hooks/usePaymentTracking";

// Import Cache and Pagination
import { useTransactionCache } from "../context/TransactionCacheContext";
import { usePagination } from "../hooks/usePagination";

// Import Utils
import { printReceipt } from "../components/TransactionHistory/utils/receiptUtils";

// Import Firestore - Added runTransaction, doc, increment
import {
  collection,
  getDocs,
  doc,
  runTransaction,
  increment,
} from "firebase/firestore";
import { db } from "../Firebase/firebase";

import "../styles/transaction.scss";

export default function TransactionHistory() {
  const { isCollapsed } = useSidebar();
  const location = useLocation();

  // Cache Context
  const { setCacheData } = useTransactionCache();

  // Add products state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const ITEMS_PER_PAGE = 20;

  // Use custom hooks
  const {
    orders,
    loading,
    fetchOrders,
    handleCancelOrder,
    handleDeleteOrder,
    handleProcessBadOrder,
  } = useOrders();

  const {
    paymentDetails,
    setPaymentDetails,
    handleRecordPayment,
    handleMarkAsPaid,
  } = usePaymentTracking(fetchOrders);

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);

  // Add date filter state
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
    dateRange: "all",
  });

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [badOrderModal, setBadOrderModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [markAsPaidModal, setMarkAsPaidModal] = useState(null);

  // Bad Order state
  const [badOrderDetails, setBadOrderDetails] = useState({
    items: [],
    action: "replace",
    reason: "",
  });

  // Fetch orders and products on component mount
  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  // Save to cache whenever data changes
  useEffect(() => {
    if (orders.length > 0 && products.length > 0) {
      setCacheData(orders, products);
    }
  }, [orders, products, setCacheData]);

  // Add this function to fetch products
  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const querySnapshot = await getDocs(collection(db, "products"));
      const productsData = [];

      querySnapshot.forEach((doc) => {
        productsData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setProductsLoading(false);
    }
  };

  // Handle navigation state for highlighted order
  useEffect(() => {
    if (location.state?.highlightedOrder) {
      setHighlightedOrderId(location.state.highlightedOrder);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Check if order is overdue - FIXED VERSION
  const isOrderOverdue = (order) => {
    // Check if it's a credit order
    const isCreditOrder =
      order.paymentMethod === "credit" || order.paymentMethod === "card";
    if (!isCreditOrder) return false;

    if (!order.dueDate) {
      return false;
    }

    try {
      // Convert due date to Date object
      let dueDate;
      if (order.dueDate.toDate && typeof order.dueDate.toDate === "function") {
        dueDate = order.dueDate.toDate();
      } else if (order.dueDate.seconds) {
        dueDate = new Date(order.dueDate.seconds * 1000);
      } else if (order.dueDate._seconds) {
        dueDate = new Date(order.dueDate._seconds * 1000);
      } else {
        dueDate = new Date(order.dueDate);
      }

      // Check if valid date
      if (isNaN(dueDate.getTime())) return false;

      const now = new Date();

      // Check balance and status
      const hasBalance =
        order.remainingBalance > 0 &&
        (order.paymentStatus === "pending" ||
          order.paymentStatus === "partial");

      // Simple comparison - if due date is in the past AND has balance
      return dueDate < now && hasBalance;
    } catch (error) {
      console.error("Error in isOrderOverdue:", error);
      return false;
    }
  };

  // Filter orders based on date range
  const filterOrdersByDate = (orders) => {
    if (dateFilter.dateRange === "all") {
      return orders;
    }

    const now = new Date();

    if (dateFilter.dateRange !== "custom") {
      let startDate, endDate;

      switch (dateFilter.dateRange) {
        case "today":
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "yesterday":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "thisWeek":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "thisMonth":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          return orders;
      }

      return orders.filter((order) => {
        let orderDate;
        if (order.createdAt && order.createdAt.toDate) {
          orderDate = order.createdAt.toDate();
        } else if (order.createdAt instanceof Date) {
          orderDate = order.createdAt;
        } else if (order.createdAt) {
          orderDate = new Date(order.createdAt);
        } else {
          return false;
        }

        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    if (dateFilter.startDate && dateFilter.endDate) {
      const start = new Date(dateFilter.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateFilter.endDate);
      end.setHours(23, 59, 59, 999);

      return orders.filter((order) => {
        let orderDate;
        if (order.createdAt && order.createdAt.toDate) {
          orderDate = order.createdAt.toDate();
        } else if (order.createdAt instanceof Date) {
          orderDate = order.createdAt;
        } else if (order.createdAt) {
          orderDate = new Date(order.createdAt);
        } else {
          return false;
        }

        return orderDate >= start && orderDate <= end;
      });
    }

    return orders;
  };

  // Get filtered orders for display
  const filteredOrders = filterOrdersByDate(orders);

  // Apply all filters to orders - FIXED VERSION
  const getFilteredOrders = () => {
    let filtered = filteredOrders;

    // SPECIAL CASE: If filtering for overdue, we need to check ALL orders regardless of date filter
    if (filterPayment === "overdue") {
      filtered = orders; // Use all orders instead of date-filtered orders
    }

    // Apply payment filter
    if (filterPayment !== "all") {
      filtered = filtered.filter((order) => {
        let matches = false;

        switch (filterPayment) {
          case "cash":
            matches = order.paymentMethod === "cash";
            break;
          case "bank_transfer":
            matches = order.paymentMethod === "bank_transfer";
            break;
          case "cheque":
            matches = order.paymentMethod === "cheque";
            break;
          case "credit":
            matches =
              order.paymentMethod === "credit" ||
              order.paymentMethod === "card";
            break;
          case "credit_pending":
            matches =
              (order.paymentMethod === "credit" ||
                order.paymentMethod === "card") &&
              order.paymentStatus === "pending";
            break;
          case "credit_partial":
            matches =
              (order.paymentMethod === "credit" ||
                order.paymentMethod === "card") &&
              order.paymentStatus === "partial";
            break;
          case "overdue":
            matches = isOrderOverdue(order);
            break;
          default:
            matches = true;
        }

        return matches;
      });
    }

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((order) => {
        switch (filterStatus) {
          case "has_bad_order":
            return order.hasBadOrder === true;
          default:
            return order.status === filterStatus;
        }
      });
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.customerName?.toLowerCase().includes(searchLower) ||
          order.id?.toLowerCase().includes(searchLower) ||
          order.paymentMethod?.toLowerCase().includes(searchLower),
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "date":
          aValue = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(a.createdAt);
          bValue = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(b.createdAt);
          break;
        case "customer":
          aValue = a.customerName?.toLowerCase() || "";
          bValue = b.customerName?.toLowerCase() || "";
          break;
        case "totalAmount":
          aValue = a.totalAmount || 0;
          bValue = b.totalAmount || 0;
          break;
        case "totalItems":
          aValue = a.totalItems || 0;
          bValue = b.totalItems || 0;
          break;
        case "remainingBalance":
          aValue = a.remainingBalance || 0;
          bValue = b.remainingBalance || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  };

  // Final filtered orders
  const finalFilteredOrders = useMemo(
    () => getFilteredOrders(),
    [
      orders,
      dateFilter,
      filterPayment,
      filterStatus,
      searchTerm,
      sortBy,
      sortOrder,
    ],
  );

  const pagination = usePagination(finalFilteredOrders, ITEMS_PER_PAGE);

  // Reset to page 1 only when filters change
  useEffect(() => {
    pagination.resetPagination();
  }, [filterPayment, filterStatus, searchTerm, sortBy, sortOrder, dateFilter]);

  // Calculate overdue count for statistics
  const overdueCount = orders.filter((order) => isOrderOverdue(order)).length;

  // Handle date range changes
  const handleDateRangeChange = (range) => {
    setDateFilter((prev) => ({
      ...prev,
      dateRange: range,
      startDate: "",
      endDate: "",
    }));
  };

  // Handle custom date changes
  const handleCustomDateChange = (type, value) => {
    setDateFilter((prev) => ({
      ...prev,
      [type]: value,
      dateRange: "custom",
    }));
  };

  // Clear date filters
  const clearDateFilters = () => {
    setDateFilter({
      startDate: "",
      endDate: "",
      dateRange: "all",
    });
  };

  // Handle successful operations
  const handleSuccess = (message) => {
    alert(message);
  };

  const handleError = (error) => {
    console.error(error);
    alert(error.message || "An error occurred");
  };

  // Wrapper functions for error handling
  const handleCancelOrderWithErrorHandling = async (order) => {
    try {
      await handleCancelOrder(order);
      handleSuccess("Order cancelled successfully");
      setCancelModal(null);
    } catch (error) {
      handleError(error);
    }
  };

  const handleDeleteOrderWithErrorHandling = async (orderId) => {
    try {
      await handleDeleteOrder(orderId);
      handleSuccess("Order deleted successfully");
      setDeleteModal(null);
    } catch (error) {
      handleError(error);
    }
  };

  const handleRecordPaymentWithErrorHandling = async (order) => {
    try {
      await handleRecordPayment(order);
      handleSuccess("Payment recorded successfully");
      setPaymentModal(null);
    } catch (error) {
      handleError(error);
    }
  };

  const handleMarkAsPaidWithErrorHandling = async (order) => {
    try {
      await handleMarkAsPaid(order);
      handleSuccess("Order marked as paid successfully");
      setMarkAsPaidModal(null);
    } catch (error) {
      handleError(error);
    }
  };

  const handleProcessBadOrderWithErrorHandling = async (badOrderData) => {
    try {
      await handleProcessBadOrder(badOrderData);
      handleSuccess("Bad order processed successfully");
      setBadOrderModal(null);
      setBadOrderDetails({
        items: [],
        action: "replace",
        reason: "",
      });
    } catch (error) {
      handleError(error);
    }
  };

  // ===============================================
  // 🔥 RESTORE ORDER FUNCTIONALITY
  // ===============================================
  const handleRestoreOrder = async (order) => {
    if (
      !window.confirm(
        "Are you sure you want to restore this order? Stock will be deducted and sales stats updated.",
      )
    ) {
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Check Stock Availability first
        for (const item of order.items) {
          const productRef = doc(db, "products", item.id);
          const productDoc = await transaction.get(productRef);

          if (!productDoc.exists()) {
            throw new Error(`Product ${item.name} no longer exists.`);
          }

          const currentStock = productDoc.data().stock || 0;
          if (currentStock < item.quantity) {
            throw new Error(
              `Not enough stock to restore ${item.name}. Available: ${currentStock}, Required: ${item.quantity}`,
            );
          }
        }

        // 2. Deduct Stock & Increase Sold count
        for (const item of order.items) {
          const productRef = doc(db, "products", item.id);
          transaction.update(productRef, {
            stock: increment(-item.quantity),
            sold: increment(item.quantity),
          });
        }

        // 3. Determine Status based on payment
        let newStatus = "completed";
        if (order.paymentMethod === "credit") {
          newStatus = order.paymentStatus === "paid" ? "completed" : "pending";
        }

        // 4. Update Order Status
        const orderRef = doc(db, "orders", order.id);
        transaction.update(orderRef, {
          status: newStatus,
        });
      });

      handleSuccess("Order restored successfully!");
      fetchOrders(); // Refresh list
      setSelectedOrder(null); // Close modal
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div className="page-container">
      <Sidebar />
      <div className={`transactions-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />

        <div className="transactions-content">
          <div className="page-header">
            <h1>Transaction History</h1>
            <p>Manage and review all customer orders</p>

            {/* Date Filter Controls */}
            <div className="date-filter-controls">
              <div className="date-filter-group">
                <label>Date Range:</label>
                <select
                  value={dateFilter.dateRange}
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                  className="date-range-select"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="thisWeek">This Week</option>
                  <option value="thisMonth">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {dateFilter.dateRange === "custom" && (
                <div className="custom-date-filters">
                  <div className="date-input-group">
                    <label>From:</label>
                    <input
                      type="date"
                      value={dateFilter.startDate}
                      onChange={(e) =>
                        handleCustomDateChange("startDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="date-input-group">
                    <label>To:</label>
                    <input
                      type="date"
                      value={dateFilter.endDate}
                      onChange={(e) =>
                        handleCustomDateChange("endDate", e.target.value)
                      }
                    />
                  </div>
                </div>
              )}

              {(dateFilter.dateRange !== "all" ||
                dateFilter.startDate ||
                dateFilter.endDate) && (
                <button
                  className="clear-date-filter"
                  onClick={clearDateFilters}
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          {/* Statistics Cards */}
          <StatisticsCards
            orders={finalFilteredOrders}
            dateFilter={dateFilter}
            overdueCount={overdueCount}
          />

          {/* Controls Bar */}
          <ControlsBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterPayment={filterPayment}
            setFilterPayment={setFilterPayment}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />

          {/* Transaction List - Pass final filtered orders */}
          <TransactionList
            orders={pagination.paginatedItems}
            loading={loading}
            searchTerm={searchTerm}
            filterStatus={filterStatus}
            filterPayment={filterPayment}
            sortBy={sortBy}
            sortOrder={sortOrder}
            highlightedOrderId={highlightedOrderId}
            onViewOrder={setSelectedOrder}
            onRecordPayment={setPaymentModal}
            onMarkAsPaid={setMarkAsPaidModal}
            onBadOrder={setBadOrderModal}
            onCancelOrder={setCancelModal}
            onDeleteOrder={setDeleteModal}
          />

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="pagination-controls">
              <div className="pagination-info">
                Showing {(pagination.currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(
                  pagination.currentPage * ITEMS_PER_PAGE,
                  finalFilteredOrders.length,
                )}{" "}
                of {finalFilteredOrders.length} orders
              </div>
              <div className="pagination-buttons">
                <button
                  onClick={pagination.prevPage}
                  disabled={!pagination.hasPrevPage}
                  className="pagination-btn"
                >
                  ← Previous
                </button>
                <div className="page-indicator">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <button
                  onClick={pagination.nextPage}
                  disabled={!pagination.hasNextPage}
                  className="pagination-btn"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Modals */}
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onRecordPayment={() => {
              setPaymentModal(selectedOrder);
              setSelectedOrder(null);
            }}
            onMarkAsPaid={() => {
              setMarkAsPaidModal(selectedOrder);
              setSelectedOrder(null);
            }}
            onCancelOrder={() => {
              setCancelModal(selectedOrder);
              setSelectedOrder(null);
            }}
            onPrintReceipt={printReceipt}
            // 🔥 PASS RESTORE FUNCTION HERE
            onRestoreOrder={() => handleRestoreOrder(selectedOrder)}
            onBadOrder={() => {
              setBadOrderModal(selectedOrder);
              setSelectedOrder(null);
            }}
          />

          <PaymentModal
            order={paymentModal}
            paymentDetails={paymentDetails}
            setPaymentDetails={setPaymentDetails}
            onClose={() => {
              setPaymentModal(null);
              setPaymentDetails({
                amount: "",
                paymentDate: new Date().toISOString().split("T")[0],
                notes: "",
                paymentMethod: "cash",
              });
            }}
            onRecordPayment={handleRecordPaymentWithErrorHandling}
          />

          <BadOrderModal
            order={badOrderModal}
            badOrderDetails={badOrderDetails}
            setBadOrderDetails={setBadOrderDetails}
            allProducts={products}
            onClose={() => {
              setBadOrderModal(null);
              setBadOrderDetails({
                items: [],
                action: "replace",
                reason: "",
              });
            }}
            onProcessBadOrder={handleProcessBadOrderWithErrorHandling}
          />

          <CancelOrderModal
            order={cancelModal}
            onClose={() => setCancelModal(null)}
            onConfirm={handleCancelOrderWithErrorHandling}
          />

          <DeleteOrderModal
            order={deleteModal}
            onClose={() => setDeleteModal(null)}
            onConfirm={handleDeleteOrderWithErrorHandling}
          />

          <MarkAsPaidModal
            order={markAsPaidModal}
            onClose={() => setMarkAsPaidModal(null)}
            onConfirm={handleMarkAsPaidWithErrorHandling}
          />
        </div>
      </div>
    </div>
  );
}
