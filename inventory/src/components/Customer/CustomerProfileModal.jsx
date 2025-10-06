import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faUser,
  faPhone,
  faMapMarkerAlt,
  faShoppingCart,
  faDollarSign,
  faCalendar,
  faBox,
  faReceipt,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";
import "./customerProfileModal.scss";

export default function CustomerProfileModal({
  customer,
  customerOrders,
  onClose,
  onOrderClick,
}) {
  if (!customer) return null;

  const totalSpent = customerOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );
  const totalItems = customerOrders.reduce(
    (sum, order) => sum + order.totalItems,
    0
  );
  const averageOrderValue = totalSpent / (customerOrders.length || 1);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return `₱${amount.toFixed(2)}`;
  };

  return (
    <div className="customer-profile-modal-overlay">
      <div className="customer-profile-modal">
        {/* Header */}
        <div className="customer-profile-modal-header">
          <div className="customer-profile-header-content">
            <div className="customer-profile-avatar-large">
              <FontAwesomeIcon icon={faUser} />
            </div>
            <div className="customer-profile-info-header">
              <h2>{customer.name}</h2>
              <div className="customer-profile-meta">
                {customer.phone && (
                  <span className="customer-profile-contact-item">
                    <FontAwesomeIcon icon={faPhone} />
                    {customer.phone}
                  </span>
                )}
                {customer.address && (
                  <span className="customer-profile-contact-item">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    {customer.address}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="customer-profile-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="customer-profile-modal-content">
          {/* Statistics Cards */}
          <div className="customer-profile-stats-grid">
            <div className="customer-profile-stat-card">
              <div className="customer-profile-stat-icon">
                <FontAwesomeIcon icon={faShoppingCart} />
              </div>
              <div className="customer-profile-stat-info">
                <h3>{customerOrders.length}</h3>
                <p>Total Orders</p>
              </div>
            </div>
            <div className="customer-profile-stat-card">
              <div className="customer-profile-stat-icon">
                <FontAwesomeIcon icon={faDollarSign} />
              </div>
              <div className="customer-profile-stat-info">
                <h3>{formatCurrency(totalSpent)}</h3>
                <p>Total Spent</p>
              </div>
            </div>
            <div className="customer-profile-stat-card">
              <div className="customer-profile-stat-icon">
                <FontAwesomeIcon icon={faBox} />
              </div>
              <div className="customer-profile-stat-info">
                <h3>{totalItems}</h3>
                <p>Total Items</p>
              </div>
            </div>
            <div className="customer-profile-stat-card">
              <div className="customer-profile-stat-icon">
                <FontAwesomeIcon icon={faReceipt} />
              </div>
              <div className="customer-profile-stat-info">
                <h3>{formatCurrency(averageOrderValue)}</h3>
                <p>Avg. Order Value</p>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="customer-profile-orders-section">
            <h3>Order History</h3>
            {customerOrders.length === 0 ? (
              <div className="customer-profile-no-orders">
                <FontAwesomeIcon icon={faShoppingCart} size="2x" />
                <p>No orders found for this customer</p>
              </div>
            ) : (
              <div className="customer-profile-orders-list">
                {customerOrders.map((order) => (
                  <div
                    key={order.id}
                    className="customer-profile-order-card"
                    onClick={() => onOrderClick(order.id)}
                  >
                    <div className="customer-profile-order-header">
                      <div className="customer-profile-order-info">
                        <span className="customer-profile-order-id">
                          Order #{order.id.slice(-8)}
                        </span>
                        <span className="customer-profile-order-date">
                          <FontAwesomeIcon icon={faCalendar} />
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <div className="customer-profile-order-amount">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </div>

                    <div className="customer-profile-order-details">
                      <div className="customer-profile-order-items">
                        <strong>Items:</strong> {order.totalItems} items
                      </div>
                      <div className="customer-profile-order-products">
                        {order.items.slice(0, 3).map((item, index) => (
                          <span
                            key={index}
                            className="customer-profile-product-tag"
                          >
                            {item.name} × {item.quantity}
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span className="customer-profile-more-items">
                            +{order.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="customer-profile-order-footer">
                      <span className="customer-profile-view-transaction">
                        View Transaction
                        <FontAwesomeIcon icon={faExternalLinkAlt} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
