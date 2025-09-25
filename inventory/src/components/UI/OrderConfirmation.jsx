import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faReceipt,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import "../../styles/OrderConfirmation.scss";

const OrderConfirmation = ({
  isOpen,
  onClose,
  orderDetails,
  customerName,
  totalItems,
  totalAmount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-overlay">
      <div className="confirmation-modal">
        <div className="confirmation-header">
          <div className="header-content">
            <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
            <div>
              <h2>Order Confirmed!</h2>
              <p>Order has been successfully processed</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="confirmation-body">
          <div className="order-summary">
            <div className="summary-header">
              <FontAwesomeIcon icon={faReceipt} />
              <h3>Order Summary</h3>
            </div>

            <div className="customer-info">
              <div className="info-row">
                <span className="label">Customer:</span>
                <span className="value">
                  {customerName || "Walk-in Customer"}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Date:</span>
                <span className="value">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="info-row">
                <span className="label">Time:</span>
                <span className="value">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="items-list">
              <h4>Items Ordered</h4>
              <div className="items-header">
                <span>Product</span>
                <span>Qty</span>
                <span>Price</span>
                <span>Subtotal</span>
              </div>
              <div className="items-container">
                {orderDetails.map((item, index) => (
                  <div key={index} className="order-item">
                    <span className="product-name">{item.name}</span>
                    <span className="quantity">{item.quantity}</span>
                    <span className="price">₱{item.price.toFixed(2)}</span>
                    <span className="subtotal">
                      ₱{item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-totals">
              <div className="total-row">
                <span>Total Items:</span>
                <span>{totalItems}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total Amount:</span>
                <span>₱{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="confirmation-footer">
          <button className="print-btn" onClick={() => window.print()}>
            Print Receipt
          </button>
          <button className="close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
