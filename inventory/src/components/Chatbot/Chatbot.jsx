import React, { useState, useEffect, useRef, useContext } from "react";
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
import { useFirestoreContext } from "./ChatbotLogic";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import ReactMarkdown from "react-markdown";
import "./Chatbot.scss";

const Chatbot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useContext(AuthContext);
  const { firestoreContext, loading: contextLoading } =
    useFirestoreContext(user);

  // Debug: Log context changes
  useEffect(() => {
    console.log("🔄 FirestoreContext updated:", {
      hasContext: !!firestoreContext,
      totalProducts: firestoreContext?.totalProducts,
      loading: contextLoading,
    });
  }, [firestoreContext, contextLoading]);

  // Setup sessionId
  useEffect(() => {
    if (user) {
      const storedSessionId =
        localStorage.getItem(`chatbot_session_${user.uid}`) ||
        `session_${user.uid}_${Date.now()}`;
      setSessionId(storedSessionId);
      localStorage.setItem(`chatbot_session_${user.uid}`, storedSessionId);
      console.log("🔑 Session ID set:", storedSessionId);
    }
  }, [user]);

  // Listen for messages
  useEffect(() => {
    if (!sessionId || !isOpen) return;

    console.log("👂 Setting up message listener for session:", sessionId);

    const q = query(
      collection(db, "chats"),
      where("sessionId", "==", sessionId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("📨 Snapshot update, documents:", snapshot.docs.length);
        const chatMessages = [];

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          console.log("📄 Document:", doc.id, {
            hasPrompt: !!data.prompt,
            hasResponse: !!data.response,
            state: data.state,
          });

          if (data.prompt && data.prompt.trim()) {
            chatMessages.push({
              id: doc.id + "_user",
              content: data.prompt,
              role: "user",
              timestamp: data.timestamp,
              docId: doc.id,
            });
          }

          if (data.response && data.response.trim()) {
            chatMessages.push({
              id: doc.id + "_ai",
              content: data.response,
              role: "model",
              timestamp:
                data.status?.completeTime || data.timestamp || new Date(),
              docId: doc.id,
            });
          }
        });

        const sortedMessages = chatMessages.sort((a, b) => {
          const timeA =
            a.timestamp?.toMillis?.() || new Date(a.timestamp).getTime();
          const timeB =
            b.timestamp?.toMillis?.() || new Date(b.timestamp).getTime();
          return timeA - timeB;
        });

        console.log("💬 Sorted messages count:", sortedMessages.length);
        setMessages(sortedMessages);

        if (sortedMessages.length > 0 && loading) {
          const hasAIResponse = sortedMessages.some(
            (msg) => msg.role === "model"
          );
          if (hasAIResponse) {
            console.log("✅ Loading complete - AI response received");
            setLoading(false);
          }
        }
      },
      (error) => {
        console.error("❌ Error in chat listener:", error);
        setLoading(false);
      }
    );

    return () => {
      console.log("🧹 Cleaning up message listener");
      unsubscribe();
    };
  }, [sessionId, isOpen, loading]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send message with enhanced debugging
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || !user || loading) return;

    const userMessage = input.trim();
    console.log("📤 Sending message:", userMessage);
    console.log("🔍 Context check:", {
      hasFirestoreContext: !!firestoreContext,
      totalProducts: firestoreContext?.totalProducts,
      productsCount: firestoreContext?.products?.length,
    });

    setInput("");
    setLoading(true);

    try {
      // Save user message
      const docRef = await addDoc(collection(db, "chats"), {
        prompt: userMessage,
        enhancedPrompt: "",
        sessionId: sessionId,
        userId: user.uid,
        timestamp: new Date(),
        state: "PENDING",
      });

      console.log("✅ User message saved with ID:", docRef.id);

      // Get AI response
      await sendChatMessage(userMessage, firestoreContext, sessionId, user);
    } catch (error) {
      console.error("❌ Error sending message:", error);
      setLoading(false);
    }
  };

  // Markdown message renderer
  const SafeMessage = ({ message, index }) => {
    const markdownComponents = {
      p: ({ children }) => (
        <p style={{ margin: "8px 0", lineHeight: "1.5" }}>{children}</p>
      ),
      strong: ({ children }) => (
        <strong style={{ fontWeight: "700", color: "#2c5aa0" }}>
          {children}
        </strong>
      ),
      em: ({ children }) => (
        <em style={{ fontStyle: "italic", color: "#6c757d" }}>{children}</em>
      ),
      ul: ({ children }) => (
        <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>{children}</ul>
      ),
      ol: ({ children }) => (
        <ol style={{ paddingLeft: "20px", margin: "8px 0" }}>{children}</ol>
      ),
      li: ({ children }) => (
        <li style={{ margin: "4px 0", lineHeight: "1.4" }}>{children}</li>
      ),
    };

    const formatTime = (timestamp) => {
      try {
        if (timestamp?.toDate) {
          return timestamp.toDate().toLocaleTimeString();
        }
        return new Date(timestamp).toLocaleTimeString();
      } catch {
        return "Just now";
      }
    };

    return (
      <div key={message.id || index} className={`message ${message.role}`}>
        <div className="message-content">
          <ReactMarkdown components={markdownComponents}>
            {String(message.content || "")}
          </ReactMarkdown>
        </div>
        <div className="message-time">{formatTime(message.timestamp)}</div>
      </div>
    );
  };

  const clearChat = () => {
    console.log("🗑️ Clearing chat");
    setMessages([]);
    setLoading(false);
    if (user) {
      const newSessionId = `session_${user.uid}_${Date.now()}`;
      setSessionId(newSessionId);
      localStorage.setItem(`chatbot_session_${user.uid}`, newSessionId);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 300);
  };

  if (!isOpen) return null;

  return (
    <div className="chatbot-overlay" onClick={handleClose}>
      <div
        className={`chatbot-container ${isClosing ? "closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="chatbot-header">
          <div className="chatbot-title">
            <span className="chatbot-icon">🤖</span>
            <h3>Firestore Assistant</h3>
            {firestoreContext && (
              <span className="context-info">
                Live: {firestoreContext.totalProducts} products
              </span>
            )}
          </div>
          <div className="chatbot-actions">
            <button
              onClick={clearChat}
              className="clear-btn"
              disabled={loading}
            >
              CLEAR
            </button>
            <button
              onClick={handleClose}
              className="close-btn"
              disabled={loading}
            >
              ×
            </button>
          </div>
        </div>

        {/* Database Status Bar */}
        {firestoreContext && (
          <div className="database-status-bar">
            <div className="status-item">
              <span className="status-icon">📦</span>
              <span>{firestoreContext.totalProducts} products</span>
            </div>
            <div className="status-item">
              <span className="status-icon">🛒</span>
              <span>{firestoreContext.totalOrders} orders</span>
            </div>
            <div className="status-item">
              <span className="status-icon">⚠️</span>
              <span>{firestoreContext.lowStockCount} low stock</span>
            </div>
            <div className="status-item">
              <span className="status-icon">👥</span>
              <span>{firestoreContext.totalCustomers} customers</span>
            </div>
          </div>
        )}

        <div className="chatbot-messages">
          {messages.length === 0 && !loading ? (
            <div className="welcome-message">
              <div className="welcome-header">
                <h3>🤖 Firestore Database Assistant</h3>
                <p>I have real-time access to your inventory system</p>
              </div>

              {firestoreContext ? (
                <div className="database-overview">
                  <p>
                    <strong>Current Database Status:</strong>
                  </p>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <span className="stat-number">
                        {firestoreContext.totalProducts}
                      </span>
                      <span className="stat-label">Total Products</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-number">
                        {firestoreContext.totalOrders}
                      </span>
                      <span className="stat-label">Orders</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-number">
                        {firestoreContext.lowStockCount}
                      </span>
                      <span className="stat-label">Low Stock</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-number">
                        {firestoreContext.totalCustomers}
                      </span>
                      <span className="stat-label">Customers</span>
                    </div>
                  </div>

                  {firestoreContext.lowStockCount > 0 && (
                    <div className="alert-section">
                      <p>
                        ⚠️ <strong>Attention Needed:</strong>{" "}
                        {firestoreContext.lowStockCount} items are low in stock
                      </p>
                    </div>
                  )}

                  <div className="suggested-questions">
                    <p>
                      <strong>Ask me about:</strong>
                    </p>
                    <button
                      onClick={() =>
                        setInput("What is my current inventory status?")
                      }
                    >
                      📊 Inventory Overview
                    </button>
                    <button
                      onClick={() =>
                        setInput("Which items need reordering right now?")
                      }
                    >
                      🔄 Reorder Suggestions
                    </button>
                    <button
                      onClick={() => setInput("How are my sales performing?")}
                    >
                      📈 Sales Analysis
                    </button>
                    <button
                      onClick={() =>
                        setInput("How can I optimize my inventory management?")
                      }
                    >
                      💡 Optimization Tips
                    </button>
                  </div>
                </div>
              ) : contextLoading ? (
                <p>🔄 Loading database connection...</p>
              ) : (
                <p>❌ Unable to connect to database</p>
              )}
            </div>
          ) : (
            messages.map((message, index) => (
              <SafeMessage key={index} message={message} index={index} />
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
                <div style={{ fontSize: "12px", marginTop: "5px" }}>
                  Analyzing your inventory data...
                  {firestoreContext &&
                    ` (${firestoreContext.totalProducts} products)`}
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
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about inventory, products, or orders..."
            disabled={loading || contextLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || contextLoading}
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
