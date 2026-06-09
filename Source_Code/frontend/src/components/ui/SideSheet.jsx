import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "./SideSheet.css";

const SideSheet = ({
  isOpen,
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = "560px",
  className = "",
  overlayClassName = "",
}) => {
  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return createPortal(
    <div
      className={`sheet-overlay ${overlayClassName}`.trim()}
      role="presentation"
      onMouseDown={handleOverlayMouseDown}
    >
      <section
        className={`side-sheet ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="side-sheet-title"
        style={{ "--sheet-width": width }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="side-sheet-header">
          <div>
            <h2 id="side-sheet-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            type="button"
            className="side-sheet-close"
            onClick={onClose}
            aria-label="Tutup panel"
          >
            <X size={20} strokeWidth={2.3} />
          </button>
        </header>

        <div className="side-sheet-body">{children}</div>

        {footer && <footer className="side-sheet-footer">{footer}</footer>}
      </section>
    </div>,
    document.body,
  );
};

export default SideSheet;
