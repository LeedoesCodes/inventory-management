export const applyFiltersAndSorting = (orders, filters) => {
  const { searchTerm, filterStatus, filterPayment, sortBy, sortOrder } =
    filters;

  let filtered = orders.filter((order) => {
    const matchesSearch = order.customerName
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "has_bad_order"
        ? order.hasBadOrder
        : order.status === filterStatus);

    const matchesPayment =
      filterPayment === "all" ||
      (filterPayment === "credit_pending"
        ? order.paymentMethod === "credit" && order.paymentStatus === "pending"
        : filterPayment === "credit_partial"
        ? order.paymentMethod === "credit" && order.paymentStatus === "partial"
        : order.paymentMethod === filterPayment);

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Apply sorting
  return [...filtered].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    if (aValue === undefined || aValue === null) aValue = "";
    if (bValue === undefined || bValue === null) bValue = "";

    if (
      sortBy === "totalAmount" ||
      sortBy === "totalItems" ||
      sortBy === "remainingBalance"
    ) {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;

      if (sortOrder === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    } else if (sortBy === "date") {
      aValue = a.createdAt;
      bValue = b.createdAt;

      if (sortOrder === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    } else if (sortBy === "customer") {
      aValue = String(a.customerName || "Walk-in Customer").toLowerCase();
      bValue = String(b.customerName || "Walk-in Customer").toLowerCase();

      if (sortOrder === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    }

    return 0;
  });
};
