import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDollarSign,
  faClock,
  faMoneyCheck,
  faReceipt,
  faCreditCard,
  faTimesCircle,
  faExclamationTriangle,
  faUndo,
  faChartLine,
  faUsers,
  faShoppingCart,
  faCalendarAlt,
  faPercentage,
  faExchangeAlt,
  faBalanceScale,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import "./StatisticsCards.scss";

const StatisticsCards = ({ orders, customers = [] }) => {
  const [showAll, setShowAll] = useState(false);

  // Calculate all statistics (your existing code)
  const totalRevenue = orders
    .filter(
      (order) => order.status !== "cancelled" && order.paymentStatus === "paid"
    )
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const pendingPayments = orders.filter(
    (order) =>
      (order.paymentMethod === "credit" ||
        order.paymentMethod === "pay_later") &&
      (order.paymentStatus === "pending" || order.paymentStatus === "partial")
  );

  const totalPendingAmount = pendingPayments.reduce(
    (sum, order) => sum + (order.remainingBalance || order.totalAmount),
    0
  );

  const totalPaidAmount = orders.reduce(
    (sum, order) => sum + (order.paidAmount || 0),
    0
  );

  const creditOrders = orders.filter(
    (order) =>
      order.paymentMethod === "credit" || order.paymentMethod === "pay_later"
  );

  const totalCreditAmount = creditOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );

  const overduePayments = pendingPayments.filter((order) => {
    if (!order.dueDate) return false;
    const dueDate = order.dueDate.toDate
      ? order.dueDate.toDate()
      : new Date(order.dueDate);
    return dueDate < new Date();
  });

  const totalOverdueAmount = overduePayments.reduce(
    (sum, order) => sum + (order.remainingBalance || order.totalAmount),
    0
  );

  const averageOrderValue =
    orders.length > 0 ? totalRevenue / orders.length : 0;

  const cancelledOrders = orders.filter(
    (order) => order.status === "cancelled"
  ).length;

  const today = new Date();
  const todaySales = orders
    .filter((order) => {
      const orderDate = order.createdAt?.toDate
        ? order.createdAt.toDate()
        : new Date(order.createdAt);
      return (
        orderDate.toDateString() === today.toDateString() &&
        order.status !== "cancelled" &&
        order.paymentStatus === "paid"
      );
    })
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const monthlySales = orders
    .filter((order) => {
      const orderDate = order.createdAt?.toDate
        ? order.createdAt.toDate()
        : new Date(order.createdAt);
      return (
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getFullYear() === today.getFullYear() &&
        order.status !== "cancelled" &&
        order.paymentStatus === "paid"
      );
    })
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const paymentMethodBreakdown = {
    cash: orders.filter((order) => order.paymentMethod === "cash").length,
    credit: orders.filter(
      (order) =>
        order.paymentMethod === "credit" || order.paymentMethod === "pay_later"
    ).length,
    online: orders.filter((order) => order.paymentMethod === "online").length,
  };

  // New additional stats
  const totalItemsSold = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + (order.totalItems || 0), 0);

  const uniqueCustomers = [
    ...new Set(orders.map((order) => order.customerName).filter(Boolean)),
  ].length;

  const refundedOrders = orders.filter(
    (order) => order.status === "refunded"
  ).length;
  const totalRefundAmount = orders
    .filter((order) => order.status === "refunded")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const partialPayments = orders.filter(
    (order) => order.paymentStatus === "partial"
  ).length;

  const collectionRate =
    totalRevenue > 0 ? (totalPaidAmount / totalRevenue) * 100 : 0;

  const stats = [
    // Financial Overview - Most important cards first
    {
      icon: faDollarSign,
      value: `₱${totalRevenue.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      label: "Total Revenue",
      description: "Paid and completed orders",
      className: "total-revenue",
      trend: "up",
      priority: 1, // High priority - always show first
    },
    {
      icon: faMoneyCheck,
      value: `₱${totalPaidAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      label: "Total Collected",
      description: "Actual cash collected",
      className: "collected-revenue",
      trend: "up",
      priority: 1,
    },
    {
      icon: faChartLine,
      value: `₱${monthlySales.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      label: "Monthly Sales",
      description: "Current month revenue",
      className: "monthly-sales",
      trend: "up",
      priority: 1,
    },
    {
      icon: faCalendarAlt,
      value: `₱${todaySales.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      label: "Today's Sales",
      description: "Revenue from today",
      className: "today-sales",
      trend: "up",
      priority: 2,
    },

    // Credit & Pending
    {
      icon: faClock,
      value: `₱${totalPendingAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      label: "Pending Payments",
      description: `${pendingPayments.length} pending order(s)`,
      className: "pending-revenue",
      trend: pendingPayments.length > 0 ? "warning" : "neutral",
      priority: 2,
    },
    {
      icon: faExclamationTriangle,
      value: `₱${totalOverdueAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      label: "Overdue Payments",
      description: `${overduePayments.length} overdue order(s)`,
      className: "overdue-revenue",
      trend: overduePayments.length > 0 ? "down" : "neutral",
      priority: 2,
    },
    {
      icon: faCreditCard,
      value: `₱${totalCreditAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      label: "Total Credit Given",
      description: `${creditOrders.length} credit transaction(s)`,
      className: "total-credit",
      trend: "neutral",
      priority: 3,
    },

    // Order Metrics
    {
      icon: faReceipt,
      value: orders.length.toLocaleString(),
      label: "Total Transactions",
      description: "All time orders",
      className: "total-orders",
      trend: "up",
      priority: 2,
    },
    {
      icon: faShoppingCart,
      value: `₱${averageOrderValue.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      label: "Average Order Value",
      description: "Revenue per order",
      className: "average-order",
      trend: "up",
      priority: 3,
    },
    {
      icon: faBalanceScale,
      value: totalItemsSold.toLocaleString(),
      label: "Total Items Sold",
      description: "All products sold",
      className: "total-items",
      trend: "up",
      priority: 3,
    },

    // Customer & Performance Metrics
    {
      icon: faUsers,
      value: uniqueCustomers.toLocaleString(),
      label: "Unique Customers",
      description: "Total customer count",
      className: "unique-customers",
      trend: "up",
      priority: 3,
    },
    {
      icon: faPercentage,
      value: `${collectionRate.toFixed(1)}%`,
      label: "Collection Rate",
      description: "Payment collection efficiency",
      className: "collection-rate",
      trend:
        collectionRate > 80 ? "up" : collectionRate > 60 ? "warning" : "down",
      priority: 3,
    },

    // Risk & Cancellation Metrics
    {
      icon: faTimesCircle,
      value: cancelledOrders.toLocaleString(),
      label: "Cancelled Orders",
      description: `${((cancelledOrders / orders.length) * 100 || 0).toFixed(
        1
      )}% cancellation rate`,
      className: "cancelled-orders",
      trend: "down",
      priority: 3,
    },
    {
      icon: faUndo,
      value: refundedOrders.toLocaleString(),
      label: "Refunded Orders",
      description: `₱${totalRefundAmount.toFixed(2)} total refunded`,
      className: "refunded-orders",
      trend: "down",
      priority: 3,
    },
    {
      icon: faExchangeAlt,
      value: partialPayments.toLocaleString(),
      label: "Partial Payments",
      description: "Orders with partial payments",
      className: "partial-payments",
      trend: "warning",
      priority: 3,
    },
  ];

  // Sort by priority (lower number = higher priority)
  const sortedStats = [...stats].sort((a, b) => a.priority - b.priority);

  // First 3 cards (highest priority)
  const initialCards = sortedStats.slice(0, 3);

  // Remaining cards
  const additionalCards = sortedStats.slice(3);

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  return (
    <div className="statistics-cards-container">
      {/* Always visible cards */}
      {initialCards.map((stat, index) => (
        <div
          key={index}
          className={`statistics-card statistics-card--${stat.className}`}
        >
          <div className="statistics-card__content">
            <div className="statistics-card__icon">
              <FontAwesomeIcon icon={stat.icon} />
            </div>
            <div className="statistics-card__main">
              <h3 className="statistics-card__value">{stat.value}</h3>
              <span className="statistics-card__label">{stat.label}</span>
            </div>
            <div className="statistics-card__description">
              {stat.description}
            </div>
          </div>
          <div
            className={`statistics-card__trend statistics-card__trend--${stat.trend}`}
          >
            {stat.trend === "up" && "↑"}
            {stat.trend === "down" && "↓"}
            {stat.trend === "warning" && "⚠"}
            {stat.trend === "neutral" && "●"}
          </div>
        </div>
      ))}

      {/* Show More/Show Less toggle */}
      {additionalCards.length > 0 && (
        <div className="statistics-cards-toggle">
          <button
            className="statistics-cards-toggle__button"
            onClick={toggleShowAll}
          >
            <span>
              {showAll ? "Show Less" : `Show ${additionalCards.length} More`}
            </span>
            <FontAwesomeIcon
              icon={showAll ? faChevronUp : faChevronDown}
              className="statistics-cards-toggle__icon"
            />
          </button>
        </div>
      )}

      {/* Additional cards - conditionally rendered */}
      {showAll &&
        additionalCards.map((stat, index) => (
          <div
            key={index + initialCards.length}
            className={`statistics-card statistics-card--${stat.className}`}
          >
            <div className="statistics-card__content">
              <div className="statistics-card__icon">
                <FontAwesomeIcon icon={stat.icon} />
              </div>
              <div className="statistics-card__main">
                <h3 className="statistics-card__value">{stat.value}</h3>
                <span className="statistics-card__label">{stat.label}</span>
              </div>
              <div className="statistics-card__description">
                {stat.description}
              </div>
            </div>
            <div
              className={`statistics-card__trend statistics-card__trend--${stat.trend}`}
            >
              {stat.trend === "up" && "↑"}
              {stat.trend === "down" && "↓"}
              {stat.trend === "warning" && "⚠"}
              {stat.trend === "neutral" && "●"}
            </div>
          </div>
        ))}
    </div>
  );
};

export default StatisticsCards;
