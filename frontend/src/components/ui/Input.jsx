import React from "react";
import "./ui.css";

const Input = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
  ...props
}) => {
  return (
    <div className={`input-group-custom ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <input
        type={type}
        className="input-field"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
};

export default Input;
