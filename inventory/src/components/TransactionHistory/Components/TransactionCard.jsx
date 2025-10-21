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

  // Determine card classes based on status
  const getCardClasses = () => {
    const classes = ["transaction-card"];

    if (isHighlighted) classes.push("highlighted-order");
    if (order.status === "cancelled") classes.push("cancelled-order");
    if (order.hasBadOrder) classes.push("has-bad-order");
    if (isCreditPending) classes.push("credit-pending");
    if (isPartiallyPaid) classes.push("credit-partial");

    return classes.join(" ");
  };

  const handlePrintReceipt = (e) => {
    e.stopPropagation();
    printReceipt(order);
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
                BAD ORDER PROCESSED ({order.badOrders?.length || 0})
              </span>
            )}
            {isCreditPending && (
              <span className="credit-pending-badge">PENDING PAYMENT</span>
            )}
            {isPartiallyPaid && (
              <span className="credit-partial-badge">PARTIALLY PAID</span>
            )}
          </span>
          <span className={`status-badge ${order.status || "completed"}`}>
            {order.status || "completed"}
          </span>
        </div>

        <div className="order-actions" onClick={(e) => e.stopPropagation()}>
          {/* Payment Actions for Credit Orders */}
          {order.status !== "cancelled" && order.paymentMethod === "credit" && (
            <>
              {(isCreditPending || isPartiallyPaid) && (
                <button
                  className="action-btn payment-btn"
                  onClick={() => onRecordPayment(order)}
                  title="Record Payment"
                >
                  <FontAwesomeIcon icon={faMoneyCheck} />
                </button>
              )}
              {isCreditPending && (
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
          <div className="detail-item payment-method">
            <FontAwesomeIcon
              icon={paymentMethod.icon}
              style={{ color: paymentMethod.color }}
            />
            <span>
              {paymentMethod.name}
              {isCreditPending && " (Pending)"}
              {isPartiallyPaid && " (Partial)"}
            </span>
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

        {/* Payment Progress for Credit Orders */}
        {(isCreditPending || isPartiallyPaid) && (
          <div className="payment-progress-section">
            <div className="payment-progress-header">
              <span>Payment Progress</span>
              <span className="payment-amounts">
                ₱{(order.paidAmount || 0).toFixed(2)} of ₱
                {order.totalAmount.toFixed(2)}
              </span>
            </div>
            <div className="payment-progress-bar">
              <div
                className="payment-progress-fill"
                style={{ width: `${paymentProgress}%` }}
              >
                <span className="progress-text">{paymentProgress}%</span>
              </div>
            </div>
            <div className="payment-balance">
              Remaining: ₱
              {(order.remainingBalance || order.totalAmount).toFixed(2)}
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
