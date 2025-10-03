import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import "../../styles/SuccessAnimation.scss";

const SuccessAnimation = ({ isVisible, onComplete }) => {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        if (onComplete) onComplete();
      }, 2000); // Hide after 2 seconds

      return () => clearTimeout(timer);
    } else {
      setShouldRender(false);
    }
  }, [isVisible, onComplete]);

  if (!shouldRender) return null;

  return (
    <div className="success-animation-overlay">
      <div className="success-animation-content">
        <div className="success-icon">
          <FontAwesomeIcon icon={faCheckCircle} />
        </div>
        <h2>Order Confirmed!</h2>
        <p>Your order has been successfully processed</p>
      </div>
    </div>
  );
};

export default SuccessAnimation;
