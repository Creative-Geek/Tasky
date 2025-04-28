import React from "react";

const SkeletonLoader = ({ type = "task", count = 1 }) => {
  const renderTaskSkeleton = () => (
    <div className="card p-4 animate-pulse">
      <div className="flex items-start">
        <div
          className="mt-1 h-5 w-5 rounded-full flex-shrink-0"
          style={{ backgroundColor: "var(--border-color)" }}
        ></div>
        <div className="ml-3 flex-grow min-w-0">
          <div
            className="h-5 rounded w-3/4 mb-2"
            style={{ backgroundColor: "var(--border-color)" }}
          ></div>
          <div
            className="h-4 rounded w-1/2"
            style={{ backgroundColor: "var(--border-color)" }}
          ></div>
        </div>
        <div className="flex space-x-1 ml-2">
          <div
            className="h-7 w-7 rounded-full"
            style={{ backgroundColor: "var(--border-color)" }}
          ></div>
          <div
            className="h-7 w-7 rounded-full"
            style={{ backgroundColor: "var(--border-color)" }}
          ></div>
          <div
            className="h-7 w-7 rounded-full"
            style={{ backgroundColor: "var(--border-color)" }}
          ></div>
        </div>
      </div>
    </div>
  );

  const renderFormSkeleton = () => (
    <div className="card p-4 animate-pulse">
      <div
        className="h-6 rounded w-1/4 mb-3"
        style={{ backgroundColor: "var(--border-color)" }}
      ></div>
      <div
        className="h-10 rounded w-full mb-3"
        style={{ backgroundColor: "var(--border-color)" }}
      ></div>
      <div
        className="h-20 rounded w-full mb-3"
        style={{ backgroundColor: "var(--border-color)" }}
      ></div>
      <div className="flex justify-end">
        <div
          className="h-10 rounded w-1/4"
          style={{ backgroundColor: "var(--border-color)" }}
        ></div>
      </div>
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case "task":
        return renderTaskSkeleton();
      case "form":
        return renderFormSkeleton();
      default:
        return renderTaskSkeleton();
    }
  };

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
