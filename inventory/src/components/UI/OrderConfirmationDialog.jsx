import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faReceipt,
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import "../../styles/OrderConfirmationDialog.scss";

const OrderConfirmationDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  orderDetails,
  customerName,
  totalItems,
  totalAmount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-dialog-overlay">
      <div className="confirmation-dialog">
        <div className="dialog-header">
          <FontAwesomeIcon icon={faReceipt} className="header-icon" />
          <h2>Confirm Order</h2>
          <p>Please review the order details before confirming</p>
        </div>

        <div className="dialog-body">
          <div className="order-summary">
            <div className="customer-info">
              <div className="info-row">
                <span className="label">Customer:</span>
                <span className="value">
                  {customerName || "Walk-in Customer"}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Order Date:</span>
                <span className="value">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="items-section">
              <h3>Order Items ({totalItems})</h3>
              <div className="items-list">
                {orderDetails.map((item, index) => (
                  <div key={index} className="order-item">
                    <span className="product-name">{item.name}</span>
                    <span className="quantity">x{item.quantity}</span>
                    <span className="price">₱{item.price.toFixed(2)}</span>
                    <span className="subtotal">
                      ₱{item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="totals-section">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>₱{totalAmount.toFixed(2)}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total Amount:</span>
                <span>₱{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="cancel-btn" onClick={onCancel}>
            <FontAwesomeIcon icon={faTimesCircle} />
            Cancel
          </button>
          <button className="confirm-btn" onClick={onConfirm}>
            <FontAwesomeIcon icon={faCheckCircle} />
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationDialog;
