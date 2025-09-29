import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where, // Added 'where'
  limit,
} from "firebase/firestore";
import { db } from "../../Firebase/firebase";

// Define the sales window for "popular products"
const POPULARITY_WINDOW_DAYS = 90; // Using 90 days for better stability

export const useFirestoreContext = (user) => {
  const [firestoreContext, setFirestoreContext] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchFirestoreContext = async () => {
      try {
        setLoading(true);

        // 1. Calculate the cutoff date (90 days ago)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - POPULARITY_WINDOW_DAYS);

        const [productsSnapshot, ordersSnapshot, customersSnapshot] =
          await Promise.all([
            getDocs(collection(db, "products")),
            getDocs(
              query(
                collection(db, "orders"),
                // Filter orders created within the last 90 days
                where("createdAt", ">=", cutoffDate),
                orderBy("createdAt", "desc")
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
          // Convert Firebase Timestamp to Date for easier handling if needed elsewhere
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          ...doc.data(),
        }));

        const customers = customersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 2. Aggregate Sales Data from Orders (The core fix)
        let totalRevenue = 0;
        let totalUnitsSold = 0;
        const itemCounts = {}; // { productName: totalUnitsSold }

        orders.forEach((order) => {
          // Calculate total revenue from orders in the last 90 days
          totalRevenue += order.totalAmount || 0;

          // Assuming order items are stored in an array field called 'items'
          const orderItems = order.items || [];

          orderItems.forEach((item) => {
            const name = item.productName || item.name;

            // Use the correct quantity field (try 'quantity' then 'qty')
            const quantity = item.quantity || item.qty || 0;

            if (name && quantity > 0) {
              const numQuantity = Number(quantity);

              // Tally the total units sold for this product
              itemCounts[name] = (itemCounts[name] || 0) + numQuantity;
              // Tally the overall total units sold
              totalUnitsSold += numQuantity;
            }
          });
        });

        // 3. Find Top-Selling Items (Ensuring correct output structure)
        const popularProducts = Object.entries(itemCounts)
          .sort((a, b) => b[1] - a[1]) // Sort by quantity sold (descending)
          .slice(0, 5) // Take top 5
          // Map the [name, sold] array back into a clear object
          .map(([name, sold]) => ({
            name,
            sold: sold, // CRITICAL: Use the aggregated 'sold' count
          }));

        // 4. Calculate Inventory Metrics
        const lowStockProducts = products.filter((p) => (p.stock || 0) < 10);

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
          totalUnitsSold: totalUnitsSold,
          lowStockCount: lowStockProducts.length,

          // Business insights
          lowStockProducts: lowStockProducts,
          // This list now correctly uses the 90-day aggregate data
          popularProducts: popularProducts,

          timestamp: new Date(),
          salesWindow: POPULARITY_WINDOW_DAYS, // Helpful for debugging
        };

        console.log("📊 Firestore context loaded with:", {
          products: products.length,
          orders: orders.length,
          unitsSold: totalUnitsSold,
          topSeller: popularProducts[0]?.name,
        });

        setFirestoreContext(context);
      } catch (error) {
        console.error("❌ Error fetching Firestore context:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFirestoreContext();
  }, [user]);

  return { firestoreContext, loading };
};
