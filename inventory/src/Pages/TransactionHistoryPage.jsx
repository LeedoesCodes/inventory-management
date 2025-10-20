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
import { db } from "../Firebase/firebase"; // Adjust path as needed

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
      console.log("Fetched products:", productsData.length);
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

  // Handle successful operations
  const handleSuccess = (message) => {
    // You can add toast notifications here later
    console.log(message);
    alert(message); // Temporary alert for feedback
  };

  const handleError = (error) => {
    // You can add error handling/toasts here later
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
      console.log("Processing bad order with data:", badOrderData);

      // Call the hook function with the complete data object
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
          </div>

          {/* Statistics Cards */}
          <StatisticsCards orders={orders} />

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

          {/* Transaction List */}
          <TransactionList
            orders={orders}
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
            // --- THIS IS THE ADDED PROP ---
            onBadOrder={() => {
              setBadOrderModal(selectedOrder); // Open BadOrderModal with the order
              setSelectedOrder(null); // Close OrderDetailsModal
            }}
            // --- END OF ADDITION ---
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
