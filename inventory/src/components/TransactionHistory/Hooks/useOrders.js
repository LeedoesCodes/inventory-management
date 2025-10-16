import { useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  deleteDoc,
  doc,
  writeBatch,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "../../../Firebase/firebase";

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate
          ? doc.data().createdAt.toDate()
          : new Date(doc.data().createdAt),
        paymentMethod: doc.data().paymentMethod || "cash",
        paymentStatus: doc.data().paymentStatus || "paid",
        paidAmount: doc.data().paidAmount || 0,
        remainingBalance:
          doc.data().remainingBalance || doc.data().totalAmount || 0,
        paymentHistory: doc.data().paymentHistory || [],
      }));
      setOrders(ordersData);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (order) => {
    try {
      const batch = writeBatch(db);
      order.items.forEach((item) => {
        const productRef = doc(db, "products", item.id);
        batch.update(productRef, {
          stock: increment(item.quantity),
          sold: increment(-item.quantity),
        });
      });
      const orderRef = doc(db, "orders", order.id);
      batch.update(orderRef, {
        status: "cancelled",
        cancelledAt: new Date(),
      });
      await batch.commit();
      setOrders(
        orders.map((o) =>
          o.id === order.id
            ? { ...o, status: "cancelled", cancelledAt: new Date() }
            : o
        )
      );
      return true;
    } catch (err) {
      console.error("Error cancelling order:", err);
      throw err;
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, "orders", orderId));
      setOrders(orders.filter((order) => order.id !== orderId));
      return true;
    } catch (err) {
      console.error("Error deleting order:", err);
      throw err;
    }
  };

  const handleProcessBadOrder = async (order, badOrderDetails) => {
    // Implementation for bad order processing
    // (You can move your existing handleProcessBadOrder logic here)
  };

  const handleRestoreStock = async (order) => {
    // Implementation for stock restoration
  };

  return {
    orders,
    loading,
    fetchOrders,
    handleCancelOrder,
    handleDeleteOrder,
    handleProcessBadOrder,
    handleRestoreStock,
  };
};
