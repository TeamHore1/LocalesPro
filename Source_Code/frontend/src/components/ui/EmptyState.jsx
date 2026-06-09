import React from "react";
import Button from "./Button";
import "./EmptyState.css";

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
  className = "",
}) => (
  <div className={`empty-state empty-state-${variant} ${className}`.trim()}>
    {Icon && (
      <div className="empty-state-icon" aria-hidden="true">
        <Icon size={24} strokeWidth={2.3} />
      </div>
    )}
    <div className="empty-state-copy">
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
    {actionLabel && onAction && (
      <Button
        type="button"
        variant={variant === "error" ? "outline" : "primary"}
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
