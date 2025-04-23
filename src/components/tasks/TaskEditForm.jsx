import React from "react";
import {
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from "../../constants/validation";

const TaskEditForm = ({
  editingTask,
  setEditingTask,
  saveEdit,
  titleError, // Add titleError prop
  setTitleError, // Add setTitleError prop
}) => {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <input
          dir="auto"
          type="text"
          placeholder={titleError ? "Title is required" : "Task title"} // Conditional placeholder
          className={`input w-full transition-colors duration-300 ease-in-out ${
            // Add transition classes and conditional red border
            titleError
              ? "border border-red-500 bg-red-50 focus:border-red-500"
              : "focus:border-indigo-500"
          }`}
          value={editingTask.title}
          maxLength={MAX_TITLE_LENGTH}
          onChange={(e) => {
            setEditingTask({
              ...editingTask,
              title: e.target.value,
            });
            if (titleError) {
              setTitleError(false); // Reset error on change
            }
          }}
        />
        <div className="flex justify-end text-xs text-gray-500">
          {editingTask.title.length}/{MAX_TITLE_LENGTH} characters
        </div>
      </div>
      <div className="space-y-1">
        <textarea
          dir="auto"
          className="input w-full min-h-[60px] transition-colors"
          value={editingTask.description}
          maxLength={MAX_DESCRIPTION_LENGTH}
          onChange={(e) =>
            setEditingTask({
              ...editingTask,
              description: e.target.value,
            })
          }
        />
        <div className="flex justify-end text-xs text-gray-500">
          {editingTask.description.length}/{MAX_DESCRIPTION_LENGTH} characters
        </div>
      </div>
      <div className="flex justify-end mt-2 space-x-2">
        <button
          onClick={() => setEditingTask(null)}
          className="btn bg-gray-200 hover:bg-gray-300 text-gray-700"
        >
          Cancel
        </button>
        <button onClick={saveEdit} className="btn btn-primary">
          Save
        </button>
      </div>
    </div>
  );
};

export default TaskEditForm;
