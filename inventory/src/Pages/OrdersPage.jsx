import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  writeBatch,
  doc,
} from "firebase/firestore";
import { db } from "../Firebase/firebase";
import Sidebar from "../components/UI/Sidebar";
import Header from "../components/UI/Headers";
import Checkout from "../components/products/Checkout";
import { useSidebar } from "../context/SidebarContext";
import "../styles/orders.scss";
import ProductSearch from "../components/products/ProductSearch";

export default function OrdersPage() {
  const { isCollapsed } = useSidebar();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customerName, setCustomerName] = useState("");

  const fetchProducts = async () => {
    const snapshot = await getDocs(collection(db, "products"));
    const productsData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setProducts(productsData);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (term, category) => {
    setSearchTerm(term.toLowerCase());
    setSelectedCategory(category);
  };

  const toggleProduct = (id) => {
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
    setCart((prev) => {
      const currentQty = prev[id]?.quantity || 1;
      const newQty = Math.max(1, currentQty + delta);
      return {
        ...prev,
        [id]: { ...prev[id], checked: true, quantity: newQty },
      };
    });
  };

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

  // Checkout function
  const handleCheckout = async () => {
    if (totalItems === 0) {
      alert("Please select some products first.");
      return;
    }

    try {
      const orderItems = products
        .filter((p) => cart[p.id]?.checked)
        .map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          quantity: cart[p.id].quantity,
          subtotal: p.price * cart[p.id].quantity,
        }));

      const batch = writeBatch(db);
      orderItems.forEach((item) => {
        const productRef = doc(db, "products", item.id);
        const currentProduct = products.find((p) => p.id === item.id);
        const currentSold = currentProduct.sold || 0;
        const currentStock = currentProduct.stock || 0;

        batch.update(productRef, {
          stock: currentStock - item.quantity,
          sold: currentSold + item.quantity,
        });
      });
      await batch.commit();

      await addDoc(collection(db, "orders"), {
        customerName: customerName || null,
        items: orderItems,
        totalItems,
        totalAmount,
        createdAt: new Date(),
      });

      alert(
        `Order completed!\nCustomer: ${
          customerName || "N/A"
        }\nTotal Items: ${totalItems}\nTotal: ₱${totalAmount.toFixed(2)}`
      );

      setCart({});
      setCustomerName("");
      fetchProducts();
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong while completing the order.");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm);
    const matchesCategory =
      !selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-container">
      <Sidebar />
      <div className={`orders-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />

        <div className="orders-content">
          <div className="search-container">
            <ProductSearch onSearch={handleSearch} />
          </div>

          <h2>Select Products</h2>
          <ul className="orders-list">
            {filteredProducts.map((p) => {
              const item = cart[p.id] || {};
              return (
                <li key={p.id} className="order-item">
                  <input
                    type="checkbox"
                    checked={item.checked || false}
                    onChange={() => toggleProduct(p.id)}
                  />
                  <span className="product-name">{p.name}</span>
                  <span className="product-price">₱{p.price}</span>

                  {item.checked && (
                    <div className="quantity-controls">
                      <button onClick={() => changeQuantity(p.id, -1)}>
                        -
                      </button>
                      <span>{item.quantity || 1}</span>
                      <button onClick={() => changeQuantity(p.id, 1)}>+</button>
                    </div>
                  )}

                  {item.checked && (
                    <span className="subtotal">
                      Subtotal: ₱{(p.price * (item.quantity || 1)).toFixed(2)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <Checkout
            totalItems={totalItems}
            totalAmount={totalAmount}
            onCheckout={handleCheckout}
          >
            <div className="customer-name-input">
              <label>Customer Name (optional):</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
          </Checkout>
        </div>
      </div>
    </div>
  );
}
