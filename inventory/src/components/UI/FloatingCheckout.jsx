import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShoppingCart,
  faTag,
  faChevronUp,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`floating-checkout ${isExpanded ? "expanded" : "compact"}`}>
      <div className="checkout-content">
        {/* Mobile-only toggle header */}
        <div className="mobile-checkout-toggle" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="compact-summary">
            <FontAwesomeIcon icon={faShoppingCart} />
            <span className="items-count">{totalItems} items</span>
            <span className="total-price">₱{totalAmount.toFixed(2)}</span>
          </div>
          <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronUp} className="toggle-icon" />
        </div>

        <div className="checkout-summary">
          <div className="summary-info">
            <div className="summary-row desktop-only">
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
                placeholder="Name or Walk-in Customer"
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
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
