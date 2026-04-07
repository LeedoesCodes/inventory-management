import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faFilter,
  faSort,
  faCreditCard,
  faChevronDown,
  faChevronUp,
  faSlidersH,
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
  const getIsMobile = () =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false;

  const [isMobile, setIsMobile] = useState(getIsMobile);
  const [filtersOpen, setFiltersOpen] = useState(!getIsMobile());

  useEffect(() => {
    const handleResize = () => {
      const mobile = getIsMobile();
      setIsMobile(mobile);
      setFiltersOpen(!mobile);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check if any filter is active
  const hasActiveFilters =
    filterStatus !== "all" ||
    filterPayment !== "all" ||
    sortBy !== "date" ||
    sortOrder !== "desc";

  const showFilters = !isMobile || filtersOpen;

  return (
    <div className="controls-bar">
      {/* Top row: search + mobile filter toggle */}
      <div className="controls-top-row">
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search by customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className={`mobile-filter-toggle ${
            filtersOpen ? "open" : ""
          } ${hasActiveFilters ? "has-active" : ""}`}
          onClick={() => setFiltersOpen((prev) => !prev)}
          aria-expanded={filtersOpen}
          title="Toggle filters"
        >
          <FontAwesomeIcon icon={faSlidersH} />
          <span className="filter-toggle-label">Filters</span>
          {hasActiveFilters && <span className="active-dot" />}
          <FontAwesomeIcon
            icon={filtersOpen ? faChevronUp : faChevronDown}
            className="toggle-chevron"
          />
        </button>
      </div>

      {/* Filter controls: always visible on desktop, toggle on mobile */}
      {showFilters && (
        <div className={`filter-controls ${filtersOpen ? "mobile-open" : ""}`}>
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
              <option value="credit">Card/Credit (All)</option>
              <option value="credit_pending">Card/Credit (Pending)</option>
              <option value="credit_partial">Card/Credit (Partial)</option>
              <option value="overdue">Overdue</option>
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
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlsBar;
