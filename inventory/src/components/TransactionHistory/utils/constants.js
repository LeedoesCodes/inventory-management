import {
  faMoneyBillWave,
  faUniversity,
  faFileInvoiceDollar,
  faCreditCard,
  faDollarSign,
  faClock,
  faMoneyCheck,
  faReceipt,
  faTimesCircle,
  faExclamationTriangle,
  faUndo,
} from "@fortawesome/free-solid-svg-icons";

// Payment Methods
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

// Order Status
export const ORDER_STATUS = {
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  PENDING: "pending",
};

// Payment Status
export const PAYMENT_STATUS = {
  PAID: "paid",
  PENDING: "pending",
  PARTIAL: "partial",
};

// Filter Options
export const FILTER_OPTIONS = {
  STATUS: [
    { value: "all", label: "All Status" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "has_bad_order", label: "Has Bad Order" },
  ],
  PAYMENT: [
    { value: "all", label: "All Payments" },
    { value: "cash", label: "Cash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cheque", label: "Cheque" },
    { value: "credit", label: "Credit (All)" },
    { value: "credit_pending", label: "Credit (Pending)" },
    { value: "credit_partial", label: "Credit (Partial)" },
  ],
};

// Statistics Icons
export const STATS_ICONS = {
  totalRevenue: faDollarSign,
  pendingRevenue: faClock,
  collectedRevenue: faMoneyCheck,
  totalOrders: faReceipt,
  creditOrders: faCreditCard,
  cancelledOrders: faTimesCircle,
  badOrders: faExclamationTriangle,
  totalRefunds: faUndo,
};

export default {
  paymentMethods,
  ORDER_STATUS,
  PAYMENT_STATUS,
  FILTER_OPTIONS,
  STATS_ICONS,
};
