import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  writeBatch,
  doc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../Firebase/firebase";
import Sidebar from "../components/UI/Sidebar";
import Header from "../components/UI/Headers";
import { useSidebar } from "../context/SidebarContext";
import FloatingCheckout from "../components/UI/FloatingCheckout";
import ProductSearch from "../components/products/ProductSearch";
import OrderConfirmationDialog from "../components/UI/OrderConfirmationDialog";
import BarcodeScanner from "../components/UI/BarcodeScanning";
import SuccessAnimation from "../components/UI/SuccessAnimation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faSort,
  faShoppingCart,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/orders.scss";

export default function OrdersPage() {
  const { isCollapsed } = useSidebar();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "products"));
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent customers
  const fetchRecentCustomers = async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const ordersQuery = query(
        collection(db, "orders"),
        where("createdAt", ">=", oneWeekAgo)
      );
      const snapshot = await getDocs(ordersQuery);
      const customers = snapshot.docs
        .map((doc) => doc.data().customerName)
        .filter((name) => name && name.trim() !== "")
        .filter((name, index, array) => array.indexOf(name) === index)
        .slice(0, 5);

      setRecentCustomers(customers);
    } catch (error) {
      console.error("Error fetching recent customers:", error);
    }
  };

  // Simple barcode scanning
  const handleBarcodeScanned = (barcode) => {
    if (!barcode || barcode.trim() === "") return false;

    console.log("Barcode scanned:", barcode);

    const product = products.find((p) => {
      if (!p.barcode) return false;
      const productBarcode = p.barcode.toString().replace(/\D/g, "").trim();
      return productBarcode === barcode;
    });

    if (product) {
      const currentQty = cart[product.id]?.quantity || 0;
      const newQty = currentQty + 1;

      if (newQty > product.stock) {
        console.warn(
          `❌ Not enough stock for ${product.name}. Only ${product.stock} available.`
        );
        return false;
      }

      setCart((prev) => ({
        ...prev,
        [product.id]: {
          checked: true,
          quantity: newQty,
        },
      }));

      console.log(
        `✅ Updated ${product.name} in cart. New quantity: ${newQty}`
      );
      return true;
    } else {
      console.warn(`❌ No product found with barcode: ${barcode}`);
      return false;
    }
  };

  // Customer management functions
  const saveCustomerToManagement = async (customerName) => {
    if (
      !customerName ||
      customerName.trim() === "" ||
      customerName === "Walk-in Customer"
    )
      return;

    try {
      const customersQuery = query(
        collection(db, "customers"),
        where("name", "==", customerName.trim())
      );
      const snapshot = await getDocs(customersQuery);

      if (snapshot.empty) {
        await addDoc(collection(db, "customers"), {
          name: customerName.trim(),
          phone: "",
          address: "",
          createdAt: new Date(),
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: null,
        });
        console.log("✅ New customer created:", customerName);
      } else {
        console.log("ℹ️ Customer already exists:", customerName);
      }
    } catch (error) {
      console.error("❌ Error saving customer data:", error);
      throw error;
    }
  };

  const updateCustomerStats = async (customerName, orderAmount) => {
    if (
      !customerName ||
      customerName.trim() === "" ||
      customerName === "Walk-in Customer"
    )
      return;

    try {
      const customersQuery = query(
        collection(db, "customers"),
        where("name", "==", customerName.trim())
      );
      const snapshot = await getDocs(customersQuery);

      if (!snapshot.empty) {
        const customerDoc = snapshot.docs[0];
        const customerData = customerDoc.data();

        await updateDoc(doc(db, "customers", customerDoc.id), {
          totalOrders: (customerData.totalOrders || 0) + 1,
          totalSpent: (customerData.totalSpent || 0) + orderAmount,
          lastOrderDate: new Date(),
        });
        console.log("✅ Customer stats updated for:", customerName);
      } else {
        console.warn("⚠️ Customer not found for stats update:", customerName);
      }
    } catch (error) {
      console.error("❌ Error updating customer stats:", error);
      throw error;
    }
  };

  // Customer name change handler
  const handleCustomerNameChange = (name) => {
    setCustomerName(name);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (name && name.trim() !== "" && name !== "Walk-in Customer") {
      const timer = setTimeout(() => {
        saveCustomerToManagement(name);
      }, 2000);
      setDebounceTimer(timer);
    }
  };

  // Product selection and quantity functions
  const toggleProduct = (id) => {
    const product = products.find((p) => p.id === id);
    if (product && product.stock === 0) return;

    setCart((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        checked: !prev[id]?.checked,
        quantity: prev[id]?.quantity || 1,
      },
    }));
  };

  const changeQuantity = (id, delta) => {
    const product = products.find((p) => p.id === id);
    const currentQty = cart[id]?.quantity || 1;
    const newQty = Math.max(1, currentQty + delta);

    if (product && newQty > product.stock) {
      alert(`Only ${product.stock} items available in stock`);
      return;
    }

    setCart((prev) => ({
      ...prev,
      [id]: { ...prev[id], checked: true, quantity: newQty },
    }));
  };

  const setQuantity = (id, quantity) => {
    const product = products.find((p) => p.id === id);
    const newQty = Math.max(1, parseInt(quantity) || 1);

    if (product && newQty > product.stock) {
      alert(`Only ${product.stock} items available in stock`);
      return;
    }

    setCart((prev) => ({
      ...prev,
      [id]: { ...prev[id], checked: true, quantity: newQty },
    }));
  };

  // Remove item from cart
  const removeFromCart = (id) => {
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[id];
      return newCart;
    });
  };

  // Handle quantity changes from confirmation dialog
  const handleDialogQuantityChange = (itemId, delta) => {
    changeQuantity(itemId, delta);
  };

  // Handle remove item from confirmation dialog
  const handleDialogRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  // Search handler
  const handleSearch = (term, category) => {
    setSearchTerm(term.toLowerCase());
    setSelectedCategory(category);
  };

  // Simple totals calculation
  const getTotals = () => {
    let totalItems = 0;
    let totalAmount = 0;
    products.forEach((p) => {
      const item = cart[p.id];
      if (item?.checked) {
        totalItems += item.quantity;
        totalAmount += p.price * item.quantity;
      }
    });
    return { totalItems, totalAmount };
  };

  const { totalItems, totalAmount } = getTotals();

  // Simple cart items for FloatingCheckout
  const cartItems = products
    .filter((p) => cart[p.id]?.checked)
    .map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      quantity: cart[p.id].quantity,
      subtotal: p.price * cart[p.id].quantity,
      productId: p.id,
    }));

  // Checkout functions
  const handleCheckoutClick = () => {
    if (totalItems === 0) {
      alert("Please select some products first.");
      return;
    }

    const orderItems = cartItems.map((item) => ({
      id: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }));

    setPendingOrder({
      items: orderItems,
      customerName: customerName || "Walk-in Customer",
      totalItems,
      totalAmount,
    });

    setShowConfirmation(true);
  };

  // Order confirmation with success animation - FIXED DUE DATE HANDLING
  // Order confirmation with success animation - FIXED DUE DATE SAVING
  const handleConfirmOrder = async (paymentMethod = "cash", dueDate = null) => {
    if (!pendingOrder) return;

    try {
      console.log("🔄 Starting order confirmation process...");
      console.log(`💰 Payment Method: ${paymentMethod}`);
      console.log(`📅 Due Date: ${dueDate || "Not applicable"}`);
      console.log(`📅 Due Date Type: ${typeof dueDate}`);
      console.log(`📅 Due Date Value: ${dueDate}`);

      const batch = writeBatch(db);

      // Check stock availability for all items
      console.log("📦 Checking stock availability...");
      for (const item of pendingOrder.items) {
        const product = products.find((p) => p.id === item.id);

        if (!product) {
          const errorMsg = `Product not found: ${item.name} (ID: ${item.id})`;
          console.error("❌", errorMsg);
          alert(errorMsg);
          setShowConfirmation(false);
          return;
        }

        console.log(
          `📊 Product stock: ${product.stock}, requested: ${item.quantity}`
        );

        if (product.stock < item.quantity) {
          const errorMsg = `Not enough stock for ${item.name}. Only ${product.stock} available.`;
          console.error("❌", errorMsg);
          alert(errorMsg);
          setShowConfirmation(false);
          return;
        }
      }

      // Update stock and sold quantities
      console.log("🔄 Updating stock quantities...");
      pendingOrder.items.forEach((item) => {
        const productRef = doc(db, "products", item.id);
        const currentProduct = products.find((p) => p.id === item.id);

        if (!currentProduct) {
          console.error(`❌ Product not found for stock update: ${item.id}`);
          return;
        }

        const currentSold = currentProduct.sold || 0;
        const currentStock = currentProduct.stock || 0;
        console.log(
          `📊 Updating product stock: ${currentStock} -> ${
            currentStock - item.quantity
          }`
        );
        batch.update(productRef, {
          stock: currentStock - item.quantity,
          sold: currentSold + item.quantity,
        });
      });

      // Save/update customer data
      if (
        pendingOrder.customerName &&
        pendingOrder.customerName !== "Walk-in Customer"
      ) {
        console.log(
          `👤 Saving/updating customer: ${pendingOrder.customerName}`
        );
        try {
          await saveCustomerToManagement(pendingOrder.customerName);
        } catch (customerError) {
          console.warn(
            "⚠️ Could not save customer data, but continuing with order:",
            customerError
          );
        }
      }

      console.log("🔥 Committing batch write...");
      await batch.commit();
      console.log("✅ Batch write committed successfully");

      // CRITICAL FIX: Create order record with proper due date handling
      console.log("📝 Creating order record...");

      // Prepare the order data
      const orderData = {
        customerName: pendingOrder.customerName,
        items: pendingOrder.items,
        totalItems: pendingOrder.totalItems,
        totalAmount: pendingOrder.totalAmount,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === "credit" ? "pending" : "paid",
        createdAt: new Date(),
        status: "completed",
        // Initialize payment tracking fields
        paidAmount: paymentMethod === "credit" ? 0 : pendingOrder.totalAmount,
        remainingBalance:
          paymentMethod === "credit" ? pendingOrder.totalAmount : 0,
      };

      // CRITICAL: Handle due date properly - only add if it exists and is valid
      if (paymentMethod === "credit" && dueDate) {
        console.log("💾 Saving due date to order:", dueDate);

        // Convert dueDate string to a Date object for consistent storage
        const dueDateObj = new Date(dueDate);
        orderData.dueDate = dueDateObj;

        console.log("💾 Due date saved as:", dueDateObj);
        console.log("💾 Due date ISO string:", dueDateObj.toISOString());
      } else {
        console.log(
          "💾 No due date to save (not credit order or no due date provided)"
        );
        orderData.dueDate = null;
      }

      // Add payment history for non-credit orders
      if (paymentMethod !== "credit") {
        orderData.paymentHistory = [
          {
            amount: pendingOrder.totalAmount,
            paymentDate: new Date(),
            paymentMethod: paymentMethod,
            notes: "Initial payment",
            processedAt: new Date(),
          },
        ];
      } else {
        orderData.paymentHistory = [];
      }

      console.log("📦 Final order data:", orderData);
      console.log("📅 Due date in final data:", orderData.dueDate);

      const orderRef = await addDoc(collection(db, "orders"), orderData);
      console.log("✅ Order record created with ID:", orderRef.id);

      // Update customer stats
      if (
        pendingOrder.customerName &&
        pendingOrder.customerName !== "Walk-in Customer"
      ) {
        console.log("📊 Updating customer stats...");
        try {
          await updateCustomerStats(
            pendingOrder.customerName,
            pendingOrder.totalAmount
          );
          console.log("✅ Customer stats updated");
        } catch (statsError) {
          console.warn(
            "⚠️ Could not update customer stats, but order was successful:",
            statsError
          );
        }
      }

      // Order completed successfully - Show animation
      console.log("🎉 Order completed successfully!");

      // Close confirmation dialog and show success animation
      setShowConfirmation(false);
      setShowSuccessAnimation(true);
    } catch (err) {
      console.error("❌ Checkout error:", err);
      console.error("Error details:", {
        name: err.name,
        message: err.message,
        code: err.code,
        stack: err.stack,
      });

      if (err.code === "permission-denied") {
        alert("Permission denied. Please check your Firebase security rules.");
      } else if (err.code === "unavailable") {
        alert("Network error. Please check your internet connection.");
      } else if (err.code === "invalid-argument") {
        alert("Invalid data. Please check the order information.");
      } else {
        alert(
          `Something went wrong while completing the order: ${err.message}`
        );
      }

      setShowConfirmation(false);
    }
  };

  // Handle when success animation completes
  const handleSuccessAnimationComplete = () => {
    setCart({});
    setCustomerName("");
    setPendingOrder(null);
    setShowSuccessAnimation(false);
    fetchProducts();
    fetchRecentCustomers();
  };

  const handleCancelOrderDialog = () => {
    setShowConfirmation(false);
    setPendingOrder(null);
  };

  // Cancel entire order
  const handleCancelEntireOrder = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel this order? All items will be removed."
      )
    ) {
      setCart({});
      setCustomerName("");
      console.log("Order cancelled");
    }
  };

  // Effects
  useEffect(() => {
    fetchProducts();
    fetchRecentCustomers();
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Update pending order when cart changes AND dialog is open
  useEffect(() => {
    if (showConfirmation) {
      const orderItems = products
        .filter((p) => cart[p.id]?.checked)
        .map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          quantity: cart[p.id].quantity,
          subtotal: p.price * cart[p.id].quantity,
        }));

      setPendingOrder((prev) => ({
        ...prev,
        items: orderItems,
        totalItems: getTotals().totalItems,
        totalAmount: getTotals().totalAmount,
      }));
    }
  }, [cart, showConfirmation, products]);

  // Get unique categories from products
  const categories = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];

  // Filter and sort products (only show in-stock products)
  const filteredAndSortedProducts = products
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm);
      const matchesCategory =
        !selectedCategory || p.category === selectedCategory;
      const matchesStock = p.stock > 0;
      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "price" || sortBy === "stock") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  return (
    <div className="page-container">
      <Sidebar />
      <div className={`orders-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />

        <div className="orders-content">
          <div className="page-header">
            <h2>Create new orders</h2>
            <p>Select products and manage customer orders</p>
          </div>

          {/* Barcode Scanner Component */}
          <BarcodeScanner
            onBarcodeScanned={handleBarcodeScanned}
            products={products}
          />

          {/* Enhanced Search & Filters Section */}
          <div className="search-filters-section">
            <ProductSearch
              onSearch={handleSearch}
              categories={categories}
              selectedCategory={selectedCategory}
            />

            {(searchTerm || selectedCategory) && (
              <button
                className="clear-filters-btn"
                onClick={() => handleSearch("", "")}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Simplified Controls Bar */}
          <div className="controls-bar">
            <div className="control-group">
              <label>
                <FontAwesomeIcon icon={faSort} />
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="control-select"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="stock">Stock</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="control-select"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <div className="cart-summary-mini">
              <FontAwesomeIcon icon={faShoppingCart} />
              <span>{totalItems} items</span>
              <span className="amount">₱{totalAmount.toFixed(2)}</span>
            </div>

            <div className="products-count">
              <span>{filteredAndSortedProducts.length} products</span>
              {selectedCategory && (
                <span className="filter-info">• {selectedCategory}</span>
              )}
            </div>
          </div>

          {recentCustomers.length > 0 && (
            <div className="recent-customers">
              <h3>Recent Customers</h3>
              <div className="customer-tags">
                {recentCustomers.map((customer, index) => (
                  <button
                    key={index}
                    className="customer-tag"
                    onClick={() => handleCustomerNameChange(customer)}
                  >
                    {customer}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="products-grid">
            <h2>Available Products</h2>

            {loading ? (
              <div className="loading">
                <FontAwesomeIcon icon={faSearch} size="3x" />
                <p>Loading products...</p>
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="no-products">
                <FontAwesomeIcon icon={faSearch} size="3x" />
                <p>No products found matching your criteria</p>
                {(searchTerm || selectedCategory) && (
                  <button
                    className="clear-filters-btn"
                    onClick={() => handleSearch("", "")}
                    style={{ marginTop: "1rem" }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="products-list">
                {filteredAndSortedProducts.map((p) => {
                  const item = cart[p.id] || {};
                  const isOutOfStock = p.stock === 0;
                  const isSelected = item.checked;

                  return (
                    <div
                      key={p.id}
                      className={`product-card ${
                        isSelected ? "selected" : ""
                      } ${isOutOfStock ? "out-of-stock" : ""}`}
                      onClick={() => !isOutOfStock && toggleProduct(p.id)}
                      style={{ cursor: isOutOfStock ? "default" : "pointer" }}
                    >
                      <div className="product-header">
                        <div className="product-checkbox">
                          <input
                            type="checkbox"
                            checked={isSelected || false}
                            onChange={() => toggleProduct(p.id)}
                            disabled={isOutOfStock}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="product-info">
                          <span className="product-name">{p.name}</span>
                          {p.unit && (
                            <span className="unit-badge">{p.unit}</span>
                          )}
                        </div>

                        <div className="product-meta">
                          <span className="product-price">
                            ₱{p.price.toFixed(2)}
                          </span>
                          <span
                            className={`stock-badge ${
                              p.stock < 5 ? "low-stock" : ""
                            }`}
                          >
                            {p.stock} in stock
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls - Only show when product is selected */}
                      {isSelected && (
                        <div className="quantity-section">
                          <div className="quantity-controls">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                changeQuantity(p.id, -1);
                              }}
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={item.quantity || 1}
                              onChange={(e) =>
                                setQuantity(p.id, e.target.value)
                              }
                              onClick={(e) => e.stopPropagation()}
                              min="1"
                              max={p.stock}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                changeQuantity(p.id, 1);
                              }}
                              disabled={item.quantity >= p.stock}
                            >
                              +
                            </button>
                          </div>
                          <div className="quantity-summary">
                            <span className="subtotal">
                              ₱{(p.price * (item.quantity || 1)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}

                      {isOutOfStock && (
                        <div className="out-of-stock-overlay">
                          <FontAwesomeIcon icon={faExclamationTriangle} />
                          Out of Stock
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <FloatingCheckout
          totalItems={totalItems}
          totalAmount={totalAmount}
          cartItems={cartItems}
          onCheckout={handleCheckoutClick}
          onCancelOrder={handleCancelEntireOrder}
          onQuantityChange={changeQuantity}
          onRemoveItem={removeFromCart}
          customerName={customerName}
          setCustomerName={handleCustomerNameChange}
        />

        <OrderConfirmationDialog
          isOpen={showConfirmation}
          onConfirm={handleConfirmOrder} // This now accepts (paymentMethod, dueDate)
          onCancel={handleCancelOrderDialog}
          orderDetails={pendingOrder?.items || []}
          customerName={pendingOrder?.customerName}
          totalItems={pendingOrder?.totalItems || 0}
          totalAmount={pendingOrder?.totalAmount || 0}
          onQuantityChange={handleDialogQuantityChange}
          onRemoveItem={handleDialogRemoveItem}
        />

        {/* Success Animation */}
        <SuccessAnimation
          isVisible={showSuccessAnimation}
          onComplete={handleSuccessAnimationComplete}
        />
      </div>
    </div>
  );
}
