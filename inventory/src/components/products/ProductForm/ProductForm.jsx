// components/products/ProductForm/ProductForm.jsx
import { useState, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../Firebase/firebase";
import ProductSearchSelector from "../../UI/ProductSearchSelector";
import "./productform.scss";

// Add unit types
const unitTypes = ["piece", "bag", "pack", "bottle", "can", "box"];

export default function ProductForm({
  selectedProduct,
  onSave,
  onClose,
  isFullPage = false,
  allProducts = [], // Add this prop to get all products for packaging relationships
  categories = [], // Add categories as a prop (dynamic from Firestore)
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [barcode, setBarcode] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [useCustomThreshold, setUseCustomThreshold] = useState(false);
  const [customThreshold, setCustomThreshold] = useState("");
  const [defaultThreshold, setDefaultThreshold] = useState(5);

  // NEW: Track if name was manually modified
  const [isNameManuallySet, setIsNameManuallySet] = useState(false);

  // Packaging states
  const [unit, setUnit] = useState("piece");
  const [packagingType, setPackagingType] = useState("single");
  const [piecesPerPackage, setPiecesPerPackage] = useState("");
  const [parentProductId, setParentProductId] = useState("");
  const [parentProductName, setParentProductName] = useState("");
  const [isTestProduct, setIsTestProduct] = useState(false);

  // Filter available parent products (single items only)
  const availableParentProducts = allProducts.filter(
    (product) =>
      product.packagingType === "single" && product.id !== selectedProduct?.id,
  );

  // NEW: Handle name change - mark as manually set when user types
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);

    // Mark as manually set if user is typing (not empty and not just whitespace)
    if (newName.trim() !== "") {
      setIsNameManuallySet(true);
    }
  };

  // NEW: Handle product selection from search
  const handleParentProductSelect = (productId, productName) => {
    setParentProductId(productId);
    setParentProductName(productName);

    // Auto-fill logic when product is selected - ONLY SUGGESTIONS, NO AUTO-FILL
    if (productId && piecesPerPackage) {
      const parentProduct = availableParentProducts.find(
        (p) => p.id === productId,
      );

      if (parentProduct) {
        // ONLY auto-generate name if it hasn't been manually set
        if (!isNameManuallySet) {
          // UPDATED: Remove "Pack" suffix from auto-generated name
          const suggestedName = `${parentProduct.name}`;
          setName(suggestedName);
        }

        // Auto-set category if empty
        if (!category && parentProduct.category) {
          setCategory(parentProduct.category);
        }

        // Auto-set unit to "pack" for bulk items if not set
        if (unit === "piece") {
          setUnit("pack");
        }
      }
    }
  };

  // NEW: Auto-fill bulk package details when pieces per package changes - ONLY SUGGESTIONS
  useEffect(() => {
    if (packagingType === "bulk" && parentProductId && piecesPerPackage) {
      const parentProduct = availableParentProducts.find(
        (p) => p.id === parentProductId,
      );

      if (parentProduct) {
        // ONLY auto-generate name if it hasn't been manually set
        if (!isNameManuallySet) {
          // UPDATED: Remove "Pack" suffix from auto-generated name
          const suggestedName = `${parentProduct.name}`;
          setName(suggestedName);
        }

        // Auto-set category if empty
        if (!category && parentProduct.category) {
          setCategory(parentProduct.category);
        }

        // Auto-set unit to "pack" for bulk items if not set
        if (unit === "piece") {
          setUnit("pack");
        }
      }
    }
  }, [
    packagingType,
    parentProductId,
    piecesPerPackage,
    availableParentProducts,
    name,
    category,
    unit,
    isNameManuallySet, // Add this dependency
  ]);

  // Reset form when packaging type changes
  useEffect(() => {
    if (packagingType === "single") {
      setPiecesPerPackage("");
      setParentProductId("");
      setParentProductName("");
      // Keep unit as is, don't reset to piece
    }
  }, [packagingType]);

  const calculateProfitMargin = () => {
    if (!price || !costPrice) return null;

    const sellingPrice = parseFloat(price);
    const cost = parseFloat(costPrice);

    if (cost <= 0) return null;

    const profit = sellingPrice - cost;
    const margin = (profit / cost) * 100;

    return {
      profit: profit.toFixed(2),
      margin: margin.toFixed(1),
    };
  };

  const profitData = calculateProfitMargin();

  // NEW: Calculate price per piece for bulk items
  const calculatePricePerPiece = () => {
    if (packagingType === "bulk" && price && piecesPerPackage) {
      return (parseFloat(price) / parseInt(piecesPerPackage)).toFixed(2);
    }
    return null;
  };

  const pricePerPiece = calculatePricePerPiece();

  // NEW: Get parent product info for display
  const getParentProductInfo = () => {
    if (packagingType === "bulk" && parentProductId) {
      return availableParentProducts.find((p) => p.id === parentProductId);
    }
    return null;
  };

  const parentProduct = getParentProductInfo();

  // NEW: Calculate suggested prices for display only
  const calculateSuggestedPrices = () => {
    if (!parentProduct || !piecesPerPackage) return null;

    const parentPrice = parentProduct.price || 0;
    const parentCost = parentProduct.costPrice || 0;
    const pieces = parseInt(piecesPerPackage) || 0;

    return {
      regularPrice: (parentPrice * pieces).toFixed(2),
      discountedPrice: (parentPrice * pieces * 0.9).toFixed(2), // 10% discount
      costPrice: parentCost ? (parentCost * pieces).toFixed(2) : null,
    };
  };

  const suggestedPrices = calculateSuggestedPrices();

  useEffect(() => {
    const fetchDefaultThreshold = async () => {
      setDefaultThreshold(5);
    };
    fetchDefaultThreshold();
  }, []);

  // Reset manual name flag when selected product changes
  useEffect(() => {
    if (selectedProduct) {
      console.log("Selected Product Data:", selectedProduct);
      setName(selectedProduct.name || "");
      setPrice(selectedProduct.price || "");
      setCostPrice(selectedProduct.costPrice || "");
      setStock(selectedProduct.stock || "");
      setCategory(selectedProduct.category || "");
      setBarcode(selectedProduct.barcode || "");
      setUnit(selectedProduct.unit || "piece");

      // Packaging fields
      setPackagingType(selectedProduct.packagingType || "single");
      setPiecesPerPackage(selectedProduct.piecesPerPackage || "");
      setParentProductId(selectedProduct.parentProductId || "");
      setIsTestProduct(Boolean(selectedProduct.isTestProduct));

      // Get parent product name for display
      if (selectedProduct.parentProductId) {
        const parent = allProducts.find(
          (p) => p.id === selectedProduct.parentProductId,
        );
        setParentProductName(parent?.name || "");
      }

      const hasCustomThreshold =
        selectedProduct.lowStockThreshold !== null &&
        selectedProduct.lowStockThreshold !== undefined;
      setUseCustomThreshold(hasCustomThreshold);
      setCustomThreshold(
        hasCustomThreshold
          ? selectedProduct.lowStockThreshold.toString()
          : defaultThreshold.toString(),
      );

      setImageFile(null);

      // Reset manual name flag when editing existing product
      setIsNameManuallySet(!!selectedProduct.name);
    } else {
      // Reset all fields for new product
      setName("");
      setPrice("");
      setCostPrice("");
      setStock("");
      setCategory("");
      setBarcode("");
      setUnit("piece");
      setPackagingType("single");
      setPiecesPerPackage("");
      setParentProductId("");
      setParentProductName("");
      setIsTestProduct(false);
      setUseCustomThreshold(false);
      setCustomThreshold(defaultThreshold.toString());
      setImageFile(null);

      // Reset manual name flag for new product
      setIsNameManuallySet(false);
    }
  }, [selectedProduct, defaultThreshold, allProducts]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      if (!file.type.match("image/(png|jpg|jpeg)")) {
        alert("Please select a PNG, JPG, or JPEG image");
        return;
      }
      setImageFile(file);
    }
  };

  const uploadImageToFirebase = async (file) => {
    if (!file) return null;

    try {
      const timestamp = Date.now();
      const fileExtension = file.name.split(".").pop();
      const fileName = `products/${timestamp}_${Math.random()
        .toString(36)
        .substring(2)}.${fileExtension}`;

      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Failed to upload image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      alert("Product name is required");
      return;
    }
    if (!category) {
      alert("Category is required");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      alert("Please enter a valid selling price");
      return;
    }
    if (costPrice && parseFloat(costPrice) < 0) {
      alert("Cost price cannot be negative");
      return;
    }
    if (!stock || parseInt(stock) < 0) {
      alert("Please enter a valid stock quantity");
      return;
    }
    if (packagingType === "bulk") {
      if (!piecesPerPackage || parseInt(piecesPerPackage) < 1) {
        alert("Please enter valid pieces per package for bulk items");
        return;
      }
      if (!parentProductId) {
        alert("Please select a parent product for bulk items");
        return;
      }

      // NEW: Validate that parent product is not itself
      if (selectedProduct && parentProductId === selectedProduct.id) {
        alert("A product cannot be its own parent");
        return;
      }
    }
    if (
      useCustomThreshold &&
      (!customThreshold || parseInt(customThreshold) < 1)
    ) {
      alert("Please enter a valid custom threshold");
      return;
    }

    setUploading(true);

    try {
      let imageUrl = selectedProduct?.imageUrl || "";

      if (imageFile) {
        imageUrl = await uploadImageToFirebase(imageFile);
      }

      // Enhanced product data structure with packaging
      const productData = {
        name: name.trim(),
        price: parseFloat(price),
        costPrice: costPrice ? parseFloat(costPrice) : null,
        stock: parseInt(stock),
        category,
        barcode: barcode.trim(),
        unit: unit,
        imageUrl,
        lowStockThreshold: useCustomThreshold
          ? parseInt(customThreshold)
          : null,

        // Packaging fields
        packagingType: packagingType,
        piecesPerPackage:
          packagingType === "bulk" ? parseInt(piecesPerPackage) : 1,
        parentProductId: packagingType === "bulk" ? parentProductId : null,
        isBulkPackage: packagingType === "bulk",
        isTestProduct: Boolean(isTestProduct),
      };

      console.log("🟡 [ProductForm] SAVING PRODUCT DATA:", {
        productData,
        isEditing: !!selectedProduct,
        productId: selectedProduct?.id,
      });

      await onSave(productData, imageFile);

      console.log("🟢 [ProductForm] PRODUCT SAVED SUCCESSFULLY");
    } catch (error) {
      console.error("🔴 [ProductForm] Error saving product:", error);
      alert("Error saving product: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  const handleToggleChange = (enabled) => {
    setUseCustomThreshold(enabled);
    if (enabled && !customThreshold) {
      setCustomThreshold(defaultThreshold.toString());
    }
  };

  const getFileNameFromUrl = (url) => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split("/").pop();
      const parts = filename.split("_");
      if (parts.length > 2) {
        return parts.slice(2).join("_");
      }
      return filename || "uploaded-image.jpg";
    } catch (error) {
      const parts = url.split("/");
      return parts[parts.length - 1] || "uploaded-image.jpg";
    }
  };

  const hasExistingImage = selectedProduct?.imageUrl && !imageFile;
  const existingFileName = hasExistingImage
    ? getFileNameFromUrl(selectedProduct.imageUrl)
    : null;

  return (
    <form
      onSubmit={handleSubmit}
      className={`product-form horizontal-layout ${
        isFullPage ? "full-page-mode" : ""
      }`}
    >
      <div className="form-columns">
        {/* Left Column - Basic Information and Packaging */}
        <div className="form-column">
          <div className="form-section">
            <h3 className="section-title">Basic Information</h3>

            <div className="form-group">
              <label htmlFor="product-name">Product Name *</label>
              <input
                id="product-name"
                type="text"
                value={name}
                placeholder="Enter product name"
                onChange={handleNameChange}
                required
                disabled={uploading}
              />
              {packagingType === "bulk" && parentProduct && (
                <small className="field-hint">
                  {isNameManuallySet
                    ? "Manual name entered"
                    : `Auto-generated from ${parentProduct.name}`}
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="product-category">Category *</label>
              <select
                id="product-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                disabled={uploading}
              >
                <option value="" disabled>
                  Select Category
                </option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {packagingType === "bulk" && parentProduct && (
                <small className="field-hint">
                  Inherited from {parentProduct.name}
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="product-unit">Unit Type</label>
              <select
                id="product-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                disabled={uploading}
              >
                {unitTypes.map((unitType) => (
                  <option key={unitType} value={unitType}>
                    {unitType}
                  </option>
                ))}
              </select>
              {packagingType === "bulk" && (
                <small className="field-hint">
                  Recommended: "pack" for bulk packages
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="product-barcode">Barcode Number</label>
              <input
                id="product-barcode"
                type="text"
                value={barcode}
                placeholder="e.g., 4800016022361 (Optional)"
                onChange={(e) => setBarcode(e.target.value)}
                disabled={uploading}
              />
              {selectedProduct && selectedProduct.barcode && (
                <small className="current-barcode">
                  Current: {selectedProduct.barcode}
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="is-test-product">Testing Product</label>
              <label className="checkbox-inline">
                <input
                  id="is-test-product"
                  type="checkbox"
                  checked={isTestProduct}
                  onChange={(e) => setIsTestProduct(e.target.checked)}
                  disabled={uploading}
                />
                Mark this product as testing/sample data
              </label>
              <small className="field-description">
                Testing products can be excluded from audit stats and daily
                totals.
              </small>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Packaging Information</h3>

            <div className="form-group">
              <label htmlFor="packaging-type">Packaging Type</label>
              <select
                id="packaging-type"
                value={packagingType}
                onChange={(e) => setPackagingType(e.target.value)}
                disabled={uploading}
              >
                <option value="single">Single Item</option>
                <option value="bulk">Bulk Package</option>
              </select>
              <small className="field-description">
                {packagingType === "single"
                  ? "Individual items sold separately"
                  : "Packages containing multiple individual items"}
              </small>
            </div>

            {packagingType === "bulk" && (
              <>
                <div className="form-group">
                  <label>Parent Product *</label>
                  <ProductSearchSelector
                    products={availableParentProducts}
                    selectedProductId={parentProductId}
                    onProductSelect={handleParentProductSelect}
                    placeholder="Search for individual products..."
                    disabled={uploading}
                  />
                  <small className="field-description">
                    Search and select the individual product that this package
                    contains
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="pieces-per-package">
                    Pieces per Package *
                  </label>
                  <input
                    id="pieces-per-package"
                    type="number"
                    value={piecesPerPackage}
                    onChange={(e) => setPiecesPerPackage(e.target.value)}
                    min="1"
                    placeholder="e.g., 50"
                    required={packagingType === "bulk"}
                    disabled={uploading}
                  />
                  <small className="field-description">
                    Number of individual pieces in one package
                  </small>
                </div>

                {/* NEW: Parent Product Information Display */}
                {parentProduct && (
                  <div className="parent-product-info">
                    <h4>Parent Product Details</h4>
                    <div className="parent-details">
                      <div className="detail-item">
                        <span className="label">Name:</span>
                        <span className="value">{parentProduct.name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Price per piece:</span>
                        <span className="value">₱{parentProduct.price}</span>
                      </div>
                      {parentProduct.costPrice && (
                        <div className="detail-item">
                          <span className="label">Cost per piece:</span>
                          <span className="value">
                            ₱{parentProduct.costPrice}
                          </span>
                        </div>
                      )}
                      <div className="detail-item">
                        <span className="label">Stock:</span>
                        <span className="value">
                          {parentProduct.stock} pieces
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="form-section">
            <h3 className="section-title">Stock Alert Settings</h3>

            <div className="form-group">
              <div className="threshold-header">
                <label>Low Stock Alert</label>
                <div className="toggle-container">
                  <span
                    className={`toggle-label ${
                      !useCustomThreshold ? "active" : ""
                    }`}
                  >
                    Global
                  </span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={useCustomThreshold}
                      onChange={(e) => handleToggleChange(e.target.checked)}
                      disabled={uploading}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span
                    className={`toggle-label ${
                      useCustomThreshold ? "active" : ""
                    }`}
                  >
                    Custom
                  </span>
                </div>
              </div>

              {useCustomThreshold ? (
                <div className="custom-threshold-input">
                  <label htmlFor="custom-threshold">Custom Threshold</label>
                  <div className="input-with-suffix">
                    <input
                      id="custom-threshold"
                      type="number"
                      value={customThreshold}
                      onChange={(e) => setCustomThreshold(e.target.value)}
                      min="1"
                      placeholder="Enter threshold"
                      required={useCustomThreshold}
                      disabled={uploading}
                    />
                    <span className="input-suffix">items</span>
                  </div>
                </div>
              ) : (
                <div className="global-threshold-display">
                  <div className="global-threshold-value">
                    {defaultThreshold} items
                  </div>
                  <span className="global-threshold-label">
                    Using global setting from System Settings
                  </span>
                </div>
              )}

              {selectedProduct && (
                <div className="current-threshold-info">
                  <span className="current-threshold-label">
                    Current setting:
                  </span>
                  <span className="current-threshold-value">
                    {selectedProduct.lowStockThreshold
                      ? `${selectedProduct.lowStockThreshold} items (custom)`
                      : `${defaultThreshold} items (global)`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Pricing Information and Product Image */}
        <div className="form-column">
          <div className="form-section">
            <h3 className="section-title">Pricing Information</h3>

            <div className="form-group">
              <label htmlFor="cost-price">Cost Price (Purchase Price)</label>
              <div className="input-with-symbol">
                <span className="currency-symbol">₱</span>
                <input
                  id="cost-price"
                  type="number"
                  value={costPrice}
                  placeholder="0.00"
                  onChange={(e) => setCostPrice(e.target.value)}
                  step="0.01"
                  min="0"
                  disabled={uploading}
                />
              </div>
              <small className="field-description">
                The price you paid when buying this product
              </small>
              {packagingType === "bulk" && suggestedPrices?.costPrice && (
                <small className="field-hint suggestion">
                  💡 Suggested: ₱{suggestedPrices.costPrice} (based on{" "}
                  {parentProduct.costPrice} × {piecesPerPackage})
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="product-price">Selling Price *</label>
              <div className="input-with-symbol">
                <span className="currency-symbol">₱</span>
                <input
                  id="product-price"
                  type="number"
                  value={price}
                  placeholder="0.00"
                  onChange={(e) => setPrice(e.target.value)}
                  step="0.01"
                  min="0"
                  required
                  disabled={uploading}
                />
              </div>
              <small className="field-description">
                The price customers will pay
              </small>
              {packagingType === "bulk" && suggestedPrices && (
                <div className="price-suggestions">
                  <small className="field-hint suggestion">
                    💡 Regular price: ₱{suggestedPrices.regularPrice} (
                    {parentProduct.price} × {piecesPerPackage})
                  </small>
                  <small className="field-hint suggestion">
                    💡 With 10% discount: ₱{suggestedPrices.discountedPrice}
                  </small>
                </div>
              )}

              {/* NEW: Price per piece display for bulk items */}
              {packagingType === "bulk" && pricePerPiece && (
                <div className="price-per-piece">
                  <span className="label">Price per piece:</span>
                  <span className="value">₱{pricePerPiece}</span>
                  {parentProduct && (
                    <span className="discount-info">
                      (
                      {(
                        (pricePerPiece / parentProduct.price - 1) *
                        100
                      ).toFixed(1)}
                      % vs individual price)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Profit Margin Display */}
            {profitData && (
              <div className="profit-margin-display">
                <div className="profit-row">
                  <span className="profit-label">Profit per {unit}:</span>
                  <span className="profit-value profit-amount">
                    ₱{profitData.profit}
                  </span>
                </div>
                <div className="profit-row">
                  <span className="profit-label">Profit margin:</span>
                  <span
                    className={`profit-value profit-margin ${
                      parseFloat(profitData.margin) >= 0
                        ? "positive"
                        : "negative"
                    }`}
                  >
                    {profitData.margin}%
                  </span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="product-stock">Stock Quantity *</label>
              <input
                id="product-stock"
                type="number"
                value={stock}
                placeholder="0"
                onChange={(e) => setStock(e.target.value)}
                min="0"
                required
                disabled={uploading}
              />
              {packagingType === "bulk" && piecesPerPackage && (
                <small className="field-description">
                  Each package contains {piecesPerPackage} individual pieces
                </small>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Product Image</h3>

            <div className="form-group">
              <label>Upload Image</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  onChange={handleImageChange}
                  accept="image/png, image/jpg, image/jpeg"
                  className="file-input"
                  disabled={uploading}
                />
                <div className="file-upload-prompt">
                  <span className="upload-icon">📁</span>
                  <span>Click to upload image</span>
                  <small>PNG, JPG, JPEG up to 5MB</small>
                </div>
              </div>

              {/* File Previews */}
              {hasExistingImage && (
                <div className="file-preview existing-file">
                  <div className="file-info">
                    <span className="file-name">{existingFileName}</span>
                    <span className="file-status">Current image</span>
                  </div>
                </div>
              )}

              {imageFile && (
                <div className="file-preview new-file">
                  <div className="file-info">
                    <span className="file-name">{imageFile.name}</span>
                    <span className="file-size">
                      {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="clear-file-btn"
                    disabled={uploading}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* NEW: Packaging Summary Section */}
          {packagingType === "bulk" && parentProduct && piecesPerPackage && (
            <div className="form-section packaging-summary">
              <h3 className="section-title">Packaging Summary</h3>
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="summary-label">Package Composition</div>
                  <div className="summary-value">
                    {piecesPerPackage} × {parentProduct.name}
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Individual Price</div>
                  <div className="summary-value">
                    ₱{parentProduct.price} per piece
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Total Value</div>
                  <div className="summary-value">
                    ₱{suggestedPrices?.regularPrice}
                  </div>
                </div>
              </div>
              <div className="pricing-note">
                <small>
                  💡 Set your selling price above. Consider offering a discount
                  for bulk purchases.
                </small>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div
        className={`form-actions-sticky ${
          isFullPage ? "full-page-actions" : ""
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary"
          disabled={uploading}
        >
          {isFullPage ? "Back to Products" : "Cancel"}
        </button>
        <button type="submit" className="btn-primary" disabled={uploading}>
          {uploading ? (
            <>
              <span className="loading-spinner"></span>
              Saving...
            </>
          ) : selectedProduct ? (
            "Update Product"
          ) : (
            "Add Product"
          )}
        </button>
      </div>
    </form>
  );
}
