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
}) => {
  return (
    <div className="card p-4">
      <h2 className="text-lg font-medium text-gray-700 mb-3">Add New Task</h2>
      <div className="space-y-3">
        <div className="space-y-1">
          <input
            dir="auto"
            type="text"
            placeholder="Task title"
            className="input w-full"
            value={newTaskTitle}
            maxLength={MAX_TITLE_LENGTH}
            onChange={(e) => setNewTaskTitle(e.target.value)}
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
            className="input w-full min-h-[80px]"
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
          className="btn btn-primary flex items-center justify-center"
          disabled={!newTaskTitle.trim() || isCreatingTask} // Disable button when loading or title is empty
        >
          {isCreatingTask ? (
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
