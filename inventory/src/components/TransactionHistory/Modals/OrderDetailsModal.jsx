import React, { useState } from "react";
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
  faExclamationTriangle,
  faUndo,
  faEye,
  faEyeSlash,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import "./ordersDetails.scss";

const OrderDetailsModal = ({
  order,
  onClose,
  onRecordPayment,
  onMarkAsPaid,
  onCancelOrder,
  printReceipt,
  onBadOrder,
}) => {
  if (!order) return null;

  // New state for bad order history
  const [showBadOrderHistory, setShowBadOrderHistory] = useState(false);
  const [selectedBadOrder, setSelectedBadOrder] = useState(null);

  const isCreditPending =
    order.paymentMethod === "credit" && order.paymentStatus === "pending";
  const isPartiallyPaid =
    order.paymentMethod === "credit" && order.paymentStatus === "partial";
  const isFullyPaid =
    order.paymentMethod === "credit" && order.paymentStatus === "paid";

  // Calculate totals - use current items or bad order items if viewing history
  const currentItems = selectedBadOrder ? selectedBadOrder.items : order.items;
  const subtotal =
    currentItems?.reduce((sum, item) => sum + item.price * item.quantity, 0) ||
    0;
  const discount = order.discount || 0;
  const tax = order.tax || 0;
  const grandTotal = subtotal - discount + (tax || 0);
  const totalPaid =
    order.paymentHistory?.reduce((sum, payment) => sum + payment.amount, 0) ||
    0;
  const balance = grandTotal - totalPaid;

  // Due date calculations
  const isCreditOrder =
    order.paymentMethod === "credit" || order.paymentMethod === "pay_later";
  const hasDueDate = order.dueDate;
  const isOverdue =
    isCreditOrder && hasDueDate && new Date(order.dueDate) < new Date();

  // Calculate days overdue or remaining
  const getDaysOverdue = () => {
    if (!isCreditOrder || !hasDueDate) return 0;
    const dueDate = order.dueDate.toDate
      ? order.dueDate.toDate()
      : new Date(order.dueDate);
    const today = new Date();
    const diffTime = today - dueDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysRemaining = () => {
    if (!isCreditOrder || !hasDueDate || isOverdue) return 0;
    const dueDate = order.dueDate.toDate
      ? order.dueDate.toDate()
      : new Date(order.dueDate);
    const today = new Date();
    const diffTime = dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysOverdue = getDaysOverdue();
  const daysRemaining = getDaysRemaining();

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

  const formatDueDate = (date) => {
    if (!date) return "Not set";
    if (date.toDate) {
      return date.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
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

  // New helper functions for bad order history
  const handleViewBadOrder = (badOrder) => {
    setSelectedBadOrder(badOrder);
    setShowBadOrderHistory(true);
  };

  const handleViewCurrentOrder = () => {
    setSelectedBadOrder(null);
    setShowBadOrderHistory(false);
  };

  const getBadOrderActionLabel = (action) => {
    switch (action) {
      case "replace":
        return "Replace Only";
      case "partial_refund":
        return "Partial Refund + Replace";
      case "full_refund":
        return "Full Refund";
      default:
        return action;
    }
  };

  return (
    <div className="order-details-modal-component modal-overlay">
      <div className="modal-content">
        <div className={`modal-header ${isOverdue ? "overdue-header" : ""}`}>
          <h3>
            <FontAwesomeIcon
              icon={isOverdue ? faExclamationTriangle : faReceipt}
            />
            {selectedBadOrder ? "Bad Order Details" : "Order Details"} -{" "}
            {order.id}
            {selectedBadOrder && (
              <span className="bad-order-indicator-header">
                (Historical View)
              </span>
            )}
            {isOverdue && (
              <span className="overdue-indicator-header">(OVERDUE)</span>
            )}
          </h3>
          <button onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* New Section: View Toggle */}
          {order.badOrders && order.badOrders.length > 0 && (
            <div className="view-toggle-section">
              <div className="view-toggle-buttons">
                <button
                  className={`btn btn-sm ${
                    !showBadOrderHistory ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={handleViewCurrentOrder}
                >
                  <FontAwesomeIcon icon={faEye} />
                  Current Order
                </button>
                <button
                  className={`btn btn-sm ${
                    showBadOrderHistory ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={() => setShowBadOrderHistory(true)}
                >
                  <FontAwesomeIcon icon={faHistory} />
                  Bad Order History ({order.badOrders.length})
                </button>
              </div>
            </div>
          )}

          {/* New Section: Bad Order History Panel */}
          {showBadOrderHistory && (
            <div className="bad-order-history-section">
              <h4 className="section-title">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                Bad Order History
              </h4>

              {!selectedBadOrder ? (
                <div className="bad-order-list">
                  {order.badOrders?.map((badOrder, index) => (
                    <div key={badOrder.id || index} className="bad-order-card">
                      <div className="bad-order-header">
                        <div className="bad-order-info">
                          <span className="bad-order-action">
                            {getBadOrderActionLabel(badOrder.action)}
                          </span>
                          <span className="bad-order-reason">
                            Reason: {badOrder.reason}
                          </span>
                          <span className="bad-order-date">
                            {formatDate(badOrder.processedAt)}
                          </span>
                        </div>
                        <div className="bad-order-amount">
                          {badOrder.totalRefundAmount > 0 && (
                            <span className="refund-amount">
                              Refund: ₱{badOrder.totalRefundAmount.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bad-order-footer">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleViewBadOrder(badOrder)}
                        >
                          <FontAwesomeIcon icon={faEye} />
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="selected-bad-order">
                  <div className="bad-order-details-header">
                    <h5>
                      Bad Order - {formatDate(selectedBadOrder.processedAt)}
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setSelectedBadOrder(null)}
                        style={{ marginLeft: "10px" }}
                      >
                        <FontAwesomeIcon icon={faUndo} />
                        Back to List
                      </button>
                    </h5>
                    <div className="bad-order-meta">
                      <span className="bad-order-action-badge">
                        {getBadOrderActionLabel(selectedBadOrder.action)}
                      </span>
                      <span className="bad-order-reason">
                        Reason: {selectedBadOrder.reason}
                      </span>
                      {selectedBadOrder.totalRefundAmount > 0 && (
                        <span className="bad-order-refund">
                          Refund: ₱
                          {selectedBadOrder.totalRefundAmount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
                {/* New bad order count row */}
                {order.hasBadOrder && (
                  <div className="detail-row">
                    <span className="detail-label">Bad Orders:</span>
                    <span className="detail-value bad-order-count">
                      {order.badOrders?.length || 0} recorded
                    </span>
                  </div>
                )}
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

            {/* Payment Information (Enhanced with Due Date) */}
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

                    {/* Due Date Information */}
                    <div
                      className={`detail-row ${isOverdue ? "overdue-row" : ""}`}
                    >
                      <span className="detail-label">
                        <FontAwesomeIcon
                          icon={isOverdue ? faExclamationTriangle : faCalendar}
                        />
                        Due Date:
                      </span>
                      <span
                        className={`detail-value due-date-display ${
                          isOverdue ? "overdue" : ""
                        }`}
                      >
                        {formatDueDate(order.dueDate)}
                        {isOverdue && (
                          <span className="overdue-badge">
                            {daysOverdue} day{daysOverdue !== 1 ? "s" : ""}{" "}
                            overdue
                          </span>
                        )}
                        {!isOverdue && hasDueDate && daysRemaining > 0 && (
                          <span className="due-soon-badge">
                            {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}{" "}
                            remaining
                          </span>
                        )}
                        {!isOverdue && hasDueDate && daysRemaining === 0 && (
                          <span className="due-today-badge">Due today</span>
                        )}
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

            {/* Payment Status Summary (Enhanced with Due Date Info) */}
            {order.paymentMethod === "credit" && (
              <div
                className={`payment-status-summary payment-${
                  order.paymentStatus
                } ${isOverdue ? "overdue-payment" : ""}`}
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

                {/* Due Date Summary */}
                {hasDueDate && (
                  <div className="payment-summary-row due-date-summary">
                    <span className="summary-label">
                      <FontAwesomeIcon
                        icon={isOverdue ? faExclamationTriangle : faClock}
                      />
                      {isOverdue ? "Overdue Since:" : "Due Date:"}
                    </span>
                    <span
                      className={`summary-value ${
                        isOverdue ? "overdue-value" : ""
                      }`}
                    >
                      {formatDueDate(order.dueDate)}
                      {isOverdue && (
                        <span className="overdue-days">
                          ({daysOverdue} day{daysOverdue !== 1 ? "s" : ""})
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ordered Items */}
          <div className="items-section">
            <h4 className="section-title">
              <FontAwesomeIcon icon={faList} />
              {selectedBadOrder ? "Bad Order Items" : "Ordered Items"} (
              {currentItems?.length || 0})
              {selectedBadOrder && (
                <span className="historical-badge">Historical View</span>
              )}
            </h4>
            <div className="items-list">
              {currentItems?.map((item, index) => (
                <div
                  key={index}
                  className={`item-row ${
                    item.badPieces > 0 ? "bad-order-item" : ""
                  }`}
                >
                  <div className="item-name">
                    <FontAwesomeIcon icon={faBox} />
                    {item.name}
                    {selectedBadOrder && item.badPieces > 0 && (
                      <span className="bad-order-quantity" title="Bad Pieces">
                        🚨 {item.badPieces} bad pieces
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
                  } ${isOverdue ? "overdue-balance" : ""}`}
                >
                  <span className="total-label">Balance Due:</span>
                  <span className="total-value balance-total">
                    ₱{balance.toFixed(2)}
                    {isOverdue && (
                      <span className="overdue-indicator">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        OVERDUE
                      </span>
                    )}
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

        {/* Modal Footer (Enhanced with overdue indicators) */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            <FontAwesomeIcon icon={faTimesCircle} />
            Close
          </button>

          {order.status !== "cancelled" &&
            order.paymentMethod === "credit" &&
            (isCreditPending || isPartiallyPaid) && (
              <button
                className={`btn ${isOverdue ? "btn-warning" : "btn-primary"}`}
                onClick={onRecordPayment}
              >
                <FontAwesomeIcon
                  icon={isOverdue ? faExclamationTriangle : faMoneyCheck}
                />
                {isOverdue ? "Pay Overdue Amount" : "Record Payment"}
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
            <button className="btn btn-danger" onClick={onBadOrder}>
              <FontAwesomeIcon icon={faExclamationTriangle} />
              Record Bad Order
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
