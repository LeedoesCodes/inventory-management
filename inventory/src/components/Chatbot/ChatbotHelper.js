import { addDoc, collection } from "firebase/firestore";
import { db } from "../../Firebase/firebase";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

// Function Calling is more advanced, so for now, we'll keep the direct API call.
// IMPORTANT: You'll eventually want to move this logic to a Firebase Cloud Function for security
// and to implement Function Calling properly.

const SYSTEM_INSTRUCTION = `
You are a helpful and professional **Inventory Management Assistant**. 
Your primary goal is to assist the user with questions related to their inventory and products.
Keep your answers brief, clear, and formatted nicely with markdown.
`;

// New signature: accepts the full history and the user's new message docId
export const sendChatMessage = async (
  history,
  userDocId,
  sessionId,
  userId
) => {
  try {
    console.log("🤖 Sending message to AI with history");

    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API Key is missing");
    }

    // Corrected payload structure for the REST API
    const payload = {
      // 1. Correct: systemInstruction is a top-level string field.
      systemInstruction: SYSTEM_INSTRUCTION, // Directly use the string

      // 2. The rest of your payload remains the same
      contents: history, // The full conversation history
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    };

    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("API call failed");
    }

    const data = await response.json();
    const aiResponse =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm here! How can I help you?";

    // 2. SAVE the AI's response as a *new, separate document* (New Structure)
    await addDoc(collection(db, "chats"), {
      content: aiResponse,
      role: "model",
      sessionId: sessionId,
      userId: userId,
      timestamp: new Date(),
    });

    // We no longer update the user's doc, as the AI response is a new doc.

    console.log("✅ Response saved successfully as a new document");
  } catch (error) {
    console.error("Error:", error);

    // Save error message as a new document
    try {
      await addDoc(collection(db, "chats"), {
        content:
          "Sorry, I'm having trouble responding right now. Please try again.",
        role: "model",
        sessionId: sessionId,
        userId: userId,
        timestamp: new Date(),
        error: true,
      });
    } catch (firestoreError) {
      console.error("Failed to save error message:", firestoreError);
    }

    throw error;
  }
};
