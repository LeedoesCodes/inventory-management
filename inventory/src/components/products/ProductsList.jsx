import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

export default function ProductList({
  products,
  onEdit,
  onDelete,
  highlightedProductId,
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
        <ul>
          {products.map((p) => {
            const isHighlighted = p.id === highlightedProductId;

            return (
              <li
                key={p.id}
                ref={isHighlighted ? highlightedRef : null}
                className={isHighlighted ? "highlighted" : ""}
                id={isHighlighted ? "highlighted-product" : ""}
              >
                <div className="product-details">
                  {/* Product Image */}
                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="product-image"
                    />
                  )}

                  {/* Product Name */}
                  <div className="product-name">{p.name}</div>

                  {/* Product Price */}
                  <div className="product-price">
                    <span className="field-label">Price: </span>₱{p.price}
                  </div>

                  {/* Product Stock */}
                  <div className={`product-stock ${getStockLevel(p.stock)}`}>
                    <span className="field-label">Stock: </span>
                    {p.stock}
                  </div>

                  {/* Product Sold */}
                  <div className="product-sold">
                    <span className="field-label">Sold: </span>
                    {p.sold || 0}
                  </div>

                  {/* Product Category */}
                  <div className="product-category">
                    <span className="field-label">Category: </span>
                    {p.category}
                  </div>
                </div>

                <div className="actions">
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
