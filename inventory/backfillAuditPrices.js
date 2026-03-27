import admin from "firebase-admin";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load service account key
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"), "utf-8")
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function backfillAuditPrices() {
  try {
    console.log("🔵 Starting backfill of audit log prices...\n");

    // Get all audit logs
    const auditLogsSnapshot = await db.collection("productAuditLogs").get();

    console.log(
      `📊 Found ${auditLogsSnapshot.docs.length} audit logs to process\n`
    );

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const auditDoc of auditLogsSnapshot.docs) {
      const auditLog = auditDoc.data();

      // Skip only if already has both price and totalPrice
      if (auditLog.price !== undefined && auditLog.price !== null &&
          auditLog.totalPrice !== undefined && auditLog.totalPrice !== null) {
        skipped++;
        continue;
      }

      try {
        // Get the product to fetch its cost price
        const productSnapshot = await db
          .collection("products")
          .doc(auditLog.productId)
          .get();

        if (productSnapshot.exists) {
          const product = productSnapshot.data();
          const costPrice = product.costPrice !== null && product.costPrice !== undefined ? product.costPrice : null;
          
          // Calculate total price (quantity difference × cost price)
          const quantityDifference = auditLog.changes?.difference || 0;
          const totalPrice = costPrice != null && quantityDifference ? costPrice * quantityDifference : null;

          // Update the audit log with both price and totalPrice
          await auditDoc.ref.update({
            price: costPrice,
            totalPrice: totalPrice,
          });

          updated++;
          console.log(
            `✅ Updated: ${auditLog.productName} - Cost: ₱${costPrice || "N/A"} | Total: ₱${totalPrice || "N/A"}`
          );
        } else {
          failed++;
          console.warn(
            `⚠️ Product not found for audit log: ${auditLog.productId}`
          );
        }
      } catch (error) {
        failed++;
        console.error(
          `❌ Failed to update audit log ${auditDoc.id}:`,
          error.message
        );
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Backfill completed!");
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️ Skipped (already has price): ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log("=".repeat(50));

    process.exit(0);
  } catch (error) {
    console.error("❌ Backfill failed:", error);
    process.exit(1);
  }
}

// Run the backfill
backfillAuditPrices();
