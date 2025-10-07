import { useEffect, useRef } from "react";

export default function ProductList({
  products,
  onEdit,
  onDelete,
  highlightedProductId,
}) {
  const highlightedRef = useRef(null);

  // Scroll to highlighted product when it changes and is in the filtered list
  useEffect(() => {
    console.log(
      "🎯 PRODUCT LIST: highlightedProductId =",
      highlightedProductId
    );
    console.log("🎯 PRODUCT LIST: products count =", products.length);

    if (highlightedProductId) {
      console.log("🎯 SCROLLING TO HIGHLIGHTED PRODUCT");

      const highlightedProduct = products.find(
        (p) => p.id === highlightedProductId
      );
      console.log("🎯 HIGHLIGHTED PRODUCT FOUND:", highlightedProduct);

      if (highlightedProduct && highlightedRef.current) {
        console.log("🎯 SCROLLING TO ELEMENT");
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          highlightedRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
          });
        }, 200);
      }
    }
  }, [highlightedProductId, products]);

  // Find the highlighted product
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
            if (isHighlighted) {
              console.log("🎯 RENDERING HIGHLIGHTED PRODUCT:", p.name);
            }
            return (
              <li
                key={p.id}
                ref={isHighlighted ? highlightedRef : null}
                className={isHighlighted ? "highlighted" : ""}
                id={isHighlighted ? "highlighted-product" : ""}
              >
                <div className="product-details">
                  {p.imageUrl && (
                    <div className="product-image">
                      <img src={p.imageUrl} alt={p.name} />
                    </div>
                  )}
                  <div className="product-name">{p.name}</div>
                  <div className="product-price">₱{p.price}</div>
                  <div className="product-stock">Stock: {p.stock}</div>
                  <div className="product-sold">Sold: {p.sold || 0}</div>
                  <div className="product-category">Category: {p.category}</div>
                </div>
                <div className="actions">
                  <button onClick={() => onEdit(p)}>Edit</button>
                  <button onClick={() => onDelete(p.id)}>Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Show message if highlighted product is not in filtered list */}
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
