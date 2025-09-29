import React, { useState, useEffect, useRef, useContext } from "react";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../../Firebase/firebase";
import { AuthContext } from "../../context/AuthContext";
import { sendChatMessage } from "./ChatbotHelper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import ReactMarkdown from "react-markdown";
import "./Chatbot.scss";

const Chatbot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const { user } = useContext(AuthContext);

  // Session setup
  useEffect(() => {
    if (user && !sessionId) {
      const newSessionId = `session_${user.uid}_${Date.now()}`;
      setSessionId(newSessionId);
      console.log("🔑 New session created:", newSessionId);
    }
  }, [user, sessionId]);

  // DEBUG: Message listener
  useEffect(() => {
    if (!sessionId || !isOpen) return;

    console.log("🎯 STARTING LISTENER for session:", sessionId);

    const q = query(
      collection(db, "chats"),
      where("sessionId", "==", sessionId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("🔥 SNAPSHOT UPDATE - Documents:", snapshot.docs.length);

        const chatMessages = [];
        let foundCompletedAI = false;

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const docId = doc.id;

          console.log("📄 DOCUMENT ANALYSIS:", {
            docId: docId,
            prompt: data.prompt?.substring(0, 30),
            response: data.response?.substring(0, 30),
            state: data.state,
            timestamp: data.timestamp?.toDate?.() || data.timestamp,
          });

          // Add user message
          if (data.prompt && data.prompt.trim()) {
            chatMessages.push({
              id: docId + "_user",
              content: data.prompt,
              role: "user",
              timestamp: data.timestamp,
              docId: docId,
              state: data.state,
            });
            console.log("👤 ADDED USER MESSAGE");
          }

          // Add AI message - SIMPLIFIED: just check if response exists
          if (data.response && data.response.trim()) {
            chatMessages.push({
              id: docId + "_ai",
              content: data.response,
              role: "model",
              timestamp: data.timestamp,
              docId: docId,
              state: data.state,
            });
            console.log("🤖 ADDED AI MESSAGE");
            if (data.state === "COMPLETED") {
              foundCompletedAI = true;
            }
          }
        });

        // Remove duplicates
        const uniqueMessages = chatMessages.filter(
          (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
        );

        // Sort by timestamp
        const sortedMessages = uniqueMessages.sort((a, b) => {
          const timeA =
            a.timestamp?.toMillis?.() || new Date(a.timestamp).getTime();
          const timeB =
            b.timestamp?.toMillis?.() || new Date(b.timestamp).getTime();
          return timeA - timeB;
        });

        console.log("💬 FINAL MESSAGES ARRAY:", {
          total: sortedMessages.length,
          userMessages: sortedMessages.filter((m) => m.role === "user").length,
          aiMessages: sortedMessages.filter((m) => m.role === "model").length,
          messages: sortedMessages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content?.substring(0, 40),
            state: m.state,
          })),
        });

        setMessages(sortedMessages);

        // Stop loading if we found completed AI messages
        if (loading && foundCompletedAI) {
          console.log("🛑 STOPPING LOADING - Found completed AI response");
          setLoading(false);
        } else if (loading) {
          console.log("🔄 STILL LOADING - No completed AI response found");
        }
      },
      (error) => {
        console.error("💥 FIRESTORE ERROR:", error);
        setLoading(false);
      }
    );

    return () => {
      console.log("🧹 Cleaning up listener");
      unsubscribe();
    };
  }, [sessionId, isOpen, loading]);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading || !sessionId) return;

    const userMessage = input.trim();
    console.log("🚀 SENDING MESSAGE:", userMessage);

    setInput("");
    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, "chats"), {
        prompt: userMessage,
        response: "",
        sessionId: sessionId,
        userId: user.uid,
        timestamp: new Date(),
        state: "PENDING",
      });

      console.log("✅ USER MESSAGE SAVED:", docRef.id);

      await sendChatMessage(userMessage, sessionId, user, docRef.id);
    } catch (error) {
      console.error("❌ SEND MESSAGE ERROR:", error);
      setLoading(false);
    }
  };

  // Message component
  const Message = ({ message }) => {
    return (
      <div className={`message ${message.role}`}>
        <div className="message-content">
          <ReactMarkdown>{String(message.content || "")}</ReactMarkdown>
        </div>
        <div className="message-debug">
          {message.role} | {message.state} | {message.id}
        </div>
      </div>
    );
  };

  const clearChat = () => {
    console.log("🗑️ CLEARING CHAT");
    setMessages([]);
    setLoading(false);
    if (user) {
      const newSessionId = `session_${user.uid}_${Date.now()}`;
      setSessionId(newSessionId);
    }
  };

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
            <h3>Chat Assistant [DEBUG]</h3>
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
                <p style={{ fontSize: "12px", color: "#666" }}>
                  Session: {sessionId}
                </p>
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
                <div style={{ fontSize: "12px", marginTop: "5px" }}>
                  Loading... (check console)
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
