// 1. Import the Firebase Admin SDK
const admin = require("firebase-admin");

// 2. CONFIGURATION: UPDATE THESE THREE LINES --------------------

// Path to your downloaded service account key (must be in the project root)
const SERVICE_ACCOUNT_PATH = "./serviceAccountKey.json";

// Replace with your current App ID and User ID
const APP_ID = "your-app-id-here";
const USER_ID = "your-user-id-here";

// -------------------------------------------------------------

// Collection path for private user data (standard canvas security rules)
// Adjust if you are using a different collection structure
const PRODUCTS_COLLECTION_PATH = `artifacts/${APP_ID}/users/${USER_ID}/products`;

// Initialize Firebase Admin
try {
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (e) {
  console.error(
    `\n❌ ERROR: Could not load service account key from ${SERVICE_ACCOUNT_PATH}.`
  );
  console.error(
    "Please ensure you have downloaded your Firebase Service Account JSON and updated the SERVICE_ACCOUNT_PATH variable."
  );
  process.exit(1);
}

const db = admin.firestore();

// Helper function to generate a large random integer (e.g., 5,000 to 20,000)
const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Iterates through all documents in the products collection and updates the
 * 'sales' field with a large random number using a batch write.
 */
async function populateSales() {
  console.log(
    `\n🚀 Starting sales data population for collection: ${PRODUCTS_COLLECTION_PATH}`
  );

  try {
    const productsRef = db.collection(PRODUCTS_COLLECTION_PATH);
    const snapshot = await productsRef.get();

    if (snapshot.empty) {
      console.log("⚠️ No products found in the collection. Aborting.");
      return;
    }

    const batch = db.batch();
    let updateCount = 0;

    // Iterate and set the update operation for each document
    snapshot.forEach((productDoc) => {
      // 💡 ADJUST THESE NUMBERS to change the sales range (min, max) 💡
      // Current range: 5,000 to 20,000
      const randomSales = getRandomInt(5000, 20000);

      const productRef = productsRef.doc(productDoc.id);
      batch.update(productRef, {
        sales: randomSales,
      });
      updateCount++;

      console.log(
        `-> Preparing update for: ${
          productDoc.data().name || productDoc.id
        } | New Sales: ${randomSales}`
      );
    });

    // Commit the batch update
    await batch.commit();

    console.log(
      `\n✅ Done! Successfully updated ${updateCount} products in a single batch operation.`
    );
  } catch (error) {
    console.error("❌ Fatal error during population:", error);
  }
}

populateSales();
