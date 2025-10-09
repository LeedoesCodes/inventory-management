// functions/index.js - SIMPLIFIED WORKING VERSION
const cors = require("cors")({ origin: true });
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const functions = require("firebase-functions");

initializeApp();
const db = getFirestore();

// Use environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

exports.geminiAnalysis = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      console.log("🔮 [FUNCTION] Gemini analysis called");

      const { userInput, businessContext } = req.body;

      if (!userInput) {
        return res.status(400).json({ error: "User input required" });
      }

      if (!GEMINI_API_KEY) {
        console.error("❌ No Gemini API key found");
        return res.status(500).json({
          error: "Gemini API key not configured",
          fallback: true,
        });
      }

      // Get fresh business data
      const businessData = await getBusinessData();

      const prompt = `
USER QUESTION: ${userInput}

BUSINESS DATA:
${businessData.summary}

ANALYSIS REQUEST:
Please provide a comprehensive business analysis with:
1. Key insights from the data
2. Specific recommendations
3. Actionable next steps
4. Areas of opportunity

Format your response in markdown with clear sections.
Be specific and data-driven in your analysis.
      `;

      console.log("📝 [FUNCTION] Sending to Gemini...");

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log("✅ [FUNCTION] Gemini response successful");

      res.json({
        success: true,
        response: text,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ [FUNCTION] Error:", error);

      res.json({
        success: false,
        response: `**AI Analysis Temporarily Unavailable**\n\nI'm unable to access the AI analysis service right now. Here's what you can do:\n\n• Use specific data queries like "customer analytics" or "order overview"\n• Check your business metrics through the dashboard\n• Try again in a few minutes\n\n*Error: ${error.message}*`,
        error: error.message,
        fallback: true,
      });
    }
  });
});

// Business data collection
async function getBusinessData() {
  try {
    const [customersSnapshot, ordersSnapshot, productsSnapshot] =
      await Promise.all([
        db.collection("customers").get(),
        db.collection("orders").get(),
        db.collection("products").get(),
      ]);

    const customers = customersSnapshot.docs.map((doc) => doc.data());
    const orders = ordersSnapshot.docs.map((doc) => doc.data());
    const products = productsSnapshot.docs.map((doc) => doc.data());

    // Calculate metrics
    const totalRevenue = orders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );
    const totalCustomers = customers.length;
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const lowStockProducts = products.filter(
      (p) => (p.stock || 0) <= 10
    ).length;
    const avgOrderValue = totalRevenue / (totalOrders || 1);

    // Get unique customers from orders
    const uniqueCustomers = [
      ...new Set(orders.map((order) => order.customerName).filter(Boolean)),
    ].length;

    return {
      summary: `
BUSINESS OVERVIEW:
• Total Customers: ${totalCustomers} registered, ${uniqueCustomers} active
• Total Orders: ${totalOrders} totaling ₱${totalRevenue.toFixed(2)}
• Total Products: ${totalProducts} items, ${lowStockProducts} low-stock
• Average Order Value: ₱${avgOrderValue.toFixed(2)}
• Orders per Customer: ${(totalOrders / (uniqueCustomers || 1)).toFixed(1)}

RECENT ACTIVITY:
• Data current as of: ${new Date().toLocaleString()}
      `.trim(),
    };
  } catch (error) {
    console.error("Error getting business data:", error);
    return { summary: "Business data currently unavailable" };
  }
}

// Test function
exports.testFunction = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    res.json({
      success: true,
      message: "Function is working!",
      hasGeminiKey: !!GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });
});
