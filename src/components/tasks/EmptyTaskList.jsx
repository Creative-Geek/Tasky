import React from "react";

const EmptyTaskList = () => {
  return (
    <div className="card p-8 text-center">
      <p className="text-gray-500">
        No tasks yet. Add your first task above!
      </p>
    </div>
  );
};

export default EmptyTaskList;
