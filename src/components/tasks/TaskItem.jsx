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
  pendingOperation,
  isOffline,
}) => {
  const nodeRef = React.useRef(null);
  const [editTitleError, setEditTitleError] = useState(false);
  const [isCompletingTask, setIsCompletingTask] = useState(false);
  const [isUncompletingTask, setIsUncompletingTask] = useState(false);
  const [showFadingCircle, setShowFadingCircle] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [height, setHeight] = useState(null);

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

    // Measure the height of the task item when it's first rendered
    if (node && !height) {
      setHeight(node.offsetHeight);
    }
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

  // Determine if this task has a pending operation (but don't show visual indicators)
  const isPending = !!pendingOperation;
  const hasFailed = isPending && pendingOperation.status === "failed";

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
    opacity: isDragging ? 0.5 : task.isTemp ? 0.7 : 1,
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

      // Start the animation sequence for visual feedback
      setTimeout(() => {
        // Show the fading circle after the checkmark disappears
        setShowFadingCircle(true);
        // Reset the animation states after animations complete
        setTimeout(() => {
          setIsUncompletingTask(false);
          // Keep the fading circle visible for a bit longer
          setTimeout(() => {
            setShowFadingCircle(false);
          }, 300);
        }, 100);
      }, 600);
    }

    // Call the original toggle function immediately for both completion and uncompletion
    // This ensures syncing starts right away while animations play
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
      style={{
        ...style,
        backgroundColor:
          task.isDone && !isUncompletingTask
            ? "var(--secondary-color)"
            : "var(--card-color)",
        borderColor: "var(--border-color)",
      }}
      data-dragging={isDragging}
      data-any-dragging={isAnyItemDragging ? "true" : "false"}
      className={`card p-4 transition-all duration-300 ease-in-out ${
        isNewTask ? "new-task-animation" : ""
      } ${isDeleting ? "delete-task-animation" : ""}`}
    >
      {/* Status indicators removed to make interaction seamless */}
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
          <div className="flex items-start pl-1">
            <div className="flex items-start space-x-3 flex-grow min-w-0">
              <button
                onClick={handleTaskCompletion}
                className="mt-1 flex-shrink-0"
              >
                {task.isDone || isUncompletingTask ? (
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
                      isCompletingTask || isUncompletingTask
                        ? { strokeDasharray: "100" }
                        : {}
                    }
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12l3 3 6-6" />
                  </svg>
                ) : (
                  <div
                    className={`h-5 w-5 rounded-full border-2 border-gray-300 hover:border-indigo-500 transition-all ${
                      showFadingCircle ? "fade-in-circle" : ""
                    }`}
                  />
                )}
              </button>
              <div className="min-w-0 flex-grow overflow-hidden">
                <h3
                  dir="auto"
                  className="text-lg font-medium break-words overflow-hidden transition-all duration-300 ease-in-out"
                  style={{
                    color:
                      task.isDone && !isUncompletingTask
                        ? "var(--text-color)"
                        : "var(--text-color)",
                    opacity: task.isDone && !isUncompletingTask ? 0.6 : 1,
                  }}
                >
                  {task.isDone || isUncompletingTask ? (
                    <span
                      className={
                        isCompletingTask
                          ? "strikethrough-animation"
                          : isUncompletingTask
                          ? "unstrikethrough-animation"
                          : task.isDone
                          ? "line-through"
                          : ""
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
                    className="mt-1 text-sm break-words overflow-hidden transition-all duration-300 ease-in-out"
                    style={{
                      color: "var(--text-color)",
                      opacity: task.isDone && !isUncompletingTask ? 0.5 : 0.8,
                    }}
                  >
                    {task.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-1 flex-shrink-0 ml-2">
              {/* Syncing indicators removed to make interaction seamless */}
              {/* Always show drag handle if not offline */}
              {!isOffline && (
                <div
                  {...attributes}
                  {...listeners}
                  className="p-1 rounded-full cursor-move transition-colors"
                  style={{
                    color: "var(--text-color)",
                    opacity: 0.5,
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = "0.5")}
                >
                  <ArrowsUpDownIcon className="h-5 w-5" />
                </div>
              )}
              {/* Always show edit button */}
              <button
                onClick={() => startEditing(task)}
                disabled={isOffline}
                className="p-1 rounded-full transition-colors"
                style={{
                  color: isOffline ? "var(--text-color)" : "var(--text-color)",
                  opacity: isOffline ? 0.3 : 0.5,
                  cursor: isOffline ? "not-allowed" : "pointer",
                }}
                onMouseOver={(e) =>
                  !isOffline && (e.currentTarget.style.opacity = "0.8")
                }
                onMouseOut={(e) =>
                  !isOffline && (e.currentTarget.style.opacity = "0.5")
                }
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              {/* Always show delete button */}
              <button
                onClick={() => {
                  // Start the delete animation
                  setIsDeleting(true);
                  // Wait for animation to complete before actually deleting
                  setTimeout(() => {
                    handleDeleteTask(task.id);
                  }, 500); // Match animation duration
                }}
                disabled={isOffline || isDeleting}
                className="p-1 rounded-full transition-colors"
                style={{
                  color:
                    isOffline || isDeleting
                      ? "var(--text-color)"
                      : "var(--text-color)",
                  opacity: isOffline || isDeleting ? 0.3 : 0.5,
                  cursor: isOffline || isDeleting ? "not-allowed" : "pointer",
                }}
                onMouseOver={(e) =>
                  !isOffline &&
                  !isDeleting &&
                  ((e.currentTarget.style.opacity = "0.8"),
                  (e.currentTarget.style.color = "#ef4444"))
                }
                onMouseOut={(e) =>
                  !isOffline &&
                  !isDeleting &&
                  ((e.currentTarget.style.opacity = "0.5"),
                  (e.currentTarget.style.color = "var(--text-color)"))
                }
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
