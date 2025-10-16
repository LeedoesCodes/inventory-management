import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import "../../styles/productSearchSelector.scss";

const ProductSearchSelector = ({
  products,
  selectedProductId,
  onProductSelect,
  placeholder = "Search products...",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const dropdownRef = useRef(null);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts(products.slice(0, 10)); // Show first 10 products by default
    } else {
      const filtered = products
        .filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            product.barcode?.includes(searchTerm)
        )
        .slice(0, 10); // Limit to 10 results
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProductSelect = (product) => {
    onProductSelect(product.id, product.name);
    setSearchTerm(product.name);
    setIsDropdownOpen(false);
  };

  const clearSelection = () => {
    onProductSelect("", "");
    setSearchTerm("");
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="product-search-selector" ref={dropdownRef}>
      <div className="search-input-container">
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
        <input
          type="text"
          placeholder={placeholder}
          value={selectedProduct ? selectedProduct.name : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (e.target.value === "") {
              onProductSelect("", "");
            }
          }}
          onFocus={() => setIsDropdownOpen(true)}
          className="search-input"
        />
        {selectedProductId && (
          <button
            className="clear-button"
            onClick={clearSelection}
            type="button"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
      </div>

      {isDropdownOpen && filteredProducts.length > 0 && (
        <div className="search-dropdown">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`dropdown-item ${
                selectedProductId === product.id ? "selected" : ""
              }`}
              onClick={() => handleProductSelect(product)}
            >
              <div className="product-info">
                <div className="product-name">{product.name}</div>
                <div className="product-details">
                  <span className="product-category">{product.category}</span>
                  <span className="product-stock">
                    Stock: {product.stock || 0}
                  </span>
                  <span className="product-price">
                    ₱{product.price?.toFixed(2)}
                  </span>
                </div>
              </div>
              {product.packagingType === "bulk" && (
                <span className="bulk-badge">BULK</span>
              )}
            </div>
          ))}
        </div>
      )}

      {isDropdownOpen &&
        searchTerm.trim() !== "" &&
        filteredProducts.length === 0 && (
          <div className="search-dropdown">
            <div className="no-results">No products found</div>
          </div>
        )}
    </div>
  );
};

export default ProductSearchSelector;
