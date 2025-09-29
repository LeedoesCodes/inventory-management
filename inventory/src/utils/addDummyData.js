import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../Firebase/firebase";

// Fetch real products and prices from Firestore
const fetchRealProducts = async () => {
  try {
    const productsSnapshot = await getDocs(collection(db, "products"));
    const products = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("📦 Fetched real products from Firestore:", products.length);

    // Log some sample products to verify prices
    products.slice(0, 5).forEach((product) => {
      console.log(`   - ${product.name}: ₱${product.price}`);
    });

    return products;
  } catch (error) {
    console.error("❌ Error fetching products from Firestore:", error);
    // Fallback to sample products if Firestore fails
    return getFallbackProducts();
  }
};

// Fallback products in case Firestore is unavailable
const getFallbackProducts = () => {
  console.log(
    "⚠️ Using fallback products - prices may not match your actual prices"
  );
  return [
    { name: "Fish Cracker 100/24g", price: 680.0 },
    { name: "Fish Cracker [by pcs]", price: 6.8 },
    { name: "Crackling Salt & Vinegar 100/24g", price: 680.0 },
    { name: "Crackling Salt & Vinegar [by pcs]", price: 6.8 },
    { name: "Crispy Patata 100/24g", price: 680.0 },
    { name: "Crispy Patata [by pcs]", price: 6.8 },
    { name: "Crispy Patata Cheese 100/24g", price: 680.0 },
    { name: "Crispy Patata Cheese [by pcs]", price: 6.8 },
    { name: "Oishi Fisda Fish Kropeck 100/22g", price: 680.0 },
    { name: "Oishi Fisda Fish Kropeck [by pcs]", price: 6.8 },
    { name: "Cheez on Chips 100/22g", price: 680.0 },
    { name: "Cheez on Chips [by pcs]", price: 6.8 },
    { name: "Rinbee Cheese Stick 100/24g", price: 680.0 },
    { name: "Rinbee Cheese Stick [by pcs]", price: 6.8 },
    { name: "Onion Ring 100/16g", price: 680.0 },
    { name: "Onion Ring [by pcs]", price: 6.8 },
    { name: "Boogyman Crunch 100/24g", price: 680.0 },
    { name: "Boogyman Crunch [by pcs]", price: 6.8 },
    { name: "Kirei Yummy Flakes 100/24g", price: 680.0 },
    { name: "Kirei Yummy Flakes [by pcs]", price: 6.8 },
    { name: "Kirei Yummy Flakes Spicy Shrimp 100/20g", price: 680.0 },
    { name: "Kirei Yummy Flakes Spicy Shrimp [by pcs]", price: 6.8 },
    { name: "Spicy Seafood Curls 100/24g", price: 680.0 },
    { name: "Spicy Seafood Curls [by pcs]", price: 6.8 },
    { name: "Oishi Chokulot Choco Curls 100/22g", price: 680.0 },
    { name: "Choco Lo 100/32g", price: 680.0 },
    { name: "Choco Lo [by pcs]", price: 6.8 },
    { name: "Oishi OHEYA Multi Grain Cheese 100/28g", price: 680.0 },
    { name: "Oishi OHEYA Multi Grain Cheese [by pcs]", price: 6.8 },
    { name: "Potato Fries Cheese 100/21g", price: 680.0 },
    { name: "Potato Fries Cheese [by pcs]", price: 6.8 },
    { name: "Potato Fries Plain Salted 100/21g", price: 680.0 },
    { name: "Potato Fries Plain Salted [by pcs]", price: 6.8 },
    { name: "Potato Fries Barbecue Flavor 100/21g", price: 680.0 },
    { name: "Potato Fries Barbecue Flavor [by pcs]", price: 6.8 },
    { name: "Potato Fries Tomato Ketchup 100/21g", price: 680.0 },
    { name: "Potato Fries Tomato Ketchup [by pcs]", price: 6.8 },
    { name: "Oishi Prawn Cracker Spicy 100g/24g", price: 680.0 },
    { name: "Oishi Prawn Cracker Spicy [by pcs]", price: 6.8 },
    { name: "Oishi Prawn Cracker Sweet&Extra Hot 24g", price: 680.0 },
    { name: "Oishi Prawn Cracker Sweet&Extra Hot [by pcs]", price: 6.8 },
    { name: "Oishi Prawn Cracker Plain 100/24g", price: 680.0 },
    { name: "Oishi Prawn Cracker Plain [by pcs]", price: 6.8 },
    { name: "Marty's Cracklin' Spicy Flavor 100/26g", price: 680.0 },
    { name: "Marty's Cracklin' Spicy Flavor [by pcs]", price: 6.8 },
    { name: "Martyrs Plain Salted 100/26g", price: 680.0 },
    { name: "Martyrs Plain Salted [by pcs]", price: 6.8 },
    { name: "Marty's Salted and Vinegar 100/26g", price: 680.0 },
    { name: "Marty's Salted and Vinegar [by pcs]", price: 6.8 },
    { name: "Marty's Chicken Inasal 100/26g", price: 680.0 },
    { name: "Marty's Chicken Inasal [by pcs]", price: 6.8 },
    { name: "Choco Pillows 100/24g", price: 680.0 },
    { name: "Choco Pillows [by pcs]", price: 6.8 },
    { name: "Ube Pillows 100/24g", price: 680.0 },
    { name: "Ube Pillows [by pcs]", price: 6.8 },
    { name: "Choco Pillows 100/38g", price: 680.0 },
    { name: "Choco Pillows [by pcs]", price: 6.8 },
    { name: "Ube Pillows 100/38g", price: 680.0 },
    { name: "Ube Pillows [by pcs]", price: 6.8 },
    { name: "Oishi Chocolate Popcorn 50/60g", price: 680.0 },
    { name: "Oishi Chocolate Popcorn [by pcs]", price: 6.8 },
    { name: "Oishi Caramel Popcorn 50/60g", price: 680.0 },
    { name: "Oishi Caramel Popcorn [by pcs]", price: 6.8 },
    { name: "Oishi Tater Thins Potato Snack 100g/18g", price: 680.0 },
    { name: "Oishi Tater Thins Potato Snack [by pcs]", price: 6.8 },
    { name: "Pods Vegetarian Pea Snack 100/28g", price: 680.0 },
    { name: "Pods Vegetarian Pea Snack [by pcs]", price: 6.8 },
    { name: "Oishi Shripon Shrimp Kropeck 100/20g", price: 680.0 },
    { name: "Oishi Shripon Shrimp Kropeck [by pcs]", price: 6.8 },
    { name: "Corn Ole' 100/22g", price: 680.0 },
    { name: "Corn Ole' [by pcs]", price: 6.8 },
    { name: "Cheese Clubs 100/23g", price: 680.0 },
    { name: "Cheese Clubs [by pcs]", price: 6.8 },
    { name: "Oishi Crackle Nets BBQ 100/24g", price: 680.0 },
    { name: "Oishi Crackle Nets BBQ [by pcs]", price: 6.8 },
    { name: "Oishi KARLS Corn Cheese 100/35g", price: 680.0 },
    { name: "Oishi KARLS Corn Cheese [by pcs]", price: 6.8 },
    { name: "Oishi Miggos Sweetcorn 100/28g", price: 680.0 },
    { name: "Oishi Miggos Sweetcorn [by pcs]", price: 6.8 },
    { name: "Oishi Miggos Nacho Cheese 100/28g", price: 680.0 },
    { name: "Oishi Miggos Nacho Cheese [by pcs]", price: 6.8 },
    { name: "4X Corn Snack Cheddar Cheese 100/24g", price: 680.0 },
    { name: "4X Corn Snack Cheddar Cheese [by pcs]", price: 6.8 },
    { name: "4X Corn Snack BBQ 100/24g", price: 680.0 },
    { name: "4X Corn Snack BBQ [by pcs]", price: 6.8 },
    { name: "4X Corn Snack Sweet Corn 100/24g", price: 680.0 },
    { name: "4X Corn Snack Sweet Corn [by pcs]", price: 6.8 },
  ];
};

// Define NEW varied product associations (mixed and matched)
const productAssociations = [
  // Mixed cheese and potato snacks
  {
    main: "Crispy Patata Cheese 100/24g",
    oftenBoughtWith: [
      "Potato Fries Plain Salted 100/21g",
      "Cheez on Chips 100/22g",
      "Oishi Tater Thins Potato Snack 100g/18g",
    ],
  },
  // Seafood mix with different brands
  {
    main: "Fish Cracker 100/24g",
    oftenBoughtWith: [
      "Spicy Seafood Curls 100/24g",
      "Oishi Shripon Shrimp Kropeck 100/20g",
      "Oishi Prawn Cracker Plain 100/24g",
    ],
  },
  // Sweet treats combination
  {
    main: "Oishi Chocolate Popcorn 50/60g",
    oftenBoughtWith: [
      "Choco Pillows 100/38g",
      "Ube Pillows 100/38g",
      "Choco Lo 100/32g",
    ],
  },
  // Spicy snacks mix
  {
    main: "Marty's Cracklin' Spicy Flavor 100/26g",
    oftenBoughtWith: [
      "Kirei Yummy Flakes Spicy Shrimp 100/20g",
      "Oishi Prawn Cracker Spicy 100g/24g",
      "Boogyman Crunch 100/24g",
    ],
  },
  // Corn-based snacks variety
  {
    main: "Oishi KARLS Corn Cheese 100/35g",
    oftenBoughtWith: [
      "Corn Ole' 100/22g",
      "4X Corn Snack Cheddar Cheese 100/24g",
      "Oishi Miggos Sweetcorn 100/28g",
    ],
  },
  // Cheese sticks and rings combo
  {
    main: "Rinbee Cheese Stick 100/24g",
    oftenBoughtWith: [
      "Onion Ring 100/16g",
      "Cheese Clubs 100/23g",
      "Oishi OHEYA Multi Grain Cheese 100/28g",
    ],
  },
  // Mixed Marty's products
  {
    main: "Marty's Chicken Inasal 100/26g",
    oftenBoughtWith: [
      "Marty's Salted and Vinegar 100/26g",
      "Martyrs Plain Salted 100/26g",
      "Potato Fries Barbecue Flavor 100/21g",
    ],
  },
  // Sweet and savory mix
  {
    main: "Oishi Caramel Popcorn 50/60g",
    oftenBoughtWith: [
      "Oishi Chokulot Choco Curls 100/22g",
      "Crackling Salt & Vinegar 100/24g",
      "Crispy Patata 100/24g",
    ],
  },
  // Fish-based snacks combo
  {
    main: "Oishi Fisda Fish Kropeck 100/22g",
    oftenBoughtWith: [
      "Fish Cracker [by pcs]",
      "Oishi Prawn Cracker Sweet&Extra Hot 24g",
      "Kirei Yummy Flakes 100/24g",
    ],
  },
  // Potato fries variety pack
  {
    main: "Potato Fries Cheese 100/21g",
    oftenBoughtWith: [
      "Potato Fries Tomato Ketchup 100/21g",
      "Potato Fries Barbecue Flavor 100/21g",
      "Oishi Crackle Nets BBQ 100/24g",
    ],
  },
  // Pillows and curls mix
  {
    main: "Ube Pillows 100/24g",
    oftenBoughtWith: [
      "Choco Pillows 100/24g",
      "Oishi Chokulot Choco Curls 100/22g",
      "Oishi Miggos Nacho Cheese 100/28g",
    ],
  },
  // Snack mix for parties
  {
    main: "Boogyman Crunch 100/24g",
    oftenBoughtWith: [
      "Onion Ring 100/16g",
      "Cheez on Chips 100/22g",
      "4X Corn Snack BBQ 100/24g",
    ],
  },
];

// Generate dates across different time periods
const generateDiverseDates = (numberOfOrders) => {
  const dates = [];
  const now = new Date();

  // Distribute orders across different time periods with more recent bias
  const distribution = {
    last7Days: Math.floor(numberOfOrders * 0.4), // 40% - Recent (last 7 days)
    last30Days: Math.floor(numberOfOrders * 0.3), // 30% - Last month
    last90Days: Math.floor(numberOfOrders * 0.15), // 15% - Last 3 months
    lastYear: Math.floor(numberOfOrders * 0.1), // 10% - Last year
    older: Math.floor(numberOfOrders * 0.05), // 5% - Older than 1 year
  };

  // Last 7 days (high frequency)
  for (let i = 0; i < distribution.last7Days; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(
      Math.floor(Math.random() * 24),
      Math.floor(Math.random() * 60)
    );
    dates.push(date);
  }

  // Last 30 days (medium frequency)
  for (let i = 0; i < distribution.last30Days; i++) {
    const daysAgo = Math.floor(Math.random() * 30) + 7;
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(
      Math.floor(Math.random() * 24),
      Math.floor(Math.random() * 60)
    );
    dates.push(date);
  }

  // Last 90 days (medium frequency)
  for (let i = 0; i < distribution.last90Days; i++) {
    const daysAgo = Math.floor(Math.random() * 60) + 30;
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(
      Math.floor(Math.random() * 24),
      Math.floor(Math.random() * 60)
    );
    dates.push(date);
  }

  // Last year (low frequency)
  for (let i = 0; i < distribution.lastYear; i++) {
    const daysAgo = Math.floor(Math.random() * 275) + 90;
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(
      Math.floor(Math.random() * 24),
      Math.floor(Math.random() * 60)
    );
    dates.push(date);
  }

  // Older than 1 year (very low frequency)
  for (let i = 0; i < distribution.older; i++) {
    const yearsAgo = Math.floor(Math.random() * 2) + 1; // 1-3 years ago
    const daysAgo = 365 * yearsAgo + Math.floor(Math.random() * 365);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(
      Math.floor(Math.random() * 24),
      Math.floor(Math.random() * 60)
    );
    dates.push(date);
  }

  // Fill any remaining slots with random dates
  const totalGenerated = dates.length;
  for (let i = totalGenerated; i < numberOfOrders; i++) {
    const daysAgo = Math.floor(Math.random() * 365 * 2); // Up to 2 years ago
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(
      Math.floor(Math.random() * 24),
      Math.floor(Math.random() * 60)
    );
    dates.push(date);
  }

  // Shuffle the dates to mix them up
  return dates.sort(() => Math.random() - 0.5);
};

// Generate items with realistic associations using real prices
const generateOrderItems = async (realProducts) => {
  const items = [];
  let totalAmount = 0;
  let totalItems = 0;

  // 80% chance to create orders with associated products, 20% random
  const useAssociations = Math.random() < 0.8;

  if (useAssociations && productAssociations.length > 0) {
    // Pick a random association group
    const association =
      productAssociations[
        Math.floor(Math.random() * productAssociations.length)
      ];

    // Add the main product (always include this)
    const mainProduct = realProducts.find((p) => p.name === association.main);
    if (mainProduct) {
      const mainQuantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity (smaller quantities for realistic prices)
      const mainSubtotal = (mainProduct.price || 0) * mainQuantity;

      items.push({
        name: mainProduct.name,
        price: mainProduct.price || 0,
        quantity: mainQuantity,
        subtotal: mainSubtotal,
        id: `item_${Date.now()}_main`,
        productId:
          mainProduct.id ||
          `prod_${mainProduct.name.replace(/[^a-zA-Z0-9]/g, "_")}`,
      });

      totalAmount += mainSubtotal;
      totalItems += mainQuantity;

      // Add 1-2 associated products (70% chance for each associated product)
      const availableAssociates = association.oftenBoughtWith.filter((assoc) =>
        realProducts.some((p) => p.name === assoc)
      );

      // Shuffle and take 1-2 associated products
      const shuffledAssociates = [...availableAssociates].sort(
        () => 0.5 - Math.random()
      );
      const associatesToAdd = shuffledAssociates.slice(
        0,
        Math.floor(Math.random() * 2) + 1
      );

      associatesToAdd.forEach((assocName, index) => {
        // 70% chance to actually add each associated product
        if (Math.random() < 0.7) {
          const assocProduct = realProducts.find((p) => p.name === assocName);
          if (assocProduct) {
            const assocQuantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
            const assocSubtotal = (assocProduct.price || 0) * assocQuantity;

            items.push({
              name: assocProduct.name,
              price: assocProduct.price || 0,
              quantity: assocQuantity,
              subtotal: assocSubtotal,
              id: `item_${Date.now()}_assoc_${index}`,
              productId:
                assocProduct.id ||
                `prod_${assocProduct.name.replace(/[^a-zA-Z0-9]/g, "_")}`,
            });

            totalAmount += assocSubtotal;
            totalItems += assocQuantity;
          }
        }
      });
    }
  }

  // If no associations were used or we need more items, add some random ones
  if (items.length < 2 || Math.random() < 0.3) {
    const additionalItemsNeeded = Math.floor(Math.random() * 2) + 1; // 1-2 additional items
    for (let i = 0; i < additionalItemsNeeded; i++) {
      const product =
        realProducts[Math.floor(Math.random() * realProducts.length)];
      const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity

      const subtotal = (product.price || 0) * quantity;

      // Don't add duplicates
      if (!items.some((item) => item.name === product.name)) {
        items.push({
          name: product.name,
          price: product.price || 0,
          quantity: quantity,
          subtotal: subtotal,
          id: `item_${Date.now()}_random_${i}`,
          productId:
            product.id || `prod_${product.name.replace(/[^a-zA-Z0-9]/g, "_")}`,
        });

        totalAmount += subtotal;
        totalItems += quantity;
      }
    }
  }

  return {
    items,
    totalAmount,
    totalItems,
    total: totalAmount,
  };
};

// Add seasonal variation and popularity trends
const addBusinessTrends = (dates, orders) => {
  return orders.map((order, index) => {
    const date = dates[index];
    const month = date.getMonth();
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    // Add seasonal trends:
    let seasonalMultiplier = 1.0;

    if (month >= 4 && month <= 7) {
      // Summer months (May-Aug)
      seasonalMultiplier = 1.4; // 40% higher in summer
    } else if (month === 11) {
      // December
      seasonalMultiplier = 1.6; // 60% higher in December
    } else if (month >= 8 && month <= 10) {
      // Sep-Nov
      seasonalMultiplier = 1.2; // 20% higher in fall
    }

    // Weekend boost
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : 1.0;

    // Apply trends to order items
    const adjustedItems = order.items.map((item) => {
      const finalMultiplier = seasonalMultiplier * weekendMultiplier;

      return {
        ...item,
        quantity: Math.max(1, Math.floor(item.quantity * finalMultiplier)),
      };
    });

    const adjustedTotal = adjustedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return {
      ...order,
      items: adjustedItems,
      totalAmount: adjustedTotal,
      total: adjustedTotal,
      totalItems: adjustedItems.reduce((sum, item) => sum + item.quantity, 0),
    };
  });
};

// Add dummy orders to Firestore with meaningful associations and REAL prices
export const addDummyOrders = async (numberOfOrders = 200) => {
  try {
    const ordersRef = collection(db, "orders");
    const dates = generateDiverseDates(numberOfOrders);

    console.log("🎯 Fetching real products from Firestore...");
    const realProducts = await fetchRealProducts();

    if (realProducts.length === 0) {
      console.error("❌ No products found in Firestore!");
      return false;
    }

    console.log(
      "📦 Generating orders with REAL prices and varied associations..."
    );

    // First generate all orders
    const orders = [];
    for (let i = 0; i < numberOfOrders; i++) {
      const orderData = await generateOrderItems(realProducts);
      const { items, totalAmount, totalItems, total } = orderData;

      orders.push({
        items: items,
        totalAmount: totalAmount,
        total: total,
        totalItems: totalItems,
        createdAt: dates[i],
        updatedAt: serverTimestamp(),
        status: "completed",
        customerName: `Customer ${Math.floor(Math.random() * 100) + 1}`,
        customerEmail: `customer${
          Math.floor(Math.random() * 100) + 1
        }@example.com`,
        paymentMethod: ["cash", "card", "gcash"][Math.floor(Math.random() * 3)],
        storeLocation: ["Main Store", "Branch 1", "Branch 2"][
          Math.floor(Math.random() * 3)
        ],
      });
    }

    // Apply business trends
    const trendAdjustedOrders = addBusinessTrends(dates, orders);

    // Add to Firestore
    for (let i = 0; i < trendAdjustedOrders.length; i++) {
      await addDoc(ordersRef, {
        ...trendAdjustedOrders[i],
        createdAt: Timestamp.fromDate(trendAdjustedOrders[i].createdAt),
      });

      if ((i + 1) % 50 === 0) {
        console.log(`Added ${i + 1}/${numberOfOrders} orders...`);
      }
    }

    console.log(
      `✅ Successfully added ${numberOfOrders} orders with varied associations!`
    );
    console.log(
      `💰 Expected revenue range: ₱${trendAdjustedOrders
        .reduce((sum, order) => sum + order.totalAmount, 0)
        .toLocaleString()}`
    );

    return true;
  } catch (error) {
    console.error("❌ Error adding dummy orders:", error);
    return false;
  }
};

// Simple function to create a button element (no JSX)
export const createDummyDataButton = () => {
  const button = document.createElement("button");
  button.textContent = "📊 Add Varied Dummy Data (200 Orders)";
  button.style.padding = "10px 20px";
  button.style.background = "var(--accent-color)";
  button.style.color = "white";
  button.style.border = "none";
  button.style.borderRadius = "6px";
  button.style.cursor = "pointer";
  button.style.margin = "10px 0";
  button.style.fontSize = "14px";

  button.addEventListener("click", async () => {
    if (
      window.confirm(
        "This will add 200 orders with varied product associations. Continue?"
      )
    ) {
      const success = await addDummyOrders(200);
      if (success) {
        alert(
          "Varied dummy data added successfully! Multiple association patterns created."
        );
      } else {
        alert("Failed to add dummy data. Check console for errors.");
      }
    }
  });

  return button;
};
