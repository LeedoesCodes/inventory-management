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

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow empty string or valid numbers
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPaymentDetails({
        ...paymentDetails,
        amount: value,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
    <div className="modal-overlay payment-modal">
      <div className="modal-content">
        <div className="modal-header success-header">
          <h3>
            <FontAwesomeIcon icon={faMoneyCheck} />
            Record Payment
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
                    Payment Date
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
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="paymentMethod">
                    <FontAwesomeIcon icon={faCreditCard} />
                    Payment Method
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
            className="btn btn-success"
            onClick={handleSubmit}
            disabled={
              !paymentDetails.amount ||
              paymentAmount <= 0 ||
              paymentAmount > remainingBalance
            }
            type="button"
          >
            <FontAwesomeIcon icon={faMoneyCheck} />
            Record Payment
            {paymentAmount > 0 && ` (₱${paymentAmount.toFixed(2)})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
