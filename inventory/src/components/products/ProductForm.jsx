import { useState, useEffect } from "react";

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
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [barcode, setBarcode] = useState("");
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (selectedProduct) {
      setName(selectedProduct.name || "");
      setDescription(selectedProduct.description || "");
      setPrice(selectedProduct.price || "");
      setStock(selectedProduct.stock || "");
      setCategory(selectedProduct.category || "");
      setBarcode(selectedProduct.barcode || "");
      setImageFile(null);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setCategory("");
      setBarcode("");
      setImageFile(null);
    }
  }, [selectedProduct]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, description, price, stock, category, barcode }, imageFile);
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <input
        type="text"
        value={name}
        placeholder="Product Name"
        onChange={(e) => setName(e.target.value)}
        required
      />

      <input
        type="text"
        value={barcode}
        placeholder="Barcode Number (e.g., 4800016022361)"
        onChange={(e) => setBarcode(e.target.value)}
      />

      <input
        type="number"
        value={price}
        placeholder="Price"
        onChange={(e) => setPrice(e.target.value)}
        required
      />

      <input
        type="number"
        value={stock}
        placeholder="Stock Quantity"
        onChange={(e) => setStock(e.target.value)}
        required
      />

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

      <input
        type="file"
        onChange={(e) => setImageFile(e.target.files[0])}
        accept="image/*"
      />

      <div className="form-buttons">
        <button type="submit">
          {selectedProduct ? "Update" : "Add"} Product
        </button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}
