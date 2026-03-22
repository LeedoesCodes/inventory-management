// src/components/TransactionHistory/utils/receiptUtils.js
import { getPaymentMethodInfo, getPaymentProgress } from "./paymentUtils";

// Helper function to get ordered items for receipts
const getOrderedItemsForReceipt = (order) => {
  if (!order || !order.items) return [];

  // If order has explicit itemSelectionOrder, use it
  if (order.itemSelectionOrder && order.itemSelectionOrder.length > 0) {
    const itemMap = {};
    order.items.forEach((item) => {
      itemMap[item.id] = item;
    });

    return order.itemSelectionOrder
      .map((itemId) => itemMap[itemId])
      .filter((item) => item !== undefined);
  }

  // Fallback: If items have displayOrder property, sort by it
  if (order.items[0]?.displayOrder) {
    return [...order.items].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  // Default: return items as-is
  return order.items;
};

/**
 * Print receipt for an order
 * @param {Object} order - The order object
 */
export const printReceipt = (order) => {
  const printWindow = window.open("", "_blank");

  const paymentMethod = getPaymentMethodInfo(order.paymentMethod);

  // Calculate payment progress considering bad order adjustments
  const paymentProgress = getPaymentProgress(order);

  const receiptContent = generateReceiptHTML(
    order,
    paymentMethod,
    paymentProgress
  );

  printWindow.document.write(receiptContent);
  printWindow.document.close();

  // Use setTimeout to ensure content is rendered before printing
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 500);
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

  // Get ordered items
  const displayItems = getOrderedItemsForReceipt(order);

  // Calculate totals considering bad orders
  const subtotal =
    displayItems?.reduce((sum, item) => sum + item.price * item.quantity, 0) ||
    0;
  const discount = order.discount || 0;
  const tax = order.tax || 0;
  const originalGrandTotal = subtotal - discount + (tax || 0);

  // Calculate total refund from bad orders
  const totalBadOrderRefund =
    order.badOrders?.reduce((total, badOrder) => {
      return total + (badOrder.refundAmount || 0);
    }, 0) || 0;

  const adjustedGrandTotal = Math.max(
    0,
    originalGrandTotal - totalBadOrderRefund
  );

  const totalPaid =
    order.paymentHistory?.reduce((sum, payment) => sum + payment.amount, 0) ||
    0;
  const balanceDue = adjustedGrandTotal - totalPaid;

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
            vertical-align: top;
          }
          
          .items-table .item-number {
            text-align: center;
            width: 25px;
            font-weight: bold;
            color: #666;
          }
          
          .items-table .item-name {
            text-align: left;
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
          
          .bad-order-item {
            color: #dc3545;
            font-style: italic;
          }
          
          .bad-pieces-note {
            font-size: 9px;
            color: #dc3545;
            display: block;
            margin-top: 2px;
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
          
          .bad-order-adjustment {
            color: #dc3545;
            font-style: italic;
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
            isFullyPaid,
            adjustedGrandTotal,
            balanceDue
          )}
          ${generateItemsTable(displayItems)}
          ${generateTotals(
            order,
            isPartiallyPaid,
            originalGrandTotal,
            totalBadOrderRefund,
            adjustedGrandTotal,
            totalPaid,
            balanceDue
          )}
          ${generatePaymentHistory(order)}
          ${generateSpecialNotices(
            order,
            isCreditPending,
            isPartiallyPaid,
            isFullyPaid,
            totalBadOrderRefund
          )}
          ${generateFooter()}
        </div>
        <script>
          // Auto print after a short delay to ensure content is rendered
          setTimeout(function() {
            window.print();
          }, 100);
        </script>
      </body>
    </html>
  `;
};

/**
 * Generate receipt header
 */
const generateReceiptHeader = (order) => {
  // Safely handle date
  let orderDate;
  try {
    if (order.createdAt && order.createdAt.toDate) {
      orderDate = order.createdAt.toDate();
    } else if (order.createdAt instanceof Date) {
      orderDate = order.createdAt;
    } else if (order.createdAt) {
      orderDate = new Date(order.createdAt);
    } else {
      orderDate = new Date();
    }
  } catch (error) {
    orderDate = new Date();
  }

  return `
    <div class="header">
      <h1>ORDER RECEIPT</h1>
      <div class="store-info">Freddie Food Wholesaling</div>
      <div class="store-info">Contact: 09855007680</div>
      <div class="order-info">
        <div class="info-row">
          <span class="info-label">Receipt No:</span>
          <span>${order.id ? order.id.slice(-8) : "N/A"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span>${orderDate.toLocaleString()}</span>
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
  // Safely handle cancelled date
  let cancelledDate = "";
  if (order.status === "cancelled" && order.cancelledAt) {
    try {
      if (
        order.cancelledAt.toDate &&
        typeof order.cancelledAt.toDate === "function"
      ) {
        cancelledDate = order.cancelledAt.toDate().toLocaleString();
      } else if (order.cancelledAt instanceof Date) {
        cancelledDate = order.cancelledAt.toLocaleString();
      } else {
        cancelledDate = new Date(order.cancelledAt).toLocaleString();
      }
    } catch (error) {
      cancelledDate = new Date().toLocaleString();
    }
  }

  return `
    <div class="order-info">
      <div class="info-row">
        <span class="info-label">Customer:</span>
        <span>${order.customerName || "Walk-in Customer"}</span>
      </div>
      ${
        order.status === "cancelled" && cancelledDate
          ? `
        <div class="info-row">
          <span class="info-label">Cancelled:</span>
          <span>${cancelledDate}</span>
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
  isFullyPaid,
  adjustedGrandTotal,
  balanceDue
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

  // Safely handle paidAt date
  let paidAtDate = "";
  if (order.paidAt) {
    try {
      if (order.paidAt.toDate && typeof order.paidAt.toDate === "function") {
        paidAtDate = order.paidAt.toDate().toLocaleString();
      } else if (order.paidAt instanceof Date) {
        paidAtDate = order.paidAt.toLocaleString();
      } else {
        paidAtDate = new Date(order.paidAt).toLocaleString();
      }
    } catch (error) {
      paidAtDate = "";
    }
  }

  return `
    <div class="payment-info">
      <div class="info-row">
        <span class="info-label">Payment Method:</span>
        <span>${paymentMethod?.name || "Cash"}</span>
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
            <span>Adjusted Total:</span>
            <span>₱${adjustedGrandTotal.toFixed(2)}</span>
          </div>
          <div class="info-row">
            <span>Amount Paid:</span>
            <span>₱${paidAmount.toFixed(2)}</span>
          </div>
          <div class="info-row">
            <span>Remaining Balance:</span>
            <span>₱${balanceDue.toFixed(2)}</span>
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
        paidAtDate
          ? `
        <div class="info-row">
          <span class="info-label">Paid At:</span>
          <span>${paidAtDate}</span>
        </div>
      `
          : ""
      }
    </div>
  `;
};

/**
 * Generate items table with order numbers
 */
const generateItemsTable = (displayItems) => {
  if (!displayItems || !Array.isArray(displayItems)) {
    return "<div>No items found</div>";
  }

  return `
    <table class="items-table">
      <thead>
        <tr>
          <th class="item-number">#</th>
          <th class="item-name">Item</th>
          <th class="quantity">Qty</th>
          <th class="price">Price</th>
          <th class="subtotal">Total</th>
        </tr>
      </thead>
      <tbody>
        ${displayItems
          .map(
            (item, index) => `
            <tr class="${item.badPieces > 0 ? "bad-order-item" : ""}">
              <td class="item-number">${index + 1}</td>
              <td class="item-name">
                ${item.name || `Item ${index + 1}`}
                ${
                  item.badPieces > 0
                    ? `
                  <span class="bad-pieces-note">(${item.badPieces} bad pieces)</span>
                `
                    : ""
                }
              </td>
              <td class="quantity">${item.quantity || 0} ${
              item.unit || "pcs"
            }</td>
              <td class="price">₱${(item.price || 0).toFixed(2)}</td>
              <td class="subtotal">₱${(
                (item.price || 0) * (item.quantity || 0)
              ).toFixed(2)}</td>
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
const generateTotals = (
  order,
  isPartiallyPaid,
  originalGrandTotal,
  totalBadOrderRefund,
  adjustedGrandTotal,
  totalPaid,
  balanceDue
) => {
  const hasBadOrders = totalBadOrderRefund > 0;

  return `
    <div class="totals">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>₱${(order.totalAmount || 0).toFixed(2)}</span>
      </div>
      
      ${
        order.discount > 0
          ? `
        <div class="total-row">
          <span>Discount:</span>
          <span>-₱${(order.discount || 0).toFixed(2)}</span>
        </div>
      `
          : ""
      }
      
      ${
        order.tax > 0
          ? `
        <div class="total-row">
          <span>Tax:</span>
          <span>+₱${(order.tax || 0).toFixed(2)}</span>
        </div>
      `
          : ""
      }
      
      ${
        hasBadOrders
          ? `
        <div class="total-row">
          <span>Original Total:</span>
          <span>₱${originalGrandTotal.toFixed(2)}</span>
        </div>
        <div class="total-row bad-order-adjustment">
          <span>Bad Order Refunds:</span>
          <span>-₱${totalBadOrderRefund.toFixed(2)}</span>
        </div>
      `
          : ""
      }
      
      ${
        isPartiallyPaid
          ? `
        <div class="total-row">
          <span>Adjusted Total:</span>
          <span>₱${adjustedGrandTotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>Amount Paid:</span>
          <span>₱${totalPaid.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>Balance Due:</span>
          <span>₱${balanceDue.toFixed(2)}</span>
        </div>
      `
          : ""
      }
      
      <div class="total-row grand-total">
        <span>${
          hasBadOrders || isPartiallyPaid ? "Final Amount:" : "Total Amount:"
        }</span>
        <span>₱${adjustedGrandTotal.toFixed(2)}</span>
      </div>
    </div>
  `;
};

/**
 * Generate payment history
 */
const generatePaymentHistory = (order) => {
  if (
    !order.paymentHistory ||
    !Array.isArray(order.paymentHistory) ||
    order.paymentHistory.length === 0
  ) {
    return "";
  }

  return `
    <div class="payment-history">
      <div style="font-weight: bold; margin-bottom: 5px; text-align: center;">PAYMENT HISTORY</div>
      ${order.paymentHistory
        .filter((payment) => payment && payment.amount) // Filter out invalid payments
        .sort((a, b) => {
          try {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA;
          } catch (error) {
            return 0;
          }
        })
        .map((payment) => {
          // Safely handle payment date
          let paymentDate = "";
          try {
            if (
              payment.date &&
              payment.date.toDate &&
              typeof payment.date.toDate === "function"
            ) {
              paymentDate = payment.date.toDate().toLocaleDateString();
            } else if (payment.date instanceof Date) {
              paymentDate = payment.date.toLocaleDateString();
            } else if (payment.date) {
              paymentDate = new Date(payment.date).toLocaleDateString();
            } else {
              paymentDate = "Unknown date";
            }
          } catch (error) {
            paymentDate = "Invalid date";
          }

          return `
          <div class="payment-record">
            <span class="payment-amount">₱${(payment.amount || 0).toFixed(
              2
            )}</span>
            <span class="payment-date">${paymentDate}</span>
            <span class="payment-method">${
              payment.paymentMethod || "Unknown"
            }</span>
          </div>
        `;
        })
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
  isFullyPaid,
  totalBadOrderRefund
) => {
  let notices = "";

  if (totalBadOrderRefund > 0) {
    notices += `
      <div class="bad-order-notice">
        <strong>⚠️ BAD ORDER PROCESSED</strong><br>
        Total Refund Amount: ₱${totalBadOrderRefund.toFixed(2)}<br>
        ${order.badOrders?.length || 0} bad order${
      order.badOrders?.length !== 1 ? "s" : ""
    } recorded
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
    const adjustedGrandTotal = (order.totalAmount || 0) - totalBadOrderRefund;
    const balanceDue = adjustedGrandTotal - (order.paidAmount || 0);
    notices += `
      <div class="credit-notice">
        <strong>CREDIT ORDER - PENDING PAYMENT</strong><br>
        Please settle your balance of ₱${balanceDue.toFixed(2)}
      </div>
    `;
  }

  if (isPartiallyPaid) {
    const adjustedGrandTotal = (order.totalAmount || 0) - totalBadOrderRefund;
    const balanceDue = adjustedGrandTotal - (order.paidAmount || 0);
    notices += `
      <div class="partial-payment-notice">
        <strong>PARTIAL PAYMENT RECEIVED</strong><br>
        Thank you for your payment of ₱${(order.paidAmount || 0).toFixed(2)}<br>
        Remaining balance: ₱${balanceDue.toFixed(2)}
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

  // Get ordered items
  const displayItems = getOrderedItemsForReceipt(order);

  // Calculate adjusted total for quick receipt
  const totalBadOrderRefund =
    order.badOrders?.reduce((total, badOrder) => {
      return total + (badOrder.refundAmount || 0);
    }, 0) || 0;
  const adjustedTotal = (order.totalAmount || 0) - totalBadOrderRefund;

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
          .item-number { width: 25px; text-align: center; font-weight: bold; color: #666; }
          .total { font-weight: bold; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
          .bad-order-note { color: #dc3545; font-size: 10px; margin-top: 5px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <strong>QUICK RECEIPT</strong><br>
          Order: ${order.id ? order.id.slice(-8) : "N/A"}<br>
          ${
            order.createdAt
              ? order.createdAt.toLocaleDateString()
              : new Date().toLocaleDateString()
          }
        </div>
        <table class="items">
          ${displayItems
            .map(
              (item, index) => `
            <tr>
              <td class="item-number">${index + 1}</td>
              <td>${item.name || "Item"}</td>
              <td>×${item.quantity || 0}</td>
              <td>₱${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
            </tr>
          `
            )
            .join("")}
        </table>
        <div class="total">
          ${
            totalBadOrderRefund > 0
              ? `Original: ₱${(order.totalAmount || 0).toFixed(2)}<br>`
              : ""
          }
          ${
            totalBadOrderRefund > 0
              ? `Refunds: -₱${totalBadOrderRefund.toFixed(2)}<br>`
              : ""
          }
          Total: ₱${adjustedTotal.toFixed(2)}<br>
          Payment: ${paymentMethod?.name || "Cash"}<br>
          ${order.paymentStatus === "pending" ? "Status: PENDING PAYMENT" : ""}
          ${
            order.paymentStatus === "partial"
              ? `Status: PARTIAL (Paid: ₱${(order.paidAmount || 0).toFixed(2)})`
              : ""
          }
        </div>
        ${
          totalBadOrderRefund > 0
            ? `
          <div class="bad-order-note">
            Includes ${order.badOrders?.length || 0} bad order adjustment${
                order.badOrders?.length !== 1 ? "s" : ""
              }
          </div>
        `
            : ""
        }
        <script>
          setTimeout(function() {
            window.print();
          }, 100);
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(quickReceiptContent);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 500);
};

export default {
  printReceipt,
  printQuickReceipt,
  generateReceiptHTML,
};
