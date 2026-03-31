const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

function getProductName(product) {
  if (!product || typeof product !== "object") return "Unknown Product";
  return product.name || product.productName || "Unknown Product";
}

function getItemName(item) {
  if (!item || typeof item !== "object") return "Unknown Product";
  return item.name || item.productName || "Unknown Product";
}

const DASHBOARD_METRICS_DOC = "dashboardMetrics/global";
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

async function computeDashboardMetrics(db, globalLowStockThreshold) {
  const [productsSnapshot, ordersSnapshot] = await Promise.all([
    db.collection("products").get(),
    db.collection("orders").get(),
  ]);

  const products = productsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  const orders = ordersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const productNameSet = new Set(
    products.map((product) => getProductName(product)),
  );

  const bulkPiecesByParent = products.reduce((acc, product) => {
    if (
      product.packagingType === "bulk" &&
      product.parentProductId &&
      (product.stock || 0) > 0
    ) {
      const piecesPerPackage = product.piecesPerPackage || 1;
      acc[product.parentProductId] =
        (acc[product.parentProductId] || 0) +
        (product.stock || 0) * piecesPerPackage;
    }
    return acc;
  }, {});

  const lowStock = products.filter((product) => {
    const stock = product.stock || 0;
    const availableStock =
      product.packagingType === "single"
        ? stock + (bulkPiecesByParent[product.id] || 0)
        : stock;

    const threshold =
      product.lowStockThreshold !== null &&
      product.lowStockThreshold !== undefined
        ? product.lowStockThreshold
        : globalLowStockThreshold;

    return availableStock <= threshold;
  }).length;

  let totalRevenue = 0;
  const itemCounts = {};

  orders.forEach((order) => {
    if (order.status !== "cancelled" && order.paymentStatus === "paid") {
      totalRevenue += order.totalAmount || order.total || 0;
    }

    if (order.status !== "cancelled") {
      (order.items || []).forEach((item) => {
        const itemName = getItemName(item);
        if (!productNameSet.has(itemName)) return;

        itemCounts[itemName] =
          (itemCounts[itemName] || 0) + (item.quantity || 1);
      });
    }
  });

  const popularItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, sold]) => ({ name, sold }));

  return {
    totalProducts: products.length,
    totalOrders: orders.length,
    lowStock,
    popularItems,
    totalRevenue,
    productNames: Array.from(productNameSet),
    thresholdUsed: globalLowStockThreshold,
    computedAtMs: Date.now(),
  };
}

exports.getDashboardMetrics = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required");
  }

  try {
    const globalLowStockThreshold = Number(
      request.data?.lowStockThreshold ?? 5,
    );
    const db = admin.firestore();
    if (globalLowStockThreshold === DEFAULT_LOW_STOCK_THRESHOLD) {
      const cachedDoc = await db.doc(DASHBOARD_METRICS_DOC).get();
      if (cachedDoc.exists) {
        return cachedDoc.data();
      }
    }

    const metrics = await computeDashboardMetrics(db, globalLowStockThreshold);

    if (globalLowStockThreshold === DEFAULT_LOW_STOCK_THRESHOLD) {
      await db.doc(DASHBOARD_METRICS_DOC).set(
        {
          ...metrics,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    return metrics;
  } catch (error) {
    console.error("getDashboardMetrics failed", error);
    throw new HttpsError("internal", "Failed to load dashboard metrics");
  }
});
