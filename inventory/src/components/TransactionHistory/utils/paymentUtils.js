import {
  faMoneyBillWave,
  faUniversity,
  faFileInvoiceDollar,
  faCreditCard,
} from "@fortawesome/free-solid-svg-icons";

// Payment methods configuration - included directly in this file
export const paymentMethods = [
  {
    id: "cash",
    name: "Cash",
    icon: faMoneyBillWave,
    color: "#28a745",
    description: "Pay with cash",
  },
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    icon: faUniversity,
    color: "#007bff",
    description: "Bank transfer or GCash",
  },
  {
    id: "cheque",
    name: "Cheque",
    icon: faFileInvoiceDollar,
    color: "#6f42c1",
    description: "Pay with cheque",
  },
  {
    id: "credit",
    name: "Credit",
    icon: faCreditCard,
    color: "#fd7e14",
    description: "Pay later",
  },
];

/**
 * Get payment method information by ID
 * @param {string} paymentMethod - The payment method ID
 * @returns {Object} Payment method object
 */
export const getPaymentMethodInfo = (paymentMethod) => {
  return (
    paymentMethods.find((method) => method.id === paymentMethod) ||
    paymentMethods[0]
  );
};

/**
 * Calculate payment progress percentage
 * @param {Object} order - The order object
 * @returns {number} Payment progress percentage (0-100)
 */
export const getPaymentProgress = (order) => {
  const paidAmount = order.paidAmount || 0;
  const totalAmount = order.totalAmount || 1; // Avoid division by zero
  return Math.round((paidAmount / totalAmount) * 100);
};

/**
 * Calculate payment statistics from orders
 * @param {Array} orders - Array of order objects
 * @returns {Object} Payment statistics
 */
export const calculatePaymentStats = (orders) => {
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

  const totalTransactions = orders.length;
  const totalBadOrders = orders.filter((order) => order.hasBadOrder).length;
  const totalRefunds = orders.reduce((total, order) => {
    return total + (order.badOrderRefundAmount || 0);
  }, 0);

  return {
    totalRevenue,
    pendingPayments,
    totalPendingAmount,
    totalPaidAmount,
    totalTransactions,
    totalBadOrders,
    totalRefunds,
  };
};

/**
 * Check if an order is a credit order with pending payment
 * @param {Object} order - The order object
 * @returns {boolean} True if credit order with pending payment
 */
export const isCreditPending = (order) => {
  return order.paymentMethod === "credit" && order.paymentStatus === "pending";
};

/**
 * Check if an order is a credit order with partial payment
 * @param {Object} order - The order object
 * @returns {boolean} True if credit order with partial payment
 */
export const isCreditPartial = (order) => {
  return order.paymentMethod === "credit" && order.paymentStatus === "partial";
};

/**
 * Check if an order is fully paid
 * @param {Object} order - The order object
 * @returns {boolean} True if order is fully paid
 */
export const isFullyPaid = (order) => {
  return order.paymentStatus === "paid";
};

/**
 * Get remaining balance for an order
 * @param {Object} order - The order object
 * @returns {number} Remaining balance amount
 */
export const getRemainingBalance = (order) => {
  return (
    order.remainingBalance ||
    (order.paymentMethod === "credit" ? order.totalAmount : 0)
  );
};

export default {
  paymentMethods,
  getPaymentMethodInfo,
  getPaymentProgress,
  calculatePaymentStats,
  isCreditPending,
  isCreditPartial,
  isFullyPaid,
  getRemainingBalance,
};
