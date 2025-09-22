import React from "react";
import "../../styles/confirm-modal.scss";

export default function ConfirmModal({
  message,
  children,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        {typeof message === "string" ? <h3>{message}</h3> : message}

        {children && <div className="modal-extra">{children}</div>}

        <div className="modal-actions">
          <button className="btn-confirm" onClick={onConfirm}>
            Confirm
          </button>
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
