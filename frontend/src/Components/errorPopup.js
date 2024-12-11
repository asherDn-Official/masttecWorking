import React from "react";
import "../App.css"; // Import your CSS file for styling

const ErrorPopup = ({ error }) => {
  if (!error) return null; // Don't render if there's no error

  return <div className="error-popup">{error}</div>;
};

export default ErrorPopup;
