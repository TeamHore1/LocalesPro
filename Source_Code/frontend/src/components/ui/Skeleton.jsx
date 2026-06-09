import React from "react";
import "./Skeleton.css";

export const Skeleton = ({ className = "" }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="skeleton-table" aria-label="Memuat data">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="skeleton-table-row">
        {Array.from({ length: columns }).map((__, columnIndex) => (
          <Skeleton key={columnIndex} className="skeleton-cell" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeletonGrid = ({ count = 4 }) => (
  <div className="skeleton-card-grid" aria-label="Memuat ringkasan">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="skeleton-card">
        <Skeleton className="skeleton-icon" />
        <div className="skeleton-card-copy">
          <Skeleton className="skeleton-line short" />
          <Skeleton className="skeleton-line" />
        </div>
      </div>
    ))}
  </div>
);
