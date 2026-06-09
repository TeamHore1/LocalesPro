import React from "react";
import "./PageLoader.css";

const PageLoader = ({ message = "Memuat data Locales..." }) => {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader-mark">
        <span />
      </div>
      <p>{message}</p>
    </div>
  );
};

export default PageLoader;
