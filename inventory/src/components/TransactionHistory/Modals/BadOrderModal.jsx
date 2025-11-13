import React, { useEffect, useState } from "react";
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
  faExchangeAlt,
  faPlus,
  faMinus,
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
  allProducts = [],
}) => {
  if (!order) return null;

  // State to track replacement type for each item (piece or bag)
  const [replacementTypes, setReplacementTypes] = useState({});

  // State for general replacement settings
  const [generalReplacement, setGeneralReplacement] = useState({
    enabled: false,
    products: [], // Array of { productId, productName, quantity, replacementType }
  });

  // Calculate refund amount based on bad order details
  const calculateRefundAmount = () => {
    if (badOrderDetails.action === "full_refund") {
      return order.totalAmount;
    }

    if (badOrderDetails.action === "partial_refund") {
      const itemsToRefund = badOrderDetails.items || order.items;
      return itemsToRefund.reduce((total, item) => {
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

  // Handle general replacement toggle
  const handleGeneralReplacementToggle = (enabled) => {
    setGeneralReplacement((prev) => ({
      ...prev,
      enabled,
      products: enabled ? prev.products : [],
    }));

    if (!enabled) {
      // Reset to individual product selections
      resetToIndividualSelections();
    }
  };

  // Add a new product to general replacement
  const handleAddGeneralProduct = () => {
    setGeneralReplacement((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          productId: "",
          productName: "",
          quantity: 1,
          replacementType: "piece",
        },
      ],
    }));
  };

  // Remove a product from general replacement
  const handleRemoveGeneralProduct = (index) => {
    setGeneralReplacement((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  };

  // Handle general product selection
  const handleGeneralProductSelect = (index, productId, productName) => {
    const updatedProducts = [...generalReplacement.products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      productId,
      productName,
    };

    setGeneralReplacement((prev) => ({
      ...prev,
      products: updatedProducts,
    }));
  };

  // Handle general product quantity change - FIXED VERSION
  const handleGeneralProductQuantityChange = (index, quantity) => {
    const updatedProducts = [...generalReplacement.products];

    // Allow empty string for better UX, but default to 1 when processing
    const newQuantity =
      quantity === "" ? "" : Math.max(1, parseInt(quantity) || 1);

    updatedProducts[index] = {
      ...updatedProducts[index],
      quantity: newQuantity,
    };

    setGeneralReplacement((prev) => ({
      ...prev,
      products: updatedProducts,
    }));
  };

  // Handle general replacement type change
  const handleGeneralReplacementTypeChange = (index, replacementType) => {
    const updatedProducts = [...generalReplacement.products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      replacementType,
    };

    setGeneralReplacement((prev) => ({
      ...prev,
      products: updatedProducts,
    }));
  };

  // Apply general replacement to all items with bad pieces
  const applyGeneralReplacementToItems = () => {
    if (!generalReplacement.enabled || generalReplacement.products.length === 0)
      return;

    const currentItems = badOrderDetails.items || order.items;
    const updatedItems = currentItems.map((item) => {
      // Only update items that have bad pieces
      if ((item.badPieces || 0) > 0) {
        // For general replacement, we'll use the first product as primary
        // but the actual deduction will be handled in the backend
        const primaryProduct = generalReplacement.products[0];
        return {
          ...item,
          selectedProductId: primaryProduct.productId,
          selectedProductName: primaryProduct.productName,
          generalReplacementProducts: generalReplacement.products,
        };
      }
      return item;
    });

    setBadOrderDetails({
      ...badOrderDetails,
      items: updatedItems,
    });
  };

  // Reset to individual product selections
  const resetToIndividualSelections = () => {
    const currentItems = badOrderDetails.items || order.items;
    const updatedItems = currentItems.map((item) => {
      const productInfo = allProducts.find((p) => p.id === item.id);
      if (productInfo?.packagingType === "bulk") {
        const suggestedProduct = findIndividualProductForBulk(productInfo);
        return {
          ...item,
          selectedProductId: suggestedProduct?.id || item.id,
          selectedProductName: suggestedProduct?.name || item.name,
          generalReplacementProducts: undefined,
        };
      }
      return {
        ...item,
        selectedProductId: item.id,
        selectedProductName: item.name,
        generalReplacementProducts: undefined,
      };
    });

    setBadOrderDetails({
      ...badOrderDetails,
      items: updatedItems,
    });
  };

  const handleItemBadPiecesChange = (itemIndex, badPieces) => {
    const currentItems = badOrderDetails.items || order.items;
    const updatedItems = [...currentItems];
    const item = updatedItems[itemIndex];
    const productInfo = allProducts.find((p) => p.id === item.id);

    // Determine max pieces based on replacement type
    let maxPieces;
    const replacementType = replacementTypes[itemIndex] || "piece";

    if (replacementType === "bag" && productInfo?.packagingType === "bulk") {
      maxPieces = item.quantity; // Maximum is the number of bags
    } else {
      maxPieces =
        productInfo?.packagingType === "bulk"
          ? (productInfo?.piecesPerPackage || 1) * item.quantity
          : item.quantity;
    }

    const newBadPieces = parseInt(badPieces) || 0;

    if (newBadPieces > maxPieces) {
      alert(
        `Cannot replace more than ${maxPieces} ${
          replacementType === "bag" ? "bags" : "pieces"
        } for ${item.name}`
      );
      updatedItems[itemIndex] = {
        ...item,
        badPieces: maxPieces,
      };
    } else {
      updatedItems[itemIndex] = {
        ...item,
        badPieces: newBadPieces,
      };
    }

    setBadOrderDetails({
      ...badOrderDetails,
      items: updatedItems,
    });

    // If general replacement is enabled and we're adding bad pieces, apply general product
    if (
      generalReplacement.enabled &&
      generalReplacement.products.length > 0 &&
      newBadPieces > 0
    ) {
      setTimeout(() => applyGeneralReplacementToItems(), 0);
    }
  };

  const handleProductSelect = (itemIndex, productId, productName) => {
    // Don't allow individual product selection when general replacement is enabled
    if (generalReplacement.enabled) {
      alert(
        "Individual product selection is disabled when general replacement is enabled. Please disable general replacement first."
      );
      return;
    }

    const currentItems = badOrderDetails.items || order.items;
    const updatedItems = [...currentItems];
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

  // For bulk products, find the individual/single-piece version
  const findIndividualProductForBulk = (bulkProduct) => {
    if (!bulkProduct) return null;

    // Strategy 1: Look by parentProductId first (if it exists)
    if (bulkProduct.parentProductId) {
      const individualByParent = allProducts.find(
        (product) => product.id === bulkProduct.parentProductId
      );
      if (individualByParent && individualByParent.packagingType === "single") {
        return individualByParent;
      }
    }

    // Strategy 2: Look for products with similar name but single packaging
    const baseName = bulkProduct.name
      .toLowerCase()
      .replace(/\[.*\]/g, "") // Remove anything in brackets
      .replace(/\s*bag\s*/g, "") // Remove "bag" from name
      .replace(/\s*pack\s*/g, "") // Remove "pack" from name
      .replace(/\s*package\s*/g, "") // Remove "package" from name
      .replace(/\s*bulk\s*/g, "") // Remove "bulk" from name
      .trim();

    const individualProduct = allProducts.find(
      (product) =>
        product.packagingType === "single" &&
        product.name.toLowerCase().includes(baseName) &&
        product.id !== bulkProduct.id
    );

    if (individualProduct) {
      return individualProduct;
    }

    // Strategy 3: Look for any single product in the same category as fallback
    const fallbackIndividual = allProducts.find(
      (product) =>
        product.packagingType === "single" &&
        product.category === bulkProduct.category
    );

    return fallbackIndividual || null;
  };

  // Get available products for replacement based on type
  const getAvailableReplacementProducts = (currentItem, replacementType) => {
    const currentProduct = allProducts.find((p) => p.id === currentItem.id);

    if (currentProduct?.packagingType === "bulk") {
      if (replacementType === "piece") {
        // For piece replacement, show individual/single products
        return allProducts.filter(
          (product) => product.packagingType === "single"
        );
      } else {
        // For bag replacement, show ALL bulk products
        return allProducts.filter(
          (product) => product.packagingType === "bulk"
        );
      }
    } else {
      // For single products, they can only be replaced by themselves
      return allProducts.filter((product) => product.id === currentItem.id);
    }
  };

  // Get available products for general replacement - ALL products
  const getAvailableGeneralReplacementProducts = () => {
    return allProducts;
  };

  const itemsForValidation = badOrderDetails.items || order.items;
  const hasValidBadOrderItems = itemsForValidation.some(
    (item) => (item.badPieces || 0) > 0 && item.selectedProductId
  );

  // Check if general replacement has valid products - FIXED VERSION
  const hasValidGeneralReplacement = generalReplacement.products.some(
    (product) =>
      product.productId && (product.quantity > 0 || product.quantity === "")
  );

  // Validate before processing - FIXED VERSION
  const validateBeforeProcessing = () => {
    if (!badOrderDetails.reason) {
      alert("Please select a reason for the bad order");
      return false;
    }

    if (!hasValidBadOrderItems) {
      alert(
        "Please specify at least one item to replace with valid quantities"
      );
      return false;
    }

    // Validate general replacement if enabled
    if (generalReplacement.enabled) {
      if (generalReplacement.products.length === 0) {
        alert("Please add at least one replacement product");
        return false;
      }

      // Check each product has valid data
      for (const product of generalReplacement.products) {
        if (!product.productId) {
          alert("Please select a product for all replacement entries");
          return false;
        }
        if (!product.quantity || product.quantity < 1) {
          alert(
            "Please enter a valid quantity (at least 1) for all replacement products"
          );
          return false;
        }
      }
    }

    return true;
  };

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

  // Handle replacement type change
  const handleReplacementTypeChange = (itemIndex, newType) => {
    // Don't allow individual replacement type changes when general replacement is enabled
    if (generalReplacement.enabled) {
      alert(
        "Individual replacement type changes are disabled when general replacement is enabled. Please disable general replacement first."
      );
      return;
    }

    setReplacementTypes((prev) => ({
      ...prev,
      [itemIndex]: newType,
    }));

    // Use the state-managed items array
    const currentItems = badOrderDetails.items || order.items;
    const item = currentItems[itemIndex];
    const productInfo = allProducts.find((p) => p.id === item.id);

    if (productInfo?.packagingType === "bulk") {
      // Simplified logic
      if (newType === "piece") {
        // Find the individual product for "piece"
        const suggestedProduct = findIndividualProductForBulk(productInfo);
        if (suggestedProduct) {
          handleProductSelect(
            itemIndex,
            suggestedProduct.id,
            suggestedProduct.name
          );
        } else {
          // Fallback if no individual product is found
          handleProductSelect(itemIndex, productInfo.id, productInfo.name);
        }
      } else {
        // For "bag", always default to the product itself
        handleProductSelect(itemIndex, productInfo.id, productInfo.name);
      }
    }
  };

  // Auto-select products when component loads or order changes
  useEffect(() => {
    if (order.items && allProducts.length > 0) {
      const initialReplacementTypes = {};

      // Create a new array based on order.items to avoid mutating the prop
      const updatedItems = order.items.map((item, index) => {
        let newItem = { ...item }; // Copy the item

        // First, try to find the product by direct ID match
        let productInfo = allProducts.find((p) => p.id === item.id);

        // Strategy 1: Check if this is an individual product that belongs to a bulk package
        if (!productInfo) {
          const bulkProduct = allProducts.find(
            (p) => p.packagingType === "bulk" && p.parentProductId === item.id
          );
          if (bulkProduct) {
            productInfo = bulkProduct;
          }
        }

        // Strategy 2: Try to find by name as fallback
        if (!productInfo) {
          const productByName = allProducts.find((p) => p.name === item.name);
          if (productByName) {
            productInfo = productByName;
          }
        }

        if (!productInfo) {
          // Skip auto-selection for this item since we can't find the product
          initialReplacementTypes[index] = "piece";
          return newItem; // Return the copied item as-is
        }

        // Set default replacement type
        if (productInfo.packagingType === "bulk") {
          initialReplacementTypes[index] = "piece"; // Default to piece
          const suggestedProduct = findIndividualProductForBulk(productInfo);

          if (suggestedProduct) {
            newItem.selectedProductId = suggestedProduct.id;
            newItem.selectedProductName = suggestedProduct.name;
          } else {
            // If no individual product found, select the bulk product itself
            newItem.selectedProductId = productInfo.id;
            newItem.selectedProductName = productInfo.name;
          }
        } else {
          // For single products
          initialReplacementTypes[index] = "piece";
          if (!item.selectedProductId) {
            newItem.selectedProductId = item.id;
            newItem.selectedProductName = item.name;
          }
        }
        return newItem; // Return the modified item
      });

      setReplacementTypes(initialReplacementTypes);
      // Set the badOrderDetails state *once* with the fully prepared items array
      setBadOrderDetails((prev) => ({
        ...prev,
        // Reset badPieces to 0 for all items when order changes
        items: updatedItems.map((item) => ({ ...item, badPieces: 0 })),
        reason: "", // Also reset reason
        action: "replace", // Reset action
      }));

      // Reset general replacement when order changes
      setGeneralReplacement({
        enabled: false,
        products: [],
      });
    }
  }, [order, allProducts, setBadOrderDetails]);

  // Handle process bad order button click - FIXED VERSION
  const handleProcessClick = () => {
    if (!validateBeforeProcessing()) {
      return;
    }

    // Create the complete bad order data to process
    const badOrderData = {
      order: order, // original order
      badOrderDetails: {
        ...badOrderDetails,
        refundAmount,
        processedAt: new Date().toISOString(),
        generalReplacement: generalReplacement.enabled
          ? {
              ...generalReplacement,
              products: generalReplacement.products.map((product) => ({
                ...product,
                // Ensure quantity is at least 1
                quantity: Math.max(1, product.quantity || 1),
              })),
            }
          : null,
      },
    };

    onProcessBadOrder(badOrderData);
  };

  return (
    <div className="bad-order-modal-component modal-overlay">
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
                  <strong>Automatic selection:</strong> System auto-selects the
                  appropriate replacement product
                </span>
              </div>
              <div className="instruction-step">
                <span className="step-number">2</span>
                <span>
                  <strong>Replacement type:</strong> Choose between replacing
                  individual pieces or entire bags
                </span>
              </div>
              <div className="instruction-step">
                <span className="step-number">3</span>
                <span>
                  <strong>General Replacement:</strong> Use specific products
                  from inventory for all replacements (optional)
                </span>
              </div>
              <div className="instruction-step">
                <span className="step-number">4</span>
                <span>Enter quantity to replace and process the bad order</span>
              </div>
            </div>
          </div>

          {/* General Replacement Section */}
          <div className="general-replacement-section">
            <div className="form-section">
              <h4 className="section-title">
                <FontAwesomeIcon icon={faExchangeAlt} />
                General Replacement (Optional)
              </h4>

              <div className="general-replacement-card">
                <div className="general-replacement-toggle">
                  <div className="toggle-container">
                    <span className="toggle-label">General Replacement:</span>
                    <div
                      className={`sliding-toggle ${
                        generalReplacement.enabled ? "enabled" : "disabled"
                      }`}
                      onClick={() =>
                        handleGeneralReplacementToggle(
                          !generalReplacement.enabled
                        )
                      }
                    >
                      <div className="toggle-slider"></div>
                      <div className="toggle-options">
                        <span className="toggle-option disabled"></span>
                        <span className="toggle-option enabled"></span>
                      </div>
                    </div>
                  </div>
                  <div className="toggle-description">
                    Toggle to use specific products from inventory for all
                    replacements
                  </div>
                </div>

                {generalReplacement.enabled && (
                  <div className="general-replacement-controls">
                    <div className="general-products-list">
                      {generalReplacement.products.map((product, index) => (
                        <div key={index} className="general-product-item">
                          <div className="general-product-header">
                            <h5>Replacement Product #{index + 1}</h5>
                            {generalReplacement.products.length > 1 && (
                              <button
                                type="button"
                                className="remove-product-btn"
                                onClick={() =>
                                  handleRemoveGeneralProduct(index)
                                }
                              >
                                <FontAwesomeIcon icon={faMinus} />
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="general-product-form">
                            <div className="form-group">
                              <label>
                                <FontAwesomeIcon icon={faSearch} />
                                Select Product *
                              </label>
                              <ProductSearchSelector
                                products={getAvailableGeneralReplacementProducts()}
                                selectedProductId={product.productId}
                                onProductSelect={(productId, productName) =>
                                  handleGeneralProductSelect(
                                    index,
                                    productId,
                                    productName
                                  )
                                }
                                placeholder="Search for any product in inventory..."
                              />
                            </div>

                            {product.productId && (
                              <div className="form-group replacement-type-toggle">
                                <label>Replacement Type</label>
                                <div className="toggle-container">
                                  <span className="toggle-label">
                                    {product.replacementType === "piece"
                                      ? "By Piece"
                                      : "By Bag"}
                                  </span>
                                  <div
                                    className={`sliding-toggle ${
                                      product.replacementType === "piece"
                                        ? "piece-active"
                                        : "bag-active"
                                    }`}
                                    onClick={() =>
                                      handleGeneralReplacementTypeChange(
                                        index,
                                        product.replacementType === "piece"
                                          ? "bag"
                                          : "piece"
                                      )
                                    }
                                  >
                                    <div className="toggle-slider"></div>
                                    <div className="toggle-options">
                                      <span className="toggle-option piece">
                                        Piece
                                      </span>
                                      <span className="toggle-option bag">
                                        Bag
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="toggle-description">
                                  {product.replacementType === "piece"
                                    ? "Replace as individual pieces"
                                    : "Replace as entire bags/packages"}
                                </div>
                              </div>
                            )}

                            <div className="form-group">
                              <label>Quantity to Deduct *</label>
                              <input
                                type="number"
                                min="1"
                                value={product.quantity}
                                onChange={(e) =>
                                  handleGeneralProductQuantityChange(
                                    index,
                                    e.target.value
                                  )
                                }
                                className="quantity-input"
                                placeholder="Enter quantity"
                              />
                              <div className="input-info">
                                Number of{" "}
                                {product.replacementType === "piece"
                                  ? "pieces"
                                  : "bags"}{" "}
                                to deduct from stock
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="add-product-btn"
                      onClick={handleAddGeneralProduct}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                      Add Another Replacement Product
                    </button>

                    <div className="general-replacement-notice">
                      <FontAwesomeIcon icon={faInfoCircle} />
                      <strong>How this works:</strong> When you specify
                      quantities for bad items below, the system will use the
                      selected products above for stock deduction. You can add
                      multiple products if needed.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bad Order Form */}
          <div className="bad-order-form">
            <div className="form-section">
              <h4 className="section-title">
                <FontAwesomeIcon icon={faBox} />
                Specify Items to Replace
                {generalReplacement.enabled &&
                  generalReplacement.products.length > 0 && (
                    <span className="general-mode-badge">
                      Using {generalReplacement.products.length} Replacement
                      Product(s)
                    </span>
                  )}
              </h4>

              {(badOrderDetails.items || order.items)?.map((item, index) => {
                // Try multiple strategies to find the product
                let productInfo = allProducts.find((p) => p.id === item.id);

                if (!productInfo) {
                  // Check if this is an individual product that belongs to a bulk package
                  productInfo = allProducts.find(
                    (p) =>
                      p.packagingType === "bulk" &&
                      p.parentProductId === item.id
                  );
                }

                if (!productInfo) {
                  // Try name matching as last resort
                  productInfo = allProducts.find((p) => p.name === item.name);
                }

                // If product not found, show error message and skip this item
                if (!productInfo) {
                  return (
                    <div
                      key={index}
                      className="bad-order-item-card"
                      style={{ borderColor: "red" }}
                    >
                      <div className="item-header">
                        <div className="item-info">
                          <span className="item-name" style={{ color: "red" }}>
                            {item.name}
                          </span>
                          <span
                            className="item-quantity"
                            style={{ color: "red" }}
                          >
                            Product not found in database! (ID: {item.id})
                          </span>
                        </div>
                      </div>
                      <div style={{ color: "red", padding: "10px" }}>
                        Cannot process this item - product data missing from
                        inventory.
                      </div>
                    </div>
                  );
                }

                const isBulkProduct = productInfo.packagingType === "bulk";
                const replacementType = replacementTypes[index] || "piece";

                // Calculate max quantity based on replacement type
                const maxQuantity =
                  replacementType === "bag" && isBulkProduct
                    ? item.quantity // Max is number of bags
                    : isBulkProduct
                    ? (productInfo?.piecesPerPackage || 1) * item.quantity // Max pieces total
                    : item.quantity; // For single items, max is quantity ordered

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
                      {/* Replacement Type Toggle - Only show for ACTUAL bulk products and when general replacement is disabled */}
                      {isBulkProduct && !generalReplacement.enabled && (
                        <div className="form-group replacement-type-toggle">
                          <label>Replacement Type</label>
                          <div className="toggle-container">
                            <span className="toggle-label">
                              {replacementType === "piece"
                                ? "By Piece"
                                : "By Bag"}
                            </span>
                            <div
                              className={`sliding-toggle ${
                                replacementType === "piece"
                                  ? "piece-active"
                                  : "bag-active"
                              }`}
                              onClick={() =>
                                handleReplacementTypeChange(
                                  index,
                                  replacementType === "piece" ? "bag" : "piece"
                                )
                              }
                            >
                              <div className="toggle-slider"></div>
                              <div className="toggle-options">
                                <span className="toggle-option piece">
                                  Piece
                                </span>
                                <span className="toggle-option bag">Bag</span>
                              </div>
                            </div>
                          </div>
                          <div className="toggle-description">
                            {replacementType === "piece"
                              ? "Replace individual pieces from single products"
                              : "Replace entire bags from bulk inventory"}
                          </div>
                        </div>
                      )}

                      {/* Product Selection - Only show when general replacement is disabled */}
                      {!generalReplacement.enabled && (
                        <div className="form-group product-selection">
                          <label>
                            <FontAwesomeIcon icon={faSearch} />
                            {isBulkProduct
                              ? `Select ${
                                  replacementType === "piece"
                                    ? "Individual Product"
                                    : "Bulk Product"
                                } to Deduct From *`
                              : "Product to Deduct From *"}
                          </label>

                          {isBulkProduct ? (
                            <div className="search-with-suggestion">
                              <ProductSearchSelector
                                products={getAvailableReplacementProducts(
                                  item,
                                  replacementType
                                )}
                                selectedProductId={item.selectedProductId}
                                onProductSelect={(productId, productName) =>
                                  handleProductSelect(
                                    index,
                                    productId,
                                    productName
                                  )
                                }
                                placeholder={`Search for ${
                                  replacementType === "piece"
                                    ? "individual"
                                    : "bulk"
                                } products...`}
                              />
                            </div>
                          ) : (
                            <div className="auto-selected-product">
                              <div className="selected-product-card">
                                <div className="product-name">
                                  <strong>{item.name}</strong>
                                </div>
                                <div className="stock-info">
                                  Current stock: {productInfo?.stock || 0}{" "}
                                  pieces
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
                              Will deduct from:{" "}
                              <strong>{item.selectedProductName}</strong>
                              {!isBulkProduct && " (this product)"}
                              {isBulkProduct &&
                                replacementType === "piece" &&
                                " (individual product)"}
                              {isBulkProduct &&
                                replacementType === "bag" &&
                                " (bulk product)"}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show general replacement info when enabled */}
                      {generalReplacement.enabled && (
                        <div className="general-replacement-info">
                          <div className="general-replacement-badge">
                            <FontAwesomeIcon icon={faExchangeAlt} />
                            Using General Replacement
                          </div>
                          <div className="general-product-details">
                            <strong>Replacement Products:</strong>{" "}
                            {generalReplacement.products.length > 0
                              ? generalReplacement.products
                                  .map((p) => p.productName)
                                  .join(", ")
                              : "No products selected"}
                            {generalReplacement.products.length === 0 && (
                              <div className="input-warning">
                                Please add at least one replacement product
                                above
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Quantity Input */}
                      <div className="form-group pieces-input">
                        <label>
                          {isBulkProduct && !generalReplacement.enabled
                            ? `Number of ${
                                replacementType === "piece" ? "Pieces" : "Bags"
                              } to Replace *`
                            : "Number of Pieces to Replace *"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={maxQuantity}
                          value={item.badPieces || ""}
                          onChange={(e) =>
                            handleItemBadPiecesChange(index, e.target.value)
                          }
                          placeholder="0"
                          className="pieces-input-field"
                          disabled={
                            generalReplacement.enabled &&
                            generalReplacement.products.length === 0
                          }
                        />
                        <div className="input-info">
                          <span className="max-pieces">
                            Maximum: {maxQuantity}{" "}
                            {isBulkProduct &&
                            !generalReplacement.enabled &&
                            replacementType === "bag"
                              ? "bags"
                              : "pieces"}
                          </span>
                          {isBulkProduct &&
                            replacementType === "piece" &&
                            productInfo?.piecesPerPackage && (
                              <span className="package-info">
                                {productInfo.piecesPerPackage} pieces per
                                package
                              </span>
                            )}
                        </div>
                        {generalReplacement.enabled &&
                          generalReplacement.products.length === 0 && (
                            <div className="input-warning">
                              Please add at least one replacement product first
                            </div>
                          )}
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
                                  {!generalReplacement.enabled && isBulkProduct
                                    ? (replacementType === "piece"
                                        ? "Pieces"
                                        : "Bags") + " to replace:"
                                    : "Pieces to replace:"}
                                </span>
                                <span className="summary-value pieces-count">
                                  {item.badPieces}{" "}
                                  {!generalReplacement.enabled &&
                                  isBulkProduct &&
                                  replacementType === "bag"
                                    ? "bags"
                                    : "pieces"}
                                </span>
                              </div>
                              <div className="summary-row">
                                <span className="summary-label">
                                  Deduct from:
                                </span>
                                <span className="summary-value target-product">
                                  {item.selectedProductName}
                                  {generalReplacement.enabled &&
                                    " (General Replacement)"}
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
                      "Replace damaged pieces at no cost - stock will be deducted from inventory"}
                    {badOrderDetails.action === "partial_refund" &&
                      "Refund value of damaged pieces + replace them - stock will be deducted from inventory"}
                    {badOrderDetails.action === "full_refund" &&
                      "Full refund + customer keeps all items - NO stock deduction from inventory"}
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
                            (badOrderDetails.items || order.items).filter(
                              (item) => (item.badPieces || 0) > 0
                            ).length
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
            onClick={handleProcessClick}
            disabled={
              !badOrderDetails.reason ||
              !hasValidBadOrderItems ||
              (generalReplacement.enabled &&
                generalReplacement.products.length === 0)
            }
          >
            <FontAwesomeIcon icon={faExclamationTriangle} />
            Process Bad Order
            {refundAmount > 0 && ` (Refund: ₱${refundAmount.toFixed(2)})`}
            {generalReplacement.enabled && " [General Replacement]"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BadOrderModal;
