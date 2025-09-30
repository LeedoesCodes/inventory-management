import React, { useState, useEffect, useRef, useContext } from "react";
// import {
//   collection,
//   addDoc,
//   query,
//   onSnapshot,
//   where,
// } from "firebase/firestore";
// import { db } from "../../Firebase/firebase";
// import { AuthContext } from "../../context/AuthContext";
// import { sendChatMessage } from "./ChatbotHelper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import ReactMarkdown from "react-markdown";
import "./Chatbot.scss";

// Memoized Message component (kept in case you want to re-enable later)
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
  // const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  // const { user } = useContext(AuthContext);

  // Commented out session + Firestore setup
  // useEffect(() => {
  //   if (user) {
  //     const storedSessionId =
  //       localStorage.getItem(`chatbot_session_${user.uid}`) ||
  //       `session_${user.uid}_${Date.now()}`;
  //     setSessionId(storedSessionId);
  //     localStorage.setItem(`chatbot_session_${user.uid}`, storedSessionId);
  //   }
  // }, [user]);

  // Commented out Firestore listener
  // useEffect(() => {
  //   if (!sessionId || !isOpen) return;
  //   const q = query(collection(db, "chats"), where("sessionId", "==", sessionId));
  //   const unsubscribe = onSnapshot(q, (snapshot) => {
  //     const allMessages = snapshot.docs.map((doc) => {
  //       const data = doc.data();
  //       return {
  //         id: doc.id,
  //         content: data.content,
  //         role: data.role,
  //         timestamp: data.timestamp,
  //       };
  //     });
  //     const sorted = allMessages.sort((a, b) => {
  //       const timeA = a.timestamp?.toMillis?.() || new Date(a.timestamp).getTime();
  //       const timeB = b.timestamp?.toMillis?.() || new Date(b.timestamp).getTime();
  //       return timeA - timeB;
  //     });
  //     setMessages(sorted);
  //   });
  //   return unsubscribe;
  // }, [sessionId, isOpen]);

  // Auto-scroll (kept for structure)
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Disabled sendMessage functionality
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Just clear input, no AI/DB logic
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: "🚧 Development paused" },
    ]);
  };

  // Clear chat (kept for structure)
  const clearChat = () => {
    setMessages([]);
    setLoading(false);
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
                <h3>🚧 Chatbot Development Paused</h3>
                <p>The AI integration is temporarily on hold.</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <Message key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="chatbot-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Development paused..."
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
