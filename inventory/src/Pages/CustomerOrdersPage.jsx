// CustomerOrdersPage.jsx - UPDATED WITHOUT CUSTOMER INFO MODAL
import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../Firebase/firebase";
import Sidebar from "../components/UI/CustomerSidebar";
import Header from "../components/UI/Headers";
import { useSidebar } from "../context/SidebarContext";
import FloatingCheckout from "../components/UI/FloatingCheckout";
import ProductSearch from "../components/products/ProductSearch";
import OrderConfirmationDialog from "../components/UI/CustomerOrderConfirmationDialog";
import SuccessAnimation from "../components/UI/SuccessAnimation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faSort,
  faShoppingCart,
  faExclamationTriangle,
  faUser,
  faClock,
  faCheckCircle,
  faTruck,
  faBoxOpen,
  faEdit,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { StockConverter } from "../components/products/utils/stockConverter";
import "../styles/CustomerOrdersPage.scss";

// Normalize customer name for case-insensitive operations
const normalizeCustomerName = (name) => {
  return name ? name.trim().toLowerCase() : "";
};

// Properly capitalize customer name
const capitalizeCustomerName = (name) => {
  if (!name || name.trim() === "") return name;

  return name
    .trim()
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Order status definitions
const ORDER_STATUS = {
  PENDING: "pending", // Waiting for approval
  PROCESSING: "processing", // Approved, being prepared
  READY: "ready", // Ready for pickup/delivery
  SHIPPED: "shipped", // On the way
  DELIVERED: "delivered", // Delivered to customer
  CANCELLED: "cancelled", // Order cancelled
};

export default function CustomerOrdersPage() {
  const { isCollapsed } = useSidebar();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPackagingType, setSelectedPackagingType] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [customerDiscounts, setCustomerDiscounts] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [orderNotes, setOrderNotes] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("pickup"); // pickup or delivery

  // Fetch categories from Firestore
  const fetchCategories = async () => {
    try {
      const categoriesSnapshot = await getDocs(collection(db, "categories"));
      const categoriesData = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));

      const uniqueCategories = [
        ...new Set(categoriesData.map((cat) => cat.name)),
      ];

      const sortedCategories = uniqueCategories.sort((a, b) =>
        a.localeCompare(b)
      );

      setCategories(sortedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

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

      await fetchCategories();
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer information when name changes
  useEffect(() => {
    const fetchCustomerInfo = async () => {
      if (customerName && customerName !== "Walk-in Customer") {
        try {
          const normalizedName = normalizeCustomerName(customerName);
          const customersQuery = query(
            collection(db, "customers"),
            where("nameLower", "==", normalizedName)
          );
          const snapshot = await getDocs(customersQuery);

          if (!snapshot.empty) {
            const customerData = snapshot.docs[0].data();
            const customerInfoData = {
              name: customerData.name,
              email: customerData.email || "",
              phone: customerData.phone || "",
              address: customerData.address || "",
              totalOrders: customerData.totalOrders || 0,
              totalSpent: customerData.totalSpent || 0,
            };
            setCustomerInfo(customerInfoData);

            // Auto-fill contact info if available
            setCustomerEmail(customerInfoData.email || "");
            setCustomerPhone(customerInfoData.phone || "");
            setCustomerAddress(customerInfoData.address || "");
          } else {
            setCustomerInfo(null);
            setCustomerEmail("");
            setCustomerPhone("");
            setCustomerAddress("");
          }
        } catch (error) {
          console.error("Error fetching customer info:", error);
          setCustomerInfo(null);
        }
      } else {
        setCustomerInfo(null);
        setCustomerEmail("");
        setCustomerPhone("");
        setCustomerAddress("");
      }
    };

    fetchCustomerInfo();
  }, [customerName]);

  // Fetch customer discounts when customer name changes
  useEffect(() => {
    const fetchCustomerDiscounts = async (customerName) => {
      try {
        const normalizedName = normalizeCustomerName(customerName);
        const discountsQuery = query(
          collection(db, "customerDiscounts"),
          where("customerNameLower", "==", normalizedName)
        );
        const snapshot = await getDocs(discountsQuery);

        if (!snapshot.empty) {
          setCustomerDiscounts(snapshot.docs[0].data().discounts || []);
        } else {
          setCustomerDiscounts([]);
        }
      } catch (error) {
        console.error("Error fetching customer discounts:", error);
        setCustomerDiscounts([]);
      }
    };

    if (customerName && customerName !== "Walk-in Customer") {
      fetchCustomerDiscounts(customerName);
    } else {
      setCustomerDiscounts([]);
    }
  }, [customerName]);

  // Calculate discounted price for a product
  const getDiscountedPrice = (product) => {
    if (!customerDiscounts.length) return product.price;

    const activeDiscounts = customerDiscounts.filter((d) => d.active);
    const categoryDiscount = activeDiscounts.find(
      (d) => d.category === product.category
    );

    if (!categoryDiscount) return product.price;

    let discountedPrice;
    if (categoryDiscount.discountType === "percentage") {
      discountedPrice =
        product.price * (1 - categoryDiscount.discountValue / 100);
    } else {
      if (product.category === "LARGE") {
        if (product.price >= 100) {
          discountedPrice = product.price - categoryDiscount.discountValue;
        } else {
          discountedPrice =
            product.price - categoryDiscount.discountValue / 100;
        }
      } else {
        discountedPrice = product.price - categoryDiscount.discountValue;
      }
    }

    return Math.max(0, discountedPrice);
  };

  // Product selection and quantity functions
  const toggleProduct = (id) => {
    const product = products.find((p) => p.id === id);
    const availableStock = StockConverter.getAvailableStock(product, products);
    if (product && availableStock === 0) return;

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
    const availableStock = StockConverter.getAvailableStock(product, products);
    const currentQty = cart[id]?.quantity || 1;
    const newQty = Math.max(1, currentQty + delta);

    if (product && newQty > availableStock) {
      alert(`Only ${availableStock} items available in stock`);
      return;
    }

    setCart((prev) => ({
      ...prev,
      [id]: { ...prev[id], checked: true, quantity: newQty },
    }));
  };

  const setQuantity = (id, quantity) => {
    const product = products.find((p) => p.id === id);
    const availableStock = StockConverter.getAvailableStock(product, products);
    const newQty = Math.max(1, parseInt(quantity) || 1);

    if (product && newQty > availableStock) {
      alert(`Only ${availableStock} items available in stock`);
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

  // Updated search handler
  const handleSearch = (term, category, unit = "", packagingType = "") => {
    setSearchTerm(term.toLowerCase());
    setSelectedCategory(category);
    setSelectedPackagingType(packagingType);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedPackagingType("");
  };

  // Simple totals calculation with discounts
  const getTotals = () => {
    let totalItems = 0;
    let totalAmount = 0;

    products.forEach((p) => {
      const item = cart[p.id];
      if (item?.checked) {
        const discountedPrice = getDiscountedPrice(p);
        const quantity = item.quantity;

        totalItems += quantity;
        totalAmount += discountedPrice * quantity;
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
      discountedPrice: getDiscountedPrice(p),
      quantity: cart[p.id].quantity,
      subtotal: getDiscountedPrice(p) * cart[p.id].quantity,
      productId: p.id,
      category: p.category,
    }));

  // Checkout functions
  const handleCheckoutClick = () => {
    if (totalItems === 0) {
      alert("Please select some products first.");
      return;
    }

    // Validate customer info for delivery
    if (deliveryMethod === "delivery") {
      if (!customerAddress.trim()) {
        alert("Please provide a delivery address");
        return;
      }
      if (!customerPhone.trim()) {
        alert("Please provide a phone number for delivery");
        return;
      }
    }

    const orderItems = cartItems.map((item) => ({
      id: item.productId,
      name: item.name,
      price: item.discountedPrice,
      discountedPrice: item.discountedPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
      category: item.category,
    }));

    const finalCustomerName = customerName || "Walk-in Customer";
    const capitalizedCustomerName =
      finalCustomerName === "Walk-in Customer"
        ? finalCustomerName
        : capitalizeCustomerName(finalCustomerName);

    setPendingOrder({
      items: orderItems,
      customerName: capitalizedCustomerName,
      customerEmail,
      customerPhone,
      customerAddress,
      deliveryMethod,
      orderNotes,
      totalItems,
      totalAmount,
    });

    setShowConfirmation(true);
  };

  // Order confirmation with approval system
  const handleConfirmOrder = async (paymentMethod = "cash") => {
    if (!pendingOrder) return;

    try {
      console.log("🔄 Starting order placement process...");
      console.log(`💰 Payment Method: ${paymentMethod}`);
      console.log(`🚚 Delivery Method: ${pendingOrder.deliveryMethod}`);

      // Create order record with approval system
      const orderData = {
        customerName: pendingOrder.customerName,
        customerNameLower: normalizeCustomerName(pendingOrder.customerName),
        customerEmail: pendingOrder.customerEmail || "",
        customerPhone: pendingOrder.customerPhone || "",
        customerAddress: pendingOrder.customerAddress || "",
        deliveryMethod: pendingOrder.deliveryMethod,
        orderNotes: pendingOrder.orderNotes || "",

        // Order items
        items: pendingOrder.items,
        totalItems: pendingOrder.totalItems,
        totalAmount: pendingOrder.totalAmount,

        // Payment info
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === "credit" ? "pending" : "paid",
        paidAmount: paymentMethod === "credit" ? 0 : pendingOrder.totalAmount,
        remainingBalance:
          paymentMethod === "credit" ? pendingOrder.totalAmount : 0,

        // Order status tracking
        status: ORDER_STATUS.PENDING, // Initial status: pending approval
        statusHistory: [
          {
            status: ORDER_STATUS.PENDING,
            timestamp: new Date(),
            note: "Order placed, waiting for approval",
          },
        ],

        // Timestamps
        createdAt: new Date(),
        placedAt: new Date(),
        estimatedDeliveryTime: null, // Will be set when approved

        // Customer info
        isCustomerOrder: true,
        discountsApplied: customerDiscounts.length > 0,
      };

      console.log("📦 Creating order with data:", orderData);

      // Add order to Firestore
      const orderRef = await addDoc(collection(db, "orders"), orderData);
      console.log("✅ Order created with ID:", orderRef.id);

      // Update customer's order count if registered customer
      if (pendingOrder.customerName !== "Walk-in Customer") {
        try {
          const normalizedName = normalizeCustomerName(
            pendingOrder.customerName
          );
          const customersQuery = query(
            collection(db, "customers"),
            where("nameLower", "==", normalizedName)
          );
          const snapshot = await getDocs(customersQuery);

          if (!snapshot.empty) {
            const customerDoc = snapshot.docs[0];
            const customerData = customerDoc.data();

            await updateDoc(doc(db, "customers", customerDoc.id), {
              totalOrders: (customerData.totalOrders || 0) + 1,
              totalSpent:
                (customerData.totalSpent || 0) + pendingOrder.totalAmount,
              lastOrderDate: new Date(),
            });
            console.log("✅ Customer record updated");
          }
        } catch (error) {
          console.error("Error updating customer record:", error);
        }
      }

      // DO NOT update product stock yet - wait for approval
      console.log("⚠️ Product stock will be updated after order approval");

      // Show success message
      console.log("🎉 Order placed successfully! Waiting for approval...");

      // Close confirmation dialog and show success animation
      setShowConfirmation(false);
      setShowSuccessAnimation(true);
    } catch (err) {
      console.error("❌ Order placement error:", err);
      alert(`Something went wrong while placing the order: ${err.message}`);
      setShowConfirmation(false);
    }
  };

  // Handle when success animation completes
  const handleSuccessAnimationComplete = () => {
    setCart({});
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCustomerAddress("");
    setCustomerDiscounts([]);
    setPendingOrder(null);
    setOrderNotes("");
    setDeliveryMethod("pickup");
    setShowSuccessAnimation(false);
    fetchProducts();
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
      setCustomerEmail("");
      setCustomerPhone("");
      setCustomerAddress("");
      setCustomerDiscounts([]);
      setOrderNotes("");
      console.log("Order cancelled");
    }
  };

  // Effects
  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (showConfirmation) {
      const orderItems = products
        .filter((p) => cart[p.id]?.checked)
        .map((p) => ({
          id: p.id,
          name: p.name,
          price: getDiscountedPrice(p),
          discountedPrice: getDiscountedPrice(p),
          quantity: cart[p.id].quantity,
          subtotal: getDiscountedPrice(p) * cart[p.id].quantity,
          category: p.category,
        }));

      const totals = getTotals();
      setPendingOrder((prev) => ({
        ...prev,
        items: orderItems,
        customerEmail,
        customerPhone,
        customerAddress,
        deliveryMethod,
        orderNotes,
        totalItems: totals.totalItems,
        totalAmount: totals.totalAmount,
      }));
    }
  }, [
    cart,
    showConfirmation,
    products,
    customerDiscounts,
    customerEmail,
    customerPhone,
    customerAddress,
    deliveryMethod,
    orderNotes,
  ]);

  // Filter and sort products
  const filteredAndSortedProducts = products
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm);

      const matchesCategory =
        !selectedCategory ||
        p.category === selectedCategory ||
        (!p.category && selectedCategory === "none");

      const matchesPackaging =
        !selectedPackagingType ||
        (p.packagingType || "single") === selectedPackagingType;

      const availableStock = StockConverter.getAvailableStock(p, products);
      const matchesStock = availableStock > 0;

      return (
        matchesSearch && matchesCategory && matchesPackaging && matchesStock
      );
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
      <div className={`customer-orders-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />

        <div className="orders-content">
          <div className="page-header">
            <h2>Customer Order</h2>
            <p>Browse products and place your order</p>
          </div>

          {/* Customer Info Section */}
          {customerName && (
            <div className="customer-info-section">
              <div className="customer-info-card">
                <div className="customer-info-header">
                  <FontAwesomeIcon icon={faUser} />
                  <span className="customer-name">{customerName}</span>
                  {customerInfo && (
                    <span className="customer-badge">
                      {customerInfo.totalOrders} orders | ₱
                      {customerInfo.totalSpent.toFixed(2)} spent
                    </span>
                  )}
                </div>

                {customerDiscounts.length > 0 && (
                  <div className="discounts-badge">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    {customerDiscounts.filter((d) => d.active).length}{" "}
                    discount(s) available
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Search & Filters Section */}
          <div className="search-filters-section">
            <ProductSearch
              onSearch={handleSearch}
              categories={categories}
              selectedCategory={selectedCategory}
              selectedPackagingType={selectedPackagingType}
            />

            {(searchTerm || selectedCategory || selectedPackagingType) && (
              <button className="clear-filters-btn" onClick={clearAllFilters}>
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
              {selectedPackagingType && (
                <span className="filter-info">
                  •{" "}
                  {selectedPackagingType === "single"
                    ? "Single Items"
                    : "Bulk Packages"}
                </span>
              )}
            </div>
          </div>

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
                {(searchTerm || selectedCategory || selectedPackagingType) && (
                  <button
                    className="clear-filters-btn"
                    onClick={clearAllFilters}
                    style={{ marginTop: "1rem" }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="products-list">
                {filteredAndSortedProducts.map((p) => {
                  const availableStock = StockConverter.getAvailableStock(
                    p,
                    products
                  );
                  const isOutOfStock = availableStock === 0;
                  const item = cart[p.id] || {};
                  const isSelected = item.checked;
                  const discountedPrice = getDiscountedPrice(p);
                  const hasDiscount = discountedPrice < p.price;

                  return (
                    <div
                      key={p.id}
                      className={`product-card ${
                        isSelected ? "selected" : ""
                      } ${isOutOfStock ? "out-of-stock" : ""} ${
                        hasDiscount ? "has-discount" : ""
                      }`}
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
                          {p.category && (
                            <span className="category-badge">{p.category}</span>
                          )}
                          <span
                            className="packaging-badge"
                            data-packaging={p.packagingType || "single"}
                          >
                            {p.packagingType === "bulk" ? "Bulk" : "Single"}
                          </span>
                        </div>

                        <div className="product-meta">
                          <div className="product-price">
                            {hasDiscount ? (
                              <>
                                <span className="original-price">
                                  ₱{p.price.toFixed(2)}
                                </span>
                                <span className="discounted-price">
                                  ₱{discountedPrice.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span>₱{discountedPrice.toFixed(2)}</span>
                            )}
                            <span
                              className={`stock-badge ${
                                availableStock < 5 ? "low-stock" : ""
                              }`}
                            >
                              {availableStock} available
                            </span>
                          </div>
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
                              max={availableStock}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                changeQuantity(p.id, 1);
                              }}
                              disabled={item.quantity >= availableStock}
                            >
                              +
                            </button>
                          </div>
                          <div className="quantity-summary">
                            <span className="subtotal">
                              ₱
                              {(discountedPrice * (item.quantity || 1)).toFixed(
                                2
                              )}
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
          setCustomerName={setCustomerName}
          isCustomerView={true}
        />

        <OrderConfirmationDialog
          isOpen={showConfirmation}
          onConfirm={handleConfirmOrder}
          onCancel={handleCancelOrderDialog}
          orderDetails={pendingOrder?.items || []}
          customerName={pendingOrder?.customerName}
          customerEmail={pendingOrder?.customerEmail}
          customerPhone={pendingOrder?.customerPhone}
          customerAddress={pendingOrder?.customerAddress}
          deliveryMethod={pendingOrder?.deliveryMethod}
          orderNotes={pendingOrder?.orderNotes}
          totalItems={pendingOrder?.totalItems || 0}
          totalAmount={pendingOrder?.totalAmount || 0}
          customerDiscounts={customerDiscounts}
          onQuantityChange={handleDialogQuantityChange}
          onRemoveItem={handleDialogRemoveItem}
          isCustomerView={true}
        />

        {/* Success Animation */}
        <SuccessAnimation
          isVisible={showSuccessAnimation}
          onComplete={handleSuccessAnimationComplete}
          message="Order Placed Successfully! Waiting for approval..."
          icon={faClock}
        />
      </div>
    </div>
  );
}
