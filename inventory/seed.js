import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { firebaseConfig } from "./src/Firebase/firebase.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Product data with both single and bulk versions
const productTemplates = [
  // LARGE Category - 100 pieces bulk packages
  {
    single: {
      name: "Fish Cracker",
      basePrice: 6.8,
      category: "LARGE",
      unit: "piece",
    },
    bulk: {
      pieces: 100,
      bulkPrice: 680, // 6.8 * 100
      unit: "pack",
    },
  },
  {
    single: {
      name: "Crackling Salt & Vinegar",
      basePrice: 6.8,
      category: "LARGE",
      unit: "piece",
    },
    bulk: {
      pieces: 100,
      bulkPrice: 680,
      unit: "pack",
    },
  },
  {
    single: {
      name: "Crispy Patata",
      basePrice: 6.8,
      category: "LARGE",
      unit: "piece",
    },
    bulk: {
      pieces: 100,
      bulkPrice: 680,
      unit: "pack",
    },
  },
  {
    single: {
      name: "Crispy Patata Cheese",
      basePrice: 6.8,
      category: "LARGE",
      unit: "piece",
    },
    bulk: {
      pieces: 100,
      bulkPrice: 680,
      unit: "pack",
    },
  },
  {
    single: {
      name: "Oishi Fisda Fish Kropeck",
      basePrice: 6.8,
      category: "LARGE",
      unit: "piece",
    },
    bulk: {
      pieces: 100,
      bulkPrice: 680,
      unit: "pack",
    },
  },

  // EXTRA SIZE (UA) Category - 30 pieces bulk packages
  {
    single: {
      name: "Fish Cracker",
      basePrice: 25,
      category: "EXTRA SIZE (UA)",
      unit: "piece",
    },
    bulk: {
      pieces: 30,
      bulkPrice: 750, // 25 * 30
      unit: "pack",
    },
  },
  {
    single: {
      name: "Crackling Salt & Vinegar",
      basePrice: 25,
      category: "EXTRA SIZE (UA)",
      unit: "piece",
    },
    bulk: {
      pieces: 30,
      bulkPrice: 750,
      unit: "pack",
    },
  },
  {
    single: {
      name: "Crispy Patata",
      basePrice: 25,
      category: "EXTRA SIZE (UA)",
      unit: "piece",
    },
    bulk: {
      pieces: 30,
      bulkPrice: 750,
      unit: "pack",
    },
  },

  // FAMILY Category - 50 pieces bulk packages
  {
    single: {
      name: "Oishi Prawn Cracker Spicy",
      basePrice: 16.6,
      category: "FAMILY",
      unit: "piece",
    },
    bulk: {
      pieces: 50,
      bulkPrice: 830, // 16.6 * 50
      unit: "pack",
    },
  },
  {
    single: {
      name: "Oishi Prawn Cracker Sweet",
      basePrice: 16.6,
      category: "FAMILY",
      unit: "piece",
    },
    bulk: {
      pieces: 50,
      bulkPrice: 830,
      unit: "pack",
    },
  },

  // BEERMATCH Category - 50 pieces bulk packages
  {
    single: {
      name: "Potato Fries Cheese",
      basePrice: 15.1,
      category: "BEERMATCH",
      unit: "piece",
    },
    bulk: {
      pieces: 50,
      bulkPrice: 755, // 15.1 * 50
      unit: "pack",
    },
  },
  {
    single: {
      name: "Potato Fries Plain Salted",
      basePrice: 15.1,
      category: "BEERMATCH",
      unit: "piece",
    },
    bulk: {
      pieces: 50,
      bulkPrice: 755,
      unit: "pack",
    },
  },

  // BREADPAN Category
  {
    single: {
      name: "Breadpan Cheese & Onion",
      basePrice: 6.8,
      category: "BREADPAN",
      unit: "piece",
    },
    bulk: {
      pieces: 100,
      bulkPrice: 680,
      unit: "pack",
    },
  },
  {
    single: {
      name: "Breadpan Garlic Toast",
      basePrice: 6.8,
      category: "BREADPAN",
      unit: "piece",
    },
    bulk: {
      pieces: 100,
      bulkPrice: 680,
      unit: "pack",
    },
  },

  // DKFPI Category - 15 pieces bulk packages
  {
    single: {
      name: "Alibaba",
      basePrice: 19,
      category: "DKFPI",
      unit: "piece",
    },
    bulk: {
      pieces: 15,
      bulkPrice: 285, // 19 * 15
      unit: "pack",
    },
  },
  {
    single: {
      name: "Cheezeball",
      basePrice: 19,
      category: "DKFPI",
      unit: "piece",
    },
    bulk: {
      pieces: 15,
      bulkPrice: 285,
      unit: "pack",
    },
  },

  // NUTRI 25x100 Category - 25 pieces bulk packages
  {
    single: {
      name: "Peewe BBQ",
      basePrice: 8.1,
      category: "NUTRI 25x100",
      unit: "piece",
    },
    bulk: {
      pieces: 25,
      bulkPrice: 202.5, // 8.1 * 25
      unit: "pack",
    },
  },
  {
    single: {
      name: "Peewe Salt & Vinegar",
      basePrice: 8.1,
      category: "NUTRI 25x100",
      unit: "piece",
    },
    bulk: {
      pieces: 25,
      bulkPrice: 202.5,
      unit: "pack",
    },
  },
  {
    single: {
      name: "Peewe Cheese",
      basePrice: 8.1,
      category: "NUTRI 25x100",
      unit: "piece",
    },
    bulk: {
      pieces: 25,
      bulkPrice: 202.5,
      unit: "pack",
    },
  },

  // LOADED 32x100 Category - 32 pieces bulk packages
  {
    single: {
      name: "Loaded Chips",
      basePrice: 28.75,
      category: "LOADED 32x100",
      unit: "piece",
    },
    bulk: {
      pieces: 32,
      bulkPrice: 920, // 28.75 * 32
      unit: "pack",
    },
  },

  // PILLOWS Category
  {
    single: {
      name: "Choco Pillows",
      basePrice: 6.7,
      category: "PILLOWS",
      unit: "piece",
    },
    bulk: {
      pieces: 100,
      bulkPrice: 670,
      unit: "pack",
    },
  },
  {
    single: {
      name: "Ube Pillows",
      basePrice: 6.7,
      category: "PILLOWS",
      unit: "piece",
    },
    bulk: {
      pieces: 100,
      bulkPrice: 670,
      unit: "pack",
    },
  },

  // MARSHMALLOW Category
  {
    single: {
      name: "O'Puff Marshmallow Ube",
      basePrice: 29,
      category: "MARSHMALLOW",
      unit: "piece",
    },
    bulk: {
      pieces: 30,
      bulkPrice: 870,
      unit: "pack",
    },
  },
  {
    single: {
      name: "O'Puff Marshmallow Chocolate",
      basePrice: 29,
      category: "MARSHMALLOW",
      unit: "piece",
    },
    bulk: {
      pieces: 30,
      bulkPrice: 870,
      unit: "pack",
    },
  },

  // FROOZE Category
  {
    single: {
      name: "Frooze Pineapple",
      basePrice: 20.83,
      category: "FROOZE",
      unit: "bottle",
    },
    bulk: {
      pieces: 24,
      bulkPrice: 500,
      unit: "case",
    },
  },
  {
    single: {
      name: "Frooze Orange",
      basePrice: 20.83,
      category: "FROOZE",
      unit: "bottle",
    },
    bulk: {
      pieces: 24,
      bulkPrice: 500,
      unit: "case",
    },
  },

  // LONBISCO Category
  {
    single: {
      name: "Lonbisco Crackers",
      basePrice: 9,
      category: "LONBISCO",
      unit: "piece",
    },
    bulk: {
      pieces: 50,
      bulkPrice: 450,
      unit: "pack",
    },
  },
];

// Generate product data with proper structure
function generateProducts() {
  const allProducts = [];
  const singleProducts = [];
  const bulkProducts = [];

  productTemplates.forEach((template) => {
    const { single, bulk } = template;

    // Create single product
    const singleProduct = {
      name: `${single.name} [by pcs]`,
      price: single.basePrice,
      costPrice: parseFloat((single.basePrice * 0.7).toFixed(2)),
      stock: 100,
      category: single.category,
      barcode: "",
      imageUrl: "",
      sold: 0,
      lowStockThreshold: null,
      packagingType: "single",
      piecesPerPackage: 1,
      parentProductId: null,
      isBulkPackage: false,
      unit: single.unit,
      createdAt: {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      },
      updatedAt: {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      },
    };

    singleProducts.push(singleProduct);
    allProducts.push(singleProduct);

    // Create bulk product (will be linked after creation)
    const bulkProduct = {
      name: `${single.name} ${bulk.pieces}/${
        bulk.pieces * (single.category.includes("NUTRI") ? 4 : 1)
      }g`,
      price: bulk.bulkPrice,
      costPrice: parseFloat((bulk.bulkPrice * 0.7).toFixed(2)),
      stock: 50,
      category: single.category,
      barcode: "",
      imageUrl: "",
      sold: 0,
      lowStockThreshold: null,
      packagingType: "bulk",
      piecesPerPackage: bulk.pieces,
      parentProductId: null, // Will be updated after single product is created
      isBulkPackage: true,
      unit: bulk.unit,
      createdAt: {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      },
      updatedAt: {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      },
      // Store reference for linking
      correspondingSingleName: singleProduct.name,
    };

    bulkProducts.push(bulkProduct);
    allProducts.push(bulkProduct);
  });

  return { allProducts, singleProducts, bulkProducts };
}

async function seedProductsWithRelationships() {
  let successCount = 0;
  let errorCount = 0;
  const productIds = new Map();

  // Add delay function to avoid rate limiting
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  console.log("🟡 Generating products with relationships...");
  const { allProducts, singleProducts, bulkProducts } = generateProducts();

  console.log(
    `📊 Generated ${singleProducts.length} single products and ${bulkProducts.length} bulk packages`
  );

  // First pass: Create all products and store their IDs
  console.log("🟡 Creating products in Firestore...");

  for (let i = 0; i < allProducts.length; i++) {
    const product = allProducts[i];
    try {
      const docRef = await addDoc(collection(db, "products"), product);
      productIds.set(product.name, docRef.id);
      console.log(`✅ Added ${product.name} (ID: ${docRef.id})`);
      successCount++;

      // Add a small delay every 10 products to avoid rate limiting
      if (i % 10 === 0 && i > 0) {
        console.log("⏳ Taking a brief pause...");
        await delay(500);
      }
    } catch (error) {
      console.error(`❌ Error adding ${product.name}:`, error);
      errorCount++;
      await delay(1000);
    }
  }

  // Second pass: Link bulk packages to their single products
  console.log("🟡 Linking bulk packages to single products...");
  let linkCount = 0;

  for (const bulkProduct of bulkProducts) {
    const singleProductId = productIds.get(bulkProduct.correspondingSingleName);

    if (singleProductId) {
      try {
        const bulkProductId = productIds.get(bulkProduct.name);
        await updateDoc(doc(db, "products", bulkProductId), {
          parentProductId: singleProductId,
        });
        console.log(
          `🔗 Linked ${bulkProduct.name} to ${bulkProduct.correspondingSingleName}`
        );
        linkCount++;
        await delay(200); // Small delay between updates
      } catch (error) {
        console.error(`❌ Error linking ${bulkProduct.name}:`, error);
      }
    } else {
      console.log(
        `⚠️ Could not find single product for: ${bulkProduct.correspondingSingleName}`
      );
    }
  }

  console.log(`🎉 Seeding complete!`);
  console.log(`✅ Successfully created: ${successCount} products`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`🔗 Successfully linked: ${linkCount} bulk packages`);
  console.log(`📦 Final breakdown:`);
  console.log(`   Single items: ${singleProducts.length}`);
  console.log(`   Bulk packages: ${bulkProducts.length}`);
  console.log(`   Total products: ${allProducts.length}`);
}

// Run the enhanced seeder
seedProductsWithRelationships().catch(console.error);
