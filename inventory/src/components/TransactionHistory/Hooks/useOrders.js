import { useState } from "react";
import {
  collection,
  getDocs,
  query,
  deleteDoc,
  doc,
  writeBatch,
  updateDoc,
  increment,
  addDoc,
  getDoc,
  arrayUnion,
  orderBy,
} from "firebase/firestore";
import { db } from "../../../Firebase/firebase";

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const convertFirestoreDueDate = (dueDate) => {
    if (!dueDate) return null;

    try {
      if (dueDate.toDate && typeof dueDate.toDate === "function") {
        return dueDate.toDate();
      }

      if (dueDate.seconds && typeof dueDate.seconds === "number") {
        return new Date(dueDate.seconds * 1000);
      }

      if (typeof dueDate === "string") {
        const result = new Date(dueDate);
        if (!isNaN(result.getTime())) {
          return result;
        }
      }

      if (dueDate instanceof Date) {
        return dueDate;
      }

      if (dueDate._seconds && typeof dueDate._seconds === "number") {
        return new Date(dueDate._seconds * 1000);
      }

      return null;
    } catch (error) {
      console.error("Error converting dueDate:", error);
      return null;
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersQuery = query(
        collection(db, "orders"),
        orderBy("createdAt", "desc"),
      );
      const [ordersSnapshot, badOrdersSnapshot] = await Promise.all([
        getDocs(ordersQuery),
        getDocs(collection(db, "badOrders")),
      ]);

      const badOrdersByOrderId = new Map();
      badOrdersSnapshot.forEach((badOrderDoc) => {
        const badOrder = { id: badOrderDoc.id, ...badOrderDoc.data() };
        const orderId = badOrder.orderId;
        if (!orderId) return;

        if (!badOrdersByOrderId.has(orderId)) {
          badOrdersByOrderId.set(orderId, []);
        }
        badOrdersByOrderId.get(orderId).push(badOrder);
      });

      const ordersData = ordersSnapshot.docs.map((orderDoc) => {
        const orderData = orderDoc.data();
        const createdAtDate = orderData.createdAt?.toDate
          ? orderData.createdAt.toDate()
          : new Date(orderData.createdAt);
        const dueDate = convertFirestoreDueDate(orderData.dueDate);

        const order = {
          id: orderDoc.id,
          ...orderData,
          createdAt: createdAtDate,
          createdAtMs: Number.isNaN(createdAtDate?.getTime?.())
            ? 0
            : createdAtDate.getTime(),
          dueDate,
          dueDateMs: dueDate ? dueDate.getTime() : 0,
          paymentMethod: orderData.paymentMethod || "cash",
          paymentStatus: orderData.paymentStatus || "paid",
          paidAmount: orderData.paidAmount || 0,
          remainingBalance:
            orderData.remainingBalance || orderData.totalAmount || 0,
          paymentHistory: orderData.paymentHistory || [],
        };

        const badOrdersFromRoot = badOrdersByOrderId.get(orderDoc.id) || [];
        const badOrdersFromField = orderData.badOrders || [];

        const allBadOrdersMap = new Map();
        for (const bo of badOrdersFromRoot) {
          const key =
            bo.id || `${order.id}-${bo.processedAt?.seconds || "root"}`;
          allBadOrdersMap.set(key, bo);
        }
        for (const bo of badOrdersFromField) {
          const key =
            bo.id || `${order.id}-${bo.processedAt?.seconds || "field"}`;
          allBadOrdersMap.set(key, bo);
        }

        order.badOrders = Array.from(allBadOrdersMap.values());
        order.hasBadOrder = order.badOrders.length > 0;

        return order;
      });

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
            : o,
        ),
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

  // FIXED: Only update stock for replace actions, not for full refund
  const handleProcessBadOrder = async (badOrderData) => {
    try {
      console.log("Processing bad order:", badOrderData);
      const { order, badOrderDetails } = badOrderData;
      if (!order || !badOrderDetails) {
        throw new Error("Missing order or bad order details");
      }

      const badOrderRecord = {
        id: `badorder_${Date.now()}`,
        orderId: order.id,
        originalOrderId: order.id,
        action: badOrderDetails.action,
        reason: badOrderDetails.reason,
        status: "processed",
        processedAt: new Date(),
        processedBy: "current_user_id",
        totalRefundAmount: badOrderDetails.refundAmount || 0,
        items: badOrderDetails.items || [],
        createdAt: new Date(),
      };

      console.log("Saving bad order to Firestore:", badOrderRecord);
      const badOrderRef = await addDoc(
        collection(db, "badOrders"),
        badOrderRecord,
      );
      console.log("Bad order saved with ID:", badOrderRef.id);

      // FIXED: Only update product quantities for replace actions
      if (
        badOrderDetails.action === "replace" ||
        badOrderDetails.action === "partial_refund"
      ) {
        console.log("Updating product quantities for replacement action");
        await updateProductQuantities(badOrderDetails.items || []);
      } else {
        console.log("Skipping stock update for full refund action");
      }

      const orderRef = doc(db, "orders", order.id);
      const updateData = {
        hasBadOrder: true,
        lastUpdated: new Date(),
        badOrders: arrayUnion(badOrderRecord),
      };

      if (badOrderDetails.action === "full_refund") {
        updateData.status = "refunded";
      }

      await updateDoc(orderRef, updateData);
      console.log("Bad order processing completed successfully");
      await fetchOrders();
      return true;
    } catch (error) {
      console.error("Error processing bad order:", error);
      throw error;
    }
  };

  const updateProductQuantities = async (items) => {
    const batch = writeBatch(db);
    for (const item of items) {
      if (item.badPieces > 0 && item.selectedProductId) {
        try {
          const productRef = doc(db, "products", item.selectedProductId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const currentStock = productSnap.data().stock || 0;
            const newStock = currentStock - item.badPieces;
            batch.update(productRef, {
              stock: Math.max(0, newStock),
              lastUpdated: new Date(),
            });
          }
        } catch (error) {
          console.error(
            `Error updating product ${item.selectedProductId}:`,
            error,
          );
          throw error;
        }
      }
    }
    await batch.commit();
  };

  const handleRestoreStock = async (order) => {
    try {
      const batch = writeBatch(db);
      order.items.forEach((item) => {
        const productRef = doc(db, "products", item.id);
        batch.update(productRef, {
          stock: increment(item.quantity),
          sold: increment(-item.quantity),
        });
      });
      await batch.commit();
      return true;
    } catch (err) {
      console.error("Error restoring stock:", err);
      throw err;
    }
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
