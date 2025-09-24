import React, { useState } from "react";
import "../../styles/checkout.scss";

export default function Checkout({
  totalItems,
  totalAmount,
  onCheckout,
  children,
}) {
  const [showPopup, setShowPopup] = useState(false);

  const handleFinishOrder = () => {
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    if (onCheckout) onCheckout();
  };

  return (
    <div className="checkout">
      {/* Render any children passed to Checkout */}
      {children && <div className="checkout-children">{children}</div>}

      <h3>Checkout Summary</h3>
      <p>Total Items: {totalItems}</p>
      <p>Total Amount: ₱{totalAmount.toFixed(2)}</p>
      <button onClick={handleFinishOrder} disabled={totalItems === 0}>
        Finish Order
      </button>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Order Confirmation</h3>
            <p>Your order has been placed successfully</p>
            <p>
              <strong>Total Items:</strong> {totalItems}
            </p>
            <p>
              <strong>Total Amount:</strong> ₱{totalAmount.toFixed(2)}
            </p>
            <button onClick={closePopup}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
