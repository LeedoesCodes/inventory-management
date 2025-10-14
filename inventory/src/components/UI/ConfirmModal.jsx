import React from "react";
import "../../styles/confirm-modal.scss";

export default function ConfirmModal({
  message,
  children,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // 'danger', 'warning', 'success'
  isLoading = false,
  confirmDisabled = false,
}) {
  const modalClass = `confirm-${type}`;

  return (
    <div className={`modal-overlay ${modalClass}`}>
      <div className="modal">
        {typeof message === "string" ? <h3>{message}</h3> : message}

        {children && <div className="modal-extra">{children}</div>}

        <div className={`modal-actions actions-${type}`}>
          <button
            className={`btn-cancel ${isLoading ? "loading" : ""}`}
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={`btn-confirm ${isLoading ? "loading" : ""}`}
            onClick={onConfirm}
            disabled={isLoading || confirmDisabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
