import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../Firebase/firebase";
import Sidebar from "../components/UI/Sidebar";
import Header from "../components/UI/Headers";
import { useSidebar } from "../context/SidebarContext";
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
} from "@fortawesome/free-solid-svg-icons";
import "../styles/transaction.scss";

export default function TransactionHistory() {
  const { isCollapsed } = useSidebar();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

  const handleDeleteOrder = async (orderId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this transaction? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "orders", orderId));
      setOrders(orders.filter((order) => order.id !== orderId));
      alert("Transaction deleted successfully!");
    } catch (err) {
      console.error("Error deleting order:", err);
      alert("Failed to delete transaction. Please try again.");
    }
  };

  const handleRestoreStock = async (order) => {
    if (
      !window.confirm(
        "Restore stock levels for this order? This will add back the quantities to inventory."
      )
    ) {
      return;
    }

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
      alert("Stock restored successfully!");
    } catch (err) {
      console.error("Error restoring stock:", err);
      alert("Failed to restore stock. Please try again.");
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
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>ORDER RECEIPT</h2>
            <p>Order ID: ${order.id}</p>
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
        </body>
      </html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch = order.customerName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || order.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "amount":
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        case "items":
          aValue = a.totalItems;
          bValue = b.totalItems;
          break;
        case "customer":
          aValue = a.customerName?.toLowerCase();
          bValue = b.customerName?.toLowerCase();
          break;
        case "date":
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );
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
                <h3>₱{(totalRevenue / totalTransactions || 0).toFixed(2)}</h3>
                <p>Average Order Value</p>
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
                <FontAwesomeIcon icon={faSort} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="items">Items</option>
                  <option value="customer">Customer</option>
                </select>
                <button
                  className="sort-order-btn"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
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
                <div key={order.id} className="transaction-card">
                  <div className="transaction-header">
                    <div className="order-info">
                      <span className="order-id">
                        Order #{order.id.slice(-8)}
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
                        className="action-btn restore-btn"
                        onClick={() => handleRestoreStock(order)}
                        title="Restore Stock"
                      >
                        <FontAwesomeIcon icon={faUndo} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteOrder(order.id)}
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
                        <FontAwesomeIcon icon={faDollarSign} />
                        <span>₱{order.totalAmount.toFixed(2)}</span>
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
                      <span>₱{selectedOrder.totalAmount.toFixed(2)}</span>
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
        </div>
      </div>
    </div>
  );
}

// Helper function for Firestore increment
const increment = (n) => {
  return {
    increment: n,
  };
};
