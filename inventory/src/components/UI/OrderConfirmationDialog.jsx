import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faReceipt,
  faCheckCircle,
  faTimesCircle,
  faPlus,
  faMinus,
  faTrash,
  faCreditCard,
  faMoneyBillWave,
  faUniversity,
  faFileInvoiceDollar,
  faChevronDown,
  faCalendarAlt,
  faExclamationTriangle,
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
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dueDate, setDueDate] = useState("");

  if (!isOpen) return null;

  // Payment method options
  const paymentMethods = [
    {
      id: "cash",
      name: "Cash",
      icon: faMoneyBillWave,
      description: "Pay with cash",
      color: "#28a745",
    },
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      icon: faUniversity,
      description: "Bank transfer or GCash",
      color: "#007bff",
    },
    {
      id: "cheque",
      name: "Cheque",
      icon: faFileInvoiceDollar,
      description: "Pay with cheque",
      color: "#6f42c1",
    },
    {
      id: "credit",
      name: "Credit",
      icon: faCreditCard,
      description: "Pay later with due date",
      color: "#fd7e14",
    },
  ];

  const selectedPaymentMethod = paymentMethods.find(
    (method) => method.id === paymentMethod
  );

  // Set default due date when credit is selected - FIXED
  const handlePaymentMethodChange = (methodId) => {
    setPaymentMethod(methodId);
    setIsDropdownOpen(false);

    // Only set default due date if credit is selected AND no due date is set yet
    if (methodId === "credit" && !dueDate) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setDueDate(defaultDate.toISOString().split("T")[0]);
    }

    // Clear due date if switching away from credit
    if (methodId !== "credit") {
      setDueDate("");
    }
  };

  // Handle due date change directly
  const handleDueDateChange = (e) => {
    setDueDate(e.target.value);
  };

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

  // Handle order confirmation with payment method - FIXED DEBUG LOGGING
  // In OrderConfirmationDialog component - ensure this is correct
  const handleConfirmWithPayment = async () => {
    if (isProcessing) return;

    // Validate due date for credit orders
    if (paymentMethod === "credit" && !dueDate) {
      alert("Please set a due date for this credit order.");
      return;
    }

    // Validate due date is not in the past
    if (paymentMethod === "credit" && dueDate) {
      const selectedDate = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        alert("Due date cannot be in the past. Please select a future date.");
        return;
      }
    }

    // DEBUG: Enhanced logging to see what's being passed
    console.log("🔍 DEBUG - OrderConfirmationDialog CONFIRMING:");
    console.log("Payment Method:", paymentMethod);
    console.log("Due Date Value:", dueDate);
    console.log("Due Date Type:", typeof dueDate);
    console.log("Is Credit:", paymentMethod === "credit");
    console.log(
      "Should pass dueDate:",
      paymentMethod === "credit" ? dueDate : null
    );

    setIsProcessing(true);
    try {
      // Pass the actual dueDate value, not just a boolean
      await onConfirm(
        paymentMethod,
        paymentMethod === "credit" ? dueDate : null
      );
    } finally {
      setIsProcessing(false);
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

  // Check if due date is required but not set
  const isDueDateRequired = paymentMethod === "credit" && !dueDate;

  // Check if due date is in the past
  const isDueDateInPast = dueDate && new Date(dueDate) < new Date();

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

            {/* Payment Method Section */}
            <div className="payment-section">
              <h3>Payment Method</h3>
              <div className="payment-dropdown-container">
                <button
                  className="payment-dropdown-trigger"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  type="button"
                >
                  <div className="selected-payment-method">
                    <div className="payment-method-icon">
                      <FontAwesomeIcon
                        icon={selectedPaymentMethod.icon}
                        style={{ color: selectedPaymentMethod.color }}
                      />
                    </div>
                    <div className="payment-method-info">
                      <span className="payment-method-name">
                        {selectedPaymentMethod.name}
                      </span>
                      <span className="payment-method-description">
                        {selectedPaymentMethod.description}
                      </span>
                    </div>
                  </div>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`dropdown-arrow ${isDropdownOpen ? "open" : ""}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="payment-dropdown-menu">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`payment-dropdown-item ${
                          paymentMethod === method.id ? "selected" : ""
                        }`}
                        onClick={() => handlePaymentMethodChange(method.id)}
                      >
                        <div className="payment-method-icon">
                          <FontAwesomeIcon
                            icon={method.icon}
                            style={{ color: method.color }}
                          />
                        </div>
                        <div className="payment-method-info">
                          <span className="payment-method-name">
                            {method.name}
                          </span>
                          <span className="payment-method-description">
                            {method.description}
                          </span>
                        </div>
                        {paymentMethod === method.id && (
                          <div className="payment-checkmark">✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Due Date Field for Credit Orders */}
              {paymentMethod === "credit" && (
                <div className="due-date-section">
                  <div className="form-group">
                    <label htmlFor="dueDate">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      Due Date *
                    </label>
                    <input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={handleDueDateChange}
                      min={new Date().toISOString().split("T")[0]}
                      className={isDueDateInPast ? "error" : ""}
                      required
                    />
                    {isDueDateInPast && (
                      <div className="error-message">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        Due date cannot be in the past
                      </div>
                    )}
                    {!dueDate && (
                      <div className="info-message">
                        Please set a due date for this credit order
                      </div>
                    )}
                  </div>

                  {/* Due Date Preview */}
                  {dueDate && !isDueDateInPast && (
                    <div className="due-date-preview">
                      <div className="preview-label">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        Payment Due:
                      </div>
                      <div className="preview-value">
                        {new Date(dueDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Method Notes */}
              {paymentMethod === "credit" && (
                <div className="payment-note credit-note">
                  <FontAwesomeIcon icon={faCreditCard} />
                  <span>
                    This order will be marked as "Credit" with due date
                    {dueDate && ` on ${new Date(dueDate).toLocaleDateString()}`}
                  </span>
                </div>
              )}
              {paymentMethod === "cheque" && (
                <div className="payment-note cheque-note">
                  <FontAwesomeIcon icon={faFileInvoiceDollar} />
                  <span>Please collect and verify the cheque</span>
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
              {paymentMethod === "credit" && (
                <div className="total-row credit-total">
                  <span>Payment Status:</span>
                  <span className="credit-status">
                    Credit
                    {dueDate && (
                      <span className="due-date-badge">
                        Due: {new Date(dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button
            className="cancel-btn"
            onClick={onCancel}
            disabled={isProcessing}
          >
            <FontAwesomeIcon icon={faTimesCircle} />
            Cancel Order
          </button>
          <button
            className={`confirm-btn ${paymentMethod} ${
              isDueDateRequired || isDueDateInPast ? "disabled" : ""
            }`}
            onClick={handleConfirmWithPayment}
            disabled={
              orderDetails.length === 0 ||
              isProcessing ||
              isDueDateRequired ||
              isDueDateInPast
            }
            title={
              isDueDateRequired
                ? "Please set a due date"
                : isDueDateInPast
                ? "Due date cannot be in the past"
                : ""
            }
          >
            {isProcessing ? (
              <>
                <div className="processing-spinner"></div>
                Processing...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCheckCircle} />
                Confirm Order
                {paymentMethod === "credit"
                  ? ` (Credit - ₱${updatedTotalAmount.toFixed(2)})`
                  : ` (₱${updatedTotalAmount.toFixed(2)})`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationDialog;
