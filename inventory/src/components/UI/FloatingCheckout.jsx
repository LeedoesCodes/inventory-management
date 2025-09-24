import React from "react";
import "../../styles/orders.scss";

export default function FloatingCheckout({
  totalItems,
  totalAmount,
  cartItems,
  onCheckout,
  customerName,
  setCustomerName,
}) {
  return (
    <div className="floating-checkout">
      <div className="checkout-content">
        <div className="checkout-summary">
          <div className="summary-info">
            <span className="total-items">{totalItems} items</span>
            <span className="total-amount">₱{totalAmount.toFixed(2)}</span>

            <div className="customer-section">
              <label>Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name or select from recent customers"
                className="customer-input"
              />
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
