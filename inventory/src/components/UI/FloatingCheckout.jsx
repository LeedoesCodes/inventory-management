// components/UI/FloatingCheckout.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart, faTag } from "@fortawesome/free-solid-svg-icons";
import "../../styles/orders.scss";

export default function FloatingCheckout({
  totalItems,
  totalAmount,
  totalSavings,
  cartItems,
  onCheckout,
  onCancelOrder,
  onQuantityChange,
  onRemoveItem,
  customerName,
  setCustomerName,
}) {
  return (
    <div className="floating-checkout">
      <div className="checkout-content">
        <div className="checkout-summary">
          <div className="summary-info">
            <div className="summary-row">
              <FontAwesomeIcon icon={faShoppingCart} />
              <span className="total-items">{totalItems} items</span>
              <span className="total-amount">₱{totalAmount.toFixed(2)}</span>
            </div>

            {totalSavings > 0 && (
              <div className="savings-info">
                <FontAwesomeIcon icon={faTag} />
                <span className="savings-amount">
                  You save: ₱{totalSavings.toFixed(2)}
                </span>
              </div>
            )}

            <div className="customer-section">
              <label>Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name or select from recent customers"
                className="customer-input"
              />
              {customerName &&
                customerName !== "Walk-in Customer" &&
                totalSavings > 0 && (
                  <div className="discount-active-badge">
                    🎉 Discounts applied for {customerName}
                  </div>
                )}
            </div>
          </div>

          <div className="checkout-actions">
            <button
              className="checkout-btn"
              onClick={onCheckout}
              disabled={cartItems.length === 0}
            >
              Complete Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
