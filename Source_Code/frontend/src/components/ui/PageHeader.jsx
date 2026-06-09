import React from "react";
import "./PageHeader.css";

const PageHeader = ({ title, subtitle, eyebrow, actions, meta }) => {
  return (
    <div className="page-header">
      <div className="page-header-copy">
        {eyebrow && <span className="page-header-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {(meta || actions) && (
        <div className="page-header-side">
          {meta && <div className="page-header-meta">{meta}</div>}
          {actions && <div className="page-header-actions">{actions}</div>}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
