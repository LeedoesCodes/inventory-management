import React, { useState, useEffect } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import Sidebar from "../components/UI/Sidebar";
import Header from "../components/UI/Headers";
import { useSidebar } from "../context/SidebarContext";
import "../styles/transaction.scss";

export default function TransactionHistory() {
  const { isCollapsed } = useSidebar();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate
          ? doc.data().createdAt.toDate()
          : new Date(doc.data().createdAt),
      }));
      setOrders(ordersData);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) =>
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <Sidebar />
      <div className={`transactions-page ${isCollapsed ? "collapsed" : ""}`}>
        <Header />

        <div className="transactions-content">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredOrders.length === 0 ? (
            <p>No transactions found.</p>
          ) : (
            <ul className="transaction-list">
              {filteredOrders.map((order) => (
                <li key={order.id} className="transaction-item">
                  <div className="transaction-info">
                    <p>
                      <strong>Date:</strong> {order.createdAt.toLocaleString()}
                    </p>
                    <p>
                      <strong>Customer Name:</strong>{" "}
                      {order.customerName || "N/A"}
                    </p>
                    <p>
                      <strong>Total Items:</strong> {order.totalItems}
                    </p>
                    <p>
                      <strong>Total Amount:</strong> ₱
                      {order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="transaction-products">
                    <h4>Products:</h4>
                    <ul>
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.name} x {item.quantity} = ₱
                          {item.subtotal.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
