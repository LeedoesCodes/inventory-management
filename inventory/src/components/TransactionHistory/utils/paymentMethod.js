import {
  faMoneyBillWave,
  faUniversity,
  faFileInvoiceDollar,
  faCreditCard,
} from "@fortawesome/free-solid-svg-icons";

export const paymentMethods = [
  { id: "cash", name: "Cash", icon: faMoneyBillWave, color: "#28a745" },
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    icon: faUniversity,
    color: "#007bff",
  },
  { id: "cheque", name: "Cheque", icon: faFileInvoiceDollar, color: "#6f42c1" },
  { id: "credit", name: "Credit", icon: faCreditCard, color: "#fd7e14" },
];

// Helper function to get payment method by ID
export const getPaymentMethodById = (id) => {
  return paymentMethods.find((method) => method.id === id) || paymentMethods[0];
};
