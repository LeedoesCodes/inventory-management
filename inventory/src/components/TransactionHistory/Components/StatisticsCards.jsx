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
  faBoxOpen,
  faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";
import "./StatisticsCards.scss";

const StatisticsCards = ({ orders, customers = [], dateFilter }) => {
  const [showAll, setShowAll] = useState(false);

  // Helper function to get order date safely
  const getOrderDate = (order) => {
    return order.orderDate?.toDate
      ? order.orderDate.toDate()
      : new Date(order.orderDate || order.createdAt || Date.now());
  };

  // Helper function to check if date is today
  const isToday = (date) => {
    const today = new Date();
    const orderDate = new Date(date);
    return orderDate.toDateString() === today.toDateString();
  };

  // Helper function to check if date is in current month
  const isCurrentMonth = (date) => {
    const today = new Date();
    const orderDate = new Date(date);
    return (
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear()
    );
  };

  // Helper function to check if date is in current week (Sunday to Saturday)
  const isCurrentWeek = (date) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const orderDate = new Date(date);
    return orderDate >= startOfWeek && orderDate <= endOfWeek;
  };

  // Calculate all statistics from the FILTERED orders
  const totalRevenue = orders
    .filter(
      (order) => order.status !== "cancelled" && order.paymentStatus === "paid",
    )
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const pendingPayments = orders.filter(
    (order) =>
      (order.paymentMethod === "credit" ||
        order.paymentMethod === "pay_later") &&
      (order.paymentStatus === "pending" || order.paymentStatus === "partial"),
  );

  const totalPendingAmount = pendingPayments.reduce(
    (sum, order) => sum + (order.remainingBalance || order.totalAmount),
    0,
  );

  const totalPaidAmount = orders.reduce(
    (sum, order) => sum + (order.paidAmount || 0),
    0,
  );

  const creditOrders = orders.filter(
    (order) =>
      order.paymentMethod === "credit" || order.paymentMethod === "pay_later",
  );

  const totalCreditAmount = creditOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0,
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
    0,
  );

  const averageOrderValue =
    orders.length > 0 ? totalRevenue / orders.length : 0;

  const cancelledOrders = orders.filter(
    (order) => order.status === "cancelled",
  ).length;

  // NEW: Bad Orders Statistics
  const badOrders = orders.filter(
    (order) => order.hasBadOrder || order.badOrders?.length > 0,
  );
  const totalBadOrders = badOrders.length;

  // Calculate total refund amount from bad orders
  const totalBadOrderRefundAmount = badOrders.reduce((sum, order) => {
    const badOrderRefunds =
      order.badOrders?.reduce((badSum, badOrder) => {
        return badSum + (badOrder.totalRefundAmount || 0);
      }, 0) || 0;
    return sum + badOrderRefunds;
  }, 0);

  // Calculate items affected by bad orders
  const totalItemsAffectedByBadOrders = badOrders.reduce((sum, order) => {
    const itemsAffected =
      order.badOrders?.reduce((itemSum, badOrder) => {
        return itemSum + (badOrder.items?.length || 0);
      }, 0) || 0;
    return sum + itemsAffected;
  }, 0);

  // Calculate bad order rate
  const badOrderRate =
    orders.length > 0 ? (totalBadOrders / orders.length) * 100 : 0;

  // Today's sales - only orders from today
  const todaySales = orders
    .filter(
      (order) =>
        order.status !== "cancelled" &&
        order.paymentStatus === "paid" &&
        isToday(getOrderDate(order)),
    )
    .reduce((sum, order) => sum + order.totalAmount, 0);

  // Monthly sales - only orders from current month
  const monthlySales = orders
    .filter(
      (order) =>
        order.status !== "cancelled" &&
        order.paymentStatus === "paid" &&
        isCurrentMonth(getOrderDate(order)),
    )
    .reduce((sum, order) => sum + order.totalAmount, 0);

  // Weekly revenue - only paid and non-cancelled orders from current week
  const weeklyRevenue = orders
    .filter(
      (order) =>
        order.status !== "cancelled" &&
        order.paymentStatus === "paid" &&
        isCurrentWeek(getOrderDate(order)),
    )
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const totalItemsSold = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + (order.totalItems || 0), 0);

  const uniqueCustomers = [
    ...new Set(orders.map((order) => order.customerName).filter(Boolean)),
  ].length;

  const refundedOrders = orders.filter(
    (order) => order.status === "refunded",
  ).length;
  const totalRefundAmount = orders
    .filter((order) => order.status === "refunded")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const partialPayments = orders.filter(
    (order) => order.paymentStatus === "partial",
  ).length;

  const collectionRate =
    totalRevenue > 0 ? (totalPaidAmount / totalRevenue) * 100 : 0;

  // Get date context for descriptions
  const getDateContext = () => {
    if (!dateFilter) return "all time";

    if (dateFilter.dateRange === "today") return "today";
    if (dateFilter.dateRange === "yesterday") return "yesterday";
    if (dateFilter.dateRange === "thisWeek") return "this week";
    if (dateFilter.dateRange === "thisMonth") return "this month";
    if (dateFilter.dateRange === "custom") {
      if (dateFilter.startDate && dateFilter.endDate) {
        return "selected period";
      }
    }
    return "all time";
  };

  const dateContext = getDateContext();

  const stats = [
    // Financial Overview - Most important cards first
    {
      icon: faDollarSign,
      value: `₱${totalRevenue.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      label: "Total Revenue",
      description: `Paid and completed orders (${dateContext})`,
      className: "total-revenue",
      trend: "up",
      priority: 1,
    },
    {
      icon: faMoneyCheck,
      value: `₱${weeklyRevenue.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      label: "Weekly Revenue",
      description: "Paid revenue from current week",
      className: "weekly-revenue",
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
      description: `Sales from current month`,
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
      label: "Today's Revenue",
      description: `Revenue from today`,
      className: "today-sales",
      trend: "up",
      priority: 1,
    },

    // NEW: Bad Orders Statistics (High Priority - shows issues)
    {
      icon: faExclamationTriangle,
      value: totalBadOrders.toLocaleString(),
      label: "Bad Orders",
      description: `${badOrderRate.toFixed(
        1,
      )}% of total orders (${dateContext})`,
      className: "bad-orders",
      trend: totalBadOrders > 0 ? "warning" : "neutral",
      priority: 2,
    },
    {
      icon: faUndo,
      value: `₱${totalBadOrderRefundAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      label: "Bad Order Refunds",
      description: `Total refunded from bad orders (${dateContext})`,
      className: "bad-order-refunds",
      trend: totalBadOrderRefundAmount > 0 ? "down" : "neutral",
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
      description: `${pendingPayments.length} pending order(s) (${dateContext})`,
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
      description: `${overduePayments.length} overdue order(s) (${dateContext})`,
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
      description: `${creditOrders.length} credit transaction(s) (${dateContext})`,
      className: "total-credit",
      trend: "neutral",
      priority: 3,
    },

    // Order Metrics
    {
      icon: faReceipt,
      value: orders.length.toLocaleString(),
      label: "Total Transactions",
      description: `All orders (${dateContext})`,
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
      description: `Revenue per order (${dateContext})`,
      className: "average-order",
      trend: "up",
      priority: 3,
    },
    {
      icon: faBalanceScale,
      value: totalItemsSold.toLocaleString(),
      label: "Total Items Sold",
      description: `All products sold (${dateContext})`,
      className: "total-items",
      trend: "up",
      priority: 3,
    },

    // NEW: Additional Bad Order Metrics
    {
      icon: faBoxOpen,
      value: totalItemsAffectedByBadOrders.toLocaleString(),
      label: "Items in Bad Orders",
      description: `Products affected by quality issues (${dateContext})`,
      className: "bad-order-items",
      trend: totalItemsAffectedByBadOrders > 0 ? "warning" : "neutral",
      priority: 3,
    },

    // Customer & Performance Metrics
    {
      icon: faUsers,
      value: uniqueCustomers.toLocaleString(),
      label: "Unique Customers",
      description: `Total customer count (${dateContext})`,
      className: "unique-customers",
      trend: "up",
      priority: 3,
    },
    {
      icon: faPercentage,
      value: `${collectionRate.toFixed(1)}%`,
      label: "Collection Rate",
      description: `Payment collection efficiency (${dateContext})`,
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
        1,
      )}% cancellation rate (${dateContext})`,
      className: "cancelled-orders",
      trend: "down",
      priority: 3,
    },
    {
      icon: faUndo,
      value: refundedOrders.toLocaleString(),
      label: "Refunded Orders",
      description: `₱${totalRefundAmount.toFixed(
        2,
      )} total refunded (${dateContext})`,
      className: "refunded-orders",
      trend: "down",
      priority: 3,
    },
    {
      icon: faExchangeAlt,
      value: partialPayments.toLocaleString(),
      label: "Partial Payments",
      description: `Orders with partial payments (${dateContext})`,
      className: "partial-payments",
      trend: "warning",
      priority: 3,
    },
  ];

  // Sort by priority (lower number = higher priority)
  const sortedStats = [...stats].sort((a, b) => a.priority - b.priority);

  // First 4 cards (highest priority)
  const initialCards = sortedStats.slice(0, 4);

  // Remaining cards
  const additionalCards = sortedStats.slice(4);

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  return (
    <div className="statistics-cards-container">
      {/* Date Filter Indicator */}
      {dateFilter && dateFilter.dateRange !== "all" && (
        <div className="date-filter-indicator">
          <FontAwesomeIcon icon={faCalendarAlt} />
          <span>
            Showing data for: <strong>{getDateContext()}</strong>
            {dateFilter.dateRange === "custom" &&
              dateFilter.startDate &&
              dateFilter.endDate &&
              ` (${new Date(
                dateFilter.startDate,
              ).toLocaleDateString()} - ${new Date(
                dateFilter.endDate,
              ).toLocaleDateString()})`}
          </span>
        </div>
      )}

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
