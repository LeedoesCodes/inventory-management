// CustomerOrderConfirmationDialog.jsx
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faReceipt,
  faCheckCircle,
  faTimesCircle,
  faPlus,
  faMinus,
  faTrash,
  faCreditCard,
  faMoneyBillWave,
  faCalendarAlt,
  faExclamationTriangle,
  faUser,
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
  faTruck,
  faBoxOpen,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import "../../styles/CustomerOrderConfirmationDialog.scss";

const CustomerOrderConfirmationDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  orderDetails,
  customerName,
  customerEmail,
  customerPhone,
  customerAddress,
  deliveryMethod,
  orderNotes,
  totalItems,
  totalAmount,
  customerDiscounts = [],
  onQuantityChange,
  onRemoveItem,
  isCustomerView = true,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);

  if (!isOpen) return null;

  // Payment method options for customers
  const paymentMethods = [
    {
      id: "cash",
      name: "Cash",
      icon: faMoneyBillWave,
      description: "Pay with cash upon delivery/pickup",
      color: "#28a745",
    },
    {
      id: "gcash",
      name: "GCash",
      icon: faCreditCard,
      description: "Pay via GCash mobile payment",
      color: "#007bff",
    },
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      icon: faCreditCard,
      description: "Pay via bank transfer",
      color: "#6f42c1",
    },
  ];

  const selectedPaymentMethod = paymentMethods.find(
    (method) => method.id === paymentMethod
  );

  // Calculate total savings from discounts
  const calculateSavings = () => {
    let savings = 0;
    orderDetails.forEach((item) => {
      if (item.discountedPrice < item.price) {
        savings += (item.price - item.discountedPrice) * item.quantity;
      }
    });
    return savings;
  };

  const totalSavings = calculateSavings();

  // Handle quantity changes
  const handleQuantityChange = (itemId, delta) => {
    if (onQuantityChange) {
      onQuantityChange(itemId, delta);
    }
  };

  // Handle remove item
  const handleRemoveItem = (itemId) => {
    if (onRemoveItem) {
      onRemoveItem(itemId);
    }
  };

  // Handle order confirmation
  const handleConfirmOrder = async () => {
    if (isProcessing) return;

    // Validate required fields
    if (!customerName || customerName.trim() === "") {
      alert("Please enter your name to place the order.");
      return;
    }

    if (deliveryMethod === "delivery") {
      if (!customerAddress || customerAddress.trim() === "") {
        alert("Please provide a delivery address.");
        return;
      }
      if (!customerPhone || customerPhone.trim() === "") {
        alert("Please provide a phone number for delivery.");
        return;
      }
    }

    setIsProcessing(true);
    try {
      await onConfirm(paymentMethod);
    } catch (error) {
      console.error("Order confirmation error:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if delivery address is required
  const isDeliveryAddressRequired =
    deliveryMethod === "delivery" && !customerAddress;

  // Check if phone is required for delivery
  const isPhoneRequired = deliveryMethod === "delivery" && !customerPhone;

  return (
    <div className="customer-confirmation-dialog-overlay">
      <div className="customer-confirmation-dialog">
        <div className="dialog-header">
          <FontAwesomeIcon icon={faReceipt} className="header-icon" />
          <h2>Review Your Order</h2>
          <p>Please review your order details before confirming</p>
        </div>

        <div className="dialog-body">
          {/* Customer Information */}
          <div className="customer-info-section">
            <div className="section-header">
              <h3>
                <FontAwesomeIcon icon={faUser} />
                Customer Information
              </h3>
              <button
                className="edit-info-btn"
                onClick={() => setShowCustomerInfo(!showCustomerInfo)}
              >
                {showCustomerInfo ? "Hide Details" : "Show Details"}
              </button>
            </div>

            <div className="customer-summary">
              <div className="info-row">
                <span className="label">Name:</span>
                <span className="value">
                  {customerName || "Please enter your name"}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Delivery:</span>
                <span className={`delivery-method ${deliveryMethod}`}>
                  <FontAwesomeIcon
                    icon={deliveryMethod === "delivery" ? faTruck : faBoxOpen}
                  />
                  {deliveryMethod === "delivery" ? "Delivery" : "Pickup"}
                </span>
              </div>
            </div>

            {showCustomerInfo && (
              <div className="customer-details-expanded">
                <div className="details-grid">
                  {customerEmail && (
                    <div className="detail-item">
                      <FontAwesomeIcon icon={faEnvelope} />
                      <span>{customerEmail}</span>
                    </div>
                  )}
                  {customerPhone && (
                    <div className="detail-item">
                      <FontAwesomeIcon icon={faPhone} />
                      <span>{customerPhone}</span>
                    </div>
                  )}
                  {customerAddress && deliveryMethod === "delivery" && (
                    <div className="detail-item full-width">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      <span>{customerAddress}</span>
                    </div>
                  )}
                </div>

                {orderNotes && (
                  <div className="order-notes">
                    <FontAwesomeIcon icon={faInfoCircle} />
                    <span>
                      <strong>Notes:</strong> {orderNotes}
                    </span>
                  </div>
                )}

                {/* Validation messages */}
                {isDeliveryAddressRequired && (
                  <div className="validation-message error">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    Delivery address is required for delivery orders
                  </div>
                )}
                {isPhoneRequired && (
                  <div className="validation-message error">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    Phone number is required for delivery orders
                  </div>
                )}
                {!customerName && (
                  <div className="validation-message error">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    Please enter your name to place the order
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="items-section">
            <div className="section-header">
              <h3>Order Items ({totalItems})</h3>
              <span className="item-count">{orderDetails.length} products</span>
            </div>

            <div className="items-list">
              {orderDetails.map((item, index) => {
                const hasDiscount = item.discountedPrice < item.price;
                const itemSavings = hasDiscount
                  ? (item.price - item.discountedPrice) * item.quantity
                  : 0;

                return (
                  <div key={item.id || index} className="order-item">
                    <div className="item-main-info">
                      <div className="product-name-section">
                        <span className="product-name">{item.name}</span>
                        {item.category && (
                          <span className="product-category">
                            {item.category}
                          </span>
                        )}
                      </div>

                      <div className="price-section">
                        {hasDiscount ? (
                          <div className="discounted-price-info">
                            <span className="original-price">
                              ₱{item.price.toFixed(2)}
                            </span>
                            <span className="discounted-price">
                              ₱{item.discountedPrice.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="price">
                            ₱{item.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="item-controls">
                      <div className="quantity-controls">
                        <button
                          className="quantity-btn minus"
                          onClick={() => handleQuantityChange(item.id, -1)}
                          disabled={item.quantity <= 1}
                          title="Decrease quantity"
                        >
                          <FontAwesomeIcon icon={faMinus} />
                        </button>

                        <span className="quantity-display">
                          {item.quantity}
                        </span>

                        <button
                          className="quantity-btn plus"
                          onClick={() => handleQuantityChange(item.id, 1)}
                          title="Increase quantity"
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </button>
                      </div>

                      <div className="item-totals">
                        <span className="subtotal">
                          ₱{(item.discountedPrice * item.quantity).toFixed(2)}
                        </span>
                        {itemSavings > 0 && (
                          <span className="item-savings">
                            Saved: ₱{itemSavings.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveItem(item.id)}
                        title="Remove item from order"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {orderDetails.length === 0 && (
              <div className="empty-order">
                <p>Your cart is empty. Add some products to continue.</p>
              </div>
            )}
          </div>

          {/* Discounts Section */}
          {customerDiscounts.length > 0 && totalSavings > 0 && (
            <div className="discounts-section">
              <h3>
                <FontAwesomeIcon icon={faCheckCircle} />
                Applied Discounts
              </h3>
              <div className="discounts-list">
                {customerDiscounts
                  .filter((d) => d.active)
                  .map((discount, index) => (
                    <div key={index} className="discount-item">
                      <span className="discount-category">
                        {discount.category}
                      </span>
                      <span className="discount-value">
                        {discount.discountValue}
                        {discount.discountType === "percentage" ? "%" : "₱"} OFF
                      </span>
                    </div>
                  ))}
              </div>
              <div className="total-savings">
                <span>Total Savings:</span>
                <span className="savings-amount">
                  ₱{totalSavings.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Payment Method Section */}
          <div className="payment-section">
            <h3>Payment Method</h3>
            <div className="payment-methods-grid">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`payment-method-option ${
                    paymentMethod === method.id ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="payment-radio"
                  />
                  <div className="payment-content">
                    <div className="payment-icon">
                      <FontAwesomeIcon icon={method.icon} />
                    </div>
                    <div className="payment-info">
                      <span className="payment-name">{method.name}</span>
                      <span className="payment-description">
                        {method.description}
                      </span>
                    </div>
                    {paymentMethod === method.id && (
                      <div className="payment-checkmark">
                        <FontAwesomeIcon icon={faCheckCircle} />
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {paymentMethod === "cash" && (
              <div className="payment-note">
                <FontAwesomeIcon icon={faInfoCircle} />
                <span>Please prepare exact amount for faster transaction</span>
              </div>
            )}
            {paymentMethod === "gcash" && (
              <div className="payment-note">
                <FontAwesomeIcon icon={faInfoCircle} />
                <span>
                  GCash number: 0912 345 6789 (Please include order reference)
                </span>
              </div>
            )}
            {paymentMethod === "bank_transfer" && (
              <div className="payment-note">
                <FontAwesomeIcon icon={faInfoCircle} />
                <span>
                  Bank: BPI Account # 1234-5678-90 (Please send proof of
                  payment)
                </span>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="order-summary-section">
            <h3>Order Summary</h3>
            <div className="summary-grid">
              <div className="summary-row">
                <span>Subtotal ({totalItems} items):</span>
                <span>₱{totalAmount.toFixed(2)}</span>
              </div>

              {totalSavings > 0 && (
                <div className="summary-row savings">
                  <span>Discount Savings:</span>
                  <span className="savings">-₱{totalSavings.toFixed(2)}</span>
                </div>
              )}

              {deliveryMethod === "delivery" && (
                <div className="summary-row">
                  <span>Delivery Fee:</span>
                  <span>₱50.00</span>
                </div>
              )}

              <div className="summary-row grand-total">
                <span>Total Amount:</span>
                <span className="total-amount">
                  ₱
                  {(
                    totalAmount + (deliveryMethod === "delivery" ? 50 : 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="order-note">
              <FontAwesomeIcon icon={faInfoCircle} />
              <span>
                Your order will be processed after approval. You will receive
                updates via {customerEmail ? "email" : "SMS"}.
              </span>
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button
            className="cancel-btn"
            onClick={onCancel}
            disabled={isProcessing}
          >
            <FontAwesomeIcon icon={faTimesCircle} />
            Cancel
          </button>
          <button
            className={`confirm-btn ${paymentMethod} ${
              isProcessing ||
              !customerName ||
              isDeliveryAddressRequired ||
              isPhoneRequired
                ? "disabled"
                : ""
            }`}
            onClick={handleConfirmOrder}
            disabled={
              orderDetails.length === 0 ||
              isProcessing ||
              !customerName ||
              isDeliveryAddressRequired ||
              isPhoneRequired
            }
            title={
              !customerName
                ? "Please enter your name"
                : isDeliveryAddressRequired
                ? "Delivery address is required"
                : isPhoneRequired
                ? "Phone number is required for delivery"
                : "Place your order"
            }
          >
            {isProcessing ? (
              <>
                <div className="processing-spinner"></div>
                Processing...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCheckCircle} />
                Place Order
                {deliveryMethod === "delivery" && (
                  <span className="delivery-info">
                    ({deliveryMethod === "delivery" ? "Delivery" : "Pickup"})
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderConfirmationDialog;
