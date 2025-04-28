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
    <div className="space-y-2 pl-1">
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
        <div
          className="flex justify-end text-xs"
          style={{ color: "var(--text-color)", opacity: 0.6 }}
        >
          {editingTask.title.length}/{MAX_TITLE_LENGTH} characters
        </div>
      </div>
      <div className="space-y-1">
        <textarea
          dir="auto"
          className="w-full min-h-[60px] transition-colors preserve-line-breaks px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2"
          style={{
            backgroundColor: "var(--card-color)",
            color: "var(--text-color)",
            borderColor: "var(--border-color)",
          }}
          value={editingTask.description}
          maxLength={MAX_DESCRIPTION_LENGTH}
          onChange={(e) =>
            setEditingTask({
              ...editingTask,
              description: e.target.value,
            })
          }
        />
        <div
          className="flex justify-end text-xs"
          style={{ color: "var(--text-color)", opacity: 0.6 }}
        >
          {editingTask.description.length}/{MAX_DESCRIPTION_LENGTH} characters
        </div>
      </div>
      <div className="flex justify-end mt-2 space-x-2">
        <button
          onClick={() => setEditingTask(null)}
          className="px-4 py-2 rounded-md transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            backgroundColor: "var(--secondary-color)",
            color: "var(--text-color)",
          }}
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
