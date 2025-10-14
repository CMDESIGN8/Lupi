// src/components/LoadingSpinner.jsx
import React from "react";
import '../styles/LoadingSpinner.css';

export const LoadingSpinner = ({ message = "Cargando..." }) => {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
};
