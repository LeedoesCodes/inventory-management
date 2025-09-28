import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../Firebase/firebase";

export const useFirestoreContext = (user) => {
  const [firestoreContext, setFirestoreContext] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchFirestoreContext = async () => {
      try {
        setLoading(true);

        const [productsSnapshot, ordersSnapshot, customersSnapshot] =
          await Promise.all([
            getDocs(collection(db, "products")),
            getDocs(
              query(
                collection(db, "orders"),
                orderBy("createdAt", "desc"),
                limit(50)
              )
            ),
            getDocs(collection(db, "customers")),
          ]);

        const products = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const orders = ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const customers = customersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Calculate business metrics
        const lowStockProducts = products.filter((p) => (p.stock || 0) < 10);
        const totalRevenue = orders.reduce(
          (sum, order) => sum + (order.totalAmount || 0),
          0
        );
        const popularProducts = [...products]
          .sort((a, b) => (b.sales || 0) - (a.sales || 0))
          .slice(0, 5);

        const context = {
          // Raw data
          products: products,
          orders: orders,
          customers: customers,

          // Summary metrics
          totalProducts: products.length,
          totalOrders: orders.length,
          totalCustomers: customers.length,
          totalRevenue: totalRevenue,
          lowStockCount: lowStockProducts.length,

          // Business insights
          lowStockProducts: lowStockProducts,
          popularProducts: popularProducts,

          timestamp: new Date(),
        };

        console.log("📊 Firestore context loaded with:", {
          products: products.length,
          orders: orders.length,
          lowStock: lowStockProducts.length,
          revenue: totalRevenue,
        });

        setFirestoreContext(context);
      } catch (error) {
        console.error("Error fetching Firestore context:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFirestoreContext();
  }, [user]);

  return { firestoreContext, loading };
};
