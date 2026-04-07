import React from "react";
import "./ui.css";

const Button = ({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className = "",
  ...props
}) => {
  // variant: primary, danger, success, outline
  return (
    <button
      type={type}
      className={`btn-custom btn-${variant} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
