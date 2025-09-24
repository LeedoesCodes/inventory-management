import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db, storage } from "../Firebase/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import ProductList from "../components/products/ProductsList";
import ProductForm from "../components/products/ProductForm";
import ProductSearch from "../components/products/ProductSearch";
import Header from "../components/UI/Headers";
import Sidebar from "../components/UI/Sidebar";
import { useSidebar } from "../context/SidebarContext"; // Import the hook
import "../styles/products.scss";

export default function ProductsPage() {
  const { isCollapsed } = useSidebar(); // Use the context hook
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState([]);

  // Remove the local collapsed state since we're using context

  const fetchProducts = async () => {
    const snapshot = await getDocs(collection(db, "products"));
    const productsData = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    setProducts(productsData);
    setFilteredProducts(productsData);

    const uniqueCategories = [...new Set(productsData.map((p) => p.category))];
    setCategories(uniqueCategories);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteDoc(doc(db, "products", id));
      fetchProducts();
    }
  };

  const handleSave = async (productData, imageFile) => {
    try {
      let imageUrl = selectedProduct?.imageUrl || "";

      if (imageFile) {
        const storageRef = ref(
          storage,
          `products/${imageFile.name}_${Date.now()}`
        );
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const productPayload = {
        name: productData.name,
        description: productData.description || "",
        price: Number(productData.price),
        stock: Number(productData.stock),
        category: productData.category || "none",
        imageUrl,
      };

      if (selectedProduct) {
        await updateDoc(
          doc(db, "products", selectedProduct.id),
          productPayload
        );
      } else {
        await addDoc(collection(db, "products"), productPayload);
      }

      await fetchProducts();
      setShowForm(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleSearch = (term, category) => {
    let filtered = products;

    if (term) {
      filtered = filtered.filter((p) =>
        p.name?.toLowerCase().includes(term.toLowerCase())
      );
    }

    if (category) {
      filtered = filtered.filter(
        (p) => p.category?.toLowerCase() === category.toLowerCase()
      );
    }

    setFilteredProducts(filtered);
  };

  return (
    <div className={`products-page ${isCollapsed ? "collapsed" : ""}`}>
      <Header />
      <Sidebar />
      <div className="products-content">
        <div className="search-container">
          <ProductSearch onSearch={handleSearch} categories={categories} />
        </div>

        <ProductList
          products={filteredProducts}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />

        <button className="fab" onClick={handleAddProduct}>
          +
        </button>

        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <button className="close-btn" onClick={() => setShowForm(false)}>
                ✕
              </button>
              <ProductForm
                selectedProduct={selectedProduct}
                onSave={handleSave}
                onClose={() => setShowForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
