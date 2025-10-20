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
  addDoc,
  getDoc,
  arrayUnion,
  where,
} from "firebase/firestore";
import { db } from "../../../Firebase/firebase";

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // BULLETPROOF due date converter
  const convertFirestoreDueDate = (dueDate) => {
    if (!dueDate) return null;

    console.log("🔄 convertFirestoreDueDate INPUT:", dueDate);
    console.log("📊 INPUT TYPE:", typeof dueDate);

    try {
      // Method 1: Firestore Timestamp with toDate()
      if (dueDate.toDate && typeof dueDate.toDate === "function") {
        const result = dueDate.toDate();
        console.log("✅ Method 1 - toDate():", result);
        return result;
      }

      // Method 2: Firestore Timestamp with seconds
      if (dueDate.seconds && typeof dueDate.seconds === "number") {
        const result = new Date(dueDate.seconds * 1000);
        console.log("✅ Method 2 - seconds:", result);
        return result;
      }

      // Method 3: ISO string or date string
      if (typeof dueDate === "string") {
        const result = new Date(dueDate);
        if (!isNaN(result.getTime())) {
          console.log("✅ Method 3 - string:", result);
          return result;
        }
      }

      // Method 4: Already a Date object
      if (dueDate instanceof Date) {
        console.log("✅ Method 4 - already Date:", dueDate);
        return dueDate;
      }

      // Method 5: Check for _seconds (alternative Firestore format)
      if (dueDate._seconds && typeof dueDate._seconds === "number") {
        const result = new Date(dueDate._seconds * 1000);
        console.log("✅ Method 5 - _seconds:", result);
        return result;
      }

      console.warn("❌ No conversion method worked for dueDate:", dueDate);
      return null;
    } catch (error) {
      console.error("💥 Error converting dueDate:", error);
      return null;
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const ordersData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const orderData = doc.data();

          console.log(`\n=== PROCESSING ORDER ${doc.id} ===`);
          console.log("📦 Raw order data:", orderData);

          // BULLETPROOF due date conversion
          let dueDate = null;
          if (orderData.dueDate) {
            console.log("🎯 DUE DATE FOUND - Converting...");
            dueDate = convertFirestoreDueDate(orderData.dueDate);
          } else {
            console.log("📭 No dueDate for this order");
          }

          // Build the order object
          const order = {
            id: doc.id,
            ...orderData,
            createdAt: orderData.createdAt?.toDate
              ? orderData.createdAt.toDate()
              : new Date(orderData.createdAt),
            dueDate: dueDate, // Use the properly converted due date
            paymentMethod: orderData.paymentMethod || "cash",
            paymentStatus: orderData.paymentStatus || "paid",
            paidAmount: orderData.paidAmount || 0,
            remainingBalance:
              orderData.remainingBalance || orderData.totalAmount || 0,
            paymentHistory: orderData.paymentHistory || [],
          };

          // CRITICAL: Log the final result
          console.log(`🎉 FINAL ORDER ${order.id}:`, {
            dueDate: order.dueDate,
            formattedDueDate: order.dueDate
              ? order.dueDate.toLocaleDateString()
              : "NO DATE",
            paymentMethod: order.paymentMethod,
            customerName: order.customerName,
          });

          // Bad orders processing (keep your existing code)
          const badOrdersFromField = orderData.badOrders || [];
          const badOrdersRootQuery = query(
            collection(db, "badOrders"),
            where("orderId", "==", doc.id)
          );
          const badOrdersRootSnapshot = await getDocs(badOrdersRootQuery);
          const badOrdersFromRoot = badOrdersRootSnapshot.docs.map((bDoc) => ({
            id: bDoc.id,
            ...bDoc.data(),
          }));

          const allBadOrdersMap = new Map();
          for (const bo of badOrdersFromRoot) {
            const key = bo.id || bDoc.id;
            allBadOrdersMap.set(key, bo);
          }
          for (const bo of badOrdersFromField) {
            const key = bo.id || `${bo.orderId}-${bo.processedAt?.seconds}`;
            allBadOrdersMap.set(key, bo);
          }

          order.badOrders = Array.from(allBadOrdersMap.values());
          order.hasBadOrder = order.badOrders.length > 0;

          return order;
        })
      );

      // Final summary
      console.log("\n📋 FINAL ORDERS SUMMARY:");
      const creditOrders = ordersData.filter(
        (order) => order.paymentMethod === "credit"
      );
      creditOrders.forEach((order) => {
        console.log(`💰 CREDIT ORDER ${order.id}:`, {
          dueDate: order.dueDate,
          displayDate: order.dueDate
            ? order.dueDate.toLocaleDateString()
            : "NO DATE",
          customer: order.customerName,
          amount: order.totalAmount,
        });
      });

      console.log(
        `\n📊 STATS: ${creditOrders.length} credit orders out of ${ordersData.length} total orders`
      );

      setOrders(ordersData);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Rest of your functions remain the same...
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
        badOrderRecord
      );
      console.log("Bad order saved with ID:", badOrderRef.id);
      await updateProductQuantities(badOrderDetails.items || []);
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
            error
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
