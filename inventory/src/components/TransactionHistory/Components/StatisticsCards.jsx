import React from "react";
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
} from "@fortawesome/free-solid-svg-icons";

const StatisticsCards = ({ orders }) => {
  const totalRevenue = orders
    .filter(
      (order) => order.status !== "cancelled" && order.paymentStatus === "paid"
    )
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const pendingPayments = orders.filter(
    (order) =>
      order.paymentMethod === "credit" &&
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

  const stats = [
    {
      icon: faDollarSign,
      value: `₱${totalRevenue.toFixed(2)}`,
      label: "Total Revenue (Paid)",
      className: "total-revenue",
    },
    {
      icon: faClock,
      value: `₱${totalPendingAmount.toFixed(2)}`,
      label: "Pending Payments",
      className: "pending-revenue",
    },
    {
      icon: faMoneyCheck,
      value: `₱${totalPaidAmount.toFixed(2)}`,
      label: "Total Collected",
      className: "collected-revenue",
    },
    {
      icon: faReceipt,
      value: orders.length,
      label: "Total Transactions",
      className: "total-orders",
    },
    // ... other stats
  ];

  return (
    <div className="stats-cards">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className={`stat-icon ${stat.className}`}>
            <FontAwesomeIcon icon={stat.icon} />
          </div>
          <div className="stat-info">
            <h3>{stat.value}</h3>
            <p>{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatisticsCards;
