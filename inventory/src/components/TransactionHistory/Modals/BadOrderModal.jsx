import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimesCircle,
  faExclamationTriangle,
  faBox,
  faUser,
  faCalendar,
  faUndo,
  faReceipt,
  faInfoCircle,
  faSearch,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

// Import components
import ProductSearchSelector from "../../UI/ProductSearchSelector";
import "./BadOrderModal.scss";

const BadOrderModal = ({
  order,
  badOrderDetails,
  setBadOrderDetails,
  onClose,
  onProcessBadOrder,
  allProducts = [], // You'll need to pass this from parent
}) => {
  if (!order) return null;

  // Calculate refund amount based on bad order details
  const calculateRefundAmount = () => {
    if (badOrderDetails.action === "full_refund") {
      return order.totalAmount;
    }

    if (badOrderDetails.action === "partial_refund") {
      return order.items.reduce((total, item) => {
        const badPieces = item.badPieces || 0;
        if (badPieces > 0) {
          const product = allProducts.find((p) => p.id === item.id);
          const piecePrice =
            product?.packagingType === "bulk"
              ? item.price / (product.piecesPerPackage || 1)
              : item.price;
          return total + piecePrice * badPieces;
        }
        return total;
      }, 0);
    }

    return 0; // No refund for replace-only
  };

  const refundAmount = calculateRefundAmount();

  const handleItemBadPiecesChange = (itemIndex, badPieces) => {
    const updatedItems = [...order.items];
    const item = updatedItems[itemIndex];
    const productInfo = allProducts.find((p) => p.id === item.id);
    const maxPieces =
      productInfo?.packagingType === "bulk"
        ? productInfo?.piecesPerPackage || 1
        : item.quantity;

    if (badPieces > maxPieces) {
      alert(`Cannot replace more than ${maxPieces} pieces for ${item.name}`);
      return;
    }

    updatedItems[itemIndex] = {
      ...item,
      badPieces: parseInt(badPieces) || 0,
    };

    setBadOrderDetails({
      ...badOrderDetails,
      items: updatedItems,
    });
  };

  const handleProductSelect = (itemIndex, productId, productName) => {
    const updatedItems = [...order.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      selectedProductId: productId,
      selectedProductName: productName,
    };

    setBadOrderDetails({
      ...badOrderDetails,
      items: updatedItems,
    });
  };

  const hasValidBadOrderItems = order.items.some(
    (item) => item.badPieces > 0 && item.selectedProductId
  );

  const formatDate = (date) => {
    if (!date) return "N/A";
    if (date.toDate) {
      return date.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="modal-overlay bad-order-modal">
      <div className="modal-content">
        <div className="modal-header warning-header">
          <h3>
            <FontAwesomeIcon icon={faExclamationTriangle} />
            Process Bad Order
          </h3>
          <button onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Order Information */}
          <div className="order-info-summary">
            <h4 className="section-title">
              <FontAwesomeIcon icon={faReceipt} />
              Order #{order.id?.slice(-8) || order.id}
            </h4>
            <div className="order-details-grid">
              <div className="detail-item">
                <span className="detail-label">
                  <FontAwesomeIcon icon={faUser} />
                  Customer:
                </span>
                <span className="detail-value">
                  {order.customerName || "Walk-in Customer"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">
                  <FontAwesomeIcon icon={faCalendar} />
                  Date:
                </span>
                <span className="detail-value">
                  {formatDate(order.createdAt || order.date)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total Amount:</span>
                <span className="detail-value total-amount">
                  ₱{order.totalAmount?.toFixed(2) || "0.00"}
                </span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="instruction-card">
            <div className="instruction-header">
              <FontAwesomeIcon icon={faInfoCircle} />
              How it works
            </div>
            <div className="instruction-content">
              <div className="instruction-step">
                <span className="step-number">1</span>
                <span>
                  Search and select individual products to deduct pieces from
                </span>
              </div>
              <div className="instruction-step">
                <span className="step-number">2</span>
                <span>Enter the number of pieces that need replacement</span>
              </div>
              <div className="instruction-step">
                <span className="step-number">3</span>
                <span>
                  System will automatically handle bulk vs individual items
                </span>
              </div>
            </div>
          </div>

          {/* Bad Order Form */}
          <div className="bad-order-form">
            <div className="form-section">
              <h4 className="section-title">
                <FontAwesomeIcon icon={faBox} />
                Specify Replacement Details
              </h4>

              {order.items?.map((item, index) => {
                const productInfo = allProducts.find((p) => p.id === item.id);
                const isBulkProduct = productInfo?.packagingType === "bulk";
                const maxPieces = isBulkProduct
                  ? productInfo?.piecesPerPackage || 1
                  : item.quantity;

                return (
                  <div key={index} className="bad-order-item-card">
                    <div className="item-header">
                      <div className="item-info">
                        <span className="item-name">{item.name}</span>
                        <span className="item-quantity">
                          {item.quantity}{" "}
                          {isBulkProduct ? "packages" : "pieces"} • ₱
                          {item.price?.toFixed(2)}
                        </span>
                      </div>
                      <span
                        className={`item-type-badge ${
                          isBulkProduct ? "bulk" : "single"
                        }`}
                      >
                        {isBulkProduct ? "📦 BULK" : "🧩 INDIVIDUAL"}
                      </span>
                    </div>

                    <div className="replacement-controls">
                      {/* Product Selection */}
                      <div className="form-group product-selection">
                        <label>
                          <FontAwesomeIcon icon={faSearch} />
                          {isBulkProduct
                            ? "Select Individual Product to Deduct From *"
                            : "Product to Deduct From *"}
                        </label>

                        {isBulkProduct ? (
                          <ProductSearchSelector
                            products={allProducts.filter(
                              (p) => p.packagingType === "single"
                            )}
                            selectedProductId={item.selectedProductId}
                            onProductSelect={(productId, productName) =>
                              handleProductSelect(index, productId, productName)
                            }
                            placeholder="Search for individual products..."
                          />
                        ) : (
                          <div className="auto-selected-product">
                            <div className="selected-product-card">
                              <div className="product-name">
                                <strong>{item.name}</strong>
                              </div>
                              <div className="stock-info">
                                Current stock: {productInfo?.stock || 0} pieces
                              </div>
                            </div>
                            <input
                              type="hidden"
                              value={item.id}
                              onChange={(e) =>
                                handleProductSelect(index, item.id, item.name)
                              }
                            />
                          </div>
                        )}

                        {item.selectedProductId && (
                          <div className="selected-product-confirmation">
                            <FontAwesomeIcon icon={faCheckCircle} />
                            Will deduct pieces from:{" "}
                            <strong>{item.selectedProductName}</strong>
                            {!isBulkProduct && " (this product)"}
                          </div>
                        )}
                      </div>

                      {/* Pieces Input */}
                      <div className="form-group pieces-input">
                        <label>Number of Pieces to Replace *</label>
                        <input
                          type="number"
                          min="0"
                          max={maxPieces}
                          value={item.badPieces || ""}
                          onChange={(e) =>
                            handleItemBadPiecesChange(index, e.target.value)
                          }
                          placeholder="0"
                          className="pieces-input-field"
                        />
                        <div className="input-info">
                          <span className="max-pieces">
                            Maximum: {maxPieces} pieces
                          </span>
                          {isBulkProduct && (
                            <span className="package-info">
                              {maxPieces} pieces per package
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Replacement Summary */}
                      {item.badPieces > 0 && item.selectedProductId && (
                        <div className="replacement-summary">
                          <div className="summary-card">
                            <h5 className="summary-title">
                              <FontAwesomeIcon icon={faCheckCircle} />
                              Replacement Summary
                            </h5>
                            <div className="summary-details">
                              <div className="summary-row">
                                <span className="summary-label">
                                  Product to replace:
                                </span>
                                <span className="summary-value">
                                  {item.name}
                                </span>
                              </div>
                              <div className="summary-row">
                                <span className="summary-label">
                                  Pieces to replace:
                                </span>
                                <span className="summary-value pieces-count">
                                  {item.badPieces} pieces
                                </span>
                              </div>
                              <div className="summary-row">
                                <span className="summary-label">
                                  Deduct from:
                                </span>
                                <span className="summary-value target-product">
                                  {item.selectedProductName}
                                </span>
                              </div>
                              <div className="summary-row">
                                <span className="summary-label">
                                  Current stock:
                                </span>
                                <span className="summary-value">
                                  {allProducts.find(
                                    (p) => p.id === item.selectedProductId
                                  )?.stock || 0}{" "}
                                  pieces
                                </span>
                              </div>
                              <div className="summary-row new-stock">
                                <span className="summary-label">
                                  New stock after deduction:
                                </span>
                                <span className="summary-value stock-change">
                                  {(allProducts.find(
                                    (p) => p.id === item.selectedProductId
                                  )?.stock || 0) - item.badPieces}{" "}
                                  pieces
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action and Reason Selection */}
            <div className="form-section">
              <h4 className="section-title">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                Bad Order Action
              </h4>

              <div className="action-selection-grid">
                <div className="form-group">
                  <label>Action Type</label>
                  <select
                    value={badOrderDetails.action}
                    onChange={(e) =>
                      setBadOrderDetails({
                        ...badOrderDetails,
                        action: e.target.value,
                      })
                    }
                    className="action-select"
                  >
                    <option value="replace">Replace Pieces Only</option>
                    <option value="partial_refund">
                      Partial Refund + Replace
                    </option>
                    <option value="full_refund">
                      Full Refund + Return All
                    </option>
                  </select>
                  <div className="action-description">
                    {badOrderDetails.action === "replace" &&
                      "Replace damaged pieces at no cost"}
                    {badOrderDetails.action === "partial_refund" &&
                      "Refund value of damaged pieces + replace them"}
                    {badOrderDetails.action === "full_refund" &&
                      "Full refund + return all items to stock"}
                  </div>
                </div>

                <div className="form-group">
                  <label>Reason for Bad Order *</label>
                  <select
                    value={badOrderDetails.reason}
                    onChange={(e) =>
                      setBadOrderDetails({
                        ...badOrderDetails,
                        reason: e.target.value,
                      })
                    }
                    required
                    className="reason-select"
                  >
                    <option value="">Select reason...</option>
                    <option value="damaged">Damaged Items</option>
                    <option value="expired">Expired Items</option>
                    <option value="wrong_item">Wrong Item Delivered</option>
                    <option value="quality_issue">Quality Issue</option>
                    <option value="customer_complaint">
                      Customer Complaint
                    </option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Refund Summary */}
            {(badOrderDetails.action === "partial_refund" ||
              badOrderDetails.action === "full_refund") && (
              <div className="refund-summary-section">
                <h4 className="section-title">
                  <FontAwesomeIcon icon={faUndo} />
                  Refund Summary
                </h4>
                <div className="refund-summary-card">
                  <div className="refund-details">
                    <div className="refund-row">
                      <span className="refund-label">Refund Amount:</span>
                      <span className="refund-amount">
                        ₱{refundAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="refund-row">
                      <span className="refund-label">Action Type:</span>
                      <span
                        className={`action-type ${
                          badOrderDetails.action === "partial_refund"
                            ? "partial"
                            : "full"
                        }`}
                      >
                        {badOrderDetails.action === "partial_refund"
                          ? "Partial Refund"
                          : "Full Refund"}
                      </span>
                    </div>
                    {badOrderDetails.action === "partial_refund" && (
                      <div className="refund-row">
                        <span className="refund-label">Items Affected:</span>
                        <span className="affected-items">
                          {
                            order.items.filter((item) => item.badPieces > 0)
                              .length
                          }{" "}
                          items
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            <FontAwesomeIcon icon={faTimesCircle} />
            Cancel
          </button>
          <button
            className="btn btn-warning"
            onClick={() => onProcessBadOrder(order)}
            disabled={!badOrderDetails.reason || !hasValidBadOrderItems}
          >
            <FontAwesomeIcon icon={faExclamationTriangle} />
            Process Bad Order
            {refundAmount > 0 && ` (Refund: ₱${refundAmount.toFixed(2)})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BadOrderModal;
