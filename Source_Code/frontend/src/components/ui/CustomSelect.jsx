import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import "./CustomSelect.css";

const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = "Pilih opsi",
  disabled = false,
  className = "",
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const normalizedOptions = useMemo(
    () =>
      options.map((option) =>
        typeof option === "string" ? { value: option, label: option } : option,
      ),
    [options],
  );
  const selectedOption = normalizedOptions.find(
    (option) => String(option.value) === String(value),
  );

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handleSelect = (nextValue) => {
    onChange?.(nextValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`custom-select ${isOpen ? "open" : ""} ${
        disabled ? "disabled" : ""
      } ${className}`}
    >
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => !disabled && setIsOpen((current) => !current)}
        disabled={disabled}
        aria-label={ariaLabel || placeholder}
        aria-expanded={isOpen}
      >
        <span>
          <strong>{selectedOption?.label || placeholder}</strong>
          {selectedOption?.description && <small>{selectedOption.description}</small>}
        </span>
        <ChevronDown size={16} strokeWidth={2.4} />
      </button>

      {isOpen && (
        <div className="custom-select-menu">
          {normalizedOptions.map((option) => {
            const isSelected = String(option.value) === String(value);

            return (
              <button
                key={option.value}
                type="button"
                className={isSelected ? "active" : ""}
                onClick={() => handleSelect(option.value)}
              >
                <span>
                  <strong>{option.label}</strong>
                  {option.description && <small>{option.description}</small>}
                </span>
                {isSelected && <Check size={16} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
