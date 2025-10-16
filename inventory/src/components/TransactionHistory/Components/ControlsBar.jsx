import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faFilter,
  faSort,
  faCreditCard,
} from "@fortawesome/free-solid-svg-icons";

const ControlsBar = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterPayment,
  setFilterPayment,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}) => {
  return (
    <div className="controls-bar">
      <div className="search-container">
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
        <input
          type="text"
          placeholder="Search by customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="filter-controls">
        <div className="filter-group">
          <FontAwesomeIcon icon={faFilter} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="control-select"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="has_bad_order">Has Bad Order</option>
          </select>
        </div>

        <div className="filter-group">
          <FontAwesomeIcon icon={faCreditCard} />
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="control-select"
          >
            <option value="all">All Payments</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
            <option value="credit">Credit (All)</option>
            <option value="credit_pending">Credit (Pending)</option>
            <option value="credit_partial">Credit (Partial)</option>
          </select>
        </div>

        <div className="filter-group">
          <FontAwesomeIcon icon={faSort} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="control-select"
          >
            <option value="date">Date</option>
            <option value="totalAmount">Amount</option>
            <option value="totalItems">Items</option>
            <option value="customer">Customer</option>
            <option value="remainingBalance">Balance</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="control-select"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ControlsBar;
