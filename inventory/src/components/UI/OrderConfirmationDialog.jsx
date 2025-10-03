import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faReceipt,
  faCheckCircle,
  faTimesCircle,
  faPlus,
  faMinus,
  faTrash,
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
  onQuantityChange,
  onRemoveItem,
}) => {
  if (!isOpen) return null;

  // Handle quantity changes
  const handleQuantityChange = (itemId, delta) => {
    if (onQuantityChange) {
      onQuantityChange(itemId, delta);
    }
  };

  // Handle remove item
  const handleRemoveItem = (itemId) => {
    if (onRemoveItem) {
      onRemoveItem(itemId);
    }
  };

  // Calculate updated totals
  const calculateTotals = () => {
    let itemsTotal = 0;
    let itemsCount = 0;

    orderDetails.forEach((item) => {
      itemsTotal += item.price * item.quantity;
      itemsCount += item.quantity;
    });

    return {
      totalItems: itemsCount,
      totalAmount: itemsTotal,
    };
  };

  const { totalItems: updatedTotalItems, totalAmount: updatedTotalAmount } =
    calculateTotals();

  return (
    <div className="confirmation-dialog-overlay">
      <div className="confirmation-dialog">
        <div className="dialog-header">
          <FontAwesomeIcon icon={faReceipt} className="header-icon" />
          <h2>Confirm Order</h2>
          <p>Review and modify order details before confirming</p>
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
              <h3>Order Items ({updatedTotalItems})</h3>
              <div className="items-list">
                {orderDetails.map((item, index) => (
                  <div key={item.id || index} className="order-item">
                    <div className="item-main-info">
                      <span className="product-name">{item.name}</span>
                      <span className="price">₱{item.price.toFixed(2)}</span>
                    </div>

                    <div className="item-controls">
                      <div className="quantity-controls">
                        <button
                          className="quantity-btn minus"
                          onClick={() => handleQuantityChange(item.id, -1)}
                          disabled={item.quantity <= 1}
                          title="Decrease quantity"
                        >
                          <FontAwesomeIcon icon={faMinus} />
                        </button>

                        <span className="quantity-display">
                          x{item.quantity}
                        </span>

                        <button
                          className="quantity-btn plus"
                          onClick={() => handleQuantityChange(item.id, 1)}
                          title="Increase quantity"
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </button>
                      </div>

                      <div className="item-totals">
                        <span className="subtotal">
                          ₱{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveItem(item.id)}
                        title="Remove item from order"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {orderDetails.length === 0 && (
                <div className="empty-order">
                  <p>No items in order. Add some products to continue.</p>
                </div>
              )}
            </div>

            <div className="totals-section">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>₱{updatedTotalAmount.toFixed(2)}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total Amount:</span>
                <span>₱{updatedTotalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="cancel-btn" onClick={onCancel}>
            <FontAwesomeIcon icon={faTimesCircle} />
            Cancel Order
          </button>
          <button
            className="confirm-btn"
            onClick={onConfirm}
            disabled={orderDetails.length === 0}
          >
            <FontAwesomeIcon icon={faCheckCircle} />
            Confirm Order (₱{updatedTotalAmount.toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationDialog;
