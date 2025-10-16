import { getPaymentMethodInfo, getPaymentProgress } from "./paymentUtils";

/**
 * Print receipt for an order
 * @param {Object} order - The order object
 */
export const printReceipt = (order) => {
  const printWindow = window.open("", "_blank");
  const paymentMethod = getPaymentMethodInfo(order.paymentMethod);
  const paymentProgress = getPaymentProgress(order);

  const receiptContent = generateReceiptHTML(
    order,
    paymentMethod,
    paymentProgress
  );

  printWindow.document.write(receiptContent);
  printWindow.document.close();
  printWindow.print();
};

/**
 * Generate receipt HTML content
 * @param {Object} order - The order object
 * @param {Object} paymentMethod - Payment method info
 * @param {number} paymentProgress - Payment progress percentage
 * @returns {string} HTML content for receipt
 */
const generateReceiptHTML = (order, paymentMethod, paymentProgress) => {
  const isCreditPending =
    order.paymentMethod === "credit" && order.paymentStatus === "pending";
  const isPartiallyPaid =
    order.paymentMethod === "credit" && order.paymentStatus === "partial";
  const isFullyPaid = order.paymentStatus === "paid";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - Order ${order.id}</title>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            margin: 10px;
            background: white;
          }
          
          .receipt {
            max-width: 300px;
            margin: 0 auto;
            padding: 15px;
            border: 1px solid #ddd;
          }
          
          .header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #000;
          }
          
          .header h1 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          
          .header .store-info {
            font-size: 10px;
            margin-bottom: 5px;
          }
          
          .order-info {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #000;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          
          .info-label {
            font-weight: bold;
          }
          
          .status-badge {
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .status-completed {
            background: #d4edda;
            color: #155724;
          }
          
          .status-cancelled {
            background: #f8d7da;
            color: #721c24;
          }
          
          .status-pending {
            background: #fff3cd;
            color: #856404;
          }
          
          .payment-info {
            background: #f8f9fa;
            padding: 8px;
            margin: 10px 0;
            border-radius: 4px;
            border: 1px solid #dee2e6;
          }
          
          .payment-status {
            font-weight: bold;
          }
          
          .payment-paid {
            color: #28a745;
          }
          
          .payment-pending {
            color: #fd7e14;
          }
          
          .payment-partial {
            color: #ffc107;
          }
          
          .payment-details {
            margin-top: 5px;
            font-size: 10px;
          }
          
          .payment-progress {
            margin: 8px 0;
          }
          
          .progress-bar {
            background: #e9ecef;
            border-radius: 10px;
            height: 15px;
            overflow: hidden;
            margin: 3px 0;
          }
          
          .progress-fill {
            background: #28a745;
            height: 100%;
            border-radius: 10px;
            text-align: center;
            color: white;
            font-size: 9px;
            line-height: 15px;
            font-weight: bold;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          
          .items-table th {
            text-align: left;
            padding: 5px 0;
            border-bottom: 1px dashed #000;
            font-weight: bold;
          }
          
          .items-table td {
            padding: 3px 0;
            border-bottom: 1px dashed #ddd;
          }
          
          .items-table .quantity {
            text-align: center;
            width: 40px;
          }
          
          .items-table .price, 
          .items-table .subtotal {
            text-align: right;
            width: 60px;
          }
          
          .totals {
            margin: 10px 0;
            padding-top: 10px;
            border-top: 1px dashed #000;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          
          .grand-total {
            font-weight: bold;
            font-size: 14px;
            border-top: 2px solid #000;
            padding-top: 5px;
            margin-top: 5px;
          }
          
          .refund-amount {
            color: #dc3545;
          }
          
          .payment-history {
            margin: 10px 0;
            padding-top: 10px;
            border-top: 1px dashed #000;
          }
          
          .payment-record {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
            font-size: 10px;
            padding: 2px 0;
            border-bottom: 1px dashed #eee;
          }
          
          .payment-record:last-child {
            border-bottom: none;
          }
          
          .payment-amount {
            font-weight: bold;
            color: #28a745;
          }
          
          .payment-date {
            color: #666;
          }
          
          .payment-method {
            color: #666;
            font-style: italic;
          }
          
          .bad-order-notice {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 8px;
            margin: 10px 0;
            border-radius: 4px;
            font-size: 10px;
          }
          
          .cancelled-notice {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            padding: 10px;
            margin: 10px 0;
            text-align: center;
            font-weight: bold;
            border-radius: 4px;
          }
          
          .credit-notice {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 8px;
            margin: 10px 0;
            border-radius: 4px;
            font-size: 10px;
            text-align: center;
          }
          
          .partial-payment-notice {
            background: #e3f2fd;
            border: 1px solid #bbdefb;
            padding: 8px;
            margin: 10px 0;
            border-radius: 4px;
            font-size: 10px;
            text-align: center;
          }
          
          .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px dashed #000;
            font-size: 10px;
            color: #666;
          }
          
          @media print {
            body {
              margin: 0;
            }
            .receipt {
              border: none;
              max-width: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          ${generateReceiptHeader(order)}
          ${generateOrderInfo(order)}
          ${generatePaymentInfo(
            order,
            paymentMethod,
            paymentProgress,
            isCreditPending,
            isPartiallyPaid,
            isFullyPaid
          )}
          ${generateItemsTable(order)}
          ${generateTotals(order, isPartiallyPaid)}
          ${generatePaymentHistory(order)}
          ${generateSpecialNotices(
            order,
            isCreditPending,
            isPartiallyPaid,
            isFullyPaid
          )}
          ${generateFooter()}
        </div>
      </body>
    </html>
  `;
};

/**
 * Generate receipt header
 */
const generateReceiptHeader = (order) => {
  return `
    <div class="header">
      <h1>ORDER RECEIPT</h1>
      <div class="store-info">Your Store Name</div>
      <div class="store-info">Contact: +1234567890</div>
      <div class="order-info">
        <div class="info-row">
          <span class="info-label">Receipt No:</span>
          <span>${order.id.slice(-8)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span>${order.createdAt.toLocaleString()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="status-badge status-${order.status || "completed"}">
            ${(order.status || "completed").toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  `;
};

/**
 * Generate order information
 */
const generateOrderInfo = (order) => {
  return `
    <div class="order-info">
      <div class="info-row">
        <span class="info-label">Customer:</span>
        <span>${order.customerName || "Walk-in Customer"}</span>
      </div>
      ${
        order.status === "cancelled" && order.cancelledAt
          ? `
        <div class="info-row">
          <span class="info-label">Cancelled:</span>
          <span>${
            order.cancelledAt.toLocaleString?.() || new Date().toLocaleString()
          }</span>
        </div>
      `
          : ""
      }
    </div>
  `;
};

/**
 * Generate payment information
 */
const generatePaymentInfo = (
  order,
  paymentMethod,
  paymentProgress,
  isCreditPending,
  isPartiallyPaid,
  isFullyPaid
) => {
  let paymentStatusText = "";
  let paymentStatusClass = "";

  if (isFullyPaid) {
    paymentStatusText = "PAID IN FULL";
    paymentStatusClass = "payment-paid";
  } else if (isPartiallyPaid) {
    paymentStatusText = "PARTIALLY PAID";
    paymentStatusClass = "payment-partial";
  } else if (isCreditPending) {
    paymentStatusText = "PENDING PAYMENT";
    paymentStatusClass = "payment-pending";
  } else {
    paymentStatusText = "PAID";
    paymentStatusClass = "payment-paid";
  }

  const paidAmount = order.paidAmount || 0;
  const remainingBalance =
    order.remainingBalance || (isCreditPending ? order.totalAmount : 0);

  return `
    <div class="payment-info">
      <div class="info-row">
        <span class="info-label">Payment Method:</span>
        <span>${paymentMethod.name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment Status:</span>
        <span class="payment-status ${paymentStatusClass}">${paymentStatusText}</span>
      </div>
      
      ${
        isCreditPending || isPartiallyPaid
          ? `
        <div class="payment-details">
          <div class="info-row">
            <span>Amount Paid:</span>
            <span>₱${paidAmount.toFixed(2)}</span>
          </div>
          <div class="info-row">
            <span>Remaining Balance:</span>
            <span>₱${remainingBalance.toFixed(2)}</span>
          </div>
        </div>
        <div class="payment-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${paymentProgress}%">
              ${paymentProgress}%
            </div>
          </div>
        </div>
      `
          : ""
      }
      
      ${
        order.paidAt
          ? `
        <div class="info-row">
          <span class="info-label">Paid At:</span>
          <span>${order.paidAt.toLocaleString?.() || ""}</span>
        </div>
      `
          : ""
      }
    </div>
  `;
};

/**
 * Generate items table
 */
const generateItemsTable = (order) => {
  return `
    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th class="quantity">Qty</th>
          <th class="price">Price</th>
          <th class="subtotal">Total</th>
        </tr>
      </thead>
      <tbody>
        ${order.items
          .map(
            (item) => `
          <tr>
            <td>${item.name}</td>
            <td class="quantity">${item.quantity}</td>
            <td class="price">₱${item.price.toFixed(2)}</td>
            <td class="subtotal">₱${item.subtotal.toFixed(2)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
};

/**
 * Generate totals section
 */
const generateTotals = (order, isPartiallyPaid) => {
  const paidAmount = order.paidAmount || 0;
  const remainingBalance = order.remainingBalance || order.totalAmount;

  return `
    <div class="totals">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>₱${order.totalAmount.toFixed(2)}</span>
      </div>
      
      ${
        order.hasBadOrder
          ? `
        <div class="total-row refund-amount">
          <span>Refunded:</span>
          <span>-₱${(order.badOrderRefundAmount || 0).toFixed(2)}</span>
        </div>
      `
          : ""
      }
      
      ${
        isPartiallyPaid
          ? `
        <div class="total-row">
          <span>Amount Paid:</span>
          <span>₱${paidAmount.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>Balance Due:</span>
          <span>₱${remainingBalance.toFixed(2)}</span>
        </div>
      `
          : ""
      }
      
      <div class="total-row grand-total">
        <span>${isPartiallyPaid ? "Original Total:" : "Total Amount:"}</span>
        <span>₱${order.totalAmount.toFixed(2)}</span>
      </div>
    </div>
  `;
};

/**
 * Generate payment history
 */
const generatePaymentHistory = (order) => {
  if (!order.paymentHistory || order.paymentHistory.length === 0) {
    return "";
  }

  return `
    <div class="payment-history">
      <div style="font-weight: bold; margin-bottom: 5px; text-align: center;">PAYMENT HISTORY</div>
      ${order.paymentHistory
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(
          (payment) => `
          <div class="payment-record">
            <span class="payment-amount">₱${payment.amount.toFixed(2)}</span>
            <span class="payment-date">${
              payment.date.toDate?.().toLocaleDateString() ||
              new Date(payment.date).toLocaleDateString()
            }</span>
            <span class="payment-method">${payment.paymentMethod}</span>
          </div>
        `
        )
        .join("")}
    </div>
  `;
};

/**
 * Generate special notices
 */
const generateSpecialNotices = (
  order,
  isCreditPending,
  isPartiallyPaid,
  isFullyPaid
) => {
  let notices = "";

  if (order.hasBadOrder) {
    notices += `
      <div class="bad-order-notice">
        <strong>⚠️ BAD ORDER PROCESSED</strong><br>
        Refund Amount: ₱${(order.badOrderRefundAmount || 0).toFixed(2)}
      </div>
    `;
  }

  if (order.status === "cancelled") {
    notices += `
      <div class="cancelled-notice">
        ORDER CANCELLED
      </div>
    `;
  }

  if (isCreditPending) {
    const remainingBalance = order.remainingBalance || order.totalAmount;
    notices += `
      <div class="credit-notice">
        <strong>CREDIT ORDER - PENDING PAYMENT</strong><br>
        Please settle your balance of ₱${remainingBalance.toFixed(2)}
      </div>
    `;
  }

  if (isPartiallyPaid) {
    const remainingBalance = order.remainingBalance || order.totalAmount;
    notices += `
      <div class="partial-payment-notice">
        <strong>PARTIAL PAYMENT RECEIVED</strong><br>
        Thank you for your payment of ₱${(order.paidAmount || 0).toFixed(2)}<br>
        Remaining balance: ₱${remainingBalance.toFixed(2)}
      </div>
    `;
  }

  if (isFullyPaid && order.paymentMethod === "credit") {
    notices += `
      <div class="credit-notice" style="background: #d4edda; border-color: #c3e6cb;">
        <strong>CREDIT ORDER - PAID IN FULL</strong><br>
        Thank you for settling your account
      </div>
    `;
  }

  return notices;
};

/**
 * Generate receipt footer
 */
const generateFooter = () => {
  return `
    <div class="footer">
      <div>Thank you for your business!</div>
      <div>For inquiries: contact@yourstore.com</div>
      <div>Generated on: ${new Date().toLocaleString()}</div>
    </div>
  `;
};

/**
 * Generate a simple receipt for quick printing (minimal information)
 * @param {Object} order - The order object
 */
export const printQuickReceipt = (order) => {
  const printWindow = window.open("", "_blank");
  const paymentMethod = getPaymentMethodInfo(order.paymentMethod);

  const quickReceiptContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Quick Receipt - Order ${order.id}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; margin: 10px; }
          .header { text-align: center; margin-bottom: 10px; }
          .items { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .items td { padding: 2px 0; }
          .total { font-weight: bold; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <strong>QUICK RECEIPT</strong><br>
          Order: ${order.id.slice(-8)}<br>
          ${order.createdAt.toLocaleDateString()}
        </div>
        <table class="items">
          ${order.items
            .map(
              (item) => `
            <tr>
              <td>${item.name}</td>
              <td>×${item.quantity}</td>
              <td>₱${item.subtotal.toFixed(2)}</td>
            </tr>
          `
            )
            .join("")}
        </table>
        <div class="total">
          Total: ₱${order.totalAmount.toFixed(2)}<br>
          Payment: ${paymentMethod.name}<br>
          ${order.paymentStatus === "pending" ? "Status: PENDING PAYMENT" : ""}
          ${
            order.paymentStatus === "partial"
              ? `Status: PARTIAL (Paid: ₱${(order.paidAmount || 0).toFixed(2)})`
              : ""
          }
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(quickReceiptContent);
  printWindow.document.close();
  printWindow.print();
};

export default {
  printReceipt,
  printQuickReceipt,
  generateReceiptHTML,
};
