import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../Firebase/firebase";

/**
 * Log a product change to the audit trail
 * @param {Object} changeData - The change data to log
 * @param {string} changeData.productId - Product ID
 * @param {string} changeData.productName - Product name
 * @param {string} changeData.action - Action type (stock_add, stock_edit, price_change, etc.)
 * @param {Object} changeData.changes - Before/after values
 * @param {number} changeData.changes.before - Previous value
 * @param {number} changeData.changes.after - New value
 * @param {string} changeData.userId - User ID
 * @param {string} changeData.userName - User display name
 * @param {string} [changeData.notes] - Optional notes/reason
 * @returns {Promise<string>} Document ID of the audit log
 */
export async function logProductChange(changeData) {
  try {
    const {
      productId,
      productName,
      action,
      changes,
      userId,
      userName,
      notes = "",
    } = changeData;

    const difference = changes.after - changes.before;

    const auditLog = {
      productId,
      productName,
      action,
      changes: {
        before: changes.before,
        after: changes.after,
        difference,
      },
      userId,
      userName,
      timestamp: Timestamp.fromDate(new Date()),
      notes,
      status: "completed",
    };

    console.log("🟡 [AUDIT] Creating audit log:", auditLog);
    const docRef = await addDoc(collection(db, "productAuditLogs"), auditLog);
    console.log("✅ [AUDIT] Audit log created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ [AUDIT] Error logging product change:", error);
    throw error;
  }
}

/**
 * Get all audit logs for a specific product on a specific date
 * @param {string} productId - Product ID
 * @param {Date} date - The date to query
 * @returns {Promise<Array>} Array of audit logs
 */
export async function getProductChangesForDate(productId, date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(
      "🟡 [AUDIT] Fetching changes for",
      productId,
      "on",
      date.toLocaleDateString(),
    );
    console.log("🟡 [AUDIT] Date range:", startOfDay, "to", endOfDay);

    // Query only by productId to avoid composite index requirement
    const q = query(
      collection(db, "productAuditLogs"),
      where("productId", "==", productId),
    );

    const snapshot = await getDocs(q);

    // Filter by date in JavaScript
    const results = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.(),
      }))
      .filter((log) => {
        const logDate = log.timestamp;
        return logDate >= startOfDay && logDate <= endOfDay;
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    console.log(
      "🟡 [AUDIT] Found",
      results.length,
      "changes for",
      date.toLocaleDateString(),
    );
    console.log("✅ [AUDIT] Changes for date:", results);
    return results;
  } catch (error) {
    console.error("❌ [AUDIT] Error fetching product changes for date:", error);
    return [];
  }
}

/**
 * Get all audit logs for a specific product within a date range
 * @param {string} productId - Product ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of audit logs
 */
export async function getProductChangesForDateRange(
  productId,
  startDate,
  endDate,
) {
  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    console.log(
      "🟡 [AUDIT] Fetching range for",
      productId,
      "from",
      startDate,
      "to",
      endDate,
    );

    // Query only by productId to avoid composite index requirement
    const q = query(
      collection(db, "productAuditLogs"),
      where("productId", "==", productId),
    );

    const snapshot = await getDocs(q);

    // Filter by date range in JavaScript
    const results = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.(),
      }))
      .filter((log) => {
        const logDate = log.timestamp;
        return logDate >= start && logDate <= end;
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    console.log("✅ [AUDIT] Found", results.length, "logs in date range");
    return results;
  } catch (error) {
    console.error(
      "❌ [AUDIT] Error fetching product changes for date range:",
      error,
    );
    return [];
  }
}

/**
 * Get all audit logs across all products for a specific date
 * @param {Date} date - The date to query
 * @returns {Promise<Array>} Array of audit logs
 */
export async function getAllProductChangesForDate(date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Query all logs without timestamp filter to avoid composite index
    const q = query(collection(db, "productAuditLogs"));

    const snapshot = await getDocs(q);

    // Filter by date in JavaScript
    const results = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.(),
      }))
      .filter((log) => {
        const logDate = log.timestamp;
        return logDate >= startOfDay && logDate <= endOfDay;
      })
      // Sort by timestamp descending
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return results;
  } catch (error) {
    console.error("❌ Error fetching all product changes for date:", error);
    return [];
  }
}

/**
 * Get audit logs for a specific product (recent history)
 * @param {string} productId - Product ID
 * @param {number} limit - Maximum number of logs to return (default: 50)
 * @returns {Promise<Array>} Array of audit logs
 */
export async function getProductAuditHistory(productId, limit = 50) {
  try {
    console.log("🟡 [AUDIT] Fetching audit history for product:", productId);
    // Query only by productId to avoid composite index requirement
    const q = query(
      collection(db, "productAuditLogs"),
      where("productId", "==", productId),
    );

    const snapshot = await getDocs(q);
    console.log(
      "🟡 [AUDIT] Found",
      snapshot.docs.length,
      "audit logs for product",
      productId,
    );

    const logs = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.(),
      }))
      // Sort by timestamp descending in JavaScript
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    console.log("✅ [AUDIT] Processed logs:", logs);
    return logs.slice(0, limit);
  } catch (error) {
    console.error("❌ [AUDIT] Error fetching product audit history:", error);
    return [];
  }
}

/**
 * Get audit logs by action type
 * @param {string} action - Action type (stock_add, stock_edit, price_change)
 * @param {Date} [startDate] - Optional start date
 * @param {Date} [endDate] - Optional end date
 * @returns {Promise<Array>} Array of audit logs
 */
export async function getAuditLogsByAction(action, startDate, endDate) {
  try {
    // Query only by action to avoid composite index requirement
    const q = query(
      collection(db, "productAuditLogs"),
      where("action", "==", action),
    );

    const snapshot = await getDocs(q);

    let results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.(),
    }));

    // Filter by date range in JavaScript if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      results = results.filter((log) => {
        const logDate = log.timestamp;
        return logDate >= start && logDate <= end;
      });
    }

    // Sort by timestamp descending
    results = results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return results;
  } catch (error) {
    console.error("❌ Error fetching audit logs by action:", error);
    return [];
  }
}

/**
 * Get summary of stock changes for a product on a specific date
 * @param {string} productId - Product ID
 * @param {Date} date - The date to query
 * @returns {Promise<Object>} Summary object
 */
export async function getProductStockSummaryForDate(productId, date) {
  try {
    const changes = await getProductChangesForDate(productId, date);

    const summary = {
      date: date.toLocaleDateString(),
      productId,
      totalChanges: changes.length,
      netChange: 0,
      changes: [],
      startStock: null,
      endStock: null,
    };

    if (changes.length > 0) {
      // Changes are in descending order, so reverse for chronological order
      const chronological = changes.reverse();

      summary.startStock = chronological[0].changes.before;
      summary.endStock = chronological[chronological.length - 1].changes.after;
      summary.netChange = summary.endStock - summary.startStock;
      summary.changes = chronological.map((log) => ({
        time: log.timestamp.toLocaleTimeString(),
        action: log.action,
        before: log.changes.before,
        after: log.changes.after,
        difference: log.changes.difference,
        user: log.userName,
        notes: log.notes,
      }));
    }

    return summary;
  } catch (error) {
    console.error("❌ Error getting product stock summary:", error);
    return null;
  }
}
