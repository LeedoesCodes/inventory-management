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
} from "@fortawesome/free-solid-svg-icons";
import "../styles/customerManagement.scss";

export default function CustomerManagement() {
  const { isCollapsed } = useSidebar();
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Form state (only name, phone, address)
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
    const lastOrder =
      customerOrders.length > 0 ? customerOrders[0].createdAt : null;

    return { totalOrders, totalSpent, lastOrder, customerOrders };
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
                      <div className="customer-avatar">
                        <FontAwesomeIcon icon={faUser} />
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
                            <div key={order.id} className="order-item">
                              <span className="order-date">
                                {order.createdAt.toLocaleDateString()}
                              </span>
                              <span className="order-amount">
                                ₱{order.totalAmount.toFixed(2)}
                              </span>
                              <span className="order-items">
                                {order.totalItems} items
                              </span>
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
      </div>
    </div>
  );
}
