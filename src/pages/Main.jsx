import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  useQuery,
  useAction,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
} from "wasp/client/operations";
import { arrayMove } from "@dnd-kit/sortable";

// Import components
import TaskForm from "../components/tasks/TaskForm";
import TaskList from "../components/tasks/TaskList";
import SkeletonLoader from "../components/common/SkeletonLoader";
import ErrorBoundary from "../components/common/ErrorBoundary";

// Import utilities
import requestQueue from "../utils/requestQueue";

const MainPage = () => {
  const {
    data: queryTasks = [],
    isLoading,
    error,
    refetch,
  } = useQuery(getTasks);

  // Local state for tasks that can be updated immediately during drag
  const [localTasks, setLocalTasks] = useState([]);
  // Track the currently dragged task ID
  const [activeId, setActiveId] = useState(null);
  // Track newly created task for animation
  const [newTaskId, setNewTaskId] = useState(null);
  // Track pending operations
  const [pendingOperations, setPendingOperations] = useState({});
  // Track if we're in offline mode
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  // Track if we're showing skeleton loaders
  const [showSkeletons, setShowSkeletons] = useState(true);
  // Track if we're showing the error boundary
  const [hasError, setHasError] = useState(false);
  // Track if notifications are hidden
  const [hideSyncNotification, setHideSyncNotification] = useState(false);
  const [hideErrorNotification, setHideErrorNotification] = useState(false);
  // Track retry attempts
  const retryCount = useRef(0);

  // Set up online/offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Try to sync any pending operations
      syncPendingOperations();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync local tasks with query results when they change
  useEffect(() => {
    if (queryTasks.length > 0) {
      setLocalTasks(queryTasks);
      // Hide skeleton loaders after data is loaded
      setShowSkeletons(false);
    }
  }, [queryTasks]);

  // Simulate progressive loading with skeleton loaders
  useEffect(() => {
    if (isLoading) {
      setShowSkeletons(true);
    } else {
      // Add a small delay before hiding skeletons for a smoother transition
      const timer = setTimeout(() => {
        setShowSkeletons(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Reset notification visibility when operations change
  useEffect(() => {
    // Show notifications when new operations are added
    if (Object.keys(pendingOperations).length > 0) {
      setHideSyncNotification(false);
    }

    // Show error notification when operations fail
    if (Object.values(pendingOperations).some((op) => op.status === "failed")) {
      setHideErrorNotification(false);
    }
  }, [pendingOperations]);

  // Effect to clear the new task ID after animation completes
  useEffect(() => {
    if (newTaskId) {
      const timer = setTimeout(() => {
        setNewTaskId(null);
      }, 600); // Slightly longer than animation duration
      return () => clearTimeout(timer);
    }
  }, [newTaskId]);

  const createTaskFn = useAction(createTask);
  const updateTaskFn = useAction(updateTask);
  const deleteTaskFn = useAction(deleteTask);
  const reorderTasksFn = useAction(reorderTasks);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [titleError, setTitleError] = useState(false); // Add state for title error

  // Function to sync pending operations
  const syncPendingOperations = useCallback(async () => {
    if (isOffline) return;

    // Process any pending operations in the queue
    try {
      // First, process any pending operations in the request queue
      // This will automatically retry failed requests

      // Then, refetch the tasks to ensure we have the latest data
      await refetch();

      // Clear any failed operations that might have been resolved
      const failedOps = Object.entries(pendingOperations)
        .filter(([_, op]) => op.status === "failed")
        .map(([id]) => id);

      if (failedOps.length > 0) {
        // Remove failed operations that might have been resolved
        setPendingOperations((prev) => {
          const updated = { ...prev };
          failedOps.forEach((id) => {
            delete updated[id];
          });
          return updated;
        });
      }
    } catch (error) {
      console.error("Error syncing pending operations:", error);
    }
  }, [isOffline, refetch, pendingOperations]);

  // Handle retrying after an error
  const handleRetry = useCallback(() => {
    retryCount.current += 1;
    setHasError(false);
    refetch();
  }, [refetch]);

  // If there's an error, show the error boundary instead of just an alert
  if (error && !hasError) {
    setHasError(true);
  }

  // We'll show skeleton loaders instead of a spinner
  // This gives a more progressive loading experience

  const handleCreateTask = () => {
    if (newTaskTitle.trim() === "") {
      setTitleError(true); // Set error state
      return; // Prevent task creation
    }
    if (isCreatingTask) return; // Prevent multiple clicks

    setTitleError(false); // Reset error if validation passes
    setIsCreatingTask(true); // Set loading state to true

    // Generate a temporary ID for the new task
    const tempId = `temp-${Date.now()}`;

    // Create a temporary task for optimistic UI update
    const tempTask = {
      id: tempId,
      title: newTaskTitle,
      description: newTaskDescription,
      isDone: false,
      position: 0,
      // Add a flag to indicate this is a temporary task
      isTemp: true,
    };

    // Optimistically update the UI
    setLocalTasks([tempTask, ...localTasks]);
    setNewTaskId(tempId);

    // Clear the form
    setNewTaskTitle("");
    setNewTaskDescription("");

    // Track this operation as pending
    setPendingOperations((prev) => ({
      ...prev,
      [tempId]: { type: "create", status: "pending" },
    }));

    // Use the request queue to handle the API call
    requestQueue
      .enqueue(
        () =>
          createTaskFn({
            title: tempTask.title,
            description: tempTask.description,
          }),
        {
          id: `create-${tempId}`,
          batch: false, // Don't batch create operations
          priority: 1, // High priority
          onSuccess: (newTask) => {
            // Replace the temporary task with the real one without triggering animation again
            setLocalTasks((prev) =>
              prev.map((t) => (t.id === tempId ? { ...newTask } : t))
            );
            // Mark operation as complete
            setPendingOperations((prev) => {
              const updated = { ...prev };
              delete updated[tempId];
              return updated;
            });
          },
          onError: (error) => {
            // Mark operation as failed
            setPendingOperations((prev) => ({
              ...prev,
              [tempId]: { type: "create", status: "failed", error },
            }));
            // Show an error message
            console.error("Error creating task:", error);
            // You could add a toast notification here
          },
        }
      )
      .finally(() => {
        setIsCreatingTask(false); // Set loading state back to false
      });
  };

  const handleToggleTask = (task) => {
    // Don't allow toggling temporary tasks or tasks with pending operations
    if (task.isTemp || pendingOperations[task.id]) return;

    const updatedTask = { ...task, isDone: !task.isDone };

    // Optimistically update the UI
    setLocalTasks(localTasks.map((t) => (t.id === task.id ? updatedTask : t)));

    // Track this operation as pending
    setPendingOperations((prev) => ({
      ...prev,
      [task.id]: { type: "toggle", status: "pending", originalState: task },
    }));

    // Use the request queue to handle the API call
    requestQueue.enqueue(
      () => updateTaskFn({ id: task.id, isDone: !task.isDone }),
      {
        id: `toggle-${task.id}`,
        batch: true, // We can batch toggle operations
        priority: 3, // Medium priority
        onSuccess: () => {
          // Mark operation as complete
          setPendingOperations((prev) => {
            const updated = { ...prev };
            delete updated[task.id];
            return updated;
          });
        },
        onError: (error) => {
          // Revert the optimistic update
          setLocalTasks(localTasks.map((t) => (t.id === task.id ? task : t)));

          // Mark operation as failed
          setPendingOperations((prev) => ({
            ...prev,
            [task.id]: {
              type: "toggle",
              status: "failed",
              error,
              originalState: task,
            },
          }));

          console.error("Error toggling task:", error);
          // You could add a toast notification here
        },
      }
    );
  };

  const handleDeleteTask = (id) => {
    // Don't allow deleting temporary tasks or tasks with pending operations
    if (id.toString().startsWith("temp-") || pendingOperations[id]) return;

    // Find the task to be deleted (for potential rollback)
    const taskToDelete = localTasks.find((task) => task.id === id);

    // Optimistically update the UI
    // The animation is handled in the TaskItem component before this function is called
    setLocalTasks(localTasks.filter((task) => task.id !== id));

    // Track this operation as pending
    setPendingOperations((prev) => ({
      ...prev,
      [id]: { type: "delete", status: "pending", originalState: taskToDelete },
    }));

    // Use the request queue to handle the API call
    requestQueue.enqueue(() => deleteTaskFn({ id }), {
      id: `delete-${id}`,
      batch: false, // Don't batch delete operations
      priority: 2, // High priority
      onSuccess: () => {
        // Mark operation as complete
        setPendingOperations((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      },
      onError: (error) => {
        // Revert the optimistic update
        if (taskToDelete) {
          setLocalTasks((prev) => [...prev, taskToDelete]);
        }

        // Mark operation as failed
        setPendingOperations((prev) => ({
          ...prev,
          [id]: {
            type: "delete",
            status: "failed",
            error,
            originalState: taskToDelete,
          },
        }));

        console.error("Error deleting task:", error);
        // You could add a toast notification here
      },
    });
  };

  const startEditing = (task) => {
    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description || "",
    });
  };

  const saveEdit = () => {
    if (editingTask) {
      // Don't allow editing temporary tasks or tasks with pending operations
      if (
        editingTask.id.toString().startsWith("temp-") ||
        pendingOperations[editingTask.id]
      ) {
        setEditingTask(null);
        return;
      }

      // Find the original task (for potential rollback)
      const originalTask = localTasks.find((t) => t.id === editingTask.id);

      const updatedTask = {
        ...originalTask,
        title: editingTask.title,
        description: editingTask.description,
      };

      // Optimistically update the UI
      setLocalTasks(
        localTasks.map((task) =>
          task.id === editingTask.id ? updatedTask : task
        )
      );

      // Track this operation as pending
      setPendingOperations((prev) => ({
        ...prev,
        [editingTask.id]: {
          type: "edit",
          status: "pending",
          originalState: originalTask,
        },
      }));

      // Use the request queue to handle the API call
      requestQueue.enqueue(
        () =>
          updateTaskFn({
            id: editingTask.id,
            title: editingTask.title,
            description: editingTask.description,
          }),
        {
          id: `edit-${editingTask.id}`,
          batch: true, // We can batch edit operations
          priority: 3, // Medium priority
          onSuccess: () => {
            // Mark operation as complete
            setPendingOperations((prev) => {
              const updated = { ...prev };
              delete updated[editingTask.id];
              return updated;
            });
          },
          onError: (error) => {
            // Revert the optimistic update
            if (originalTask) {
              setLocalTasks((prev) =>
                prev.map((t) => (t.id === editingTask.id ? originalTask : t))
              );
            }

            // Mark operation as failed
            setPendingOperations((prev) => ({
              ...prev,
              [editingTask.id]: {
                type: "edit",
                status: "failed",
                error,
                originalState: originalTask,
              },
            }));

            console.error("Error editing task:", error);
            // You could add a toast notification here
          },
        }
      );

      setEditingTask(null);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Don't allow reordering if there are any temporary tasks
      if (localTasks.some((task) => task.isTemp)) return;

      // Map the tasks to their IDs
      const activeIndex = localTasks.findIndex(
        (task) => task.id.toString() === active.id
      );
      const overIndex = localTasks.findIndex(
        (task) => task.id.toString() === over.id
      );

      // Store the original order for potential rollback
      const originalOrder = [...localTasks];

      // Create the new task order
      const newTasksOrder = arrayMove(localTasks, activeIndex, overIndex);

      // Immediately update the UI with the new order
      setLocalTasks(newTasksOrder);

      // Track this operation as pending
      setPendingOperations((prev) => ({
        ...prev,
        reorder: {
          type: "reorder",
          status: "pending",
          originalState: originalOrder,
        },
      }));

      // Use the request queue to handle the API call
      requestQueue.enqueue(
        () =>
          reorderTasksFn({
            taskIds: newTasksOrder.map((task) => task.id),
          }),
        {
          id: `reorder-${Date.now()}`,
          batch: false, // Don't batch reorder operations
          priority: 4, // Lower priority
          onSuccess: () => {
            // Mark operation as complete
            setPendingOperations((prev) => {
              const updated = { ...prev };
              delete updated["reorder"];
              return updated;
            });
          },
          onError: (error) => {
            // Revert the optimistic update
            setLocalTasks(originalOrder);

            // Mark operation as failed
            setPendingOperations((prev) => ({
              ...prev,
              reorder: {
                type: "reorder",
                status: "failed",
                error,
                originalState: originalOrder,
              },
            }));

            console.error("Error reordering tasks:", error);
            // You could add a toast notification here
          },
        }
      );
    }
  };

  return (
    <ErrorBoundary
      errorTitle="Something went wrong loading your tasks"
      errorMessage="We're having trouble connecting to the server. Please try again."
      onRetry={handleRetry}
      showReportButton={false}
      showErrorDetails={false}
    >
      <div className="max-w-4xl mx-auto">
        {/* Offline indicator */}
        {isOffline && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You're currently offline. Changes will be saved when you
                  reconnect.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">My Tasks</h1>

          {showSkeletons ? (
            <SkeletonLoader type="form" count={1} />
          ) : (
            <TaskForm
              newTaskTitle={newTaskTitle}
              setNewTaskTitle={setNewTaskTitle}
              newTaskDescription={newTaskDescription}
              setNewTaskDescription={setNewTaskDescription}
              handleCreateTask={handleCreateTask}
              isCreatingTask={isCreatingTask}
              titleError={titleError}
              setTitleError={setTitleError}
              isOffline={isOffline}
            />
          )}
        </div>

        {/* Flyout notification for pending operations */}
        {Object.keys(pendingOperations).length > 0 && !hideSyncNotification && (
          <div className="fixed bottom-4 right-4 p-3 bg-blue-50 rounded-md shadow-lg border border-blue-100 flex items-center z-50 animate-fade-in-up">
            <svg
              className="animate-spin h-5 w-5 text-blue-500 mr-2"
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
            <span className="text-sm text-blue-700 mr-2">
              Syncing changes... ({Object.keys(pendingOperations).length}{" "}
              pending)
            </span>
            <button
              onClick={() => setHideSyncNotification(true)}
              className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
              aria-label="Close notification"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {isLoading && showSkeletons ? (
          <SkeletonLoader type="task" count={5} />
        ) : (
          <TaskList
            tasks={localTasks}
            handleToggleTask={handleToggleTask}
            startEditing={startEditing}
            handleDeleteTask={handleDeleteTask}
            editingTask={editingTask}
            setEditingTask={setEditingTask}
            saveEdit={saveEdit}
            handleDragEnd={handleDragEnd}
            activeId={activeId}
            setActiveId={setActiveId}
            newTaskId={newTaskId}
            pendingOperations={pendingOperations}
            isOffline={isOffline}
          />
        )}

        {/* Flyout notification for failed operations */}
        {Object.values(pendingOperations).some(
          (op) => op.status === "failed"
        ) &&
          !hideErrorNotification && (
            <div className="fixed bottom-4 left-4 p-3 bg-red-50 border border-red-100 rounded-md shadow-lg z-50 animate-fade-in-up max-w-xs">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm text-red-700">
                  Some changes couldn't be saved. Please try again.
                </p>
                <button
                  onClick={() => setHideErrorNotification(true)}
                  className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                  aria-label="Close notification"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => {
                  syncPendingOperations();
                  setHideErrorNotification(false);
                }}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
      </div>
    </ErrorBoundary>
  );
};

export default MainPage;
