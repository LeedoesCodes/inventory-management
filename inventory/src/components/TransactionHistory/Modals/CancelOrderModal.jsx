import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimesCircle,
  faExclamationTriangle,
  faBan,
  faBox,
  faUser,
  faDollarSign,
  faUndo,
} from "@fortawesome/free-solid-svg-icons";

const CancelOrderModal = ({ order, onClose, onConfirm }) => {
  if (!order) return null;

  const handleConfirm = () => {
    onConfirm(order);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content confirm-modal">
        <div className="modal-header warning-header">
          <h3>
            <FontAwesomeIcon icon={faBan} />
            Cancel Order
          </h3>
          <button onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Warning Message */}
          <div className="warning-message">
            <div className="warning-icon">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <div className="warning-content">
              <h4>Are you sure you want to cancel this order?</h4>
              <p>This action will restock all items and cannot be undone.</p>
            </div>
          </div>

          {/* Order Details */}
          <div className="order-cancel-details">
            <div className="detail-section">
              <h5>
                <FontAwesomeIcon icon={faBox} />
                Order Information
              </h5>
              <div className="detail-grid">
                <div className="detail-item">
                  <span>Order ID:</span>
                  <span className="order-id">#{order.id.slice(-8)}</span>
                </div>
                <div className="detail-item">
                  <span>Customer:</span>
                  <span>{order.customerName || "Walk-in Customer"}</span>
                </div>
                <div className="detail-item">
                  <span>Date:</span>
                  <span>{order.createdAt.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h5>
                <FontAwesomeIcon icon={faDollarSign} />
                Payment Information
              </h5>
              <div className="detail-grid">
                <div className="detail-item">
                  <span>Total Amount:</span>
                  <span className="total-amount">
                    ₱{order.totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="detail-item">
                  <span>Payment Method:</span>
                  <span className="payment-method">{order.paymentMethod}</span>
                </div>
                <div className="detail-item">
                  <span>Payment Status:</span>
                  <span className={`payment-status ${order.paymentStatus}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h5>
                <FontAwesomeIcon icon={faBox} />
                Items to Restock
              </h5>
              <div className="items-list">
                {order.items.map((item, index) => (
                  <div key={index} className="item-row">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">×{item.quantity}</span>
                    <span className="item-subtotal">
                      ₱{item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="items-summary">
                <span>Total Items: {order.totalItems}</span>
                <span>Total Value: ₱{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Consequences Warning */}
          <div className="consequences-warning">
            <h5>
              <FontAwesomeIcon icon={faExclamationTriangle} />
              What will happen:
            </h5>
            <ul>
              <li>
                <FontAwesomeIcon icon={faUndo} />
                All items will be returned to stock
              </li>
              <li>
                <FontAwesomeIcon icon={faBan} />
                Order status will be changed to "cancelled"
              </li>
              <li>
                <FontAwesomeIcon icon={faTimesCircle} />
                Sales statistics will be updated
              </li>
              {order.paymentStatus === "paid" && (
                <li>
                  <FontAwesomeIcon icon={faDollarSign} />
                  Payment will need to be refunded to customer
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            <FontAwesomeIcon icon={faTimesCircle} />
            Keep Order
          </button>
          <button className="btn-danger" onClick={handleConfirm}>
            <FontAwesomeIcon icon={faBan} />
            Yes, Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelOrderModal;
