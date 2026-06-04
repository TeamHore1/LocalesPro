import React from "react";
import { createPortal } from "react-dom";
import "./Modal.css";
import Button from "./Button";

const Modal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  variant = "danger", // default danger untuk void/hapus
  showCancel = true,
  children,
}) => {
  if (!isOpen || typeof document === "undefined") return null;

  const handleOverlayClick = (event) => {
    // Only trigger action if clicking directly on overlay, not on modal content
    if (event.target === event.currentTarget && showCancel && onCancel) {
      onCancel();
    }
  };

  const modalMarkup = (
    <div
      className="app-modal-overlay"
      role="presentation"
      onClick={handleOverlayClick}
    >
      <div
        className="app-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="app-modal-header">
          <h3 id="app-modal-title">{title}</h3>
        </div>
        <div className="app-modal-body">
          <p>{message}</p>
          {children}
        </div>
        <div className="app-modal-footer">
          {showCancel && (
            <Button variant="outline" onClick={onCancel}>
              {cancelText}
            </Button>
          )}
          <Button variant={variant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalMarkup, document.body);
};

export default Modal;
