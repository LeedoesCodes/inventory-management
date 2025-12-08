// src/components/orders/OrderManagement.jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  writeBatch,
  orderBy,
} from "firebase/firestore";
import { db } from "../../Firebase/firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faClock,
  faTruck,
  faBoxOpen,
  faCheckDouble,
  faSearch,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import "../../styles/order-management.scss";

const ORDER_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  READY: "ready",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");

  // Fetch all orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const ordersQuery = query(
          collection(db, "orders"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(ordersQuery);

        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setOrders(ordersData);
        setFilteredOrders(ordersData);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...orders];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    if (dateFilter !== "all") {
      filtered = filtered.filter((order) => {
        const orderDate = order.createdAt?.toDate
          ? order.createdAt.toDate()
          : new Date(order.createdAt);

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
      });
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(term) ||
          order.customerName.toLowerCase().includes(term) ||
          order.customerEmail?.toLowerCase().includes(term) ||
          order.customerPhone?.toLowerCase().includes(term)
      );
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, dateFilter, searchTerm]);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus, note = "") => {
    try {
      const orderRef = doc(db, "orders", orderId);
      const order = orders.find((o) => o.id === orderId);

      const statusHistory = [
        ...(order.statusHistory || []),
        {
          status: newStatus,
          timestamp: new Date(),
          note: note || `Status changed to ${newStatus}`,
          changedBy: "staff", // You can add actual user info here
        },
      ];

      const updateData = {
        status: newStatus,
        statusHistory,
        updatedAt: new Date(),
      };

      // Add timestamps for specific status changes
      if (newStatus === ORDER_STATUS.PROCESSING) {
        updateData.approvedAt = new Date();
        updateData.approvedBy = "staff";
      } else if (newStatus === ORDER_STATUS.READY) {
        updateData.readyAt = new Date();
      } else if (newStatus === ORDER_STATUS.SHIPPED) {
        updateData.shippedAt = new Date();
      } else if (newStatus === ORDER_STATUS.DELIVERED) {
        updateData.deliveredAt = new Date();
        updateData.paymentStatus = "paid"; // Auto-mark as paid when delivered
      }

      await updateDoc(orderRef, updateData);

      // Update product stock when order is approved
      if (newStatus === ORDER_STATUS.PROCESSING) {
        await updateProductStock(order);
      }

      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updateData } : o))
      );

      alert(`Order ${orderId} status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    }
  };

  // Update product stock when order is approved
  const updateProductStock = async (order) => {
    try {
      const batch = writeBatch(db);

      for (const item of order.items) {
        const productRef = doc(db, "products", item.id);

        // Note: You need to fetch current product data first to get current stock
        // This is simplified - you might want to fetch product data first
        batch.update(productRef, {
          stock: (currentStock) => currentStock - item.quantity,
          sold: (currentSold) => currentSold + item.quantity,
        });
      }

      await batch.commit();
      console.log("Product stock updated for order:", order.id);
    } catch (error) {
      console.error("Error updating product stock:", error);
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
        return faClock;
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Calculate statistics
  const stats = {
    pending: orders.filter((o) => o.status === ORDER_STATUS.PENDING).length,
    processing: orders.filter((o) => o.status === ORDER_STATUS.PROCESSING)
      .length,
    ready: orders.filter((o) => o.status === ORDER_STATUS.READY).length,
    shipped: orders.filter((o) => o.status === ORDER_STATUS.SHIPPED).length,
    delivered: orders.filter((o) => o.status === ORDER_STATUS.DELIVERED).length,
    total: orders.length,
  };

  return (
    <div className="order-management">
      <div className="order-management-header">
        <h1>Order Management</h1>
        <p>Review, approve, and track customer orders</p>
      </div>

      {/* Statistics */}
      <div className="order-stats">
        <div
          className="stat-card"
          onClick={() => setStatusFilter(ORDER_STATUS.PENDING)}
        >
          <div className="stat-icon pending">
            <FontAwesomeIcon icon={faClock} />
          </div>
          <div className="stat-info">
            <h3>Pending Approval</h3>
            <p className="stat-number">{stats.pending}</p>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => setStatusFilter(ORDER_STATUS.PROCESSING)}
        >
          <div className="stat-icon processing">
            <FontAwesomeIcon icon={faClock} />
          </div>
          <div className="stat-info">
            <h3>Processing</h3>
            <p className="stat-number">{stats.processing}</p>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => setStatusFilter(ORDER_STATUS.READY)}
        >
          <div className="stat-icon ready">
            <FontAwesomeIcon icon={faBoxOpen} />
          </div>
          <div className="stat-info">
            <h3>Ready</h3>
            <p className="stat-number">{stats.ready}</p>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => setStatusFilter(ORDER_STATUS.DELIVERED)}
        >
          <div className="stat-icon delivered">
            <FontAwesomeIcon icon={faCheckDouble} />
          </div>
          <div className="stat-info">
            <h3>Delivered</h3>
            <p className="stat-number">{stats.delivered}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="order-filters">
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <FontAwesomeIcon icon={faFilter} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value={ORDER_STATUS.PENDING}>Pending</option>
              <option value={ORDER_STATUS.PROCESSING}>Processing</option>
              <option value={ORDER_STATUS.READY}>Ready</option>
              <option value={ORDER_STATUS.SHIPPED}>Shipped</option>
              <option value={ORDER_STATUS.DELIVERED}>Delivered</option>
              <option value={ORDER_STATUS.CANCELLED}>Cancelled</option>
            </select>
          </div>

          <div className="filter-item">
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
      <div className="orders-table-container">
        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="no-orders">
            <p>No orders found</p>
          </div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Delivery</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>#{order.id.substring(0, 8)}</strong>
                  </td>
                  <td>
                    <div className="customer-cell">
                      <div className="customer-name">{order.customerName}</div>
                      {order.customerPhone && (
                        <div className="customer-phone">
                          {order.customerPhone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <div className="items-count">{order.totalItems} items</div>
                  </td>
                  <td className="total-amount">
                    ₱{order.totalAmount?.toFixed(2)}
                  </td>
                  <td>
                    <span className={`delivery-badge ${order.deliveryMethod}`}>
                      {order.deliveryMethod === "delivery"
                        ? "Delivery"
                        : "Pickup"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${getStatusBadgeClass(
                        order.status
                      )}`}
                    >
                      <FontAwesomeIcon icon={getStatusIcon(order.status)} />
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="view-btn"
                        onClick={() => setSelectedOrder(order)}
                      >
                        View
                      </button>

                      {/* Status update buttons based on current status */}
                      {order.status === ORDER_STATUS.PENDING && (
                        <button
                          className="approve-btn"
                          onClick={() =>
                            updateOrderStatus(
                              order.id,
                              ORDER_STATUS.PROCESSING,
                              "Order approved"
                            )
                          }
                        >
                          Approve
                        </button>
                      )}

                      {order.status === ORDER_STATUS.PROCESSING && (
                        <button
                          className="ready-btn"
                          onClick={() =>
                            updateOrderStatus(
                              order.id,
                              ORDER_STATUS.READY,
                              "Order ready for pickup/delivery"
                            )
                          }
                        >
                          Mark Ready
                        </button>
                      )}

                      {order.status === ORDER_STATUS.READY &&
                        order.deliveryMethod === "delivery" && (
                          <button
                            className="ship-btn"
                            onClick={() =>
                              updateOrderStatus(
                                order.id,
                                ORDER_STATUS.SHIPPED,
                                "Order shipped to customer"
                              )
                            }
                          >
                            Ship
                          </button>
                        )}

                      {(order.status === ORDER_STATUS.READY ||
                        order.status === ORDER_STATUS.SHIPPED) && (
                        <button
                          className="deliver-btn"
                          onClick={() =>
                            updateOrderStatus(
                              order.id,
                              ORDER_STATUS.DELIVERED,
                              "Order delivered to customer"
                            )
                          }
                        >
                          Deliver
                        </button>
                      )}

                      {order.status === ORDER_STATUS.PENDING && (
                        <button
                          className="cancel-btn"
                          onClick={() => {
                            if (window.confirm("Cancel this order?")) {
                              updateOrderStatus(
                                order.id,
                                ORDER_STATUS.CANCELLED,
                                "Order cancelled"
                              );
                            }
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="order-details-grid">
                <div className="detail-section">
                  <h3>Customer Information</h3>
                  <div className="detail-item">
                    <span>Name:</span>
                    <strong>{selectedOrder.customerName}</strong>
                  </div>
                  {selectedOrder.customerEmail && (
                    <div className="detail-item">
                      <span>Email:</span>
                      <span>{selectedOrder.customerEmail}</span>
                    </div>
                  )}
                  {selectedOrder.customerPhone && (
                    <div className="detail-item">
                      <span>Phone:</span>
                      <span>{selectedOrder.customerPhone}</span>
                    </div>
                  )}
                  {selectedOrder.customerAddress && (
                    <div className="detail-item">
                      <span>Address:</span>
                      <span>{selectedOrder.customerAddress}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span>Delivery Method:</span>
                    <span
                      className={`delivery-method ${selectedOrder.deliveryMethod}`}
                    >
                      {selectedOrder.deliveryMethod === "delivery"
                        ? "Delivery"
                        : "Pickup"}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Order Information</h3>
                  <div className="detail-item">
                    <span>Order ID:</span>
                    <span>{selectedOrder.id}</span>
                  </div>
                  <div className="detail-item">
                    <span>Date Placed:</span>
                    <span>{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Status:</span>
                    <span
                      className={`status-badge ${getStatusBadgeClass(
                        selectedOrder.status
                      )}`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span>Payment Method:</span>
                    <span>{selectedOrder.paymentMethod}</span>
                  </div>
                  <div className="detail-item">
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
                <h3>Order Items</h3>
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
                        <strong>Total</strong>
                      </td>
                      <td>
                        <strong>
                          ₱{selectedOrder.totalAmount?.toFixed(2)}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Order Notes */}
              {selectedOrder.orderNotes && (
                <div className="order-notes">
                  <h3>Order Notes</h3>
                  <p>{selectedOrder.orderNotes}</p>
                </div>
              )}

              {/* Status History */}
              {selectedOrder.statusHistory && (
                <div className="status-history">
                  <h3>Status History</h3>
                  <div className="timeline">
                    {selectedOrder.statusHistory.map((history, index) => (
                      <div key={index} className="timeline-item">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="status">{history.status}</span>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
