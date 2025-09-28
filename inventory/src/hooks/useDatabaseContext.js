// hooks/useFirestoreContext.js
import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../Firebase/firebase";

export const useFirestoreContext = (user) => {
  const [firestoreContext, setFirestoreContext] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchFirestoreContext = async () => {
      try {
        setLoading(true);

        // Fetch data from all collections concurrently
        const [
          chatsSnapshot,
          customersSnapshot,
          generateSnapshot,
          ordersSnapshot,
          productsSnapshot,
          userSettingsSnapshot,
          usersSnapshot,
        ] = await Promise.all([
          getDocs(
            query(
              collection(db, "chats"),
              orderBy("timestamp", "desc"),
              limit(5)
            )
          ),
          getDocs(query(collection(db, "customers"), limit(10))),
          getDocs(query(collection(db, "generate"), limit(5))),
          getDocs(
            query(
              collection(db, "orders"),
              orderBy("createdAt", "desc"),
              limit(10)
            )
          ),
          getDocs(collection(db, "products")),
          getDocs(
            query(
              collection(db, "userSettings"),
              where("userId", "==", user.uid)
            )
          ),
          getDocs(query(collection(db, "users"), where("uid", "==", user.uid))),
        ]);

        // Process products data
        const allProducts = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const lowStockProducts = allProducts.filter(
          (p) => p.stock < (p.minStock || 10)
        );
        const outOfStockProducts = allProducts.filter((p) => p.stock <= 0);
        const popularProducts = allProducts
          .sort((a, b) => (b.sales || 0) - (a.sales || 0))
          .slice(0, 5);

        // Process orders data
        const recentOrders = ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const totalRevenue = recentOrders.reduce(
          (sum, order) => sum + (order.totalAmount || 0),
          0
        );

        // Process customers data
        const customers = customersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Process user settings
        const userSettings =
          userSettingsSnapshot.docs.map((doc) => doc.data())[0] || {};

        const context = {
          // Collection stats
          collections: {
            chats: chatsSnapshot.size,
            customers: customersSnapshot.size,
            generate: generateSnapshot.size,
            orders: ordersSnapshot.size,
            products: productsSnapshot.size,
            userSettings: userSettingsSnapshot.size,
            users: usersSnapshot.size,
          },

          // Products data
          products: {
            total: allProducts.length,
            lowStock: lowStockProducts.length,
            outOfStock: outOfStockProducts.length,
            categories: [...new Set(allProducts.map((p) => p.category))].filter(
              Boolean
            ),
            lowStockProducts: lowStockProducts.slice(0, 5),
            popularProducts: popularProducts,
            sampleProducts: allProducts.slice(0, 3),
          },

          // Orders data
          orders: {
            total: ordersSnapshot.size,
            recent: recentOrders.length,
            totalRevenue: totalRevenue,
            averageOrderValue: recentOrders.length
              ? totalRevenue / recentOrders.length
              : 0,
            recentOrders: recentOrders.slice(0, 3),
          },

          // Customers data
          customers: {
            total: customersSnapshot.size,
            sample: customers.slice(0, 3),
          },

          // User context
          user: {
            settings: userSettings,
            hasSettings: userSettingsSnapshot.size > 0,
          },

          // System status
          timestamp: new Date(),
          lastUpdated: new Date(),
        };

        setFirestoreContext(context);
      } catch (error) {
        console.error("Error fetching Firestore context:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFirestoreContext();

    // Optional: Set up real-time updates for critical data
    const interval = setInterval(fetchFirestoreContext, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  return { firestoreContext, loading };
};
