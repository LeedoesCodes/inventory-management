import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimesCircle,
  faPrint,
  faMoneyCheck,
  faCheckCircle,
  faBan,
  faUser,
  faCalendar,
  faDollarSign,
  faCreditCard,
  faStore,
  faBox,
  faReceipt,
  faHistory,
  faList,
  faPhone,
  faMapMarkerAlt,
  faUserTie,
  faFileAlt,
  faTags,
} from "@fortawesome/free-solid-svg-icons";
import "./ordersDetails.scss";

const OrderDetailsModal = ({
  order,
  onClose,
  onRecordPayment,
  onMarkAsPaid,
  onCancelOrder,
  printReceipt,
}) => {
  if (!order) return null;

  const isCreditPending =
    order.paymentMethod === "credit" && order.paymentStatus === "pending";
  const isPartiallyPaid =
    order.paymentMethod === "credit" && order.paymentStatus === "partial";
  const isFullyPaid =
    order.paymentMethod === "credit" && order.paymentStatus === "paid";

  // Calculate totals
  const subtotal =
    order.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ||
    0;
  const discount = order.discount || 0;
  const tax = order.tax || 0;
  const grandTotal = subtotal - discount + (tax || 0);
  const totalPaid =
    order.paymentHistory?.reduce((sum, payment) => sum + payment.amount, 0) ||
    0;
  const balance = grandTotal - totalPaid;

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";
    if (date.toDate) {
      return date.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "cancelled":
        return "#ef4444";
      case "processing":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
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
    <div className="order-details-modal-component modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>
            <FontAwesomeIcon icon={faReceipt} />
            Order Details - {order.id}
          </h3>
          <button onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Customer & Order Information */}
          <div className="order-details">
            {/* Customer Information */}
            <div className="detail-section">
              <h4 className="section-title">
                <FontAwesomeIcon icon={faUser} />
                Customer Information
              </h4>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">
                    <FontAwesomeIcon icon={faUser} />
                    Customer Name:
                  </span>
                  <span className="detail-value customer-name">
                    {order.customerName || "Walk-in Customer"}
                  </span>
                </div>
                {order.customerContact && (
                  <div className="detail-row">
                    <span className="detail-label">
                      <FontAwesomeIcon icon={faPhone} />
                      Contact:
                    </span>
                    <span className="detail-value customer-contact">
                      {order.customerContact}
                    </span>
                  </div>
                )}
                {order.customerAddress && (
                  <div className="detail-row">
                    <span className="detail-label">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      Address:
                    </span>
                    <span className="detail-value">
                      {order.customerAddress}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Information */}
            <div className="detail-section">
              <h4 className="section-title">
                <FontAwesomeIcon icon={faCalendar} />
                Order Information
              </h4>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">Order ID:</span>
                  <span className="detail-value order-id">{order.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date & Time:</span>
                  <span className="detail-value order-date">
                    {formatDate(order.date)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span
                    className={`detail-value status-badge status-${order.status}`}
                    style={{
                      background: `linear-gradient(135deg, ${getPaymentStatusColor(
                        order.status
                      )}, ${getPaymentStatusColor(order.status)}99)`,
                      color: "white",
                    }}
                  >
                    {order.status}
                  </span>
                </div>
                {order.salesperson && (
                  <div className="detail-row">
                    <span className="detail-label">
                      <FontAwesomeIcon icon={faUserTie} />
                      Salesperson:
                    </span>
                    <span className="detail-value">{order.salesperson}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="detail-section">
              <h4 className="section-title">
                <FontAwesomeIcon icon={faCreditCard} />
                Payment Information
              </h4>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">Payment Method:</span>
                  <span
                    className="detail-value payment-method-badge"
                    style={{
                      background: `linear-gradient(135deg, ${getPaymentMethodColor(
                        order.paymentMethod
                      )}, ${getPaymentMethodColor(order.paymentMethod)}99)`,
                      color: "white",
                    }}
                  >
                    {order.paymentMethod}
                  </span>
                </div>
                {order.paymentMethod === "credit" && (
                  <>
                    <div className="detail-row">
                      <span className="detail-label">Payment Status:</span>
                      <span
                        className={`detail-value status-badge status-${order.paymentStatus}`}
                        style={{
                          background: `linear-gradient(135deg, ${getPaymentStatusColor(
                            order.paymentStatus
                          )}, ${getPaymentStatusColor(order.paymentStatus)}99)`,
                          color: "white",
                        }}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Credit Terms:</span>
                      <span className="detail-value">
                        {order.creditTerms || "Standard 30 days"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Payment Status Summary for Credit Orders */}
            {order.paymentMethod === "credit" && (
              <div
                className={`payment-status-summary payment-${order.paymentStatus}`}
              >
                <div className="payment-summary-row">
                  <span className="summary-label">Total Amount:</span>
                  <span className="summary-value total-amount">
                    ₱{grandTotal.toFixed(2)}
                  </span>
                </div>
                <div className="payment-summary-row">
                  <span className="summary-label">Amount Paid:</span>
                  <span className="summary-value paid-amount">
                    ₱{totalPaid.toFixed(2)}
                  </span>
                </div>
                <div className="payment-summary-row">
                  <span className="summary-label">Balance Due:</span>
                  <span className="summary-value balance-amount">
                    ₱{balance.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Ordered Items */}
          <div className="items-section">
            <h4 className="section-title">
              <FontAwesomeIcon icon={faList} />
              Ordered Items ({order.items?.length || 0})
            </h4>
            <div className="items-list">
              {order.items?.map((item, index) => (
                <div
                  key={index}
                  className={`item-row ${
                    item.isBadOrder ? "bad-order-item" : ""
                  }`}
                >
                  <div className="item-name">
                    <FontAwesomeIcon icon={faBox} />
                    {item.productName}
                    {item.variant && ` - ${item.variant}`}
                    {item.isBadOrder && (
                      <span className="bad-order-indicator" title="Bad Order">
                        🚨
                      </span>
                    )}
                  </div>
                  <div className="item-quantity">
                    {item.quantity} {item.unit || "pcs"}
                  </div>
                  <div className="item-price">₱{item.price.toFixed(2)}</div>
                  <div className="item-subtotal">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Totals */}
          <div className="order-totals">
            <div className="total-row">
              <span className="total-label">Subtotal:</span>
              <span className="total-value subtotal">
                ₱{subtotal.toFixed(2)}
              </span>
            </div>

            {discount > 0 && (
              <div className="total-row">
                <span className="total-label">
                  <FontAwesomeIcon icon={faTags} />
                  Discount:
                </span>
                <span className="total-value discount">
                  -₱{discount.toFixed(2)}
                </span>
              </div>
            )}

            {tax > 0 && (
              <div className="total-row">
                <span className="total-label">Tax:</span>
                <span className="total-value tax">+₱{tax.toFixed(2)}</span>
              </div>
            )}

            <div className="total-row grand-total">
              <span className="total-label">
                <FontAwesomeIcon icon={faDollarSign} />
                Grand Total:
              </span>
              <span className="total-value grand-total">
                ₱{grandTotal.toFixed(2)}
              </span>
            </div>

            {order.paymentMethod === "credit" && (
              <>
                <div className="total-row">
                  <span className="total-label">Total Paid:</span>
                  <span className="total-value paid-total">
                    ₱{totalPaid.toFixed(2)}
                  </span>
                </div>
                <div
                  className={`total-row balance-row ${
                    balance > 0 ? "has-balance" : "fully-paid"
                  }`}
                >
                  <span className="total-label">Balance Due:</span>
                  <span className="total-value balance-total">
                    ₱{balance.toFixed(2)}
                  </span>
                </div>
              </>
            )}

            {order.refundAmount > 0 && (
              <div className="total-row refund-row">
                <span className="total-label">Refund Amount:</span>
                <span className="total-value refund-total">
                  -₱{order.refundAmount.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Payment History */}
          {order.paymentHistory && order.paymentHistory.length > 0 && (
            <div className="payment-history-section">
              <h4 className="section-title">
                <FontAwesomeIcon icon={faHistory} />
                Payment History ({order.paymentHistory.length})
              </h4>
              <div className="payment-history-list">
                {order.paymentHistory
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((payment, index) => (
                    <div key={index} className="payment-record">
                      <div className="payment-record-header">
                        <span className="payment-amount">
                          ₱{payment.amount.toFixed(2)}
                        </span>
                        <span className="payment-date">
                          {formatDate(payment.date)}
                        </span>
                      </div>
                      <div className="payment-record-details">
                        <span
                          className="payment-method-badge"
                          style={{
                            background: `linear-gradient(135deg, ${getPaymentMethodColor(
                              payment.paymentMethod
                            )}, ${getPaymentMethodColor(
                              payment.paymentMethod
                            )}99)`,
                            color: "white",
                          }}
                        >
                          {payment.paymentMethod}
                        </span>
                        {payment.notes && (
                          <span className="payment-notes">{payment.notes}</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* No Payments Message */}
          {(!order.paymentHistory || order.paymentHistory.length === 0) &&
            order.paymentMethod === "credit" && (
              <div className="payment-history-section">
                <h4 className="section-title">
                  <FontAwesomeIcon icon={faHistory} />
                  Payment History
                </h4>
                <div className="no-payments">
                  <FontAwesomeIcon icon={faHistory} size="2x" />
                  <p>No payments recorded yet</p>
                </div>
              </div>
            )}

          {/* Order Notes */}
          {order.notes && (
            <div className="order-notes-section">
              <h4 className="section-title">
                <FontAwesomeIcon icon={faFileAlt} />
                Order Notes
              </h4>
              <div className="notes-content">{order.notes}</div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            <FontAwesomeIcon icon={faTimesCircle} />
            Close
          </button>

          {order.status !== "cancelled" &&
            order.paymentMethod === "credit" &&
            (isCreditPending || isPartiallyPaid) && (
              <button className="btn btn-primary" onClick={onRecordPayment}>
                <FontAwesomeIcon icon={faMoneyCheck} />
                Record Payment
              </button>
            )}

          {order.status !== "cancelled" &&
            order.paymentMethod === "credit" &&
            isCreditPending && (
              <button className="btn btn-success" onClick={onMarkAsPaid}>
                <FontAwesomeIcon icon={faCheckCircle} />
                Mark as Paid
              </button>
            )}

          {order.status !== "cancelled" && (
            <button className="btn btn-warning" onClick={onCancelOrder}>
              <FontAwesomeIcon icon={faBan} />
              {order.status === "completed" ? "Void Order" : "Cancel Order"}
            </button>
          )}

          <button className="btn btn-info" onClick={() => printReceipt(order)}>
            <FontAwesomeIcon icon={faPrint} />
            Print Receipt
          </button>

          {order.status === "cancelled" && (
            <button className="btn btn-success">
              <FontAwesomeIcon icon={faCheckCircle} />
              Restore Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
