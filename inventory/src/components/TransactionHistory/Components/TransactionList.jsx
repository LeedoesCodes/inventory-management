import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faReceipt } from "@fortawesome/free-solid-svg-icons";

// Import utils
import { applyFiltersAndSorting } from "../utils/filters";
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
  // Apply filters and sorting
  const filteredOrders = applyFiltersAndSorting(orders, {
    searchTerm,
    filterStatus,
    filterPayment,
    sortBy,
    sortOrder,
  });

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
          Showing {filteredOrders.length} of {orders.length} transactions
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
