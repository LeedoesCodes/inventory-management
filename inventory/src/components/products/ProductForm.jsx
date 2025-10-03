import { useState, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../Firebase/firebase"; // Adjust the import path to your firebase config

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

  useEffect(() => {
    if (selectedProduct) {
      console.log("Selected Product Data:", selectedProduct);
      setName(selectedProduct.name || "");
      setPrice(selectedProduct.price || "");
      setStock(selectedProduct.stock || "");
      setCategory(selectedProduct.category || "");
      setBarcode(selectedProduct.barcode || "");
      setImageFile(null); // Reset file input when editing existing product
    } else {
      setName("");
      setPrice("");
      setStock("");
      setCategory("");
      setBarcode("");
      setImageFile(null);
    }
  }, [selectedProduct]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
    setUploading(true);

    try {
      let imageUrl = selectedProduct?.imageUrl || "";

      if (imageFile) {
        imageUrl = await uploadImageToFirebase(imageFile);
      }

      const productData = {
        name,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        barcode,
        imageUrl,
      };

      await onSave(productData, imageFile);
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error saving product: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  // Extract filename from URL for existing products
  const getFileNameFromUrl = (url) => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      // Extract the filename from the path
      const filename = pathname.split("/").pop();
      // Remove the timestamp and random string to get original filename
      const originalName = filename.split("_").slice(2).join("_");
      return originalName || "uploaded-image.jpg";
    } catch (error) {
      // If it's not a valid URL, try to extract from the string
      const parts = url.split("/");
      return parts[parts.length - 1] || "uploaded-image.jpg";
    }
  };

  const hasExistingImage = selectedProduct?.imageUrl && !imageFile;
  const existingFileName = hasExistingImage
    ? getFileNameFromUrl(selectedProduct.imageUrl)
    : null;

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <div className="form-group">
        <label>Product Name *</label>
        <input
          type="text"
          value={name}
          placeholder="Product Name"
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Barcode Number</label>
        <input
          type="text"
          value={barcode}
          placeholder="Barcode Number (e.g., 4800016022361)"
          onChange={(e) => setBarcode(e.target.value)}
        />
        {selectedProduct && selectedProduct.barcode && (
          <small className="current-barcode">
            Current barcode: {selectedProduct.barcode}
          </small>
        )}
      </div>

      <div className="form-group">
        <label>Price *</label>
        <input
          type="number"
          value={price}
          placeholder="Price"
          onChange={(e) => setPrice(e.target.value)}
          step="0.01"
          min="0"
          required
        />
      </div>

      <div className="form-group">
        <label>Stock Quantity *</label>
        <input
          type="number"
          value={stock}
          placeholder="Stock Quantity"
          onChange={(e) => setStock(e.target.value)}
          min="0"
          required
        />
      </div>

      <div className="form-group">
        <label>Category *</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
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
        <label>Product Image</label>
        <input type="file" onChange={handleImageChange} accept="image/*" />

        {/* Show current file name when editing */}
        {hasExistingImage && (
          <div className="file-preview existing-file">
            <span className="file-name">Current: {existingFileName}</span>
            <span className="file-status">(Upload new image to replace)</span>
          </div>
        )}

        {/* Show new file name when a file is selected */}
        {imageFile && (
          <div className="file-preview new-file">
            <span className="file-name">New: {imageFile.name}</span>
            <button
              type="button"
              onClick={clearImage}
              className="clear-file-btn"
            >
              ×
            </button>
          </div>
        )}
      </div>

      <div className="form-buttons">
        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : selectedProduct ? "Update" : "Add"}{" "}
          Product
        </button>
        <button type="button" onClick={onClose} disabled={uploading}>
          Cancel
        </button>
      </div>
    </form>
  );
}
