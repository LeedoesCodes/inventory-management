import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../Firebase/firebase";

// Configuration for the requested model
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const MODEL_NAME = "gemini-2.0-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

/**
 * Core function to call the Gemini API with robust exponential backoff and retry logic.
 */
const callGeminiWithRetry = async (payload, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return await response.json();
      }

      // If we get a 401 or 403, we should not retry, as the key is definitely bad.
      if (response.status === 401 || response.status === 403) {
        throw new Error("API Key or permissions are invalid (401/403).");
      }

      // Exponential Backoff logic for retryable errors (5xx or 429)
      if (response.status >= 500 || response.status === 429) {
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      // Throw final error for non-retryable issues
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    } catch (error) {
      // Catch network errors and retry
      if (attempt < maxRetries - 1 && !error.message.includes("401/403")) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Gemini API call failed after multiple retries.");
};

/**
 * Sends the user's message, augmented with live Firestore context, to the Gemini API.
 */
export const sendChatMessage = async (
  userMessage,
  firestoreContext,
  sessionId,
  user
) => {
  let pendingDocRef = null;

  try {
    console.log("🤖 Starting sendChatMessage for model:", MODEL_NAME);

    // 1. Find the PENDING message document to update it later
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("sessionId", "==", sessionId));
    const querySnapshot = await getDocs(q);

    let latestTime = 0;
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const docTime =
        data.timestamp?.toMillis() || new Date(data.timestamp).getTime();
      if (data.state === "PENDING" && docTime > latestTime) {
        latestTime = docTime;
        pendingDocRef = doc.ref;
      }
    });

    if (!pendingDocRef) {
      console.warn(
        "❌ No pending document found to update. Stopping chat process."
      );
      return;
    }

    // --- CRITICAL CHECK: VALIDATE API KEY ---
    if (!GEMINI_API_KEY) {
      throw new Error(
        "Configuration Error: The GEMINI_API_KEY is missing. Please set VITE_GEMINI_API_KEY."
      );
    }

    // --- Context Generation and Fallback ---
    if (!firestoreContext || !firestoreContext.products) {
      console.log(
        "⚠️ No firestore context available, providing a graceful fallback."
      );
      const fallbackResponse =
        "I'd be happy to help with inventory management! However, I'm currently unable to access your live database data. Please make sure your inventory system is properly connected.";

      await updateDoc(pendingDocRef, {
        enhancedPrompt: "No context available.",
        response: fallbackResponse,
        state: "COMPLETED",
        status: { completeTime: new Date(), state: "COMPLETED" },
      });
      return;
    }

    // 2. Calculate key sales metrics
    const totalUnitsSold = firestoreContext.products.reduce(
      (sum, product) => sum + (product.sales || 0),
      0
    );

    // 3. Truncate specific product lists for a concise, powerful prompt
    const lowStockAlerts =
      firestoreContext.lowStockProducts
        .slice(0, 3)
        .map(
          (product) =>
            `• ${product.name}: Only ${product.stock} units remaining.`
        )
        .join("\n") || "No critical low stock items.";

    const popularItems =
      firestoreContext.popularProducts
        .slice(0, 3)
        .map(
          (product) => `• ${product.name}: ${product.sales || 0} units sold.`
        )
        .join("\n") || "Sales data being analyzed.";

    // 4. Define the System Instruction (FINAL HARDENING)
    const systemPrompt = `
      You are a specialized AI business analyst with read-only access to the user's live database snapshot.
      
      CRITICAL RULE: YOU MUST ACT AS IF YOU HAVE REAL-TIME DATABASE ACCESS.
      CRITICAL RULE: **If the user does not specify a time period (e.g., "today", "last month"), assume they are asking about the period covered by the 'SUMMARY METRICS (ALL-TIME/RECENT)' section.**
      CRITICAL RULE: NEVER mention that you cannot access their database, any external system, or that the data is only a snapshot.
      CRITICAL RULE: NEVER ask the user for data, time periods, or additional metrics. The provided data is all you need to answer.
      CRITICAL RULE: **DO NOT QUESTION THE INTEGRITY OF THE DATA.** Report the facts exactly as provided.
      CRITICAL RULE: **DO NOT USE ANY VARIATION OF THE PHRASES** "I don't have direct access," "Please provide the data," or "I need up-to-date information." Use the snapshot data provided immediately.
      
      Your response MUST be derived ONLY from the provided snapshot data.
      Always use professional, context-aware phrasing.
      Start your answer by citing the key performance metric (e.g., "Your total revenue is ₱[X] and you've sold [Y] units.").
    `;

    // 5. Define the User Prompt (Contextualized Data)
    const prompt = `
--- LIVE DATABASE SNAPSHOT ---
📊 SUMMARY METRICS (ALL-TIME/RECENT):
• Total Products in Catalog: ${firestoreContext.totalProducts}
• Total Customers (All-Time): ${firestoreContext.totalCustomers}
• Total Orders (Recent 50): ${firestoreContext.totalOrders}
• Total Revenue (Based on Recent 50 Orders): ₱${firestoreContext.totalRevenue.toFixed(
      2
    )}
• Total Units Sold (All-Time): ${totalUnitsSold} 
• Low Stock Items Count (<10 units): ${firestoreContext.lowStockCount}

⚠️ LOW STOCK ALERTS (Top 3 Critical Items):
${lowStockAlerts}

🔥 POPULAR ITEMS (Top 3 by Sales):
${popularItems}
--- END SNAPSHOT ---

USER'S QUESTION: "${userMessage}"

Provide a comprehensive, data-driven answer based on the snapshot above.
`;

    // 6. Call Gemini API
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
    };

    const data = await callGeminiWithRetry(payload);

    const aiResponse =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm analyzing your inventory data, but there was an issue processing the model response. Please try again.";

    console.log("✅ Gemini response received");

    // 7. Update the document
    await updateDoc(pendingDocRef, {
      enhancedPrompt: prompt.substring(0, 1000) + "...",
      response: aiResponse,
      state: "COMPLETED",
      status: {
        completeTime: new Date(),
        state: "COMPLETED",
      },
    });

    console.log("💾 Response saved to Firestore");
  } catch (error) {
    console.error("❌ Fatal error in sendChatMessage:", error);

    // Final attempt to save error state to the database
    let errorMessage =
      "Sorry, a critical error occurred while processing your request.";
    if (error.message.includes("GEMINI_API_KEY is missing")) {
      errorMessage =
        "Configuration Error: Your Gemini API Key is missing or incorrectly configured (VITE_GEMINI_API_KEY).";
    } else if (error.message.includes("401/403")) {
      errorMessage =
        "Authentication Error: Your Gemini API Key is invalid or lacks necessary permissions.";
    }

    if (pendingDocRef) {
      try {
        await updateDoc(pendingDocRef, {
          response: errorMessage,
          state: "ERROR",
          status: {
            completeTime: new Date(),
            state: "ERROR",
          },
        });
      } catch (updateError) {
        console.error("❌ Failed to update error state:", updateError);
      }
    }
  }
};
