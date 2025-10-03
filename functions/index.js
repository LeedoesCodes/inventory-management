// functions/index.js
const { GoogleGenAI } = require("@google/genai");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const functions = require("firebase-functions");

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

const SYSTEM_INSTRUCTION = `
You are a helpful and professional **Business Intelligence Assistant** for a retail/store management system. 
Your primary goal is to answer user questions about their business data including customers, orders, products, and sales analytics.
Use the available tools to get real business data when needed.
If a tool is not available to answer the question, provide helpful business insights based on general knowledge.
Keep your answers brief, clear, and formatted nicely with markdown.
Focus on providing actionable insights and business intelligence.
`;

// --- TOOL DEFINITIONS (The schema sent to Gemini) ---
const toolDefinitions = [
  {
    functionDeclarations: [
      {
        name: "getBusinessOverview",
        description:
          "Gets comprehensive business overview including customer counts, order statistics, and product inventory data.",
        parameters: {
          type: "object",
          properties: {
            overviewType: {
              type: "string",
              description:
                "Type of overview needed: 'customers', 'orders', 'products', or 'all'",
              enum: ["customers", "orders", "products", "all"],
            },
          },
          required: ["overviewType"],
        },
      },
      {
        name: "getCustomerAnalytics",
        description:
          "Gets customer data including total customers, top spenders, recent customers, and customer value metrics.",
        parameters: {
          type: "object",
          properties: {
            analyticsType: {
              type: "string",
              description:
                "Type of customer analytics: 'count', 'top', 'recent', or 'all'",
              enum: ["count", "top", "recent", "all"],
            },
          },
          required: ["analyticsType"],
        },
      },
      {
        name: "getOrderAnalytics",
        description:
          "Gets order data including total orders, revenue, recent orders, and today's performance.",
        parameters: {
          type: "object",
          properties: {
            analyticsType: {
              type: "string",
              description:
                "Type of order analytics: 'count', 'recent', 'today', or 'all'",
              enum: ["count", "recent", "today", "all"],
            },
          },
          required: ["analyticsType"],
        },
      },
      {
        name: "getProductAnalytics",
        description:
          "Gets product data including inventory counts, low stock items, categories, and product value.",
        parameters: {
          type: "object",
          properties: {
            analyticsType: {
              type: "string",
              description:
                "Type of product analytics: 'count', 'lowstock', 'categories', or 'all'",
              enum: ["count", "lowstock", "categories", "all"],
            },
          },
          required: ["analyticsType"],
        },
      },
    ],
  },
];

// --- TOOL IMPLEMENTATIONS ---
async function getBusinessOverview(overviewType) {
  try {
    const results = {};

    if (overviewType === "all" || overviewType === "customers") {
      const customersSnapshot = await db.collection("customers").get();
      const customers = customersSnapshot.docs.map((doc) => doc.data());
      results.customers = {
        total: customers.length,
        totalSpent: customers.reduce((sum, c) => sum + (c.TotalSpent || 0), 0),
        totalOrders: customers.reduce(
          (sum, c) => sum + (c.TotalOrders || 0),
          0
        ),
      };
    }

    if (overviewType === "all" || overviewType === "orders") {
      const ordersSnapshot = await db.collection("orders").get();
      const orders = ordersSnapshot.docs.map((doc) => doc.data());
      results.orders = {
        total: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        averageOrderValue:
          orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) /
          (orders.length || 1),
      };
    }

    if (overviewType === "all" || overviewType === "products") {
      const productsSnapshot = await db.collection("products").get();
      const products = productsSnapshot.docs.map((doc) => doc.data());
      results.products = {
        total: products.length,
        inventoryValue: products.reduce(
          (sum, p) => sum + (p.price || 0) * (p.stock || 0),
          0
        ),
        categories: [
          ...new Set(products.map((p) => p.category).filter(Boolean)),
        ].length,
      };
    }

    return results;
  } catch (error) {
    console.error("Error getting business overview:", error);
    return { error: "Failed to retrieve business overview" };
  }
}

async function getCustomerAnalytics(analyticsType) {
  try {
    const results = {};
    const customersSnapshot = await db.collection("customers").get();
    const customers = customersSnapshot.docs.map((doc) => doc.data());

    if (analyticsType === "all" || analyticsType === "count") {
      results.count = {
        totalCustomers: customers.length,
        totalSpent: customers.reduce((sum, c) => sum + (c.TotalSpent || 0), 0),
        totalOrders: customers.reduce(
          (sum, c) => sum + (c.TotalOrders || 0),
          0
        ),
        averageOrdersPerCustomer:
          customers.reduce((sum, c) => sum + (c.TotalOrders || 0), 0) /
          (customers.length || 1),
      };
    }

    if (analyticsType === "all" || analyticsType === "top") {
      const ordersSnapshot = await db.collection("orders").get();
      const orders = ordersSnapshot.docs.map((doc) => doc.data());

      const customerStats = {};
      orders.forEach((order) => {
        const customerName = order.customerName;
        if (!customerName) return;

        if (!customerStats[customerName]) {
          customerStats[customerName] = {
            totalSpent: 0,
            orderCount: 0,
            lastOrder: order.createdAt,
          };
        }

        customerStats[customerName].totalSpent += order.totalAmount || 0;
        customerStats[customerName].orderCount += 1;

        const orderDate = order.createdAt?.toDate?.() || new Date();
        const currentLast =
          customerStats[customerName].lastOrder?.toDate?.() || new Date(0);
        if (orderDate > currentLast) {
          customerStats[customerName].lastOrder = order.createdAt;
        }
      });

      results.topCustomers = Object.entries(customerStats)
        .map(([name, stats]) => ({
          name,
          totalSpent: stats.totalSpent,
          orderCount: stats.orderCount,
          lastOrder: stats.lastOrder,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);
    }

    if (analyticsType === "all" || analyticsType === "recent") {
      results.recentCustomers = customers
        .sort(
          (a, b) =>
            (b.createdAT?.toMillis?.() || 0) - (a.createdAT?.toMillis?.() || 0)
        )
        .slice(0, 5)
        .map((c) => ({
          name: c.name,
          phone: c.phone,
          joined: c.createdAT,
        }));
    }

    return results;
  } catch (error) {
    console.error("Error getting customer analytics:", error);
    return { error: "Failed to retrieve customer analytics" };
  }
}

async function getOrderAnalytics(analyticsType) {
  try {
    const results = {};
    const ordersSnapshot = await db.collection("orders").get();
    const orders = ordersSnapshot.docs.map((doc) => doc.data());

    if (analyticsType === "all" || analyticsType === "count") {
      const totalRevenue = orders.reduce(
        (sum, order) => sum + (order.totalAmount || 0),
        0
      );
      results.count = {
        totalOrders: orders.length,
        totalRevenue: totalRevenue,
        averageOrderValue: totalRevenue / (orders.length || 1),
        totalItemsSold: orders.reduce(
          (sum, order) => sum + (order.totalItems || 0),
          0
        ),
      };
    }

    if (analyticsType === "all" || analyticsType === "recent") {
      results.recentOrders = orders
        .sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
        )
        .slice(0, 5)
        .map((o) => ({
          customerName: o.customerName,
          totalAmount: o.totalAmount,
          totalItems: o.totalItems,
          createdAt: o.createdAt,
        }));
    }

    if (analyticsType === "all" || analyticsType === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter((o) => {
        const orderDate = o.createdAt?.toDate?.();
        return orderDate >= today;
      });
      const todayRevenue = todayOrders.reduce(
        (sum, order) => sum + (order.totalAmount || 0),
        0
      );

      results.today = {
        ordersToday: todayOrders.length,
        todayRevenue: todayRevenue,
        itemsSoldToday: todayOrders.reduce(
          (sum, order) => sum + (order.totalItems || 0),
          0
        ),
        averageOrderToday: todayRevenue / (todayOrders.length || 1),
      };
    }

    return results;
  } catch (error) {
    console.error("Error getting order analytics:", error);
    return { error: "Failed to retrieve order analytics" };
  }
}

async function getProductAnalytics(analyticsType) {
  try {
    const results = {};
    const productsSnapshot = await db.collection("products").get();
    const products = productsSnapshot.docs.map((doc) => doc.data());

    if (analyticsType === "all" || analyticsType === "count") {
      const categories = [
        ...new Set(products.map((p) => p.category).filter(Boolean)),
      ];
      const totalValue = products.reduce(
        (sum, p) => sum + (p.price || 0) * (p.stock || 0),
        0
      );

      results.count = {
        totalProducts: products.length,
        categories: categories.length,
        inventoryValue: totalValue,
        averageStock:
          products.reduce((sum, p) => sum + (p.stock || 0), 0) /
          products.length,
      };
    }

    if (analyticsType === "all" || analyticsType === "lowstock") {
      const settingsSnapshot = await db.collection("userSettings").get();
      const lowStockThreshold =
        settingsSnapshot.docs[0]?.data()?.lowStockThreshold || 10;

      results.lowStock = {
        threshold: lowStockThreshold,
        products: products
          .filter((p) => (p.stock || 0) <= lowStockThreshold)
          .sort((a, b) => (a.stock || 0) - (b.stock || 0))
          .map((p) => ({
            name: p.name,
            stock: p.stock,
            price: p.price,
            category: p.category,
          })),
      };
    }

    if (analyticsType === "all" || analyticsType === "categories") {
      const categories = [
        ...new Set(products.map((p) => p.category).filter(Boolean)),
      ];

      results.categories = categories.map((category) => {
        const categoryProducts = products.filter(
          (p) => p.category === category
        );
        const totalStock = categoryProducts.reduce(
          (sum, p) => sum + (p.stock || 0),
          0
        );
        const totalValue = categoryProducts.reduce(
          (sum, p) => sum + (p.price || 0) * (p.stock || 0),
          0
        );

        return {
          category: category,
          productCount: categoryProducts.length,
          totalStock: totalStock,
          totalValue: totalValue,
        };
      });
    }

    return results;
  } catch (error) {
    console.error("Error getting product analytics:", error);
    return { error: "Failed to retrieve product analytics" };
  }
}

// --- MAIN CALLABLE CLOUD FUNCTION ---
exports.callGemini = functions.https.onCall(async (data, context) => {
  // 1. Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called by an authenticated user."
    );
  }

  // Initialize AI inside the function where config is available
  const ai = new GoogleGenAI({
    apiKey: functions.config().gemini.key,
  });

  const { history, sessionId, userId } = data;
  const model = "gemini-2.0-flash-exp";

  const saveAiResponse = async (responseText, state = "COMPLETED") => {
    await db.collection("chats").add({
      content: responseText,
      role: "model",
      sessionId: sessionId,
      userId: userId,
      timestamp: new Date(),
      state: state,
    });
  };

  try {
    // 2. First API call to Gemini (includes tools)
    let response = await ai.models.generateContent({
      model: model,
      contents: history,
      config: {
        tools: toolDefinitions,
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
      },
    });

    // 3. CHECK FOR FUNCTION CALL
    const functionCalls = response.candidates?.[0]?.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const funcName = call.name;
      const funcArgs = call.args;

      console.log(
        `🤖 Function Call Detected: ${funcName} with args:`,
        funcArgs
      );

      let functionResult = {};

      // Execute the appropriate function based on the call
      if (funcName === "getBusinessOverview") {
        functionResult = await getBusinessOverview(funcArgs.overviewType);
      } else if (funcName === "getCustomerAnalytics") {
        functionResult = await getCustomerAnalytics(funcArgs.analyticsType);
      } else if (funcName === "getOrderAnalytics") {
        functionResult = await getOrderAnalytics(funcArgs.analyticsType);
      } else if (funcName === "getProductAnalytics") {
        functionResult = await getProductAnalytics(funcArgs.analyticsType);
      } else {
        throw new Error(`Unknown function name: ${funcName}`);
      }

      // 4. Send the function result back to Gemini (Second API call)
      const newHistory = [
        ...history,
        {
          role: "model",
          parts: [{ functionCall: call }],
        },
        {
          role: "function",
          parts: [
            {
              functionResponse: {
                name: funcName,
                response: functionResult,
              },
            },
          ],
        },
      ];

      const secondResponse = await ai.models.generateContent({
        model: model,
        contents: newHistory,
        config: {
          tools: toolDefinitions,
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
        },
      });

      const finalResponseText =
        secondResponse?.text ||
        "Sorry, I couldn't generate a response based on your business data.";
      await saveAiResponse(finalResponseText);

      return {
        success: true,
        response: finalResponseText,
        usedTools: true,
      };
    } else {
      // No function call needed - direct response
      const finalResponseText =
        response?.text || "Sorry, I couldn't generate a response.";
      await saveAiResponse(finalResponseText);

      return {
        success: true,
        response: finalResponseText,
        usedTools: false,
      };
    }
  } catch (error) {
    console.error("Gemini/Function Error:", error);
    await saveAiResponse(
      "An error occurred while analyzing your business data. Please try again later.",
      "ERROR"
    );
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// --- NEW FUNCTION: Simple Gemini proxy for the chatbot ---
exports.geminiBusinessAnalysis = functions.https.onCall(
  async (data, context) => {
    // 1. Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called by an authenticated user."
      );
    }

    const ai = new GoogleGenAI({
      apiKey: functions.config().gemini.key,
    });

    const { userInput, businessContext } = data;
    const model = "gemini-2.0-flash-exp";

    try {
      const prompt = `
      You are a business intelligence assistant for a retail/store management system.
      
      BUSINESS CONTEXT:
      ${businessContext}
      
      USER QUESTION: "${userInput}"
      
      Please provide a helpful, analytical response based on the business context above.
      Focus on insights, trends, and business intelligence.
      Use markdown formatting for better readability.
      Be concise but informative.
      If you notice any concerning patterns or opportunities, mention them.
    `;

      const response = await ai.models.generateContent({
        model: model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
        },
      });

      const responseText =
        response?.text ||
        "I couldn't generate a business analysis at the moment.";

      return {
        success: true,
        response: responseText,
      };
    } catch (error) {
      console.error("Gemini Business Analysis Error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate business analysis"
      );
    }
  }
);
