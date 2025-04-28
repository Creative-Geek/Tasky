import React from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import {
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from "../../constants/validation";

const TaskForm = ({
  newTaskTitle,
  setNewTaskTitle,
  newTaskDescription,
  setNewTaskDescription,
  handleCreateTask,
  isCreatingTask,
  titleError, // Receive titleError state
  setTitleError, // Receive function to reset titleError
  isOffline = false, // Whether the app is offline
}) => {
  return (
    <div className="card p-4">
      <h2
        className="text-lg font-medium mb-3"
        style={{ color: "var(--text-color)" }}
      >
        Add New Task
      </h2>
      <div className="space-y-3">
        <div className="space-y-1">
          <input
            dir="auto"
            type="text"
            placeholder={titleError ? "Title is required" : "Task title"} // Conditional placeholder
            className="w-full transition-colors duration-300 ease-in-out px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2"
            style={{
              backgroundColor: "var(--card-color)",
              color: "var(--text-color)",
              borderColor: titleError
                ? "var(--error-color)"
                : "var(--border-color)",
              boxShadow: titleError ? "0 0 0 1px var(--error-color)" : "none",
            }}
            value={newTaskTitle}
            maxLength={MAX_TITLE_LENGTH}
            onChange={(e) => {
              setNewTaskTitle(e.target.value);
              if (titleError) {
                setTitleError(false); // Reset error on change
              }
            }}
          />
          {/*keep fr later use*/}
          {/* <div className="flex justify-end text-xs text-gray-500">
            {newTaskTitle.length}/{MAX_TITLE_LENGTH} characters
          </div> */}
        </div>
        <div className="space-y-1">
          <textarea
            dir="auto"
            placeholder="Task description (optional)"
            className="w-full min-h-[80px] transition-colors px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2"
            style={{
              backgroundColor: "var(--card-color)",
              color: "var(--text-color)",
              borderColor: "var(--border-color)",
            }}
            value={newTaskDescription}
            maxLength={MAX_DESCRIPTION_LENGTH}
            onChange={(e) => setNewTaskDescription(e.target.value)}
          />
          {/*keep fr later use*/}
          {/* <div className="flex justify-end text-xs text-gray-500">
            {newTaskDescription.length}/{MAX_DESCRIPTION_LENGTH} characters
          </div> */}
        </div>
        <button
          onClick={handleCreateTask}
          className={`btn flex items-center justify-center ${
            isOffline
              ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
              : "btn-primary"
          }`}
          disabled={isCreatingTask || isOffline} // Disable when creating task or offline
        >
          {isOffline ? (
            <>
              <svg
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Offline
            </>
          ) : isCreatingTask ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Adding...
            </>
          ) : (
            <>
              <PlusIcon className="h-5 w-5 mr-1" />
              Add Task
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TaskForm;
