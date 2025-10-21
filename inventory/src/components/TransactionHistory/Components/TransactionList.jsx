import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faReceipt } from "@fortawesome/free-solid-svg-icons";

import TransactionCard from "./TransactionCard";
import "./TransactionList.scss";

const TransactionList = ({
  orders,
  loading,
  searchTerm,
  filterStatus,
  filterPayment,
  sortBy,
  sortOrder,
  highlightedOrderId,
  onViewOrder,
  onRecordPayment,
  onMarkAsPaid,
  onBadOrder,
  onCancelOrder,
  onDeleteOrder,
}) => {
  // Use the orders as-is - filtering is already done in parent component
  const filteredOrders = orders;

  // Loading state
  if (loading) {
    return (
      <div className="loading">
        <FontAwesomeIcon icon={faReceipt} size="3x" />
        <p>Loading transactions...</p>
      </div>
    );
  }

  // Empty state
  if (filteredOrders.length === 0) {
    return (
      <div className="no-transactions">
        <FontAwesomeIcon icon={faReceipt} size="3x" />
        <p>No transactions found</p>
        {(searchTerm || filterStatus !== "all" || filterPayment !== "all") && (
          <p className="no-results-hint">
            Try adjusting your search or filters
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="transaction-list">
      <div className="transaction-list-header">
        <span className="results-count">
          Showing {filteredOrders.length} transaction
          {filteredOrders.length !== 1 ? "s" : ""}
        </span>
        {(searchTerm || filterStatus !== "all" || filterPayment !== "all") && (
          <span className="filter-indicator">• Filtered results</span>
        )}
      </div>

      {filteredOrders.map((order) => (
        <TransactionCard
          key={order.id}
          order={order}
          isHighlighted={highlightedOrderId === order.id}
          onView={() => onViewOrder(order)}
          onRecordPayment={() => onRecordPayment(order)}
          onMarkAsPaid={() => onMarkAsPaid(order)}
          onBadOrder={() => onBadOrder(order)}
          onCancelOrder={() => onCancelOrder(order)}
          onDeleteOrder={() => onDeleteOrder(order)}
        />
      ))}
    </div>
  );
};

export default TransactionList;
