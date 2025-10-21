import React, { useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faCalendar,
  faBox,
  faEye,
  faPrint,
  faTrash,
  faExclamationTriangle,
  faTimesCircle,
  faCheckCircle,
  faMoneyCheck,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

// Import utils
import {
  getPaymentMethodInfo,
  getPaymentProgress,
} from "../utils/paymentUtils";
import { printReceipt } from "../utils/receiptUtils";
import "./TransactionCard.scss";

const TransactionCard = ({
  order,
  isHighlighted,
  onView,
  onRecordPayment,
  onMarkAsPaid,
  onBadOrder,
  onCancelOrder,
  onDeleteOrder,
}) => {
  const cardRef = useRef(null);

  // Calculate total refund amount from all bad orders
  const calculateTotalRefundAmount = () => {
    if (!order.badOrders || order.badOrders.length === 0) return 0;

    return order.badOrders.reduce((total, badOrder) => {
      return total + (badOrder.totalRefundAmount || 0);
    }, 0);
  };

  const totalRefundAmount = calculateTotalRefundAmount();

  // Scroll to and highlight the card if it's highlighted
  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      cardRef.current.classList.add("highlighted-order");
      const timer = setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.classList.remove("highlighted-order");
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  const paymentMethod = getPaymentMethodInfo(order.paymentMethod);
  const isCreditPending =
    order.paymentMethod === "credit" && order.paymentStatus === "pending";
  const isPartiallyPaid =
    order.paymentMethod === "credit" && order.paymentStatus === "partial";
  const paymentProgress = getPaymentProgress(order);

  // UNIFIED DATE HANDLING - Same as OrderDetailsModal
  const isCreditOrder = order.paymentMethod === "credit";
  const hasDueDate = order.dueDate;

  // Convert due date properly
  const getDueDate = () => {
    if (!order.dueDate) return null;

    try {
      if (order.dueDate.toDate && typeof order.dueDate.toDate === "function") {
        return order.dueDate.toDate();
      } else if (order.dueDate.seconds) {
        return new Date(order.dueDate.seconds * 1000);
      } else if (order.dueDate._seconds) {
        return new Date(order.dueDate._seconds * 1000);
      } else if (order.dueDate instanceof Date) {
        return order.dueDate;
      } else if (typeof order.dueDate === "string") {
        return new Date(order.dueDate);
      }
      return null;
    } catch (error) {
      console.error("Error converting due date:", error);
      return null;
    }
  };

  const dueDate = getDueDate();

  // Check if order is overdue - SAME LOGIC AS OrderDetailsModal
  const isOverdue = () => {
    if (!isCreditOrder || !hasDueDate) return false;
    if (!dueDate) return false;

    const today = new Date();
    const hasBalance =
      order.remainingBalance > 0 || order.paymentStatus !== "paid";

    return dueDate < today && hasBalance;
  };

  const overdue = isOverdue();

  // Calculate days overdue - SAME LOGIC AS OrderDetailsModal
  const getDaysOverdue = () => {
    if (!overdue) return 0;
    if (!dueDate) return 0;

    const today = new Date();
    const diffTime = today - dueDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysOverdue = getDaysOverdue();

  // Get overdue severity class based on days overdue
  const getOverdueSeverity = () => {
    if (!overdue) return "";

    if (daysOverdue <= 7) return "overdue-1-7";
    if (daysOverdue <= 30) return "overdue-8-30";
    if (daysOverdue <= 90) return "overdue-31-90";
    return "overdue-91-plus";
  };

  const overdueSeverity = getOverdueSeverity();

  // Determine card classes based on status
  const getCardClasses = () => {
    const classes = ["transaction-card"];

    if (isHighlighted) classes.push("highlighted-order");
    if (order.status === "cancelled") classes.push("cancelled-order");
    if (order.hasBadOrder) classes.push("has-bad-order");
    if (isCreditPending) classes.push("credit-pending");
    if (isPartiallyPaid) classes.push("credit-partial");
    if (overdue) {
      classes.push("overdue-order");
      classes.push(overdueSeverity);
    }

    return classes.join(" ");
  };

  const handlePrintReceipt = (e) => {
    e.stopPropagation();
    printReceipt(order);
  };

  // Format due date for display - SAME AS OrderDetailsModal
  const formatDueDate = () => {
    if (!dueDate) return null;

    return dueDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const displayDueDate = formatDueDate();

  // Get overdue badge text based on severity
  const getOverdueBadgeText = () => {
    if (!overdue) return "";

    if (daysOverdue <= 7) return "OVERDUE";
    if (daysOverdue <= 30) return "OVERDUE";
    if (daysOverdue <= 90) return "OVERDUE";
    return "OVERDUE";
  };

  // Get payment method display text
  const getPaymentMethodDisplay = () => {
    if (overdue) {
      return `${paymentMethod.name} (Overdue)`;
    }
    if (isCreditPending) {
      return `${paymentMethod.name} (Pending)`;
    }
    if (isPartiallyPaid) {
      return `${paymentMethod.name} (Partial)`;
    }
    return paymentMethod.name;
  };

  return (
    <div
      ref={cardRef}
      className={getCardClasses()}
      onClick={onView}
      style={{ cursor: "pointer" }}
    >
      {/* Header Section */}
      <div className="transaction-header">
        <div className="order-info">
          <span className="order-id">
            Order #{order.id.slice(-8)}
            {order.status === "cancelled" && (
              <span className="cancelled-badge">CANCELLED</span>
            )}
            {order.hasBadOrder && (
              <span className="bad-order-badge">
                BAD ORDER ({order.badOrders?.length || 0})
              </span>
            )}
            {isCreditPending && !overdue && (
              <span className="credit-pending-badge">PENDING</span>
            )}
            {isPartiallyPaid && !overdue && (
              <span className="credit-partial-badge">PARTIAL</span>
            )}
            {/* SIMPLE OVERDUE BADGE */}
            {overdue && (
              <span className={`overdue-badge ${overdueSeverity}`}>
                <FontAwesomeIcon icon={faClock} />
                OVERDUE
              </span>
            )}
          </span>
          <span
            className={`status-badge ${order.status || "completed"} ${
              overdue ? "overdue" : ""
            }`}
          >
            {order.status || "completed"}
          </span>
        </div>

        <div className="order-actions" onClick={(e) => e.stopPropagation()}>
          {/* Payment Actions for Credit Orders */}
          {order.status !== "cancelled" && order.paymentMethod === "credit" && (
            <>
              {(isCreditPending || isPartiallyPaid || overdue) && (
                <button
                  className={`action-btn payment-btn ${
                    overdue ? `overdue-btn ${overdueSeverity}` : ""
                  }`}
                  onClick={() => onRecordPayment(order)}
                  title={
                    overdue
                      ? `Pay Overdue Amount (${daysOverdue} days overdue)`
                      : "Record Payment"
                  }
                >
                  <FontAwesomeIcon
                    icon={overdue ? faExclamationTriangle : faMoneyCheck}
                  />
                </button>
              )}
              {(isCreditPending || overdue) && (
                <button
                  className="action-btn mark-paid-btn"
                  onClick={() => onMarkAsPaid(order)}
                  title="Mark as Paid in Full"
                >
                  <FontAwesomeIcon icon={faCheckCircle} />
                </button>
              )}
            </>
          )}

          {/* Regular Actions */}
          {order.status !== "cancelled" && (
            <>
              <button
                className="action-btn bad-order-btn"
                onClick={() => onBadOrder(order)}
                title="Process Bad Order"
              >
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </button>
              <button
                className="action-btn cancel-btn"
                onClick={() => onCancelOrder(order)}
                title="Cancel Order"
              >
                <FontAwesomeIcon icon={faTimesCircle} />
              </button>
            </>
          )}

          {/* Universal Actions */}
          <button
            className="action-btn print-btn"
            onClick={handlePrintReceipt}
            title="Print Receipt"
          >
            <FontAwesomeIcon icon={faPrint} />
          </button>
          <button
            className="action-btn view-btn"
            onClick={onView}
            title="View Details"
          >
            <FontAwesomeIcon icon={faEye} />
          </button>
          <button
            className="action-btn delete-btn"
            onClick={() => onDeleteOrder(order)}
            title="Delete Transaction"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </div>

      {/* Body Section */}
      <div className="transaction-body">
        <div className="transaction-details">
          <div className="detail-item">
            <FontAwesomeIcon icon={faUser} />
            <span>{order.customerName || "Walk-in Customer"}</span>
          </div>
          <div className="detail-item">
            <FontAwesomeIcon icon={faCalendar} />
            <span>{order.createdAt.toLocaleString()}</span>
          </div>

          {/* Due Date Display - Clean and simple */}
          {isCreditOrder && displayDueDate && (
            <div
              className={`detail-item ${
                overdue ? `overdue-detail ${overdueSeverity}` : ""
              }`}
            >
              <FontAwesomeIcon icon={faClock} />
              <span className={overdue ? "overdue-text" : ""}>
                Due: {displayDueDate}
                {overdue &&
                  ` (${daysOverdue} day${daysOverdue !== 1 ? "s" : ""})`}
              </span>
            </div>
          )}

          <div className="detail-item payment-method">
            <FontAwesomeIcon
              icon={paymentMethod.icon}
              style={{ color: paymentMethod.color }}
            />
            <span>{getPaymentMethodDisplay()}</span>
          </div>
          <div className="detail-item">
            <FontAwesomeIcon icon={faBox} />
            <span>{order.totalItems} items</span>
          </div>
          <div className="detail-item">
            <span
              className={order.status === "cancelled" ? "cancelled-amount" : ""}
            >
              ₱{order.totalAmount.toFixed(2)}
            </span>
            {order.hasBadOrder && totalRefundAmount > 0 && (
              <span className="refund-amount">
                -₱{totalRefundAmount.toFixed(2)} refunded
              </span>
            )}
          </div>
        </div>

        {/* Payment Progress for Credit Orders - Clean and simple */}
        {(isCreditPending || isPartiallyPaid || overdue) && (
          <div className="payment-progress-section">
            <div className="payment-progress-header">
              <span>{overdue ? "Payment Overdue" : "Payment Progress"}</span>
              <span className="payment-amounts">
                ₱{(order.paidAmount || 0).toFixed(2)} of ₱
                {order.totalAmount.toFixed(2)}
              </span>
            </div>
            <div className="payment-progress-bar">
              <div
                className={`payment-progress-fill ${
                  overdue ? `overdue-progress ${overdueSeverity}` : ""
                }`}
                style={{ width: `${paymentProgress}%` }}
              >
                <span className="progress-text">{paymentProgress}%</span>
              </div>
            </div>
            <div
              className={`payment-balance ${
                overdue ? `overdue-balance ${overdueSeverity}` : ""
              }`}
            >
              Balance: ₱
              {(order.remainingBalance || order.totalAmount).toFixed(2)}
              {overdue &&
                ` • ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue`}
            </div>
          </div>
        )}

        {/* Bad Orders Summary */}
        {order.hasBadOrder && order.badOrders && order.badOrders.length > 0 && (
          <div className="bad-orders-summary">
            <div className="bad-orders-header">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <span>Bad Orders: {order.badOrders.length} issue(s)</span>
            </div>
            <div className="bad-orders-details">
              {order.badOrders.map((badOrder, index) => (
                <div key={index} className="bad-order-item">
                  <span className="bad-order-reason">{badOrder.reason}</span>
                  <span className="bad-order-refund">
                    {badOrder.totalRefundAmount > 0 && (
                      <>₱{badOrder.totalRefundAmount.toFixed(2)} refunded</>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items Preview */}
        <div className="transaction-items">
          <div className="items-preview">
            {order.items.slice(0, 3).map((item, index) => (
              <span key={index} className="item-tag">
                {item.name} × {item.quantity}
              </span>
            ))}
            {order.items.length > 3 && (
              <span className="more-items">+{order.items.length - 3} more</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
