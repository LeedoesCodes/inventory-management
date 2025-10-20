import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../Firebase/firebase";
import Sidebar from "../components/UI/Sidebar";
import Header from "../components/UI/Headers";
import { useSidebar } from "../context/SidebarContext";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faPhone,
  faCalendar,
  faShoppingCart,
  faDollarSign,
  faExternalLinkAlt,
  faEye,
  faCreditCard, // Add credit card icon
  faClock, // Add clock icon for pending payments
  faExclamationTriangle, // Add warning icon for overdue
} from "@fortawesome/free-solid-svg-icons";
import CustomerProfileModal from "../components/Customer/CustomerProfileModal";
import "../styles/customerManagement.scss";

export default function CustomerManagement() {
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "customers"));
      const customersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
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
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchOrders();
  }, []);

  // Enhanced customer stats to include credit information
  const getCustomerStats = (customerName) => {
    const customerOrders = orders.filter(
      (order) =>
        order.customerName?.toLowerCase() === customerName.toLowerCase()
    );

    const totalOrders = customerOrders.length;
    const totalSpent = customerOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // Calculate credit-specific stats
    const creditOrders = customerOrders.filter(
      (order) =>
        order.paymentMethod === "credit" || order.paymentMethod === "pay_later"
    );

    const totalCreditAmount = creditOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // Calculate pending credit (unpaid credit orders)
    const pendingCreditOrders = creditOrders.filter(
      (order) =>
        order.paymentStatus !== "paid" && order.paymentStatus !== "completed"
    );

    const pendingCreditAmount = pendingCreditOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    const lastOrder =
      customerOrders.length > 0 ? customerOrders[0].createdAt : null;

    return {
      totalOrders,
      totalSpent,
      lastOrder,
      customerOrders,
      creditOrders,
      totalCreditAmount,
      pendingCreditAmount,
      pendingCreditCount: pendingCreditOrders.length,
    };
  };

  // Handle customer profile click
  const handleCustomerProfileClick = (customer) => {
    const customerOrders = orders.filter(
      (order) =>
        order.customerName?.toLowerCase() === customer.name.toLowerCase()
    );
    setSelectedCustomer({
      ...customer,
      orders: customerOrders,
    });
  };

  // Handle order click from profile modal
  const handleOrderClickFromModal = (orderId) => {
    setSelectedCustomer(null);
    navigate("/transactionHistory", {
      state: {
        highlightedOrder: orderId,
        scrollToOrder: true,
      },
    });
  };

  const handleOrderClick = (orderId) => {
    navigate("/transactionHistory", {
      state: {
        highlightedOrder: orderId,
        scrollToOrder: true,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Customer name is required");
      return;
    }

    try {
      if (editingCustomer) {
        await updateDoc(doc(db, "customers", editingCustomer.id), formData);
        alert("Customer updated successfully!");
      } else {
        await addDoc(collection(db, "customers"), {
          ...formData,
          createdAt: new Date(),
          totalOrders: 0,
          totalSpent: 0,
        });
        alert("Customer added successfully!");
      }

      setShowForm(false);
      setEditingCustomer(null);
      setFormData({ name: "", phone: "", address: "" });
      fetchCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Error saving customer. Please try again.");
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (customerId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this customer? This action cannot be undone."
      )
    ) {
      try {
        await deleteDoc(doc(db, "customers", customerId));
        alert("Customer deleted successfully!");
        fetchCustomers();
      } catch (error) {
        console.error("Error deleting customer:", error);
        alert("Error deleting customer. Please try again.");
      }
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
  );

  return (
    <div className="page-container">
      <Sidebar />
      <div className={`customers-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />

        <div className="customers-content">
          <div className="page-header">
            <h1>Customer Management</h1>
            <p>Manage your customer database and view purchase history</p>
          </div>

          <div className="controls-bar">
            <div className="search-container">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Search customers by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              className="add-customer-btn"
              onClick={() => setShowForm(true)}
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Customer
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading customers...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="no-customers">
              <FontAwesomeIcon icon={faUser} size="3x" />
              <p>No customers found</p>
              <button
                className="add-customer-btn"
                onClick={() => setShowForm(true)}
              >
                Add Your First Customer
              </button>
            </div>
          ) : (
            <div className="customers-grid">
              {filteredCustomers.map((customer) => {
                const stats = getCustomerStats(customer.name);

                return (
                  <div key={customer.id} className="customer-card">
                    <div className="customer-header">
                      <div
                        className="customer-avatar clickable"
                        onClick={() => handleCustomerProfileClick(customer)}
                        title="View customer profile and order history"
                      >
                        <FontAwesomeIcon icon={faUser} />
                        <div className="avatar-overlay">
                          <FontAwesomeIcon icon={faEye} />
                        </div>
                      </div>
                      <div className="customer-info">
                        <h3>{customer.name}</h3>
                        <div className="contact-info">
                          {customer.phone && (
                            <span>
                              <FontAwesomeIcon icon={faPhone} />
                              {customer.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="customer-actions">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEdit(customer)}
                          title="Edit Customer"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(customer.id)}
                          title="Delete Customer"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>

                    <div className="customer-stats">
                      <div className="stat-item">
                        <FontAwesomeIcon icon={faShoppingCart} />
                        <div>
                          <span className="stat-value">
                            {stats.totalOrders}
                          </span>
                          <span className="stat-label">Total Orders</span>
                        </div>
                      </div>
                      <div className="stat-item">
                        <FontAwesomeIcon icon={faDollarSign} />
                        <div>
                          <span className="stat-value">
                            ₱{stats.totalSpent.toFixed(2)}
                          </span>
                          <span className="stat-label">Total Spent</span>
                        </div>
                      </div>

                      {/* Credit Information */}
                      {stats.pendingCreditAmount > 0 && (
                        <div className="stat-item credit-pending">
                          <FontAwesomeIcon
                            icon={faClock}
                            className="credit-icon"
                          />
                          <div>
                            <span className="stat-value warning">
                              ₱{stats.pendingCreditAmount.toFixed(2)}
                            </span>
                            <span className="stat-label">Pending Credit</span>
                          </div>
                        </div>
                      )}

                      {stats.totalCreditAmount > 0 && (
                        <div className="stat-item">
                          <FontAwesomeIcon icon={faCreditCard} />
                          <div>
                            <span className="stat-value">
                              ₱{stats.totalCreditAmount.toFixed(2)}
                            </span>
                            <span className="stat-label">Total Credit</span>
                          </div>
                        </div>
                      )}

                      {stats.lastOrder && (
                        <div className="stat-item">
                          <FontAwesomeIcon icon={faCalendar} />
                          <div>
                            <span className="stat-value">
                              {stats.lastOrder.toLocaleDateString()}
                            </span>
                            <span className="stat-label">Last Order</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Credit Status Badge */}
                    {stats.pendingCreditAmount > 0 && (
                      <div className="credit-status-badge warning">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        <span>
                          {stats.pendingCreditCount} pending credit order(s)
                        </span>
                      </div>
                    )}

                    {customer.address && (
                      <div className="customer-address">
                        <strong>Address:</strong> {customer.address}
                      </div>
                    )}

                    {stats.customerOrders.length > 0 && (
                      <div className="recent-orders">
                        <h4>Recent Orders</h4>
                        <div className="orders-list">
                          {stats.customerOrders.slice(0, 3).map((order) => (
                            <div
                              key={order.id}
                              className={`order-item clickable-order ${
                                (order.paymentMethod === "credit" ||
                                  order.paymentMethod === "pay_later") &&
                                order.paymentStatus !== "paid"
                                  ? "credit-order"
                                  : ""
                              }`}
                              onClick={() => handleOrderClick(order.id)}
                              title="Click to view transaction details"
                            >
                              <span className="order-date">
                                {order.createdAt.toLocaleDateString()}
                              </span>
                              <span className="order-amount">
                                ₱{order.totalAmount.toFixed(2)}
                                {(order.paymentMethod === "credit" ||
                                  order.paymentMethod === "pay_later") && (
                                  <FontAwesomeIcon
                                    icon={faCreditCard}
                                    className="payment-method-icon"
                                    title="Credit/Pay Later Order"
                                  />
                                )}
                              </span>
                              <span className="order-items">
                                {order.totalItems} items
                              </span>
                              <FontAwesomeIcon
                                icon={faExternalLinkAlt}
                                className="order-link-icon"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer Form Modal */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>
                  {editingCustomer ? "Edit Customer" : "Add New Customer"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingCustomer(null);
                    setFormData({ name: "", phone: "", address: "" });
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="customer-form">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Enter customer address"
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCustomer(null);
                      setFormData({ name: "", phone: "", address: "" });
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    {editingCustomer ? "Update Customer" : "Add Customer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Customer Profile Modal */}
        {selectedCustomer && (
          <CustomerProfileModal
            customer={selectedCustomer}
            customerOrders={selectedCustomer.orders}
            onClose={() => setSelectedCustomer(null)}
            onOrderClick={handleOrderClickFromModal}
          />
        )}
      </div>
    </div>
  );
}
