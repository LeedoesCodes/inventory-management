import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../Firebase/firebase";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

export const sendChatMessage = async (userMessage, sessionId, user, docId) => {
  try {
    console.log("🤖 Sending message to AI");

    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API Key is missing");
    }

    // Simple API call
    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("API call failed");
    }

    const data = await response.json();
    const aiResponse =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm here! How can I help you?";

    // FIXED: Ensure state is set to COMPLETED
    await updateDoc(doc(db, "chats", docId), {
      response: aiResponse,
      state: "COMPLETED",
      timestamp: new Date(),
    });

    console.log("✅ Response saved successfully");
  } catch (error) {
    console.error("Error:", error);

    // FIXED: Ensure state is set to ERROR on failure
    await updateDoc(doc(db, "chats", docId), {
      response:
        "Sorry, I'm having trouble responding right now. Please try again.",
      state: "ERROR",
      timestamp: new Date(),
    });
    throw error;
  }
};
