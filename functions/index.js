// functions/index.js
const { GoogleGenAI } = require("@google/genai");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const functions = require("firebase-functions");

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

const SYSTEM_INSTRUCTION = `
You are a helpful and professional **Inventory Management Assistant**. 
Your primary goal is to answer user questions about their inventory and products by using the available tools. 
If a tool is not available to answer the question, state that politely. 
Keep your answers brief, clear, and formatted nicely with markdown.
`;

// --- TOOL DEFINITION (The schema sent to Gemini) ---
const toolDefinitions = [
  {
    functionDeclarations: [
      {
        name: "getInventoryCount",
        description:
          "Gets the current stock level and status for a specific inventory product. Use this for questions like 'What is the stock of Widget A?' or 'How many Widgets do I have?'",
        parameters: {
          type: "object",
          properties: {
            productName: {
              type: "string",
              description:
                "The exact name of the product to check stock for (e.g., 'Widget A', 'Blue Shirt', 'Screwdriver').",
            },
          },
          required: ["productName"],
        },
      },
    ],
  },
];

// --- TOOL IMPLEMENTATION ---
async function getInventoryCount(productName) {
  try {
    const snapshot = await db
      .collection("inventory")
      .where("name", "==", productName)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { product: productName, stock: 0, status: "Product Not Found" };
    }

    const data = snapshot.docs[0].data();
    return {
      product: productName,
      stock: data.stock,
      status: data.stock > 50 ? "In Stock" : "Low Stock",
    };
  } catch (error) {
    console.error("Error querying inventory:", error);
    return { product: productName, stock: null, status: "Database Error" };
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

      if (funcName === "getInventoryCount") {
        functionResult = await getInventoryCount(funcArgs.productName);
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
        secondResponse?.text || "Sorry, I couldn't generate a response.";
      await saveAiResponse(finalResponseText);
    } else {
      const finalResponseText =
        response?.text || "Sorry, I couldn't generate a response.";
      await saveAiResponse(finalResponseText);
    }

    return { success: true };
  } catch (error) {
    console.error("Gemini/Function Error:", error);
    await saveAiResponse(
      "An error occurred. I can't check the database right now. Please check the logs.",
      "ERROR"
    );
    throw new functions.https.HttpsError("internal", error.message);
  }
});
