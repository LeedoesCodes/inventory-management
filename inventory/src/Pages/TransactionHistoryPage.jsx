import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  deleteDoc,
  doc,
  writeBatch,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "../Firebase/firebase";
import Sidebar from "../components/UI/Sidebar";
import Header from "../components/UI/Headers";
import { useSidebar } from "../context/SidebarContext";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faTrash,
  faReceipt,
  faUser,
  faCalendar,
  faDollarSign,
  faBox,
  faFilter,
  faSort,
  faPrint,
  faEye,
  faUndo,
  faExclamationTriangle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import ConfirmModal from "../components/UI/ConfirmModal"; // Import the modal
import "../styles/transaction.scss";

export default function TransactionHistory() {
  const { isCollapsed } = useSidebar();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);

  // New state for modals
  const [cancelModal, setCancelModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [restoreStockModal, setRestoreStockModal] = useState(null);

  const orderRefs = useRef({});

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate
          ? doc.data().createdAt.toDate()
          : new Date(doc.data().createdAt),
      }));
      setOrders(ordersData);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Handle navigation state for highlighted order
  useEffect(() => {
    if (location.state?.highlightedOrder) {
      setHighlightedOrderId(location.state.highlightedOrder);
      // Clear the state to prevent re-highlighting on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Scroll to and highlight the order when it's available
  useEffect(() => {
    if (
      highlightedOrderId &&
      orderRefs.current[highlightedOrderId] &&
      !loading
    ) {
      const orderElement = orderRefs.current[highlightedOrderId];

      // Scroll to the order
      orderElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Add highlight class
      orderElement.classList.add("highlighted-order");

      // Remove highlight after 5 seconds
      const timer = setTimeout(() => {
        orderElement.classList.remove("highlighted-order");
        setHighlightedOrderId(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [highlightedOrderId, loading]);

  const handleCancelOrder = async (order) => {
    try {
      const batch = writeBatch(db);

      // Restock all items in the order
      order.items.forEach((item) => {
        const productRef = doc(db, "products", item.id);
        // Restore stock and adjust sold count
        batch.update(productRef, {
          stock: increment(item.quantity),
          sold: increment(-item.quantity),
        });
      });

      // Update order status to "cancelled"
      const orderRef = doc(db, "orders", order.id);
      batch.update(orderRef, {
        status: "cancelled",
        cancelledAt: new Date(),
      });

      await batch.commit();

      // Update local state
      setOrders(
        orders.map((o) =>
          o.id === order.id
            ? { ...o, status: "cancelled", cancelledAt: new Date() }
            : o
        )
      );

      setCancelModal(null);
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert("Failed to cancel order. Please try again.");
      setCancelModal(null);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, "orders", orderId));
      setOrders(orders.filter((order) => order.id !== orderId));
      setDeleteModal(null);
    } catch (err) {
      console.error("Error deleting order:", err);
      alert("Failed to delete transaction. Please try again.");
      setDeleteModal(null);
    }
  };

  const handleRestoreStock = async (order) => {
    try {
      const batch = writeBatch(db);

      order.items.forEach((item) => {
        const productRef = doc(db, "products", item.id);
        // Restore stock and adjust sold count
        batch.update(productRef, {
          stock: increment(item.quantity),
          sold: increment(-item.quantity),
        });
      });

      await batch.commit();
      setRestoreStockModal(null);
    } catch (err) {
      console.error("Error restoring stock:", err);
      alert("Failed to restore stock. Please try again.");
      setRestoreStockModal(null);
    }
  };

  const printReceipt = (order) => {
    const printWindow = window.open("", "_blank");
    const receiptContent = `
      <html>
        <head>
          <title>Receipt - Order ${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .info { margin-bottom: 15px; }
            .items { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .total { font-weight: bold; font-size: 1.2em; margin-top: 20px; }
            .status { color: ${
              order.status === "cancelled" ? "#dc3545" : "#28a745"
            }; font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>ORDER RECEIPT</h2>
            <p>Order ID: ${order.id.slice(-8)}</p>
            <p class="status">Status: ${
              order.status?.toUpperCase() || "COMPLETED"
            }</p>
            ${
              order.status === "cancelled"
                ? `<p><strong>Cancelled:</strong> ${
                    order.cancelledAt?.toLocaleString?.() ||
                    new Date().toLocaleString()
                  }</p>`
                : ""
            }
          </div>
          <div class="info">
            <p><strong>Date:</strong> ${order.createdAt.toLocaleString()}</p>
            <p><strong>Customer:</strong> ${
              order.customerName || "Walk-in Customer"
            }</p>
          </div>
          <table class="items">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>₱${item.price.toFixed(2)}</td>
                  <td>₱${item.subtotal.toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="total">
            <p>Total Items: ${order.totalItems}</p>
            <p>Total Amount: ₱${order.totalAmount.toFixed(2)}</p>
          </div>
          ${
            order.status === "cancelled"
              ? '<div style="color: #dc3545; text-align: center; margin-top: 20px; border: 2px solid #dc3545; padding: 10px;"><strong>ORDER CANCELLED</strong></div>'
              : ""
          }
        </body>
      </html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Apply filtering and sorting
  const applyFiltersAndSorting = (ordersArray) => {
    console.log("🟡 TRANSACTION FILTERING: Applying filters and sorting");
    console.log("🟡 SORT BY:", sortBy, "ORDER:", sortOrder);

    let filtered = ordersArray.filter((order) => {
      const matchesSearch = order.customerName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || order.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

    console.log("🟡 FILTERING: After filtering -", filtered.length, "orders");

    // Apply sorting - FIXED: Ensure proper sorting
    filtered = [...filtered].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle undefined values
      if (aValue === undefined || aValue === null) aValue = "";
      if (bValue === undefined || bValue === null) bValue = "";

      // Convert to numbers for numeric fields
      if (sortBy === "totalAmount" || sortBy === "totalItems") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;

        console.log(
          `🔢 Comparing ${aValue} vs ${bValue} - Order: ${sortOrder}`
        );

        if (sortOrder === "asc") {
          return aValue - bValue; // Lower values first (1, 2, 3...)
        } else {
          return bValue - aValue; // Higher values first (100, 99, 98...)
        }
      }
      // Handle date field
      else if (sortBy === "date") {
        aValue = a.createdAt;
        bValue = b.createdAt;

        console.log(
          `📅 Comparing "${aValue}" vs "${bValue}" - Order: ${sortOrder}`
        );

        if (sortOrder === "asc") {
          return aValue - bValue; // Older dates first
        } else {
          return bValue - aValue; // Newer dates first
        }
      }
      // Handle string fields (customer name)
      else if (sortBy === "customer") {
        aValue = String(a.customerName || "Walk-in Customer").toLowerCase();
        bValue = String(b.customerName || "Walk-in Customer").toLowerCase();

        console.log(
          `🔤 Comparing "${aValue}" vs "${bValue}" - Order: ${sortOrder}`
        );

        if (sortOrder === "asc") {
          return aValue.localeCompare(bValue); // A-Z
        } else {
          return bValue.localeCompare(aValue); // Z-A
        }
      }

      return 0;
    });

    console.log("🟡 FILTERING: Final filtered orders count:", filtered.length);

    // Log first few items to verify sorting
    console.log(
      "📊 SORTED RESULTS (first 5):",
      filtered.slice(0, 5).map((order) => ({
        id: order.id,
        [sortBy]: sortBy === "date" ? order.createdAt : order[sortBy],
      }))
    );

    return filtered;
  };

  // Handle sort changes
  const handleSortChange = (field) => {
    console.log("📊 SORT: Changing to", field);
    setSortBy(field);
  };

  // Handle sort order changes
  const handleSortOrderChange = (order) => {
    console.log("📊 SORT: Changing order to", order);
    setSortOrder(order);
  };

  // Apply filters and sorting whenever relevant states change
  const filteredOrders = applyFiltersAndSorting(orders);

  const totalRevenue = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const totalTransactions = orders.length;

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
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon total-revenue">
                <FontAwesomeIcon icon={faDollarSign} />
              </div>
              <div className="stat-info">
                <h3>₱{totalRevenue.toFixed(2)}</h3>
                <p>Total Revenue</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon total-orders">
                <FontAwesomeIcon icon={faReceipt} />
              </div>
              <div className="stat-info">
                <h3>{totalTransactions}</h3>
                <p>Total Transactions</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon avg-order">
                <FontAwesomeIcon icon={faBox} />
              </div>
              <div className="stat-info">
                <h3>₱{(totalRevenue / (totalTransactions || 1)).toFixed(2)}</h3>
                <p>Average Order Value</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon cancelled-orders">
                <FontAwesomeIcon icon={faTimesCircle} />
              </div>
              <div className="stat-info">
                <h3>{orders.filter((o) => o.status === "cancelled").length}</h3>
                <p>Cancelled Orders</p>
              </div>
            </div>
          </div>

          <div className="controls-bar">
            <div className="search-container">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Search by customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-controls">
              <div className="filter-group">
                <FontAwesomeIcon icon={faFilter} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="control-select"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="filter-group">
                <FontAwesomeIcon icon={faSort} />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="control-select"
                >
                  <option value="date">Date</option>
                  <option value="totalAmount">Amount</option>
                  <option value="totalItems">Items</option>
                  <option value="customer">Customer</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => handleSortOrderChange(e.target.value)}
                  className="control-select"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="loading">Loading transactions...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="no-transactions">
              <FontAwesomeIcon icon={faReceipt} size="3x" />
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="transaction-list">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  ref={(el) => (orderRefs.current[order.id] = el)}
                  className={`transaction-card ${
                    highlightedOrderId === order.id ? "highlighted-order" : ""
                  } ${order.status === "cancelled" ? "cancelled-order" : ""}`}
                >
                  <div className="transaction-header">
                    <div className="order-info">
                      <span className="order-id">
                        Order #{order.id.slice(-8)}
                        {order.status === "cancelled" && (
                          <span className="cancelled-badge">CANCELLED</span>
                        )}
                      </span>
                      <span
                        className={`status-badge ${
                          order.status || "completed"
                        }`}
                      >
                        {order.status || "completed"}
                      </span>
                    </div>
                    <div className="order-actions">
                      {order.status !== "cancelled" && (
                        <button
                          className="action-btn cancel-btn"
                          onClick={() => setCancelModal(order)}
                          title="Cancel Order"
                        >
                          <FontAwesomeIcon icon={faTimesCircle} />
                        </button>
                      )}
                      <button
                        className="action-btn print-btn"
                        onClick={() => printReceipt(order)}
                        title="Print Receipt"
                      >
                        <FontAwesomeIcon icon={faPrint} />
                      </button>
                      <button
                        className="action-btn view-btn"
                        onClick={() => setSelectedOrder(order)}
                        title="View Details"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>

                      <button
                        className="action-btn delete-btn"
                        onClick={() => setDeleteModal(order)}
                        title="Delete Transaction"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>

                  <div className="transaction-body">
                    <div className="transaction-details">
                      <div className="detail-item">
                        <FontAwesomeIcon icon={faUser} />
                        <span>{order.customerName || "Walk-in Customer"}</span>
                      </div>
                      <div className="detail-item">
                        <FontAwesomeIcon icon={faCalendar} />
                        <span>{order.createdAt.toLocaleString()}</span>
                      </div>
                      <div className="detail-item">
                        <FontAwesomeIcon icon={faBox} />
                        <span>{order.totalItems} items</span>
                      </div>
                      <div className="detail-item">
                        <span
                          className={
                            order.status === "cancelled"
                              ? "cancelled-amount"
                              : ""
                          }
                        >
                          ₱{order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="transaction-items">
                      <div className="items-preview">
                        {order.items.slice(0, 3).map((item, index) => (
                          <span key={index} className="item-tag">
                            {item.name} × {item.quantity}
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span className="more-items">
                            +{order.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Order Details Modal */}
          {selectedOrder && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Order Details</h3>
                  <button onClick={() => setSelectedOrder(null)}>×</button>
                </div>
                <div className="modal-body">
                  <div className="order-details">
                    <div className="detail-row">
                      <span>Order ID:</span>
                      <span>{selectedOrder.id}</span>
                    </div>
                    <div className="detail-row">
                      <span>Customer:</span>
                      <span>
                        {selectedOrder.customerName || "Walk-in Customer"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span>Date:</span>
                      <span>{selectedOrder.createdAt.toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <span>Status:</span>
                      <span
                        className={`status-badge ${
                          selectedOrder.status || "completed"
                        }`}
                      >
                        {selectedOrder.status || "completed"}
                      </span>
                    </div>
                    {selectedOrder.status === "cancelled" &&
                      selectedOrder.cancelledAt && (
                        <div className="detail-row">
                          <span>Cancelled:</span>
                          <span>
                            {selectedOrder.cancelledAt.toLocaleString?.() ||
                              new Date().toLocaleString()}
                          </span>
                        </div>
                      )}
                  </div>

                  <div className="items-list">
                    <h4>Order Items</h4>
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="item-row">
                        <span className="item-name">{item.name}</span>
                        <span className="item-quantity">×{item.quantity}</span>
                        <span className="item-price">
                          ₱{item.price.toFixed(2)}
                        </span>
                        <span className="item-subtotal">
                          ₱{item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="order-total">
                    <div className="total-row">
                      <span>Total Items:</span>
                      <span>{selectedOrder.totalItems}</span>
                    </div>
                    <div className="total-row grand-total">
                      <span>Total Amount:</span>
                      <span
                        className={
                          selectedOrder.status === "cancelled"
                            ? "cancelled-amount"
                            : ""
                        }
                      >
                        ₱{selectedOrder.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn-secondary"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Close
                  </button>
                  {selectedOrder.status !== "cancelled" && (
                    <button
                      className="btn-warning"
                      onClick={() => {
                        setCancelModal(selectedOrder);
                        setSelectedOrder(null);
                      }}
                    >
                      Cancel Order
                    </button>
                  )}
                  <button
                    className="btn-primary"
                    onClick={() => printReceipt(selectedOrder)}
                  >
                    Print Receipt
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Order Confirmation Modal */}
          {cancelModal && (
            <ConfirmModal
              message={
                <div>
                  <h3>Cancel Order</h3>
                  <p>Are you sure you want to cancel this order?</p>
                  <div className="order-cancel-details">
                    <p>
                      <strong>Order ID:</strong> {cancelModal.id.slice(-8)}
                    </p>
                    <p>
                      <strong>Customer:</strong>{" "}
                      {cancelModal.customerName || "Walk-in Customer"}
                    </p>
                    <p>
                      <strong>Total Amount:</strong> ₱
                      {cancelModal.totalAmount.toFixed(2)}
                    </p>
                    <p>
                      <strong>Items:</strong> {cancelModal.totalItems} items
                    </p>
                  </div>
                  <p className="warning-text">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    This will restock all items and cannot be undone.
                  </p>
                </div>
              }
              onConfirm={() => handleCancelOrder(cancelModal)}
              onCancel={() => setCancelModal(null)}
            />
          )}

          {/* Delete Order Confirmation Modal */}
          {deleteModal && (
            <ConfirmModal
              message={
                <div>
                  <h3>Delete Transaction</h3>
                  <p>Are you sure you want to delete this transaction?</p>
                  <div className="order-cancel-details">
                    <p>
                      <strong>Order ID:</strong> {deleteModal.id.slice(-8)}
                    </p>
                    <p>
                      <strong>Customer:</strong>{" "}
                      {deleteModal.customerName || "Walk-in Customer"}
                    </p>
                    <p>
                      <strong>Total Amount:</strong> ₱
                      {deleteModal.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <p className="warning-text">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    This action cannot be undone.
                  </p>
                </div>
              }
              onConfirm={() => handleDeleteOrder(deleteModal.id)}
              onCancel={() => setDeleteModal(null)}
            />
          )}

          {/* Restore Stock Confirmation Modal */}
          {restoreStockModal && (
            <ConfirmModal
              message={
                <div>
                  <h3>Restore Stock</h3>
                  <p>Restore stock levels for this order?</p>
                  <div className="order-cancel-details">
                    <p>
                      <strong>Order ID:</strong>{" "}
                      {restoreStockModal.id.slice(-8)}
                    </p>
                    <p>
                      <strong>Customer:</strong>{" "}
                      {restoreStockModal.customerName || "Walk-in Customer"}
                    </p>
                    <p>
                      <strong>Items to restock:</strong>{" "}
                      {restoreStockModal.totalItems} items
                    </p>
                  </div>
                  <p>This will add back the quantities to inventory.</p>
                </div>
              }
              onConfirm={() => handleRestoreStock(restoreStockModal)}
              onCancel={() => setRestoreStockModal(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
