// components/products/ProductsList.jsx - UPDATED VERSION
import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faBox,
  faLink,
  faBoxOpen,
} from "@fortawesome/free-solid-svg-icons";
import "./products-list.scss";

export default function ProductList({
  products,
  onEdit,
  onDelete,
  onQuickCreateBulk,
  onViewRelated,
  highlightedProductId,
  allProducts = [],
}) {
  const highlightedRef = useRef(null);

  useEffect(() => {
    if (highlightedProductId) {
      const highlightedProduct = products.find(
        (p) => p.id === highlightedProductId
      );

      if (highlightedProduct && highlightedRef.current) {
        setTimeout(() => {
          highlightedRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 200);
      }
    }
  }, [highlightedProductId, products]);

  // Helper function to get bulk packages count for a single item
  const getBulkPackagesCount = (productId) => {
    return allProducts.filter(
      (p) => p.packagingType === "bulk" && p.parentProductId === productId
    ).length;
  };

  // Helper function to get parent product name for bulk items
  const getParentProductName = (parentProductId) => {
    const parent = allProducts.find((p) => p.id === parentProductId);
    return parent ? parent.name : "Unknown";
  };

  const highlightedProduct = products.find(
    (p) => p.id === highlightedProductId
  );

  return (
    <div className="product-list">
      {products.length === 0 ? (
        <div className="no-products">
          <p>No products found</p>
        </div>
      ) : (
        <ul className="products-grid">
          {products.map((p) => {
            const isHighlighted = p.id === highlightedProductId;
            const isLowStock = (p.stock || 0) <= (p.lowStockThreshold || 5);

            return (
              <li
                key={p.id}
                ref={isHighlighted ? highlightedRef : null}
                className={`product-card ${
                  isHighlighted ? "highlighted" : ""
                } ${isLowStock ? "low-stock" : ""}`}
                id={isHighlighted ? "highlighted-product" : ""}
              >
                {/* Product Image */}
                <div className="product-image">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="product-img"
                    />
                  ) : (
                    <div className="image-placeholder">📦</div>
                  )}
                </div>

                {/* Product Details */}
                <div className="product-details">
                  {/* Product Header with Name and Packaging Badges */}
                  <div className="product-header">
                    <div className="product-name">{p.name}</div>

                    {/* Packaging Badges */}
                    <div className="packaging-badges">
                      {p.packagingType === "bulk" && (
                        <span className="badge bulk">
                          <FontAwesomeIcon icon={faBox} />
                          Bulk Package
                        </span>
                      )}
                      {p.packagingType === "single" &&
                        getBulkPackagesCount(p.id) > 0 && (
                          <span className="badge has-bulk">
                            <FontAwesomeIcon icon={faLink} />
                            Has {getBulkPackagesCount(p.id)} Bulk
                          </span>
                        )}
                      {p.packagingType === "single" &&
                        getBulkPackagesCount(p.id) === 0 && (
                          <span className="badge single-only">
                            <FontAwesomeIcon icon={faBoxOpen} />
                            Single Only
                          </span>
                        )}
                    </div>
                  </div>

                  {/* Product Information - COMPACT HORIZONTAL LAYOUT */}
                  <div className="product-info-compact">
                    {/* Main Info Row */}
                    <div className="info-row main-info">
                      <div className="info-item">
                        <span className="field-label">Price:</span>
                        <span className="product-price">
                          ₱{p.price?.toFixed(2)}
                        </span>
                      </div>

                      <div className={`info-item ${getStockLevel(p.stock)}`}>
                        <span className="field-label">Stock:</span>
                        <span className="product-stock">
                          {p.stock || 0} {p.unit || "piece"}
                          {isLowStock && " ⚠️"}
                        </span>
                      </div>

                      <div className="info-item">
                        <span className="field-label">Sold:</span>
                        <span className="product-sold">{p.sold || 0}</span>
                      </div>

                      <div className="info-item">
                        <span className="field-label">Category:</span>
                        <span className="product-category">
                          {p.category || "Uncategorized"}
                        </span>
                      </div>
                    </div>

                    {/* Secondary Info Row */}
                    <div className="info-row secondary-info">
                      {/* Cost Price */}
                      {p.costPrice && (
                        <div className="info-item">
                          <span className="field-label">Cost:</span>
                          <span className="product-cost">
                            ₱{p.costPrice.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Packaging Specific Information */}
                      {p.packagingType === "bulk" && p.parentProductId && (
                        <div className="info-item">
                          <span className="field-label">Contains:</span>
                          <span className="related-product">
                            {getParentProductName(p.parentProductId)}
                          </span>
                        </div>
                      )}

                      {p.packagingType === "bulk" && p.piecesPerPackage && (
                        <div className="info-item">
                          <span className="field-label">Pieces:</span>
                          <span className="pieces-count">
                            {p.piecesPerPackage}
                          </span>
                        </div>
                      )}

                      {/* Barcode */}
                      {p.barcode && (
                        <div className="info-item">
                          <span className="field-label">Barcode:</span>
                          <span className="product-barcode">{p.barcode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="product-actions enhanced-actions">
                  {/* Quick Packaging Actions */}
                  <div className="quick-actions">
                    {p.packagingType === "single" && (
                      <button
                        onClick={() => onQuickCreateBulk(p)}
                        className="btn-quick-action bulk"
                        title="Create Bulk Package"
                      >
                        <FontAwesomeIcon icon={faBox} />
                        Create Bulk
                      </button>
                    )}

                    <button
                      onClick={() => onViewRelated(p)}
                      className="btn-quick-action related"
                      title="View Related Products"
                    >
                      <FontAwesomeIcon icon={faLink} />
                      View Related
                    </button>
                  </div>

                  {/* Standard Actions */}
                  <div className="standard-actions">
                    <button
                      onClick={() => onEdit(p)}
                      className="icon-btn edit-btn"
                      title="Edit Product"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      className="icon-btn delete-btn"
                      title="Delete Product"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {highlightedProductId && !highlightedProduct && (
        <div className="highlighted-product-missing">
          <p>
            The product you're looking for is not visible with current filters.
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to determine stock level
function getStockLevel(stock) {
  if (stock === 0) return "out-of-stock";
  if (stock <= 5) return "low-stock";
  if (stock <= 15) return "medium-stock";
  return "high-stock";
}
