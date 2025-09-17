import React from "react";
import "../../styles/confirm-modal.scss";

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{message}</h3>
        <div className="modal-actions">
          <button className="btn-yes" onClick={onConfirm}>
            Yes
          </button>
          <button className="btn-no" onClick={onCancel}>
            No
          </button>
        </div>
      </div>
    </div>
  );
}
