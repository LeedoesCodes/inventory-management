const functions = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { GoogleGenerativeAI } = require("@google/generative-ai");

initializeApp();

const db = getFirestore();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.processMessage = functions.firestore
  .document(`${process.env.COLLECTION_PATH}/{documentId}`)
  .onCreate(async (snap, context) => {
    const data = snap.data();

    // Skip if no prompt or already has response
    if (!data.prompt || data.response) {
      console.log("Skipping document - no prompt or already processed");
      return null;
    }

    try {
      console.log("Processing chat message:", data.prompt);

      // Delete trigger document to prevent loops
      await snap.ref.delete();

      const model = genAI.getGenerativeModel({
        model: "gemini-pro",
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7,
        },
      });

      // Enhanced system prompt
      const systemPrompt = `
You are an AI assistant for a junk food wholesale inventory management system.

SYSTEM FEATURES:
- Inventory tracking with low stock alerts
- Product management (CRUD operations)
- Order processing with receipts
- Apriori algorithm recommendations
- Admin user management

DATABASE SCHEMA:
- Products: name, category, price, stock, supplier
- Orders: items, totalAmount, customerName, timestamp
- Users: name, email, role, createdAt

Focus on practical junk food inventory advice. Be specific and actionable.

User question: ${data.prompt}
`;

      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      const responseText = response.text();

      // Save response
      const responseDoc = {
        originalPrompt: data.prompt,
        response: responseText,
        sessionId: data.sessionId,
        userId: data.userId,
        timestamp: new Date(),
        status: "COMPLETED",
      };

      await db.collection(process.env.COLLECTION_PATH).add(responseDoc);

      console.log("Successfully processed message");
      return null;
    } catch (error) {
      console.error("Error:", error);

      // Save error response
      const errorDoc = {
        originalPrompt: data.prompt,
        response: "Sorry, I encountered an error. Please try again.",
        sessionId: data.sessionId,
        userId: data.userId,
        timestamp: new Date(),
        status: "ERROR",
        error: error.message,
      };

      await db.collection(process.env.COLLECTION_PATH).add(errorDoc);
      return null;
    }
  });
