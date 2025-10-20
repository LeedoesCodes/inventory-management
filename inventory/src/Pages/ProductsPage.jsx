// pages/ProductsPage.jsx
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
import {
  faSort,
  faBox,
  faBoxOpen,
  faLink,
} from "@fortawesome/free-solid-svg-icons";

import ProductList from "../components/products/ProductsList";
import ProductForm from "../components/products/ProductForm/ProductForm";
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
  const [units, setUnits] = useState([]);
  const [highlightedProductId, setHighlightedProductId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");

  // Enhanced filtering states
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [packagingFilter, setPackagingFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  // Packaging statistics
  const [packagingStats, setPackagingStats] = useState({
    singleItems: 0,
    bulkPackages: 0,
    withRelationships: 0,
  });

  // Check for highlighted product on component mount and URL changes
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    console.log("🔵 URL PARAMS CHECK: highlightId =", highlightId);

    if (highlightId) {
      console.log("🟢 HIGHLIGHT TRIGGERED: Product ID received:", highlightId);

      setHighlightedProductId(highlightId);
      setSearchTerm("");
      setSelectedCategory("");
      setSelectedUnit("");
      setPackagingFilter("all");
      setStockFilter("all");

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

  // Calculate packaging statistics whenever products change
  useEffect(() => {
    if (products.length > 0) {
      const singleItems = products.filter(
        (p) => p.packagingType === "single"
      ).length;
      const bulkPackages = products.filter(
        (p) => p.packagingType === "bulk"
      ).length;

      // Products with packaging relationships (single items that have bulk packages)
      const withRelationships = products.filter(
        (p) =>
          p.packagingType === "single" &&
          products.some((bp) => bp.parentProductId === p.id)
      ).length;

      setPackagingStats({
        singleItems,
        bulkPackages,
        withRelationships,
      });
    }
  }, [products]);

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

      // Debug: Check packaging data
      console.log("📦 LOADED PRODUCTS WITH PACKAGING:");
      productsData.forEach((product) => {
        console.log(
          `  ${product.name}: packagingType = ${
            product.packagingType || "single"
          }, parentProductId = ${product.parentProductId || "none"}`
        );
      });

      setProducts(productsData);
      applyFiltersAndSorting(productsData);

      // Extract unique categories and units
      const uniqueCategories = [
        ...new Set(productsData.map((p) => p.category).filter(Boolean)),
      ];

      // Use hardcoded units like in OrdersPage
      const defaultUnits = ["piece", "bag", "pack", "bottle", "can", "box"];

      setCategories(uniqueCategories);
      setUnits(defaultUnits);
    } catch (error) {
      console.error("🔴 Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Enhanced filtering and sorting function
  const applyFiltersAndSorting = (productsArray) => {
    console.log("🟡 FILTERING: Applying filters and sorting");
    console.log("🟡 HIGHLIGHTED PRODUCT ID:", highlightedProductId);
    console.log("🟡 SEARCH TERM:", searchTerm);
    console.log("🟡 SELECTED CATEGORY:", selectedCategory);
    console.log("🟡 SELECTED UNIT:", selectedUnit);
    console.log("🟡 PACKAGING FILTER:", packagingFilter);
    console.log("🟡 STOCK FILTER:", stockFilter);
    console.log("🟡 SORT BY:", sortBy, "ORDER:", sortOrder);

    let filtered = productsArray.filter((p) => {
      const matchesSearch =
        !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        !selectedCategory || p.category === selectedCategory;
      const matchesUnit = !selectedUnit || (p.unit || "piece") === selectedUnit;

      // Enhanced: Packaging type filter
      const matchesPackaging =
        packagingFilter === "all" ||
        (packagingFilter === "single" && p.packagingType === "single") ||
        (packagingFilter === "bulk" && p.packagingType === "bulk") ||
        (packagingFilter === "withBulk" &&
          p.packagingType === "single" &&
          productsArray.some((bp) => bp.parentProductId === p.id)) ||
        (packagingFilter === "withoutBulk" &&
          p.packagingType === "single" &&
          !productsArray.some((bp) => bp.parentProductId === p.id));

      // Enhanced: Stock filter
      const currentStock = p.stock || 0;
      const threshold = p.lowStockThreshold || 5;
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "inStock" && currentStock > 0) ||
        (stockFilter === "outOfStock" && currentStock === 0) ||
        (stockFilter === "lowStock" &&
          currentStock > 0 &&
          currentStock <= threshold);

      // If this is the highlighted product, show it regardless of stock
      const isHighlightedProduct = p.id === highlightedProductId;

      // Only show products with stock > 0, OR if it's the highlighted product, OR if showing out of stock
      const matchesStockVisibility =
        currentStock > 0 ||
        isHighlightedProduct ||
        stockFilter === "outOfStock" ||
        stockFilter === "all";

      const shouldInclude =
        matchesSearch &&
        matchesCategory &&
        matchesUnit &&
        matchesPackaging &&
        matchesStock &&
        matchesStockVisibility;

      return shouldInclude;
    });

    console.log("🟡 FILTERING: After filtering -", filtered.length, "products");

    // Apply enhanced sorting
    filtered = [...filtered].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle undefined values
      if (aValue === undefined || aValue === null) aValue = "";
      if (bValue === undefined || bValue === null) bValue = "";

      // Special handling for packaging type
      if (sortBy === "packagingType") {
        const aType = a.packagingType || "single";
        const bType = b.packagingType || "single";

        if (sortOrder === "asc") {
          return aType.localeCompare(bType);
        } else {
          return bType.localeCompare(aType);
        }
      }

      // Convert to numbers for numeric fields
      if (
        sortBy === "price" ||
        sortBy === "costPrice" ||
        sortBy === "stock" ||
        sortBy === "sold" ||
        sortBy === "lowStockThreshold" ||
        sortBy === "piecesPerPackage"
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

  // Handle search with unit filter
  const handleSearch = (term, category, unit = "") => {
    console.log("🔍 SEARCH: Term:", term, "Category:", category, "Unit:", unit);
    setSearchTerm(term);
    setSelectedCategory(category);
    setSelectedUnit(unit);
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

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedUnit("");
    setPackagingFilter("all");
    setStockFilter("all");
  };

  // Apply filters and sorting whenever relevant states change
  useEffect(() => {
    if (products.length > 0) {
      applyFiltersAndSorting(products);
    }
  }, [
    searchTerm,
    selectedCategory,
    selectedUnit,
    packagingFilter,
    stockFilter,
    sortBy,
    sortOrder,
    products,
  ]);

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

  // Updated handleSave function with packaging data
  const handleSave = async (productData, imageFile) => {
    try {
      console.log("🟡 [ProductsPage] RECEIVED PRODUCT DATA:", productData);

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

      // Enhanced product payload with packaging
      const productPayload = {
        name: productData.name,
        price: Number(productData.price),
        costPrice: productData.costPrice ? Number(productData.costPrice) : null,
        stock: Number(productData.stock),
        category: productData.category || "none",
        barcode: productData.barcode || "",
        unit: productData.unit || "piece",
        imageUrl,
        sold: selectedProduct?.sold || 0,
        lowStockThreshold:
          productData.lowStockThreshold !== undefined
            ? productData.lowStockThreshold
            : null,

        // Packaging fields
        packagingType: productData.packagingType || "single",
        piecesPerPackage: productData.piecesPerPackage || 1,
        parentProductId: productData.parentProductId || null,
        isBulkPackage: productData.packagingType === "bulk",

        updatedAt: new Date(),
      };

      console.log("🟡 [ProductsPage] FINAL FIREBASE PAYLOAD:", productPayload);

      if (selectedProduct) {
        console.log("🟡 UPDATING EXISTING PRODUCT:", selectedProduct.id);
        // Keep the sold count from existing product
        productPayload.sold = selectedProduct.sold || 0;
        await updateDoc(
          doc(db, "products", selectedProduct.id),
          productPayload
        );
        console.log("🟢 PRODUCT UPDATED IN FIREBASE");
      } else {
        console.log("🟡 CREATING NEW PRODUCT");
        productPayload.createdAt = new Date();
        productPayload.sold = 0;
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

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedProduct(null);
  };

  return (
    <div className="page-container">
      <Sidebar />
      <div className={`products-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />

        {/* Show either the form or the products list */}
        {showForm ? (
          // Full-page form layout - FIXED: Added products-content class
          <div className="product-form-fullpage products-content">
            <div className="form-header">
              <div className="header-content">
                <h1>{selectedProduct ? "Edit Product" : "Add New Product"}</h1>
                <p>
                  {selectedProduct
                    ? "Update the product details below"
                    : "Fill in the details to add a new product to your inventory"}
                </p>
              </div>
              <div className="header-actions">
                <button className="back-btn" onClick={handleCloseForm}>
                  ← Back to Products
                </button>
              </div>
            </div>

            <div className="form-content">
              <ProductForm
                selectedProduct={selectedProduct}
                onSave={handleSave}
                onClose={handleCloseForm}
                isFullPage={true}
                allProducts={products} // Pass all products for packaging relationships
              />
            </div>
          </div>
        ) : (
          // Main content with products list
          <div className="products-content">
            {/* Enhanced Header with Statistics */}
            <div className="products-header">
              <div className="header-content">
                <h1>Products Management</h1>
                <p>Manage your product inventory and details</p>

                {/* Packaging Statistics */}
                <div className="packaging-stats">
                  <div className="stat-item">
                    <FontAwesomeIcon
                      icon={faBoxOpen}
                      className="stat-icon single"
                    />
                    <span className="stat-count">
                      {packagingStats.singleItems}
                    </span>
                    <span className="stat-label">Single Items</span>
                  </div>
                  <div className="stat-item">
                    <FontAwesomeIcon icon={faBox} className="stat-icon bulk" />
                    <span className="stat-count">
                      {packagingStats.bulkPackages}
                    </span>
                    <span className="stat-label">Bulk Packages</span>
                  </div>
                  <div className="stat-item">
                    <FontAwesomeIcon
                      icon={faLink}
                      className="stat-icon related"
                    />
                    <span className="stat-count">
                      {packagingStats.withRelationships}
                    </span>
                    <span className="stat-label">With Bulk</span>
                  </div>
                </div>
              </div>

              <div className="header-actions">
                <button className="add-product-btn" onClick={handleAddProduct}>
                  Add Product
                </button>
              </div>
            </div>

            {/* Enhanced Search and Filters Section */}
            <div className="search-filters-section enhanced-filters">
              <ProductSearch
                onSearch={handleSearch}
                categories={categories}
                units={units}
                selectedCategory={selectedCategory}
                selectedUnit={selectedUnit}
              />

              {/* Enhanced Filter Groups */}
              <div className="filter-groups-row">
                <div className="filter-group">
                  <label>Packaging Type:</label>
                  <select
                    value={packagingFilter}
                    onChange={(e) => setPackagingFilter(e.target.value)}
                    className="control-select"
                  >
                    <option value="all">All Types</option>
                    <option value="single">Single Items</option>
                    <option value="bulk">Bulk Packages</option>
                    <option value="withBulk">Single with Bulk</option>
                    <option value="withoutBulk">Single without Bulk</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Stock Status:</label>
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="control-select"
                  >
                    <option value="all">All Stock</option>
                    <option value="inStock">In Stock</option>
                    <option value="lowStock">Low Stock</option>
                    <option value="outOfStock">Out of Stock</option>
                  </select>
                </div>

                {(searchTerm ||
                  selectedCategory ||
                  selectedUnit ||
                  packagingFilter !== "all" ||
                  stockFilter !== "all") && (
                  <button
                    className="clear-filters-btn"
                    onClick={handleClearFilters}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Controls Bar */}
            <div className="products-controls-bar enhanced-controls">
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
                  <option value="price">Selling Price</option>
                  <option value="costPrice">Cost Price</option>
                  <option value="category">Category</option>
                  <option value="unit">Unit</option>
                  <option value="packagingType">Packaging Type</option>
                  <option value="piecesPerPackage">Pieces per Package</option>
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
                {(selectedCategory ||
                  selectedUnit ||
                  packagingFilter !== "all" ||
                  stockFilter !== "all") && (
                  <span className="filter-info">
                    {selectedCategory && ` • ${selectedCategory}`}
                    {selectedUnit && ` • ${selectedUnit}`}
                    {packagingFilter !== "all" && ` • ${packagingFilter}`}
                    {stockFilter !== "all" && ` • ${stockFilter}`}
                  </span>
                )}
              </div>
            </div>

            {/* Products List */}
            <div className="products-list-container">
              <ProductList
                products={filteredProducts}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                highlightedProductId={highlightedProductId}
                allProducts={products}
              />
            </div>

            {/* FAB Button */}
            <button className="fab" onClick={handleAddProduct}>
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
