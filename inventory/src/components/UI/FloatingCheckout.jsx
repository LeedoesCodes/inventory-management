// components/UI/FloatingCheckout.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShoppingCart,
  faTag,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import "./FloatingCheckout.scss";

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
  isCustomer = false,
  userEmail = "",
}) {
  // Auto-set customer name for customers
  React.useEffect(() => {
    if (isCustomer && userEmail && !customerName) {
      setCustomerName(userEmail);
    }
  }, [isCustomer, userEmail, customerName, setCustomerName]);

  const handleCustomerNameChange = (name) => {
    if (isCustomer) {
      // Don't allow customers to change their name
      return;
    }
    setCustomerName(name);
  };

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

            {/* Customer Section - Different for customers vs staff */}
            <div className="customer-section">
              {isCustomer ? (
                // Customer View - Show their info as read-only
                <div className="customer-info-readonly">
                  <div className="customer-label">
                    <FontAwesomeIcon icon={faUser} />
                    <span>Your Account</span>
                  </div>
                  <div className="customer-email">{userEmail}</div>
                  {totalSavings > 0 && (
                    <div className="discount-active-badge">
                      🎉 Your member discounts are applied
                    </div>
                  )}
                </div>
              ) : (
                // Staff View - Editable customer field
                <>
                  <label>Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => handleCustomerNameChange(e.target.value)}
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
                </>
              )}
            </div>
          </div>

          <div className="checkout-actions">
            <button
              className="checkout-btn"
              onClick={onCheckout}
              disabled={cartItems.length === 0}
            >
              {isCustomer ? "Place Order" : "Complete Checkout"}
            </button>

            {/* Cancel Order Button - Only show if there are items */}
            {cartItems.length > 0 && (
              <button className="cancel-order-btn" onClick={onCancelOrder}>
                {isCustomer ? "Clear Cart" : "Cancel Order"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
