const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project.firebaseio.com",
});

const db = admin.firestore();

async function backfillAuditPrices() {
  try {
    console.log("🔵 Starting backfill of audit log prices...\n");

    // Get all audit logs
    const auditLogsSnapshot = await db
      .collection("productAuditLogs")
      .get();

    console.log(
      `📊 Found ${auditLogsSnapshot.docs.length} audit logs to process\n`
    );

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const auditDoc of auditLogsSnapshot.docs) {
      const auditLog = auditDoc.data();

      // Skip if already has price
      if (auditLog.price !== undefined && auditLog.price !== null) {
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
          const costPrice = product.costPrice || null;

          // Update the audit log with the price
          await auditDoc.ref.update({
            price: costPrice,
          });

          updated++;
          console.log(
            `✅ Updated: ${auditLog.productName} - Price: ₱${costPrice || "N/A"}`
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
