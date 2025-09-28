import React from "react";
import "./ChatbotToggle.scss";

const ChatbotToggle = ({ onClick, isOpen }) => {
  return (
    <button
      className={`chatbot-toggle ${isOpen ? "open" : ""}`}
      onClick={onClick}
      title="Chat with AI Assistant"
    >
      <span className="chatbot-toggle-icon">🤖</span>
      <span className="chatbot-toggle-text">AI Assistant</span>
    </button>
  );
};

export default ChatbotToggle;
