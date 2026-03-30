// src/Pages/OrdersPage.jsx
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
import { StockConverter } from "../components/products/utils/stockConverter";
import "../styles/orders.scss";

// Normalize customer name for case-insensitive operations
const normalizeCustomerName = (name) => {
  return name ? name.trim().toLowerCase() : "";
};

// Properly capitalize customer name (First Letter Of Each Word)
const capitalizeCustomerName = (name) => {
  if (!name || name.trim() === "") return name;

  return name
    .trim()
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function OrdersPage() {
  const { isCollapsed } = useSidebar();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState({});
  const [itemSelectionOrder, setItemSelectionOrder] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPackagingType, setSelectedPackagingType] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [customerDiscounts, setCustomerDiscounts] = useState([]);

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
        a.localeCompare(b),
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

  // Fetch recent customers with case-insensitive handling
  const fetchRecentCustomers = async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const ordersQuery = query(
        collection(db, "orders"),
        where("createdAt", ">=", oneWeekAgo),
      );
      const snapshot = await getDocs(ordersQuery);

      const uniqueCustomers = new Set();
      const customers = [];

      snapshot.docs.forEach((doc) => {
        const orderData = doc.data();
        if (orderData.customerName && orderData.customerName.trim() !== "") {
          const normalizedName = normalizeCustomerName(orderData.customerName);
          if (!uniqueCustomers.has(normalizedName)) {
            uniqueCustomers.add(normalizedName);
            customers.push(capitalizeCustomerName(orderData.customerName));
          }
        }
      });

      setRecentCustomers(customers.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent customers:", error);
    }
  };

  // Fetch customer discounts when customer name changes
  useEffect(() => {
    if (customerName && customerName !== "Walk-in Customer") {
      fetchCustomerDiscounts(customerName);
    } else {
      setCustomerDiscounts([]);
    }
  }, [customerName]);

  const fetchCustomerDiscounts = async (customerName) => {
    try {
      const normalizedName = normalizeCustomerName(customerName);
      const discountsQuery = query(
        collection(db, "customerDiscounts"),
        where("customerNameLower", "==", normalizedName),
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

  // Calculate discounted price for a product
  const getDiscountedPrice = (product) => {
    if (!customerDiscounts.length) return product.price;

    const activeDiscounts = customerDiscounts.filter((d) => d.active);
    const categoryDiscount = activeDiscounts.find(
      (d) => d.category === product.category,
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
      const availableStock = StockConverter.getAvailableStock(
        product,
        products,
      );
      const currentQty = cart[product.id]?.quantity || 0;
      const newQty = currentQty + 1;

      if (newQty > availableStock) {
        console.warn(
          `❌ Not enough stock for ${product.name}. Only ${availableStock} available.`,
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

      // Track selection order when item is added via barcode
      // 🔥 FIX: Check include to prevent duplicates
      setItemSelectionOrder((prevOrder) => {
        if (!prevOrder.includes(product.id)) {
          return [...prevOrder, product.id];
        }
        return prevOrder;
      });

      console.log(
        `✅ Updated ${product.name} in cart. New quantity: ${newQty}`,
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
      const normalizedName = normalizeCustomerName(customerName);
      const capitalizedName = capitalizeCustomerName(customerName);

      const customersSnapshot = await getDocs(collection(db, "customers"));
      const existingCustomer = customersSnapshot.docs.find((doc) => {
        const customerData = doc.data();
        const existingNormalizedName =
          customerData.nameLower || normalizeCustomerName(customerData.name);
        return existingNormalizedName === normalizedName;
      });

      if (!existingCustomer) {
        await addDoc(collection(db, "customers"), {
          name: capitalizedName,
          nameLower: normalizedName,
          phone: "",
          address: "",
          createdAt: new Date(),
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: null,
        });
        console.log(
          "✅ New customer created with proper capitalization:",
          capitalizedName,
        );
      } else {
        const existingName = existingCustomer.data().name;
        console.log("ℹ️ Customer already exists:", existingName);

        if (existingName !== capitalizedName) {
          await updateDoc(doc(db, "customers", existingCustomer.id), {
            name: capitalizedName,
          });
          console.log(
            `🔄 Updated customer name from "${existingName}" to "${capitalizedName}"`,
          );
        }
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
      const normalizedName = normalizeCustomerName(customerName);
      const customersSnapshot = await getDocs(collection(db, "customers"));
      const existingCustomer = customersSnapshot.docs.find((doc) => {
        const customerData = doc.data();
        const existingNormalizedName =
          customerData.nameLower || normalizeCustomerName(customerData.name);
        return existingNormalizedName === normalizedName;
      });

      if (existingCustomer) {
        const customerData = existingCustomer.data();

        await updateDoc(doc(db, "customers", existingCustomer.id), {
          totalOrders: (customerData.totalOrders || 0) + 1,
          totalSpent: (customerData.totalSpent || 0) + orderAmount,
          lastOrderDate: new Date(),
        });
        console.log("✅ Customer stats updated for:", customerData.name);
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
        const capitalizedName = capitalizeCustomerName(name);
        saveCustomerToManagement(capitalizedName);
      }, 2000);
      setDebounceTimer(timer);
    }
  };

  // ==========================================
  // 🔥 FIXED: Product selection with duplicate prevention
  // ==========================================
  const toggleProduct = (id) => {
    const product = products.find((p) => p.id === id);
    const availableStock = StockConverter.getAvailableStock(product, products);
    if (product && availableStock === 0) return;

    // 1. Determine new status
    const isCurrentlyChecked = cart[id]?.checked;
    const willBeChecked = !isCurrentlyChecked;

    // 2. Update Cart
    setCart((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        checked: willBeChecked,
        quantity: prev[id]?.quantity || 1,
      },
    }));

    // 3. Update Order History (Check for duplicates)
    if (willBeChecked) {
      setItemSelectionOrder((prev) => {
        if (prev.includes(id)) return prev; // Don't add if already there
        return [...prev, id];
      });
    } else {
      setItemSelectionOrder((prev) => prev.filter((itemId) => itemId !== id));
    }
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

    // If adding quantity and item isn't in selection order yet (edge case)
    if (delta > 0 && cart[id]?.checked) {
      setItemSelectionOrder((prevOrder) => {
        if (!prevOrder.includes(id)) return [...prevOrder, id];
        return prevOrder;
      });
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

  // FIXED: Remove item from cart with order tracking
  const removeFromCart = (id) => {
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[id];
      return newCart;
    });

    // Remove from selection order
    if (itemSelectionOrder.includes(id)) {
      setItemSelectionOrder((prevOrder) =>
        prevOrder.filter((itemId) => itemId !== id),
      );
    }
  };

  // Handle quantity changes from confirmation dialog
  const handleDialogQuantityChange = (itemId, delta) => {
    changeQuantity(itemId, delta);
  };

  // Handle remove item from confirmation dialog
  const handleDialogRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  // Updated search handler to match ProductSearch component
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

  // FIXED: Get cart items in the order they were selected with correct display order
  const cartItems = itemSelectionOrder
    .filter((itemId) => cart[itemId]?.checked)
    // De-duplicate in case ancient state had duplicates
    .filter((value, index, self) => self.indexOf(value) === index)
    .map((itemId, index) => {
      const product = products.find((p) => p.id === itemId);
      const cartItem = cart[itemId];

      if (!product || !cartItem) return null;

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        discountedPrice: getDiscountedPrice(product),
        quantity: cartItem.quantity,
        subtotal: getDiscountedPrice(product) * cartItem.quantity,
        productId: product.id,
        category: product.category,
        // FIX: Use the current index in the filtered array, not the original position
        displayOrder: index + 1,
        originalOrder: itemSelectionOrder.indexOf(itemId) + 1, // Keep for reference
      };
    })
    .filter((item) => item !== null);

  // FIXED: Checkout functions with order preservation
  const handleCheckoutClick = () => {
    if (totalItems === 0) {
      alert("Please select some products first.");
      return;
    }

    // Get items in the order they were selected
    const orderItems = itemSelectionOrder
      .filter((itemId) => cart[itemId]?.checked)
      // De-duplicate
      .filter((value, index, self) => self.indexOf(value) === index)
      .map((itemId, index) => {
        const product = products.find((p) => p.id === itemId);
        const cartItem = cart[itemId];

        if (!product || !cartItem) return null;

        return {
          id: product.id,
          name: product.name,
          price: product.price,
          discountedPrice: getDiscountedPrice(product),
          quantity: cartItem.quantity,
          subtotal: getDiscountedPrice(product) * cartItem.quantity,
          category: product.category,
          unit: product.unit || "pcs",
          packagingType: product.packagingType || "single",
          // FIX: Use the current display order
          displayOrder: index + 1,
        };
      })
      .filter((item) => item !== null);

    const finalCustomerName = customerName || "Walk-in Customer";
    const capitalizedCustomerName =
      finalCustomerName === "Walk-in Customer"
        ? finalCustomerName
        : capitalizeCustomerName(finalCustomerName);

    setPendingOrder({
      items: orderItems,
      customerName: capitalizedCustomerName,
      totalItems,
      totalAmount,
      itemSelectionOrder: [...itemSelectionOrder], // Save the order array
    });

    setShowConfirmation(true);
  };

  // FIXED: Order confirmation with order preservation
  const handleConfirmOrder = async (paymentMethod = "cash", dueDate = null) => {
    if (!pendingOrder) return;

    try {
      console.log("🔄 Starting order confirmation process...");
      console.log(`💰 Payment Method: ${paymentMethod}`);
      console.log(`📅 Due Date: ${dueDate || "Not applicable"}`);

      const batch = writeBatch(db);
      const stockUpdates = [];
      let updatedProducts = [...products]; // Track product changes

      // Check stock availability for all items
      console.log("📦 Checking stock availability...");
      for (const item of pendingOrder.items) {
        const product = updatedProducts.find((p) => p.id === item.id);

        if (!product) {
          const errorMsg = `Product not found: ${item.name} (ID: ${item.id})`;
          console.error("❌", errorMsg);
          alert(errorMsg);
          setShowConfirmation(false);
          return;
        }

        const availableStock = StockConverter.getAvailableStock(
          product,
          updatedProducts,
        );
        console.log(
          `📊 Product: ${product.name}, Requested: ${item.quantity}, Available: ${availableStock}`,
        );

        // For single items, check if we need to convert bulk packages
        if (
          product.packagingType === "single" &&
          product.stock < item.quantity
        ) {
          const neededQuantity = item.quantity;
          const currentStock = product.stock || 0;

          if (currentStock < neededQuantity) {
            const canConvert = StockConverter.canAutoConvert(
              updatedProducts,
              product.id,
              neededQuantity,
            );

            if (!canConvert) {
              const errorMsg = `Not enough stock for ${product.name}. Only ${availableStock} pieces available.`;
              console.error("❌", errorMsg);
              alert(errorMsg);
              setShowConfirmation(false);
              return;
            }

            // Perform the conversion
            const conversionResult = await StockConverter.convertBulkToSingle(
              updatedProducts,
              product.id,
              neededQuantity - currentStock,
            );

            if (!conversionResult.success) {
              alert(`Stock conversion failed: ${conversionResult.message}`);
              setShowConfirmation(false);
              return;
            }

            // Update local products state with converted quantities
            updatedProducts = conversionResult.updatedProducts;
            stockUpdates.push(...conversionResult.updates);

            // 🔥 CRITICAL FIX: Update Firebase for bulk products too
            conversionResult.updates.forEach((update) => {
              const productRef = doc(db, "products", update.productId);
              const currentProduct = updatedProducts.find(
                (p) => p.id === update.productId,
              );

              if (currentProduct) {
                batch.update(productRef, {
                  stock: currentProduct.stock,
                  // Also update sold count if needed
                  sold:
                    (currentProduct.sold || 0) +
                    (update.type === "single" ? update.quantity : 0),
                });
                console.log(
                  `🔥 UPDATING FIREBASE: ${currentProduct.name} stock -> ${currentProduct.stock}`,
                );
              }
            });
          }
        }

        // Regular stock check for bulk items or single items with sufficient stock
        const currentProduct = updatedProducts.find((p) => p.id === item.id);
        if (currentProduct.stock < item.quantity) {
          const errorMsg = `Not enough stock for ${currentProduct.name}. Only ${currentProduct.stock} available.`;
          console.error("❌", errorMsg);
          alert(errorMsg);
          setShowConfirmation(false);
          return;
        }
      }

      // Update stock and sold quantities in Firestore for ALL products in the order
      console.log("🔄 Updating stock quantities in Firebase...");
      pendingOrder.items.forEach((item) => {
        const productRef = doc(db, "products", item.id);
        const currentProduct = updatedProducts.find((p) => p.id === item.id);

        if (!currentProduct) {
          console.error(`❌ Product not found for stock update: ${item.id}`);
          return;
        }

        const currentSold = currentProduct.sold || 0;
        const currentStock = currentProduct.stock || 0;

        console.log(
          `📊 Final update for ${currentProduct.name}: ${currentStock} -> ${
            currentStock - item.quantity
          }`,
        );

        batch.update(productRef, {
          stock: currentStock - item.quantity,
          sold: currentSold + item.quantity,
        });
      });

      // Update local state with the converted quantities
      setProducts(updatedProducts);

      // Save/update customer data
      if (
        pendingOrder.customerName &&
        pendingOrder.customerName !== "Walk-in Customer"
      ) {
        console.log(
          `👤 Saving/updating customer: ${pendingOrder.customerName}`,
        );
        try {
          await saveCustomerToManagement(pendingOrder.customerName);
        } catch (customerError) {
          console.warn(
            "⚠️ Could not save customer data, but continuing with order:",
            customerError,
          );
        }
      }

      console.log("🔥 Committing batch write...");
      await batch.commit();
      console.log("✅ Batch write committed successfully");

      // Create order record with case-insensitive customer name
      console.log("📝 Creating order record...");

      const orderData = {
        customerName: pendingOrder.customerName,
        customerNameLower: normalizeCustomerName(pendingOrder.customerName),
        items: pendingOrder.items, // Items already have displayOrder
        totalItems: pendingOrder.totalItems,
        totalAmount: pendingOrder.totalAmount,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === "credit" ? "pending" : "paid",
        createdAt: new Date(),
        status: "completed",
        paidAmount: paymentMethod === "credit" ? 0 : pendingOrder.totalAmount,
        remainingBalance:
          paymentMethod === "credit" ? pendingOrder.totalAmount : 0,
        discountsApplied: customerDiscounts.length > 0,
        stockConversions: stockUpdates.length > 0 ? stockUpdates : null,
        // Save the selection order explicitly
        itemSelectionOrder: pendingOrder.itemSelectionOrder,
      };

      if (paymentMethod === "credit" && dueDate) {
        console.log("💾 Saving due date to order:", dueDate);
        const dueDateObj = new Date(dueDate);
        orderData.dueDate = dueDateObj;
        console.log("💾 Due date saved as:", dueDateObj);
      } else {
        console.log(
          "💾 No due date to save (not credit order or no due date provided)",
        );
        orderData.dueDate = null;
      }

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
      const orderRef = await addDoc(collection(db, "orders"), orderData);
      console.log("✅ Order record created with ID:", orderRef.id);

      // Update customer stats with case-insensitive matching
      if (
        pendingOrder.customerName &&
        pendingOrder.customerName !== "Walk-in Customer"
      ) {
        console.log("📊 Updating customer stats...");
        try {
          await updateCustomerStats(
            pendingOrder.customerName,
            pendingOrder.totalAmount,
          );
          console.log("✅ Customer stats updated");
        } catch (statsError) {
          console.warn(
            "⚠️ Could not update customer stats, but order was successful:",
            statsError,
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
          `Something went wrong while completing the order: ${err.message}`,
        );
      }

      setShowConfirmation(false);
    }
  };

  // Handle when success animation completes
  const handleSuccessAnimationComplete = () => {
    setCart({});
    setItemSelectionOrder([]); // Clear selection order
    setCustomerName("");
    setCustomerDiscounts([]);
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
        "Are you sure you want to cancel this order? All items will be removed.",
      )
    ) {
      setCart({});
      setItemSelectionOrder([]); // Clear selection order
      setCustomerName("");
      setCustomerDiscounts([]);
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
      // Get items in the order they were selected
      const orderItems = itemSelectionOrder
        .filter((itemId) => cart[itemId]?.checked)
        // Deduplicate
        .filter((value, index, self) => self.indexOf(value) === index)
        .map((itemId, index) => {
          const product = products.find((p) => p.id === itemId);
          const cartItem = cart[itemId];

          if (!product || !cartItem) return null;

          return {
            id: product.id,
            name: product.name,
            price: getDiscountedPrice(product),
            discountedPrice: getDiscountedPrice(product),
            quantity: cartItem.quantity,
            subtotal: getDiscountedPrice(product) * cartItem.quantity,
            category: product.category,
            displayOrder: index + 1, // FIX: Use current display order
          };
        })
        .filter((item) => item !== null);

      const totals = getTotals();
      setPendingOrder((prev) => ({
        ...prev,
        items: orderItems,
        totalItems: totals.totalItems,
        totalAmount: totals.totalAmount,
        itemSelectionOrder: [...itemSelectionOrder],
      }));
    }
  }, [cart, showConfirmation, products, customerDiscounts, itemSelectionOrder]);

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

  // ============================================
  // 🔥 FIX: Sequential Order Numbering (Duplicate Proof)
  // ============================================
  const orderNumberMap = {};
  let currentOrderCount = 1;
  const processedIds = new Set(); // keeps track of items we've already numbered

  itemSelectionOrder.forEach((itemId) => {
    // Check if item is:
    // 1. In the cart
    // 2. Checked
    // 3. NOT already processed (Prevents the 2, 4, 6 issue)
    if (cart[itemId]?.checked && !processedIds.has(itemId)) {
      orderNumberMap[itemId] = currentOrderCount;
      processedIds.add(itemId); // Mark as processed
      currentOrderCount++;
    }
  });

  return (
    <div className="page-container">
      <Sidebar />
      <div className={`orders-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />

        <div className="orders-content">
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

          {recentCustomers.length > 0 && (
            <div className="recent-customers">
              <h3>Recent Customers</h3>
              <div className="customer-tags">
                {recentCustomers.map((customer, index) => (
                  <button
                    key={index}
                    className="customer-tag"
                    onClick={() => setCustomerName(customer)}
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
                    products,
                  );
                  const isOutOfStock = availableStock === 0;
                  const item = cart[p.id] || {};
                  const isSelected = item.checked;
                  const discountedPrice = getDiscountedPrice(p);
                  const hasDiscount = discountedPrice < p.price;

                  // 🔥 FIX START: Use sequential map
                  const currentDisplayOrder = orderNumberMap[p.id];
                  // 🔥 FIX END

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
                          <span className="product-name" title={p.name}>
                            {p.name}
                          </span>
                          <div className="product-badges">
                            {p.unit && (
                              <span className="unit-badge">{p.unit}</span>
                            )}
                            {p.category && (
                              <span className="category-badge">
                                {p.category}
                              </span>
                            )}
                            <span
                              className="packaging-badge"
                              data-packaging={p.packagingType || "single"}
                            >
                              {p.packagingType === "bulk" ? "Bulk" : "Single"}
                            </span>
                          </div>
                        </div>

                        <div className="product-meta">
                          {hasDiscount && (
                            <span className="original-price">
                              ₱{Number(p.price || 0).toFixed(2)}
                            </span>
                          )}
                          <div className="product-price">
                            ₱{discountedPrice.toFixed(2)}
                          </div>
                        </div>

                        {/* Show selection order if item is selected */}
                        {isSelected && currentDisplayOrder && (
                          <span className="selection-order-badge floating">
                            #{currentDisplayOrder}
                          </span>
                        )}
                      </div>

                      <div className="stock-row">
                        <span
                          className={`stock-badge ${
                            availableStock < 5 ? "low-stock" : ""
                          }`}
                        >
                          {availableStock} available
                          {p.packagingType === "single" &&
                            availableStock > p.stock && (
                              <span className="stock-conversion-hint">
                                {" "}
                                (includes bulk)
                              </span>
                            )}
                        </span>
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
                                2,
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
          cartItems={cartItems} // Now ordered correctly
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
          customerDiscounts={customerDiscounts}
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
