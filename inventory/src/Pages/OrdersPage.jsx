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
  faEye,
  faEyeSlash,
  faShoppingCart,
  faExclamationTriangle,
  faTimes,
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
  const [showOutOfStock, setShowOutOfStock] = useState(false);
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

  // Fixed: Handle barcode scans from the BarcodeScanner component
  const handleBarcodeScanned = (barcode) => {
    if (!barcode || barcode.trim() === "") return false;

    console.log("Barcode scanned:", barcode);

    // Find product by barcode
    const product = products.find((p) => {
      if (!p.barcode) return false;
      const productBarcode = p.barcode.toString().replace(/\D/g, "").trim();
      return productBarcode === barcode;
    });

    if (product) {
      const currentQty = cart[product.id]?.quantity || 0;
      const newQty = currentQty + 1;

      // Check stock availability
      if (newQty > product.stock) {
        console.warn(
          `❌ Not enough stock for ${product.name}. Only ${product.stock} available.`
        );
        return false;
      }

      // Always update quantity - this will create or update the cart item
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
        console.log("New customer created:", customerName);
      }
    } catch (error) {
      console.error("Error saving customer data:", error);
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
      }
    } catch (error) {
      console.error("Error updating customer stats:", error);
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

  // Totals calculation
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

  // Checkout functions
  const handleCheckoutClick = () => {
    if (totalItems === 0) {
      alert("Please select some products first.");
      return;
    }

    const orderItems = products
      .filter((p) => cart[p.id]?.checked)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        quantity: cart[p.id].quantity,
        subtotal: p.price * cart[p.id].quantity,
      }));

    setPendingOrder({
      items: orderItems,
      customerName: customerName || "Walk-in Customer",
      totalItems,
      totalAmount,
    });

    setShowConfirmation(true);
  };

  // Fixed: Order confirmation with success animation
  const handleConfirmOrder = async () => {
    if (!pendingOrder) return;

    try {
      const batch = writeBatch(db);

      // Check stock availability
      for (const item of pendingOrder.items) {
        const product = products.find((p) => p.id === item.id);
        if (product.stock < item.quantity) {
          alert(
            `Not enough stock for ${product.name}. Only ${product.stock} available.`
          );
          setShowConfirmation(false);
          return;
        }
      }

      // Update stock and sold quantities
      pendingOrder.items.forEach((item) => {
        const productRef = doc(db, "products", item.id);
        const currentProduct = products.find((p) => p.id === item.id);
        const currentSold = currentProduct.sold || 0;
        const currentStock = currentProduct.stock || 0;

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
        await saveCustomerToManagement(pendingOrder.customerName);
      }

      await batch.commit();

      // Create order record
      await addDoc(collection(db, "orders"), {
        customerName: pendingOrder.customerName,
        items: pendingOrder.items,
        totalItems: pendingOrder.totalItems,
        totalAmount: pendingOrder.totalAmount,
        createdAt: new Date(),
        status: "completed",
      });

      // Update customer stats
      if (
        pendingOrder.customerName &&
        pendingOrder.customerName !== "Walk-in Customer"
      ) {
        await updateCustomerStats(
          pendingOrder.customerName,
          pendingOrder.totalAmount
        );
      }

      // Order completed successfully - Show animation
      console.log("✅ Order completed successfully!");

      // Close confirmation dialog and show success animation
      setShowConfirmation(false);
      setShowSuccessAnimation(true);
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong while completing the order.");
      setShowConfirmation(false);
    }
  };

  // Handle when success animation completes
  const handleSuccessAnimationComplete = () => {
    // Reset everything after animation completes
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

  // Filter and sort products
  const filteredAndSortedProducts = products
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm);
      const matchesCategory =
        !selectedCategory || p.category === selectedCategory;
      const matchesStock = showOutOfStock || p.stock > 0;
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

  const cartItems = products
    .filter((p) => cart[p.id]?.checked)
    .map((p) => ({
      ...p,
      quantity: cart[p.id].quantity,
      subtotal: p.price * cart[p.id].quantity,
    }));

  return (
    <div className="page-container">
      <Sidebar />
      <div className={`orders-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />

        <div className="orders-content">
          <div className="page-header">
            <h2>Create new orders</h2>
          </div>

          {/* Barcode Scanner Component */}
          <BarcodeScanner
            onBarcodeScanned={handleBarcodeScanned}
            products={products}
          />

          <div className="search-container">
            <ProductSearch onSearch={handleSearch} />
          </div>

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
                <option value="category">Category</option>
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

            <div className="control-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showOutOfStock}
                  onChange={(e) => setShowOutOfStock(e.target.checked)}
                />
                <FontAwesomeIcon icon={showOutOfStock ? faEye : faEyeSlash} />
                Show out of stock
              </label>
            </div>

            <div className="cart-summary-mini">
              <FontAwesomeIcon icon={faShoppingCart} />
              <span>{totalItems} items</span>
              <span className="amount">₱{totalAmount.toFixed(2)}</span>
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
            <h2>Available Products ({filteredAndSortedProducts.length})</h2>

            {loading ? (
              <div className="loading">Loading products...</div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="no-products">
                <FontAwesomeIcon icon={faSearch} size="3x" />
                <p>No products found matching your criteria</p>
              </div>
            ) : (
              <div className="products-list">
                {filteredAndSortedProducts.map((p) => {
                  const item = cart[p.id] || {};
                  const isOutOfStock = p.stock === 0;

                  return (
                    <div
                      key={p.id}
                      className={`product-card ${
                        item.checked ? "selected" : ""
                      } ${isOutOfStock ? "out-of-stock" : ""}`}
                    >
                      <div className="product-header">
                        <input
                          type="checkbox"
                          checked={item.checked || false}
                          onChange={() => toggleProduct(p.id)}
                          disabled={isOutOfStock}
                        />
                        <span className="product-name">{p.name}</span>
                        <span className="product-category">{p.category}</span>
                        {p.barcode && (
                          <span className="product-barcode">
                            📊 {p.barcode}
                          </span>
                        )}
                      </div>

                      <div className="product-details">
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

                      {item.checked && (
                        <div className="quantity-section">
                          <div className="quantity-controls">
                            <button
                              onClick={() => changeQuantity(p.id, -1)}
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
                              min="1"
                              max={p.stock}
                            />
                            <button
                              onClick={() => changeQuantity(p.id, 1)}
                              disabled={item.quantity >= p.stock}
                            >
                              +
                            </button>
                          </div>
                          <span className="subtotal">
                            ₱{(p.price * (item.quantity || 1)).toFixed(2)}
                          </span>
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
          onConfirm={handleConfirmOrder}
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
