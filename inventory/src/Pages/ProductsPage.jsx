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

      // Store the highlight ID in a variable that won't change
      const currentHighlightId = highlightId;

      setHighlightedProductId(currentHighlightId);
      setSearchTerm("");
      setSelectedCategory("");

      // Use a ref to track the current highlight ID for the filtering function
      const applyFiltersWithHighlight = (productsArray) => {
        console.log("🟢 FILTERING WITH HIGHLIGHT:", currentHighlightId);
        return applyFiltersAndSorting(productsArray, currentHighlightId);
      };

      // Wait for products to load, then apply filtering with the highlight
      if (products.length > 0) {
        console.log("🟢 PRODUCTS ALREADY LOADED, FILTERING NOW");
        applyFiltersWithHighlight(products);
      } else {
        console.log("🟢 WAITING FOR PRODUCTS TO LOAD...");
        // We'll handle this in the products useEffect
      }

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
      applyFiltersAndSorting(products, highlightedProductId);
    }
  }, [products, highlightedProductId]);

  const fetchProducts = async () => {
    console.log("🟡 FETCHING PRODUCTS FROM FIREBASE");
    const snapshot = await getDocs(collection(db, "products"));
    const productsData = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    console.log("🟡 PRODUCTS FETCHED:", productsData.length);
    setProducts(productsData);

    // Apply current filters and sorting
    applyFiltersAndSorting(productsData);

    const uniqueCategories = [...new Set(productsData.map((p) => p.category))];
    setCategories(uniqueCategories);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Apply filtering and sorting - UPDATED to accept highlightId parameter
  const applyFiltersAndSorting = (productsArray, forceHighlightId = null) => {
    const currentHighlightId = forceHighlightId || highlightedProductId;

    console.log("🟡 FILTERING: Applying filters and sorting");
    console.log("🟡 HIGHLIGHTED PRODUCT ID:", currentHighlightId);
    console.log("🟡 SEARCH TERM:", searchTerm);
    console.log("🟡 SELECTED CATEGORY:", selectedCategory);

    let filtered = productsArray.filter((p) => {
      const matchesSearch =
        !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        !selectedCategory ||
        p.category?.toLowerCase() === selectedCategory.toLowerCase();

      // FIX: If this is the highlighted product, show it regardless of stock
      const isHighlightedProduct = p.id === currentHighlightId;

      // Only show products with stock > 0, OR if it's the highlighted product
      const matchesStock = p.stock > 0 || isHighlightedProduct;

      const shouldInclude = matchesSearch && matchesCategory && matchesStock;

      if (p.id === currentHighlightId) {
        console.log("🎯 HIGHLIGHTED PRODUCT CHECK:", {
          id: p.id,
          name: p.name,
          stock: p.stock,
          matchesSearch,
          matchesCategory,
          matchesStock,
          shouldInclude,
        });
      }

      return shouldInclude;
    });

    console.log("🟡 FILTERING: After filtering -", filtered.length, "products");

    // Check if highlighted product is in the filtered list
    if (currentHighlightId) {
      const found = filtered.find((p) => p.id === currentHighlightId);
      console.log(
        "🎯 HIGHLIGHTED PRODUCT IN FILTERED LIST:",
        found ? "YES" : "NO"
      );
      if (found) {
        console.log(
          "🎯 HIGHLIGHTED PRODUCT DETAILS:",
          found.name,
          "Stock:",
          found.stock
        );
      } else {
        console.log("❌ HIGHLIGHTED PRODUCT NOT FOUND IN FILTERED LIST");
        // If not found, force include it
        const originalProduct = productsArray.find(
          (p) => p.id === currentHighlightId
        );
        if (originalProduct) {
          console.log("🟢 FORCE INCLUDING HIGHLIGHTED PRODUCT");
          filtered.push(originalProduct);
        }
      }
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle undefined values
      if (aValue === undefined || aValue === null) aValue = "";
      if (bValue === undefined || bValue === null) bValue = "";

      // Convert to numbers for numeric fields
      if (sortBy === "price" || sortBy === "stock" || sortBy === "sold") {
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
    applyFiltersAndSorting(products);
  };

  // Handle sort changes
  const handleSortChange = (field) => {
    console.log("📊 SORT: Changing to", field);
    setSortBy(field);
    applyFiltersAndSorting(products);
  };

  // Handle sort order changes
  const handleSortOrderChange = (order) => {
    console.log("📊 SORT: Changing order to", order);
    setSortOrder(order);
    applyFiltersAndSorting(products);
  };

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
        barcode: productData.barcode || "",
        imageUrl,
        updatedAt: new Date(),
      };

      if (selectedProduct) {
        await updateDoc(
          doc(db, "products", selectedProduct.id),
          productPayload
        );
      } else {
        productPayload.createdAt = new Date();
        await addDoc(collection(db, "products"), productPayload);
      }

      await fetchProducts();
      setShowForm(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
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
              <div className="modal">
                <button
                  className="close-btn"
                  onClick={() => setShowForm(false)}
                >
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
    </div>
  );
}
