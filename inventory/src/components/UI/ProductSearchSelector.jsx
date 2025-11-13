import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faTimes,
  faCheck,
  faBox,
  faBoxOpen,
} from "@fortawesome/free-solid-svg-icons";
import "../../styles/productSearchSelector.scss";

const ProductSearchSelector = ({
  products,
  selectedProductId,
  onProductSelect,
  placeholder = "Search products...",
  disabled = false,
  showProductDetails = true,
  filterByPackagingType = null, // "bulk" or "single" to filter by packaging type
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const dropdownRef = useRef(null);

  // Filter products based on search term and optional filters
  useEffect(() => {
    let filtered = products;

    // Filter by packaging type if specified
    if (filterByPackagingType) {
      filtered = filtered.filter(
        (product) => product.packagingType === filterByPackagingType
      );
    }

    // Filter by search term
    if (searchTerm.trim() === "") {
      filtered = filtered.slice(0, 10); // Show first 10 products by default
    } else {
      filtered = filtered
        .filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            product.barcode?.includes(searchTerm) ||
            product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 10); // Limit to 10 results
    }

    setFilteredProducts(filtered);
  }, [searchTerm, products, filterByPackagingType]);

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
    setIsDropdownOpen(true); // Reopen dropdown after clear
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsDropdownOpen(true);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Get packaging type icon
  const getPackagingIcon = (packagingType) => {
    return packagingType === "bulk" ? faBox : faBoxOpen;
  };

  // Get packaging type label
  const getPackagingLabel = (packagingType) => {
    return packagingType === "bulk" ? "BULK" : "INDIVIDUAL";
  };

  return (
    <div
      className={`product-search-selector ${disabled ? "disabled" : ""}`}
      ref={dropdownRef}
    >
      <div className="search-input-container">
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
        <input
          type="text"
          placeholder={placeholder}
          value={selectedProduct ? selectedProduct.name : searchTerm}
          onChange={(e) => {
            if (!disabled) {
              setSearchTerm(e.target.value);
              if (e.target.value === "") {
                onProductSelect("", "");
              }
            }
          }}
          onFocus={handleInputFocus}
          className="search-input"
          disabled={disabled}
        />
        {selectedProductId && !disabled && (
          <button
            className="clear-button"
            onClick={clearSelection}
            type="button"
            title="Clear selection"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
      </div>

      {isDropdownOpen && !disabled && filteredProducts.length > 0 && (
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
                <div className="product-name">
                  {product.name}
                  {selectedProductId === product.id && (
                    <FontAwesomeIcon
                      icon={faCheck}
                      className="selected-check"
                    />
                  )}
                </div>
                {showProductDetails && (
                  <div className="product-details">
                    <span className="product-category">{product.category}</span>
                    <span className="product-stock">
                      Stock: {product.stock || 0}
                    </span>
                    <span className="product-price">
                      ₱{product.price?.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              <div className="product-badges">
                <span className={`packaging-badge ${product.packagingType}`}>
                  <FontAwesomeIcon
                    icon={getPackagingIcon(product.packagingType)}
                  />
                  {getPackagingLabel(product.packagingType)}
                </span>
                {product.lowStock &&
                  product.stock <= (product.lowStockThreshold || 10) && (
                    <span className="low-stock-badge">LOW STOCK</span>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isDropdownOpen &&
        !disabled &&
        searchTerm.trim() !== "" &&
        filteredProducts.length === 0 && (
          <div className="search-dropdown">
            <div className="no-results">
              <FontAwesomeIcon icon={faSearch} />
              No products found for "{searchTerm}"
            </div>
          </div>
        )}

      {isDropdownOpen &&
        !disabled &&
        searchTerm.trim() === "" &&
        filteredProducts.length === 0 && (
          <div className="search-dropdown">
            <div className="no-results">No products available</div>
          </div>
        )}
    </div>
  );
};

export default ProductSearchSelector;
