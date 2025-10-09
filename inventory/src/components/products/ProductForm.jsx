import { useState, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../Firebase/firebase";

const categories = [
  "LARGE",
  "EXTRA SIZE(UA)",
  "FAMILY",
  "BEERMATCH",
  "SUNDAYS",
  "MARSHMALLOW",
  "BREADPAN 100/24G",
  "PINATSU",
  "FROOZE",
  "SMART C+ 500ML",
  "SMART C+LITER",
  "ROYAL DAICHI",
  "DKFPI",
  "LOADED 32X100",
  "NUTRI 25X100",
  "NUTRI 60X50",
  "NUTRI 90X25",
  "LONBISCO",
  "LESLIE'S",
  "PURESNACK",
  "none",
];

export default function ProductForm({ selectedProduct, onSave, onClose }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [barcode, setBarcode] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [useCustomThreshold, setUseCustomThreshold] = useState(false);
  const [customThreshold, setCustomThreshold] = useState("");
  const [defaultThreshold, setDefaultThreshold] = useState(5);

  useEffect(() => {
    const fetchDefaultThreshold = async () => {
      setDefaultThreshold(5);
    };
    fetchDefaultThreshold();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      console.log("Selected Product Data:", selectedProduct);
      setName(selectedProduct.name || "");
      setPrice(selectedProduct.price || "");
      setStock(selectedProduct.stock || "");
      setCategory(selectedProduct.category || "");
      setBarcode(selectedProduct.barcode || "");

      const hasCustomThreshold =
        selectedProduct.lowStockThreshold !== null &&
        selectedProduct.lowStockThreshold !== undefined;
      setUseCustomThreshold(hasCustomThreshold);
      setCustomThreshold(
        hasCustomThreshold
          ? selectedProduct.lowStockThreshold.toString()
          : defaultThreshold.toString()
      );

      setImageFile(null);
    } else {
      setName("");
      setPrice("");
      setStock("");
      setCategory("");
      setBarcode("");
      setUseCustomThreshold(false);
      setCustomThreshold(defaultThreshold.toString());
      setImageFile(null);
    }
  }, [selectedProduct, defaultThreshold]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      // Validate file type
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
      alert("Please enter a valid price");
      return;
    }
    if (!stock || parseInt(stock) < 0) {
      alert("Please enter a valid stock quantity");
      return;
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

      const productData = {
        name: name.trim(),
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        barcode: barcode.trim(),
        imageUrl,
        lowStockThreshold: useCustomThreshold
          ? parseInt(customThreshold)
          : null,
      };

      console.log("🟡 [ProductForm] SAVING PRODUCT DATA:", {
        useCustomThreshold,
        customThreshold,
        savedThreshold: productData.lowStockThreshold,
        isEditing: !!selectedProduct,
        productId: selectedProduct?.id,
        productData,
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
      // Extract original filename if possible
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
    <form onSubmit={handleSubmit} className="product-form horizontal-layout">
      <div className="form-columns">
        {/* Left Column - Basic Information */}
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
                onChange={(e) => setName(e.target.value)}
                required
                disabled={uploading}
              />
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
            </div>

            <div className="form-group">
              <label htmlFor="product-barcode">Barcode Number</label>
              <input
                id="product-barcode"
                type="text"
                value={barcode}
                placeholder="e.g., 4800016022361"
                onChange={(e) => setBarcode(e.target.value)}
                disabled={uploading}
              />
              {selectedProduct && selectedProduct.barcode && (
                <small className="current-barcode">
                  Current: {selectedProduct.barcode}
                </small>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Pricing & Stock</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="product-price">Price *</label>
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
              </div>

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
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Advanced Settings */}
        <div className="form-column">
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
        </div>
      </div>

      {/* Form Actions - Fixed to always be visible */}
      <div className="form-actions-sticky">
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary"
          disabled={uploading}
        >
          Cancel
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
