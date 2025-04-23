import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  TrashIcon,
  CheckCircleIcon,
  PencilIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";
import TaskEditForm from "./TaskEditForm";

const TaskItem = ({
  task,
  handleToggleTask,
  startEditing,
  handleDeleteTask,
  editingTask,
  setEditingTask,
  saveEdit,
  activeId,
}) => {
  const nodeRef = React.useRef(null);

  const {
    attributes,
    listeners,
    setNodeRef: setDndNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id: task.id.toString(),
  });

  // Set up a combined ref function that sets both our local ref and the dnd-kit ref
  const setNodeRef = (node) => {
    nodeRef.current = node;
    setDndNodeRef(node);
  };

  // Store the original width when dragging starts
  React.useEffect(() => {
    if (nodeRef.current && isDragging) {
      // Get the current width and store it as a CSS variable
      const width = nodeRef.current.offsetWidth;
      nodeRef.current.style.setProperty("--original-width", `${width}px`);
    }
  }, [isDragging]);

  // Update transform values continuously during dragging
  React.useEffect(() => {
    if (nodeRef.current && isDragging && transform) {
      // Extract transform values
      const { x, y } = transform;
      nodeRef.current.style.setProperty("--x", `${x}px`);
      nodeRef.current.style.setProperty("--y", `${y}px`);
    }
  }, [transform, isDragging]);

  // Determine if this is the active item being dragged
  const isActiveItem = isDragging;
  // Determine if any item is being dragged (but not this one)
  const isAnyItemDragging = activeId !== null;

  const style = {
    // Only apply transform through style when not dragging
    // When dragging, we'll use CSS variables and custom CSS
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    // Use different transition styles based on whether this item is being dragged
    transition: isActiveItem
      ? "transform 0ms" // Direct cursor following with no delay for the dragged item
      : isAnyItemDragging
      ? "transform 250ms cubic-bezier(0.2, 0, 0, 1)" // Smooth animation for other items when something is being dragged
      : "transform 0ms", // No transition when nothing is being dragged
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-dragging={isDragging}
      data-any-dragging={isAnyItemDragging ? "true" : "false"}
      className={`card p-4 transition-all ${
        task.isDone ? "bg-gray-50 border-gray-200" : ""
      }`}
    >
      {editingTask && editingTask.id === task.id ? (
        <TaskEditForm 
          editingTask={editingTask}
          setEditingTask={setEditingTask}
          saveEdit={saveEdit}
        />
      ) : (
        // View mode
        <div>
          <div className="flex items-start">
            <div className="flex items-start space-x-3 flex-grow min-w-0">
              <button
                onClick={() => handleToggleTask(task)}
                className="mt-1 flex-shrink-0"
              >
                {task.isDone ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 hover:border-indigo-500" />
                )}
              </button>
              <div className="min-w-0 flex-grow overflow-hidden">
                <h3
                  className={`text-lg font-medium break-words overflow-hidden ${
                    task.isDone ? "text-gray-500 line-through" : "text-gray-800"
                  }`}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <p
                    className={`mt-1 text-sm break-words overflow-hidden ${
                      task.isDone ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {task.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-1 flex-shrink-0 ml-2">
              <div
                {...attributes}
                {...listeners}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-move"
              >
                <ArrowsUpDownIcon className="h-5 w-5" />
              </div>

              <button
                onClick={() => startEditing(task)}
                className="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
