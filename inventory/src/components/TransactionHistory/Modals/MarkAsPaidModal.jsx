import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimesCircle,
  faCheckCircle,
  faDollarSign,
  faUser,
  faCalendar,
  faCreditCard,
  faReceipt,
  faHistory,
} from "@fortawesome/free-solid-svg-icons";
import "./MarkAsPaidModal.scss"; // Import the separate SCSS file

const MarkAsPaidModal = ({ order, onClose, onConfirm }) => {
  if (!order) return null;

  const handleConfirm = () => {
    onConfirm(order);
  };

  const remainingBalance = order.remainingBalance || order.totalAmount;
  const paidSoFar = order.paidAmount || 0;

  return (
    <div className="mark-as-paid-modal">
      <div className="modal-overlay">
        <div className="modal-content mark-paid-modal">
          <div className="modal-header success-header">
            <h3>
              <FontAwesomeIcon icon={faCheckCircle} />
              Mark Order as Paid
            </h3>
            <button onClick={onClose}>×</button>
          </div>

          <div className="modal-body">
            {/* Success Message */}
            <div className="success-message">
              <div className="success-icon">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <div className="success-content">
                <h4>Confirm Full Payment</h4>
                <p>
                  Mark this credit order as fully paid. This will close the
                  order and update payment records.
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="order-summary">
              <div className="summary-section">
                <h5>
                  <FontAwesomeIcon icon={faReceipt} />
                  Order Summary
                </h5>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span>Order ID:</span>
                    <span className="order-id">#{order.id.slice(-8)}</span>
                  </div>
                  <div className="summary-item">
                    <span>Customer:</span>
                    <span>{order.customerName || "Walk-in Customer"}</span>
                  </div>
                  <div className="summary-item">
                    <span>Order Date:</span>
                    <span>{order.createdAt.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="summary-section">
                <h5>
                  <FontAwesomeIcon icon={faCreditCard} />
                  Payment Summary
                </h5>
                <div className="payment-summary-grid">
                  <div className="payment-item">
                    <span>Total Order Amount:</span>
                    <span className="total-amount">
                      ₱{order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="payment-item">
                    <span>Already Paid:</span>
                    <span className="paid-amount">₱{paidSoFar.toFixed(2)}</span>
                  </div>
                  <div className="payment-item highlight">
                    <span>Remaining Balance:</span>
                    <span className="remaining-amount">
                      ₱{remainingBalance.toFixed(2)}
                    </span>
                  </div>
                  <div className="payment-item">
                    <span>This Payment:</span>
                    <span className="this-payment">
                      ₱{remainingBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment History Preview */}
              {order.paymentHistory && order.paymentHistory.length > 0 && (
                <div className="summary-section">
                  <h5>
                    <FontAwesomeIcon icon={faHistory} />
                    Previous Payments ({order.paymentHistory.length})
                  </h5>
                  <div className="payment-history-preview">
                    {order.paymentHistory
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .slice(0, 3)
                      .map((payment, index) => (
                        <div key={index} className="payment-record">
                          <span className="payment-amount">
                            ₱{payment.amount.toFixed(2)}
                          </span>
                          <span className="payment-date">
                            {payment.date.toDate?.().toLocaleDateString() ||
                              new Date(payment.date).toLocaleDateString()}
                          </span>
                          <span className="payment-method">
                            {payment.paymentMethod}
                          </span>
                        </div>
                      ))}
                    {order.paymentHistory.length > 3 && (
                      <div className="more-payments">
                        +{order.paymentHistory.length - 3} more payments
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* What will happen section */}
            <div className="consequences-info">
              <h5>What will happen:</h5>
              <div className="consequences-list">
                <div className="consequence-item positive">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <div>
                    <strong>Payment Status Updated:</strong> Order will be
                    marked as "Paid"
                  </div>
                </div>
                <div className="consequence-item positive">
                  <FontAwesomeIcon icon={faDollarSign} />
                  <div>
                    <strong>Payment Recorded:</strong> Full remaining balance of
                    ₱{remainingBalance.toFixed(2)} will be recorded
                  </div>
                </div>
                <div className="consequence-item positive">
                  <FontAwesomeIcon icon={faHistory} />
                  <div>
                    <strong>Payment History Updated:</strong> New payment record
                    will be added
                  </div>
                </div>
                <div className="consequence-item positive">
                  <FontAwesomeIcon icon={faCreditCard} />
                  <div>
                    <strong>Order Closed:</strong> Credit order will be
                    completed
                  </div>
                </div>
              </div>
            </div>

            {/* Final Notes */}
            <div className="final-notes">
              <div className="note">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>
                  This action is appropriate when the customer has made the full
                  payment offline or you want to mark the order as paid for
                  accounting purposes.
                </span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>
              <FontAwesomeIcon icon={faTimesCircle} />
              Cancel
            </button>
            <button className="btn-success" onClick={handleConfirm}>
              <FontAwesomeIcon icon={faCheckCircle} />
              Confirm Full Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAsPaidModal;
