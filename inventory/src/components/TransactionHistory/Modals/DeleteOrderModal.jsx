import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimesCircle,
  faExclamationTriangle,
  faTrash,
  faBox,
  faUser,
  faDollarSign,
  faHistory,
  faWarning,
} from "@fortawesome/free-solid-svg-icons";

const DeleteOrderModal = ({ order, onClose, onConfirm }) => {
  if (!order) return null;

  const handleConfirm = () => {
    onConfirm(order.id);
  };

  const isCancelledOrder = order.status === "cancelled";
  const hasBadOrder = order.hasBadOrder;
  const isCreditOrder = order.paymentMethod === "credit";
  const hasPaymentHistory =
    order.paymentHistory && order.paymentHistory.length > 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content delete-modal">
        <div className="modal-header danger-header">
          <h3>
            <FontAwesomeIcon icon={faTrash} />
            Delete Transaction
          </h3>
          <button onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Critical Warning */}
          <div className="critical-warning">
            <div className="critical-icon">
              <FontAwesomeIcon icon={faWarning} />
            </div>
            <div className="critical-content">
              <h4>Critical Action Required</h4>
              <p>
                You are about to permanently delete this transaction. This
                action cannot be undone.
              </p>
            </div>
          </div>

          {/* Order Details */}
          <div className="order-delete-details">
            <div className="detail-section">
              <h5>
                <FontAwesomeIcon icon={faBox} />
                Order Information
              </h5>
              <div className="detail-grid">
                <div className="detail-item">
                  <span>Order ID:</span>
                  <span className="order-id">#{order.id.slice(-8)}</span>
                </div>
                <div className="detail-item">
                  <span>Customer:</span>
                  <span>{order.customerName || "Walk-in Customer"}</span>
                </div>
                <div className="detail-item">
                  <span>Date:</span>
                  <span>{order.createdAt.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span>Status:</span>
                  <span className={`status-badge ${order.status}`}>
                    {order.status?.toUpperCase() || "COMPLETED"}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h5>
                <FontAwesomeIcon icon={faDollarSign} />
                Financial Information
              </h5>
              <div className="detail-grid">
                <div className="detail-item">
                  <span>Total Amount:</span>
                  <span className="total-amount">
                    ₱{order.totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="detail-item">
                  <span>Payment Method:</span>
                  <span className="payment-method">{order.paymentMethod}</span>
                </div>
                <div className="detail-item">
                  <span>Payment Status:</span>
                  <span className={`payment-status ${order.paymentStatus}`}>
                    {order.paymentStatus}
                  </span>
                </div>
                {order.paidAmount > 0 && (
                  <div className="detail-item">
                    <span>Amount Paid:</span>
                    <span className="paid-amount">
                      ₱{order.paidAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h5>
                <FontAwesomeIcon icon={faBox} />
                Order Items ({order.totalItems})
              </h5>
              <div className="items-preview">
                {order.items.slice(0, 5).map((item, index) => (
                  <div key={index} className="preview-item">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">×{item.quantity}</span>
                  </div>
                ))}
                {order.items.length > 5 && (
                  <div className="more-items">
                    +{order.items.length - 5} more items
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Special Warnings */}
          <div className="special-warnings">
            {hasBadOrder && (
              <div className="warning-item bad-order-warning">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <div>
                  <strong>Bad Order Processed:</strong> This order has
                  associated bad order records. Deleting it may affect your bad
                  order tracking.
                </div>
              </div>
            )}

            {hasPaymentHistory && (
              <div className="warning-item payment-warning">
                <FontAwesomeIcon icon={faHistory} />
                <div>
                  <strong>Payment History:</strong> This order has{" "}
                  {order.paymentHistory.length} payment record
                  {order.paymentHistory.length > 1 ? "s" : ""}. All payment
                  history will be lost.
                </div>
              </div>
            )}

            {!isCancelledOrder && (
              <div className="warning-item stock-warning">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <div>
                  <strong>Active Order:</strong> This order is not cancelled.
                  Deleting it will remove it from your sales records without
                  adjusting inventory.
                </div>
              </div>
            )}

            {isCancelledOrder && (
              <div className="warning-item cancelled-warning">
                <FontAwesomeIcon icon={faBox} />
                <div>
                  <strong>Cancelled Order:</strong> This order was cancelled.
                  Inventory has already been restored.
                </div>
              </div>
            )}
          </div>

          {/* Final Confirmation */}
          <div className="final-confirmation">
            <div className="confirmation-check">
              <input type="checkbox" id="confirmDelete" />
              <label htmlFor="confirmDelete">
                I understand that this action is permanent and cannot be undone
              </label>
            </div>
            <div className="type-to-confirm">
              <label htmlFor="typeConfirm">
                Type <strong>"DELETE"</strong> to confirm:
              </label>
              <input
                type="text"
                id="typeConfirm"
                placeholder="DELETE"
                className="confirmation-input"
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            <FontAwesomeIcon icon={faTimesCircle} />
            Keep Transaction
          </button>
          <button
            className="btn-danger"
            onClick={handleConfirm}
            id="deleteConfirmButton"
            disabled
          >
            <FontAwesomeIcon icon={faTrash} />
            Permanently Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteOrderModal;
