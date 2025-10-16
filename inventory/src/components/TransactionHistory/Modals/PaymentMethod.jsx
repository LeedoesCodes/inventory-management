import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimesCircle, faMoneyCheck } from "@fortawesome/free-solid-svg-icons";

const PaymentModal = ({
  order,
  onClose,
  onRecordPayment,
  paymentDetails,
  setPaymentDetails,
}) => {
  if (!order) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>
            <FontAwesomeIcon icon={faMoneyCheck} />
            Record Payment
          </h3>
          <button onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Payment form implementation */}
          <div className="payment-summary">
            <h4>Order: #{order.id.slice(-8)}</h4>
            <div className="payment-info-grid">
              <div className="payment-info-item">
                <span>Customer:</span>
                <span>{order.customerName || "Walk-in Customer"}</span>
              </div>
              <div className="payment-info-item">
                <span>Total Amount:</span>
                <span>₱{order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="payment-info-item">
                <span>Paid So Far:</span>
                <span>₱{(order.paidAmount || 0).toFixed(2)}</span>
              </div>
              <div className="payment-info-item">
                <span>Remaining Balance:</span>
                <span className="balance-highlight">
                  ₱{(order.remainingBalance || order.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="payment-form">
            <div className="form-group">
              <label>Payment Amount *</label>
              <input
                type="number"
                value={paymentDetails.amount}
                onChange={(e) =>
                  setPaymentDetails({
                    ...paymentDetails,
                    amount: e.target.value,
                  })
                }
                placeholder="0.00"
                min="0.01"
                max={order.remainingBalance || order.totalAmount}
                step="0.01"
              />
              <small>
                Maximum: ₱
                {(order.remainingBalance || order.totalAmount).toFixed(2)}
              </small>
            </div>

            {/* Other form fields */}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            <FontAwesomeIcon icon={faTimesCircle} />
            Cancel
          </button>
          <button
            className="btn-success"
            onClick={() => onRecordPayment(order)}
            disabled={
              !paymentDetails.amount || parseFloat(paymentDetails.amount) <= 0
            }
          >
            Record Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
