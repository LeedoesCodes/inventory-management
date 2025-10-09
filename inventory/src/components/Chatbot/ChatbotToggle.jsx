import React from "react";
import "./ChatbotToggle.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";

const ChatbotToggle = ({ onClick, isOpen }) => {
  return (
    <button
      className={`chatbot-toggle ${isOpen ? "open" : ""}`}
      onClick={onClick}
      title="Chat with AI Assistant"
    >
      <FontAwesomeIcon icon={faRobot} className="btn-icon" />
      <span className="chatbot-toggle-text">Assistant</span>
    </button>
  );
};

export default ChatbotToggle;
