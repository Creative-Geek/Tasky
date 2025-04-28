import React from "react";

const EmptyTaskList = () => {
  return (
    <div className="card p-8 text-center">
      <p style={{ color: "var(--text-color)", opacity: 0.6 }}>
        No tasks yet. Add your first task above!
      </p>
    </div>
  );
};

export default EmptyTaskList;
