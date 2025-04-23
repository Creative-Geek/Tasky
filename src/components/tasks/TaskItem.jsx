import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  TrashIcon,
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
  isNewTask,
}) => {
  const nodeRef = React.useRef(null);
  const [editTitleError, setEditTitleError] = useState(false);
  const [isCompletingTask, setIsCompletingTask] = useState(false);
  const [isUncompletingTask, setIsUncompletingTask] = useState(false);

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

  // Handle task completion/uncompletion with animation
  const handleTaskCompletion = () => {
    if (!task.isDone) {
      // Animate when marking as complete
      setIsCompletingTask(true);
      // Reset the animation state after animations complete
      setTimeout(() => {
        setIsCompletingTask(false);
      }, 900); // Slightly longer than all animations combined
    } else {
      // Animate when unchecking
      setIsUncompletingTask(true);
      // Call the original toggle function after a slight delay
      // to ensure the animation plays before the state changes
      setTimeout(() => {
        handleToggleTask(task);
        // Reset the animation state after animations complete
        setTimeout(() => {
          setIsUncompletingTask(false);
        }, 100);
      }, 600);
      return; // Don't call handleToggleTask immediately
    }
    // Call the original toggle function immediately for completion
    handleToggleTask(task);
  };

  const handleSaveEdit = () => {
    if (!editingTask.title || editingTask.title.trim() === "") {
      setEditTitleError(true); // Set error if title is empty
      return; // Prevent saving
    }
    setEditTitleError(false); // Clear error if title is valid
    saveEdit(); // Proceed with saving
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-dragging={isDragging}
      data-any-dragging={isAnyItemDragging ? "true" : "false"}
      className={`card p-4 transition-colors ${
        task.isDone ? "bg-gray-50 border-gray-200" : ""
      } ${isNewTask ? "new-task-animation" : ""}`}
    >
      {editingTask && editingTask.id === task.id ? (
        <TaskEditForm
          editingTask={editingTask}
          setEditingTask={setEditingTask}
          saveEdit={handleSaveEdit}
          titleError={editTitleError}
          setTitleError={setEditTitleError}
        />
      ) : (
        // View mode
        <div>
          <div className="flex items-start">
            <div className="flex items-start space-x-3 flex-grow min-w-0">
              <button
                onClick={handleTaskCompletion}
                className="mt-1 flex-shrink-0"
              >
                {task.isDone ? (
                  <svg
                    className={`h-5 w-5 text-green-500 ${
                      isCompletingTask
                        ? "checkmark-animation"
                        : isUncompletingTask
                        ? "uncheckmark-animation"
                        : ""
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={
                      isCompletingTask
                        ? { strokeDasharray: "100" }
                        : isUncompletingTask
                        ? { strokeDasharray: "100" }
                        : {}
                    }
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12l3 3 6-6" />
                  </svg>
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 hover:border-indigo-500 transition-colors" />
                )}
              </button>
              <div className="min-w-0 flex-grow overflow-hidden">
                <h3
                  dir="auto"
                  className={`text-lg font-medium break-words overflow-hidden transition-all ${
                    task.isDone ? "text-gray-500" : "text-gray-800"
                  }`}
                >
                  {task.isDone ? (
                    <span
                      className={
                        isCompletingTask
                          ? "strikethrough-animation"
                          : isUncompletingTask
                          ? "unstrikethrough-animation"
                          : "line-through"
                      }
                    >
                      {task.title}
                    </span>
                  ) : (
                    task.title
                  )}
                </h3>
                {task.description && (
                  <p
                    dir="auto"
                    className={`mt-1 text-sm break-words overflow-hidden transition-colors ${
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
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-move transition-colors"
              >
                <ArrowsUpDownIcon className="h-5 w-5" />
              </div>

              <button
                onClick={() => startEditing(task)}
                className="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100 transition-colors"
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
