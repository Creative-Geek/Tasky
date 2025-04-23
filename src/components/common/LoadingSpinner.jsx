import React from "react";

const LoadingSpinner = ({ size = "medium", className = "" }) => {
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-12 w-12",
    large: "h-16 w-16",
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`animate-spin rounded-full ${
          sizeClasses[size] || sizeClasses.medium
        } border-t-2 border-b-2 border-indigo-500`}
      ></div>
    </div>
  );
};

export default LoadingSpinner;
