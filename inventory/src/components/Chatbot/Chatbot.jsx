import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from "react";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "../../Firebase/firebase";
import { AuthContext } from "../../context/AuthContext";
import { sendChatMessage } from "./ChatbotHelper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import ReactMarkdown from "react-markdown";
import "./Chatbot.scss";

// Memoized Message component outside the main component to prevent re-renders
const Message = React.memo(({ message }) => {
  return (
    <div className={`message ${message.role}`}>
      <div className="message-content">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
    </div>
  );
});

const Chatbot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const { user } = useContext(AuthContext);

  // Use refs for values that don't need to trigger re-renders
  const loadingRef = useRef(false);

  // Session setup
  useEffect(() => {
    if (user) {
      const storedSessionId =
        localStorage.getItem(`chatbot_session_${user.uid}`) ||
        `session_${user.uid}_${Date.now()}`;
      setSessionId(storedSessionId);
      localStorage.setItem(`chatbot_session_${user.uid}`, storedSessionId);
    }
  }, [user]);

  // Updated message listener for new document structure
  useEffect(() => {
    if (!sessionId || !isOpen) return;

    console.log("👂 Setting up listener for session:", sessionId);

    const q = query(
      collection(db, "chats"),
      where("sessionId", "==", sessionId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("📨 Snapshot received, docs:", snapshot.docs.length);

      const allMessages = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          content: data.content, // Now a single 'content' field
          role: data.role, // Now an explicit 'role' field
          timestamp: data.timestamp,
        };
      });

      // Manual sort by timestamp
      const sorted = allMessages.sort((a, b) => {
        const timeA =
          a.timestamp?.toMillis?.() || new Date(a.timestamp).getTime();
        const timeB =
          b.timestamp?.toMillis?.() || new Date(b.timestamp).getTime();
        return timeA - timeB;
      });

      console.log("💬 Setting messages:", sorted.length);

      // Batch update - set messages only once
      setMessages(sorted);

      // Use ref to check loading state without causing re-render
      if (loadingRef.current && sorted.some((msg) => msg.role === "model")) {
        console.log("✅ Stopping loading - AI response found");
        setLoading(false);
        loadingRef.current = false;
      }
    });

    return unsubscribe;
  }, [sessionId, isOpen]); // Only depend on sessionId and isOpen

  // Sync loading ref with loading state
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Updated sendMessage function with new structure
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    console.log("📤 Sending message:", userMessage);

    setInput("");
    setLoading(true);
    loadingRef.current = true;

    // 1. Get the current conversation history to pass to the helper
    const history = messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    // 2. Add the NEW user message to the history for the AI call
    history.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    try {
      // SAVE *only* the user message to Firestore (New Structure)
      const userDocRef = await addDoc(collection(db, "chats"), {
        content: userMessage, // The message content
        role: "user", // Explicitly 'user'
        sessionId: sessionId,
        userId: user.uid,
        timestamp: new Date(),
      });

      console.log("✅ User message saved:", userDocRef.id);

      // Pass history to the helper
      await sendChatMessage(history, userDocRef.id, sessionId, user.uid);
    } catch (error) {
      console.error("❌ Error sending message:", error);
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // Simple clear chat
  const clearChat = () => {
    setMessages([]);
    setLoading(false);
    loadingRef.current = false;
    if (user) {
      const newSessionId = `session_${user.uid}_${Date.now()}`;
      setSessionId(newSessionId);
      localStorage.setItem(`chatbot_session_${user.uid}`, newSessionId);
    }
  };

  // Simple input handler
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  // Simple suggested question handler
  const handleSuggestedQuestion = (question) => {
    setInput(question);
  };

  if (!isOpen) return null;

  return (
    <div className="chatbot-overlay" onClick={onClose}>
      <div className="chatbot-container" onClick={(e) => e.stopPropagation()}>
        <div className="chatbot-header">
          <div className="chatbot-title">
            <span className="chatbot-icon">🤖</span>
            <h3>Chat Assistant</h3>
          </div>
          <div className="chatbot-actions">
            <button
              onClick={clearChat}
              className="clear-btn"
              disabled={loading}
            >
              Clear
            </button>
            <button onClick={onClose} className="close-btn">
              ×
            </button>
          </div>
        </div>

        <div className="chatbot-messages">
          {messages.length === 0 && !loading ? (
            <div className="welcome-message">
              <div className="welcome-header">
                <h3>🤖 Hello!</h3>
                <p>How can I help you today?</p>
              </div>
              <div className="suggested-questions">
                <button
                  onClick={() => handleSuggestedQuestion("Hello! Who are you?")}
                >
                  👋 Introduction
                </button>
                <button
                  onClick={() =>
                    handleSuggestedQuestion("What can you help me with?")
                  }
                >
                  ❓ Help
                </button>
                <button
                  onClick={() => handleSuggestedQuestion("Tell me a joke")}
                >
                  😄 Joke
                </button>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <Message key={message.id} message={message} />
            ))
          )}

          {loading && (
            <div className="message model loading">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="chatbot-input">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="send-btn"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
