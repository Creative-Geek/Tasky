import React from "react";
import { MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH } from "../../constants/validation";

const TaskEditForm = ({ editingTask, setEditingTask, saveEdit }) => {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <input
          type="text"
          className="input w-full"
          value={editingTask.title}
          maxLength={MAX_TITLE_LENGTH}
          onChange={(e) =>
            setEditingTask({
              ...editingTask,
              title: e.target.value,
            })
          }
        />
        {/*keep fr later use*/}
        {/* <div className="flex justify-end text-xs text-gray-500">
          {editingTask.title.length}/{MAX_TITLE_LENGTH} characters
        </div> */}
      </div>
      <div className="space-y-1">
        <textarea
          className="input w-full min-h-[60px]"
          value={editingTask.description}
          maxLength={MAX_DESCRIPTION_LENGTH}
          onChange={(e) =>
            setEditingTask({
              ...editingTask,
              description: e.target.value,
            })
          }
        />
        {/*keep fr later use*/}
        {/* <div className="flex justify-end text-xs text-gray-500">
          {editingTask.description.length}/{MAX_DESCRIPTION_LENGTH}{" "}
          characters
        </div> */}
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
