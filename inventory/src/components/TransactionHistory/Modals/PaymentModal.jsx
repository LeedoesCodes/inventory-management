import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimesCircle,
  faMoneyCheck,
  faDollarSign,
  faCalendar,
  faCreditCard,
  faReceipt,
  faUser,
  faWallet,
  faFileAlt,
  faExclamationTriangle,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

// Import utils
import { paymentMethods } from "../utils/constants";
import "./paymentmodal.scss";

const PaymentModal = ({
  order,
  paymentDetails,
  setPaymentDetails,
  onClose,
  onRecordPayment,
}) => {
  if (!order) return null;

  const remainingBalance = order.remainingBalance || order.totalAmount;
  const paidSoFar = order.paidAmount || 0;
  const paymentAmount = parseFloat(paymentDetails.amount) || 0;
  const newBalance = remainingBalance - paymentAmount;

  // Due date handling - This is the ORIGINAL due date from order creation
  const dueDate = order.dueDate;
  const isCreditOrder = order.paymentMethod === "credit";

  // Convert due date for display
  const getDisplayDueDate = () => {
    if (!dueDate) return null;

    if (dueDate.toDate && typeof dueDate.toDate === "function") {
      return dueDate.toDate();
    } else if (dueDate.seconds) {
      return new Date(dueDate.seconds * 1000);
    } else if (dueDate instanceof Date) {
      return dueDate;
    } else if (typeof dueDate === "string") {
      return new Date(dueDate);
    }
    return null;
  };

  const displayDueDate = getDisplayDueDate();
  const isOverdue =
    isCreditOrder && displayDueDate && new Date(displayDueDate) < new Date();

  // Calculate days overdue
  const getDaysOverdue = () => {
    if (!isCreditOrder || !displayDueDate) return 0;
    const today = new Date();
    const diffTime = today - displayDueDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysOverdue = getDaysOverdue();

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPaymentDetails({
        ...paymentDetails,
        amount: value,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (paymentAmount <= 0 || paymentAmount > remainingBalance) {
      alert("Please enter a valid payment amount.");
      return;
    }

    onRecordPayment(order);
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case "cash":
        return "#10b981";
      case "credit":
        return "#f59e0b";
      case "gcash":
        return "#3b82f6";
      case "bank-transfer":
        return "#8b5cf6";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="payment-modal-component modal-overlay">
      <div className="modal-content">
        <div
          className={`modal-header ${
            isOverdue ? "overdue-header" : "success-header"
          }`}
        >
          <h3>
            <FontAwesomeIcon
              icon={isOverdue ? faExclamationTriangle : faMoneyCheck}
            />
            {isOverdue ? "Overdue Payment" : "Record Payment"}
          </h3>
          <button onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Order Summary */}
          <div className="payment-order-summary">
            <h4 className="section-title">
              <FontAwesomeIcon icon={faReceipt} />
              Order Summary - #{order.id?.slice(-8) || order.id}
            </h4>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-label">
                  <FontAwesomeIcon icon={faUser} />
                  Customer
                </div>
                <div className="summary-value customer-name">
                  {order.customerName || "Walk-in Customer"}
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Payment Method</div>
                <div className="summary-value payment-method">
                  <span
                    className="method-badge"
                    style={{
                      backgroundColor: getPaymentMethodColor(
                        order.paymentMethod
                      ),
                      color: "white",
                    }}
                  >
                    {order.paymentMethod === "credit"
                      ? "Credit"
                      : order.paymentMethod}
                  </span>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Total Amount</div>
                <div className="summary-value total-amount">
                  ₱{order.totalAmount?.toFixed(2) || "0.00"}
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Paid So Far</div>
                <div className="summary-value paid-amount">
                  ₱{paidSoFar.toFixed(2)}
                </div>
              </div>

              {/* DUE DATE DISPLAY - READ ONLY TEXT */}
              {isCreditOrder && displayDueDate && (
                <div
                  className={`summary-item ${isOverdue ? "overdue-item" : ""}`}
                >
                  <div className="summary-label">
                    <FontAwesomeIcon
                      icon={isOverdue ? faExclamationTriangle : faCalendar}
                    />
                    Due Date
                  </div>
                  <div
                    className={`summary-value due-date ${
                      isOverdue ? "overdue" : ""
                    }`}
                  >
                    {displayDueDate.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    {isOverdue && (
                      <span className="overdue-badge">
                        {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="summary-item highlight">
                <div className="summary-label">Remaining Balance</div>
                <div className="summary-value balance-amount">
                  ₱{remainingBalance.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form className="payment-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h4 className="section-title">
                <FontAwesomeIcon icon={faWallet} />
                Payment Details
              </h4>

              <div className="form-group">
                <label htmlFor="paymentAmount">
                  <FontAwesomeIcon icon={faDollarSign} />
                  Payment Amount *
                </label>
                <div className="amount-input-container">
                  <span className="currency-symbol">₱</span>
                  <input
                    id="paymentAmount"
                    type="text"
                    value={paymentDetails.amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="amount-input"
                    autoFocus
                  />
                </div>
                <div className="amount-info">
                  <span className="max-amount">
                    Maximum: ₱{remainingBalance.toFixed(2)}
                  </span>
                  <span className="remaining-amount">
                    Will leave: ₱{newBalance.toFixed(2)}
                  </span>
                </div>
                {paymentAmount > remainingBalance && (
                  <div className="error-message">
                    Payment amount cannot exceed remaining balance
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paymentDate">
                    <FontAwesomeIcon icon={faCalendar} />
                    Payment Date *
                  </label>
                  <input
                    id="paymentDate"
                    type="date"
                    value={paymentDetails.paymentDate}
                    onChange={(e) =>
                      setPaymentDetails({
                        ...paymentDetails,
                        paymentDate: e.target.value,
                      })
                    }
                    required
                  />
                  <small className="input-help">
                    Date when this payment is being recorded
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="paymentMethod">
                    <FontAwesomeIcon icon={faCreditCard} />
                    Payment Method *
                  </label>
                  <select
                    id="paymentMethod"
                    value={paymentDetails.paymentMethod}
                    onChange={(e) =>
                      setPaymentDetails({
                        ...paymentDetails,
                        paymentMethod: e.target.value,
                      })
                    }
                    required
                  >
                    {paymentMethods
                      .filter((method) => method.id !== "credit")
                      .map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* DUE DATE INFORMATION - READ ONLY */}
              {isCreditOrder && displayDueDate && (
                <div className="form-group">
                  <label>
                    <FontAwesomeIcon icon={faClock} />
                    Original Due Date
                  </label>
                  <div className="due-date-display">
                    {displayDueDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    {isOverdue && (
                      <span className="overdue-indicator">
                        (Overdue by {daysOverdue} day
                        {daysOverdue !== 1 ? "s" : ""})
                      </span>
                    )}
                  </div>
                  <small className="input-help">
                    This is when the full payment was originally due
                  </small>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="paymentNotes">
                  <FontAwesomeIcon icon={faFileAlt} />
                  Notes (Optional)
                </label>
                <textarea
                  id="paymentNotes"
                  value={paymentDetails.notes}
                  onChange={(e) =>
                    setPaymentDetails({
                      ...paymentDetails,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Add any notes about this payment (e.g., 'Partial payment', 'Second installment', etc.)"
                  rows="3"
                />
              </div>
            </div>

            {/* Payment Preview */}
            {paymentAmount > 0 && (
              <div className="payment-preview-section">
                <h4 className="section-title">
                  <FontAwesomeIcon icon={faMoneyCheck} />
                  Payment Preview
                </h4>
                <div className="payment-preview">
                  <div className="preview-details">
                    <div className="preview-row">
                      <span className="preview-label">Current Balance:</span>
                      <span className="preview-value">
                        ₱{remainingBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="preview-row">
                      <span className="preview-label">This Payment:</span>
                      <span className="preview-value payment-highlight">
                        -₱{paymentAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="preview-row new-balance">
                      <span className="preview-label">New Balance:</span>
                      <span
                        className={`preview-value new-balance-amount ${
                          newBalance <= 0 ? "fully-paid" : "has-balance"
                        }`}
                      >
                        ₱{newBalance.toFixed(2)}
                      </span>
                    </div>

                    {/* Due Date in Preview - READ ONLY */}
                    {isCreditOrder && displayDueDate && (
                      <div className="preview-row due-date-preview">
                        <span className="preview-label">
                          Original Due Date:
                        </span>
                        <span className="preview-value due-date-value">
                          {displayDueDate.toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    <div className="preview-row payment-status">
                      <span className="preview-label">Payment Status:</span>
                      <span
                        className={`preview-value status-badge ${
                          newBalance <= 0 ? "paid" : "partial"
                        }`}
                        style={{
                          background:
                            newBalance <= 0
                              ? "linear-gradient(135deg, #10b981, #059669)"
                              : "linear-gradient(135deg, #f59e0b, #d97706)",
                          color: "white",
                        }}
                      >
                        {newBalance <= 0 ? "PAID IN FULL" : "PARTIALLY PAID"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} type="button">
            <FontAwesomeIcon icon={faTimesCircle} />
            Cancel
          </button>
          <button
            className={`btn ${isOverdue ? "btn-warning" : "btn-success"}`}
            onClick={handleSubmit}
            disabled={
              !paymentDetails.amount ||
              paymentAmount <= 0 ||
              paymentAmount > remainingBalance ||
              !paymentDetails.paymentDate ||
              !paymentDetails.paymentMethod
            }
            type="button"
          >
            <FontAwesomeIcon
              icon={isOverdue ? faExclamationTriangle : faMoneyCheck}
            />
            {isOverdue ? "Pay Overdue Amount" : "Record Payment"}
            {paymentAmount > 0 && ` (₱${paymentAmount.toFixed(2)})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
