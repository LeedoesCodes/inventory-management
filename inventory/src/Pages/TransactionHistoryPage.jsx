import React, { useState, useEffect } from "react";
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

// Import Utils
import { printReceipt } from "../components/TransactionHistory/utils/receiptUtils";

// Import Firestore
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/firebase";

import "../styles/transaction.scss";

export default function TransactionHistory() {
  const { isCollapsed } = useSidebar();
  const location = useLocation();

  // Add products state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

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
    dateRange: "all", // 'all', 'today', 'yesterday', 'thisWeek', 'thisMonth', 'custom'
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

  // Filter orders based on date range
  const filterOrdersByDate = (orders) => {
    // Only return all orders if explicitly "all"
    if (dateFilter.dateRange === "all") {
      return orders;
    }

    const now = new Date();

    // If using predefined ranges
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

    // If using custom date range
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

          {/* Statistics Cards - Pass filtered orders AND dateFilter */}
          <StatisticsCards orders={filteredOrders} dateFilter={dateFilter} />

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

          {/* Transaction List - Pass filtered orders */}
          <TransactionList
            orders={filteredOrders}
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
