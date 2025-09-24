import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { useSidebar } from "../context/SidebarContext.jsx";
import "../styles/dashboard.scss";

export default function Dashboard() {
  const { isCollapsed } = useSidebar();
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [popularItems, setPopularItems] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const productsSnap = await getDocs(collection(db, "products"));
      const products = productsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTotalProducts(products.length);
      setLowStock(products.filter((p) => p.stock <= 5).length);

      const suppliersSnap = await getDocs(collection(db, "suppliers"));
      setTotalSuppliers(suppliersSnap.docs.length);

      const ordersSnap = await getDocs(collection(db, "orders"));
      const orders = ordersSnap.docs.map((doc) => doc.data());
      setTotalOrders(orders.length);

      const itemCounts = {};
      orders.forEach((order) => {
        order.items.forEach((item) => {
          itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
        });
      });

      const sortedItems = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, sold]) => ({ name, sold }));

      setPopularItems(sortedItems);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className={`dashboard-page ${isCollapsed ? "collapsed" : ""}`}>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="stats-cards">
        <div className="card">
          <h2>{totalProducts}</h2>
          <p>Total Products</p>
        </div>
        <div className="card">
          <h2>{totalSuppliers}</h2>
          <p>Total Suppliers</p>
        </div>
        <div className="card">
          <h2>{totalOrders}</h2>
          <p>Total Orders</p>
        </div>
        <div className="card low-stock">
          <h2>{lowStock}</h2>
          <p>Low Stock Items</p>
        </div>
      </div>

      <div className="popular-items mt-8">
        <h2 className="text-xl font-semibold mb-4">Popular Items</h2>
        <ul>
          {popularItems.map((item, index) => (
            <li key={index}>
              {item.name} - {item.sold} sold
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
