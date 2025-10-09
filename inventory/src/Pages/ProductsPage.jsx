import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort } from "@fortawesome/free-solid-svg-icons";

import ProductList from "../components/products/ProductsList";
import ProductForm from "../components/products/ProductForm";
import ProductSearch from "../components/products/ProductSearch";
import Header from "../components/UI/Headers";
import Sidebar from "../components/UI/Sidebar";
import { useSidebar } from "../context/SidebarContext";
import "../styles/products.scss";

export default function ProductsPage() {
  const { isCollapsed } = useSidebar();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [highlightedProductId, setHighlightedProductId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Sorting state
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Check for highlighted product on component mount and URL changes
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    console.log("🔵 URL PARAMS CHECK: highlightId =", highlightId);

    if (highlightId) {
      console.log("🟢 HIGHLIGHT TRIGGERED: Product ID received:", highlightId);

      setHighlightedProductId(highlightId);
      setSearchTerm("");
      setSelectedCategory("");

      // Clear the URL parameter after 5 seconds
      const timer = setTimeout(() => {
        console.log("🟢 HIGHLIGHT: Removing highlight after 5 seconds");
        searchParams.delete("highlight");
        setSearchParams(searchParams, { replace: true });
        setHighlightedProductId(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  // This useEffect will handle highlighting when products are loaded
  useEffect(() => {
    if (products.length > 0 && highlightedProductId) {
      console.log("🟢 PRODUCTS LOADED, APPLYING HIGHLIGHT FILTER");
      applyFiltersAndSorting(products);
    }
  }, [products, highlightedProductId]);

  const fetchProducts = async () => {
    console.log("🟡 FETCHING PRODUCTS FROM FIREBASE");
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const productsData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      console.log("🟡 PRODUCTS FETCHED:", productsData.length);

      // Debug: Check if lowStockThreshold is being loaded
      console.log("📦 LOADED PRODUCTS WITH THRESHOLDS:");
      productsData.forEach((product) => {
        console.log(
          `  ${product.name}: lowStockThreshold =`,
          product.lowStockThreshold,
          `(type: ${typeof product.lowStockThreshold})`
        );
      });

      setProducts(productsData);
      applyFiltersAndSorting(productsData);

      const uniqueCategories = [
        ...new Set(productsData.map((p) => p.category)),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("🔴 Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Apply filtering and sorting
  const applyFiltersAndSorting = (productsArray) => {
    console.log("🟡 FILTERING: Applying filters and sorting");
    console.log("🟡 HIGHLIGHTED PRODUCT ID:", highlightedProductId);
    console.log("🟡 SEARCH TERM:", searchTerm);
    console.log("🟡 SELECTED CATEGORY:", selectedCategory);
    console.log("🟡 SORT BY:", sortBy, "ORDER:", sortOrder);

    let filtered = productsArray.filter((p) => {
      const matchesSearch =
        !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        !selectedCategory ||
        p.category?.toLowerCase() === selectedCategory.toLowerCase();

      // If this is the highlighted product, show it regardless of stock
      const isHighlightedProduct = p.id === highlightedProductId;

      // Only show products with stock > 0, OR if it's the highlighted product
      const matchesStock = p.stock > 0 || isHighlightedProduct;

      const shouldInclude = matchesSearch && matchesCategory && matchesStock;

      return shouldInclude;
    });

    console.log("🟡 FILTERING: After filtering -", filtered.length, "products");

    // Apply sorting - FIXED: Ensure proper sorting
    filtered = [...filtered].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle undefined values
      if (aValue === undefined || aValue === null) aValue = "";
      if (bValue === undefined || bValue === null) bValue = "";

      // Convert to numbers for numeric fields
      if (
        sortBy === "price" ||
        sortBy === "stock" ||
        sortBy === "sold" ||
        sortBy === "lowStockThreshold"
      ) {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;

        if (sortOrder === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }
      // Handle string fields
      else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();

        if (sortOrder === "asc") {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }
    });

    console.log(
      "🟡 FILTERING: Final filtered products count:",
      filtered.length
    );
    setFilteredProducts(filtered);
  };

  // Handle search
  const handleSearch = (term, category) => {
    console.log("🔍 SEARCH: Term:", term, "Category:", category);
    setSearchTerm(term);
    setSelectedCategory(category);
  };

  // Handle sort changes
  const handleSortChange = (field) => {
    console.log("📊 SORT: Changing to", field);
    setSortBy(field);
  };

  // Handle sort order changes
  const handleSortOrderChange = (order) => {
    console.log("📊 SORT: Changing order to", order);
    setSortOrder(order);
  };

  // Apply filters and sorting whenever relevant states change
  useEffect(() => {
    if (products.length > 0) {
      applyFiltersAndSorting(products);
    }
  }, [searchTerm, selectedCategory, sortBy, sortOrder, products]);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    console.log("✏️ EDITING PRODUCT:", product);
    setSelectedProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteDoc(doc(db, "products", id));
      fetchProducts();
    }
  };

  // UPDATED: handleSave function with proper lowStockThreshold handling
  const handleSave = async (productData, imageFile) => {
    try {
      console.log("🟡 [ProductsPage] RECEIVED PRODUCT DATA:", {
        ...productData,
        lowStockThreshold: productData.lowStockThreshold,
        lowStockThresholdType: typeof productData.lowStockThreshold,
      });

      let imageUrl = selectedProduct?.imageUrl || "";

      if (imageFile) {
        console.log("🟡 Uploading image...");
        const storageRef = ref(
          storage,
          `products/${imageFile.name}_${Date.now()}`
        );
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      // Build the product payload - MAKE SURE lowStockThreshold is included
      const productPayload = {
        name: productData.name,
        description: productData.description || "",
        price: Number(productData.price),
        stock: Number(productData.stock),
        category: productData.category || "none",
        barcode: productData.barcode || "",
        imageUrl,
        updatedAt: new Date(),
      };

      // CRITICAL: Add lowStockThreshold to payload (can be null, number, or undefined)
      if (productData.lowStockThreshold !== undefined) {
        productPayload.lowStockThreshold = productData.lowStockThreshold;
      } else {
        productPayload.lowStockThreshold = null;
      }

      console.log("🟡 [ProductsPage] FINAL FIREBASE PAYLOAD:", productPayload);

      if (selectedProduct) {
        console.log("🟡 UPDATING EXISTING PRODUCT:", selectedProduct.id);
        await updateDoc(
          doc(db, "products", selectedProduct.id),
          productPayload
        );
        console.log("🟢 PRODUCT UPDATED IN FIREBASE");
      } else {
        console.log("🟡 CREATING NEW PRODUCT");
        productPayload.createdAt = new Date();
        await addDoc(collection(db, "products"), productPayload);
        console.log("🟢 PRODUCT CREATED IN FIREBASE");
      }

      // Refresh the products list
      console.log("🟡 REFRESHING PRODUCTS LIST...");
      await fetchProducts();

      setShowForm(false);
      setSelectedProduct(null);
      console.log("🟢 FORM CLOSED SUCCESSFULLY");
    } catch (error) {
      console.error("🔴 [ProductsPage] Error saving product:", error);
      alert("Error saving product: " + error.message);
    }
  };

  return (
    <div className="page-container">
      <Sidebar />
      <div className={`products-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />
        <div className="products-content">
          <div className="header">
            <h1>Products Management</h1>
          </div>

          <div className="search-container">
            <ProductSearch onSearch={handleSearch} categories={categories} />
            {(searchTerm || selectedCategory) && (
              <button
                className="clear-filters-btn"
                onClick={() => handleSearch("", "")}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Controls Bar */}
          <div className="controls-bar">
            <div className="control-group">
              <label>
                <FontAwesomeIcon icon={faSort} />
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="control-select"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="category">Category</option>
                <option value="stock">Stock</option>
                <option value="sold">Sold</option>
                <option value="lowStockThreshold">Low Stock Threshold</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => handleSortOrderChange(e.target.value)}
                className="control-select"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <div className="products-count">
              <span>{filteredProducts.length} products</span>
            </div>
          </div>

          <ProductList
            products={filteredProducts}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            highlightedProductId={highlightedProductId}
          />

          <button className="fab" onClick={handleAddProduct}>
            +
          </button>

          {showForm && (
            <div className="modal-overlay">
              <div
                className="modal"
                style={{
                  width: "95%",
                  maxWidth: "1000px",
                  height: "95vh",
                  minHeight: "600px",
                  maxHeight: "800px",
                }}
              >
                <button
                  className="close-btn"
                  onClick={() => setShowForm(false)}
                >
                  ✕
                </button>
                <div className="form-container">
                  <ProductForm
                    selectedProduct={selectedProduct}
                    onSave={handleSave}
                    onClose={() => setShowForm(false)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
