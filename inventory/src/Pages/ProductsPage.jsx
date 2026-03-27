// src/Pages/ProductsPage.jsx
import { useState, useEffect, useContext } from "react";
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
  faHistory,
} from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../context/AuthContext";
import { logProductChange } from "../utils/productAuditUtils";
import ProductAuditHistory from "../components/ProductAuditHistory/ProductAuditHistory";

import ProductList from "../components/products/ProductsList";
import ProductForm from "../components/products/ProductForm/ProductForm";
import ProductSearch from "../components/products/ProductSearch";
import Header from "../components/UI/Headers";
import Sidebar from "../components/UI/Sidebar";
import { useSidebar } from "../context/SidebarContext";
import { useCategoryMigration } from "../hooks/useCategoryMigration";
import { StockConverter } from "../components/products/utils/stockConverter";
import "../styles/products.scss";

export default function ProductsPage() {
  const { isCollapsed } = useSidebar();
  const { isMigrating } = useCategoryMigration();
  const { user } = useContext(AuthContext);

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [highlightedProductId, setHighlightedProductId] = useState(null);
  const [auditHistoryProduct, setAuditHistoryProduct] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedPackagingType, setSelectedPackagingType] = useState("");

  // Enhanced filtering states
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [stockFilter, setStockFilter] = useState("all");

  // Packaging statistics
  const [packagingStats, setPackagingStats] = useState({
    singleItems: 0,
    bulkPackages: 0,
    withRelationships: 0,
  });

  const fetchCategories = async () => {
    try {
      const categoriesSnapshot = await getDocs(collection(db, "categories"));
      const categoriesData = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));

      const sortedCategories = categoriesData
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((cat) => cat.name);

      setCategories(["none", ...sortedCategories]);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories(["none"]);
    }
  };

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
      setSelectedPackagingType("");
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
        (p) => p.packagingType === "single",
      ).length;
      const bulkPackages = products.filter(
        (p) => p.packagingType === "bulk",
      ).length;

      const withRelationships = products.filter(
        (p) =>
          p.packagingType === "single" &&
          products.some((bp) => bp.parentProductId === p.id),
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

      setProducts(productsData);
      applyFiltersAndSorting(productsData);

      await fetchCategories();

      const defaultUnits = ["piece", "bag", "pack", "bottle", "can", "box"];
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

    let filtered = productsArray.filter((p) => {
      const matchesSearch =
        !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        !selectedCategory || p.category === selectedCategory;
      const matchesUnit = !selectedUnit || (p.unit || "piece") === selectedUnit;

      const matchesPackagingType =
        !selectedPackagingType ||
        (p.packagingType || "single") === selectedPackagingType;

      const availableStock = StockConverter.getAvailableStock(p, productsArray);
      const currentStock = p.stock || 0;
      const threshold = p.lowStockThreshold || 5;

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "inStock" && availableStock > 0) ||
        (stockFilter === "outOfStock" && availableStock === 0) ||
        (stockFilter === "lowStock" &&
          availableStock > 0 &&
          availableStock <= threshold);

      const isHighlightedProduct = p.id === highlightedProductId;

      const matchesStockVisibility =
        availableStock > 0 ||
        isHighlightedProduct ||
        stockFilter === "outOfStock" ||
        stockFilter === "all";

      const shouldInclude =
        matchesSearch &&
        matchesCategory &&
        matchesUnit &&
        matchesPackagingType &&
        matchesStock &&
        matchesStockVisibility;

      return shouldInclude;
    });

    console.log("🟡 FILTERING: After filtering -", filtered.length, "products");

    // Apply enhanced sorting
    filtered = [...filtered].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (aValue === undefined || aValue === null) aValue = "";
      if (bValue === undefined || bValue === null) bValue = "";

      if (sortBy === "packagingType") {
        const aType = a.packagingType || "single";
        const bType = b.packagingType || "single";

        if (sortOrder === "asc") {
          return aType.localeCompare(bType);
        } else {
          return bType.localeCompare(aType);
        }
      }

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
      } else {
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
      filtered.length,
    );
    setFilteredProducts(filtered);
  };

  // Handle search with unit and packaging type filter
  const handleSearch = (term, category, unit = "", packagingType = "") => {
    console.log(
      "🔍 SEARCH: Term:",
      term,
      "Category:",
      category,
      "Unit:",
      unit,
      "Packaging:",
      packagingType,
    );
    setSearchTerm(term);
    setSelectedCategory(category);
    setSelectedUnit(unit);
    setSelectedPackagingType(packagingType);
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
    setSelectedPackagingType("");
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
    selectedPackagingType,
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

  const handleSave = async (productData, imageFile) => {
    try {
      console.log("🟡 [ProductsPage] RECEIVED PRODUCT DATA:", productData);

      let imageUrl = selectedProduct?.imageUrl || "";

      if (imageFile) {
        console.log("🟡 Uploading image...");
        const storageRef = ref(
          storage,
          `products/${imageFile.name}_${Date.now()}`,
        );
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      if (
        productData.category &&
        productData.category !== "none" &&
        !categories.includes(productData.category)
      ) {
        try {
          const categoriesSnapshot = await getDocs(
            collection(db, "categories"),
          );
          const existingCategory = categoriesSnapshot.docs.find(
            (catDoc) =>
              catDoc.data().name.toLowerCase() ===
              productData.category.toLowerCase(),
          );

          if (!existingCategory) {
            await addDoc(collection(db, "categories"), {
              name: productData.category,
              createdAt: new Date(),
              createdBy: "auto-created",
              autoCreated: true,
            });
            console.log(
              `✅ Auto-created new category: ${productData.category}`,
            );
          } else {
            console.log(`ℹ️ Category already exists: ${productData.category}`);
          }

          await fetchCategories();
        } catch (error) {
          console.error("Error auto-creating category:", error);
        }
      }

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

        packagingType: productData.packagingType || "single",
        piecesPerPackage: productData.piecesPerPackage || 1,
        parentProductId: productData.parentProductId || null,
        isBulkPackage: productData.packagingType === "bulk",

        updatedAt: new Date(),
      };

      console.log("🟡 [ProductsPage] FINAL FIREBASE PAYLOAD:", productPayload);

      if (selectedProduct) {
        console.log("🟡 UPDATING EXISTING PRODUCT:", selectedProduct.id);
        productPayload.sold = selectedProduct.sold || 0;

        // Log stock change if stock was modified
        if (selectedProduct.stock !== productPayload.stock && user) {
          try {
            const quantityDifference = productPayload.stock - selectedProduct.stock;
            const costPrice = productPayload.costPrice !== null && productPayload.costPrice !== undefined ? productPayload.costPrice : null;
            const totalPrice = costPrice !== null && quantityDifference ? costPrice * quantityDifference : null;
            
            console.log("🟢 [AUDIT LOG] Stock Edit - Qty Diff:", quantityDifference, "Cost:", costPrice, "Total:", totalPrice);
            
            await logProductChange({
              productId: selectedProduct.id,
              productName: productData.name,
              action: "stock_edit",
              changes: {
                before: selectedProduct.stock,
                after: productPayload.stock,
              },
              userId: user.uid,
              userName: user.displayName || user.email || "Unknown User",
              notes: "", // Can be enhanced to accept user notes
              price: costPrice,
              totalPrice: totalPrice,
            });
          } catch (auditError) {
            console.error("❌ Failed to log stock change:", auditError);
            // Don't fail the product update if audit log fails
          }
        }

        await updateDoc(
          doc(db, "products", selectedProduct.id),
          productPayload,
        );
        console.log("🟢 PRODUCT UPDATED IN FIREBASE");
      } else {
        console.log("🟡 CREATING NEW PRODUCT");
        productPayload.createdAt = new Date();
        productPayload.sold = 0;
        const newRef = await addDoc(collection(db, "products"), productPayload);
        console.log("🟢 PRODUCT CREATED IN FIREBASE");

        // Log initial stock for new products
        if (productPayload.stock > 0 && user) {
          try {
            const costPrice = productPayload.costPrice !== null && productPayload.costPrice !== undefined ? productPayload.costPrice : null;
            const totalPrice = costPrice !== null && productPayload.stock ? costPrice * productPayload.stock : null;
            
            await logProductChange({
              productId: newRef.id,
              productName: productData.name,
              action: "stock_add",
              changes: {
                before: 0,
                after: productPayload.stock,
              },
              userId: user.uid,
              userName: user.displayName || user.email || "Unknown User",
              notes: "Initial stock",
              price: costPrice,
              totalPrice: totalPrice,
            });
          } catch (auditError) {
            console.error("❌ Failed to log initial stock:", auditError);
            // Don't fail the product creation if audit log fails
          }
        }
      }

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

  const handleViewAuditHistory = (product) => {
    setAuditHistoryProduct(product);
  };

  const handleCloseAuditHistory = () => {
    setAuditHistoryProduct(null);
  };

  return (
    <div className="page-container">
      <Sidebar />
      <div className={`products-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />

        {isMigrating && (
          <div className="migration-overlay">
            <div className="migration-message">
              <div className="loading-spinner"></div>
              <p>Setting up categories system...</p>
            </div>
          </div>
        )}

        {showForm ? (
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
                allProducts={products}
                categories={categories}
              />
            </div>
          </div>
        ) : (
          <div className="products-content">
            <div className="products-header">
              <div className="header-content">
                <h1>Products Management</h1>
                <p>Manage your product inventory and details</p>

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

            <div className="search-filters-section enhanced-filters">
              <ProductSearch
                onSearch={handleSearch}
                categories={categories}
                units={units}
                selectedCategory={selectedCategory}
                selectedUnit={selectedUnit}
                selectedPackagingType={selectedPackagingType}
              />

              <div className="filter-groups-row">
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
                  selectedPackagingType ||
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
                  selectedPackagingType ||
                  stockFilter !== "all") && (
                  <span className="filter-info">
                    {selectedCategory && ` • ${selectedCategory}`}
                    {selectedUnit && ` • ${selectedUnit}`}
                    {selectedPackagingType &&
                      ` • ${
                        selectedPackagingType === "single"
                          ? "Single Items"
                          : "Bulk Packages"
                      }`}
                    {stockFilter !== "all" && ` • ${stockFilter}`}
                  </span>
                )}
              </div>
            </div>

            <div className="products-list-container">
              <ProductList
                products={filteredProducts.map((p) => ({
                  ...p,
                  availableStock: StockConverter.getAvailableStock(p, products),
                }))}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onViewHistory={handleViewAuditHistory}
                highlightedProductId={highlightedProductId}
                allProducts={products}
              />
            </div>

            <button className="fab" onClick={handleAddProduct}>
              +
            </button>
          </div>
        )}
      </div>

      {/* Audit History Modal - Outside products-page for proper z-index*/}
      {auditHistoryProduct && (
        <div className="modal-overlay">
          <ProductAuditHistory
            productId={auditHistoryProduct.id}
            productName={auditHistoryProduct.name}
            onClose={handleCloseAuditHistory}
          />
        </div>
      )}
    </div>
  );
}
