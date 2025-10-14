// components/orders/UnitSelectionModal.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faBox, faBoxes } from "@fortawesome/free-solid-svg-icons";
import "./UnitSelectionModal.scss";

export default function UnitSelectionModal({
  product,
  onUnitSelect,
  onClose,
  scannedBarcode,
}) {
  if (!product || !product.variants) return null;

  // Auto-select if only one variant exists
  const variants = Object.entries(product.variants);
  if (variants.length === 1) {
    onUnitSelect(variants[0][0], variants[0][1]);
    return null;
  }

  // Find if scanned barcode matches a specific variant
  const getVariantFromBarcode = () => {
    if (!scannedBarcode) return null;
    return variants.find(([, variant]) => variant.barcode === scannedBarcode);
  };

  // Auto-select if barcode matches a variant
  const matchedVariant = getVariantFromBarcode();
  if (matchedVariant) {
    onUnitSelect(matchedVariant[0], matchedVariant[1]);
    return null;
  }

  const getVariantIcon = (unit) => {
    switch (unit) {
      case "piece":
        return faBox;
      case "bag":
        return faBoxes;
      default:
        return faBox;
    }
  };

  const getVariantDisplayName = (unit) => {
    switch (unit) {
      case "piece":
        return "PIECE";
      case "bag":
        return "BAG";
      default:
        return unit.toUpperCase();
    }
  };

  return (
    <div className="modal-overlay unit-selection-overlay">
      <div className="unit-selection-modal">
        <div className="modal-header">
          <h2>Select Unit Type</h2>
          <button className="close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="product-info">
          <h3>{product.name}</h3>
          <p className="product-category">{product.category}</p>
        </div>

        <div className="unit-options">
          {variants.map(([unit, variant]) => (
            <div
              key={unit}
              className={`unit-option ${
                variant.stock <= 0 ? "out-of-stock" : ""
              }`}
              onClick={() => variant.stock > 0 && onUnitSelect(unit, variant)}
            >
              <div className="unit-icon">
                <FontAwesomeIcon icon={getVariantIcon(unit)} />
              </div>

              <div className="unit-content">
                <div className="unit-header">
                  <div className="unit-name">{getVariantDisplayName(unit)}</div>
                  <div className="unit-price">₱{variant.price.toFixed(2)}</div>
                </div>

                <div className="unit-details">
                  <div className="unit-stock">
                    Stock:{" "}
                    <span className={variant.stock <= 5 ? "low-stock" : ""}>
                      {variant.stock} {unit}(s)
                    </span>
                  </div>

                  {variant.containsPieces && (
                    <div className="unit-conversion">
                      Contains {variant.containsPieces} pieces
                    </div>
                  )}

                  {variant.barcode && (
                    <div className="unit-barcode">
                      Barcode: {variant.barcode}
                    </div>
                  )}
                </div>
              </div>

              {variant.stock <= 0 && (
                <div className="out-of-stock-label">Out of Stock</div>
              )}
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
