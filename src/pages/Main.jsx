import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  useQuery,
  useAction,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  parseTaskWithAI,
} from "wasp/client/operations";
import { arrayMove } from "@dnd-kit/sortable";

// Import components
import TaskForm from "../components/tasks/TaskForm";
import TaskList from "../components/tasks/TaskList";
import AITaskParser from "../components/tasks/AITaskParser";
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
  // State for showing booting message
  const [showBootingMessage, setShowBootingMessage] = useState(false);
  const bootingMessageTimeoutRef = useRef(null);

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
      setShowBootingMessage(false); // Hide booting message when data loads
      if (bootingMessageTimeoutRef.current) {
        clearTimeout(bootingMessageTimeoutRef.current);
      }
    }
  }, [queryTasks]);

  // Simulate progressive loading with skeleton loaders
  useEffect(() => {
    if (isLoading) {
      setShowSkeletons(true);
      // Set a timeout to show the booting message if loading takes too long
      bootingMessageTimeoutRef.current = setTimeout(() => {
        if (isLoading) {
          // Check again if still loading
          setShowBootingMessage(true);
        }
      }, 5000);
    } else {
      // Add a small delay before hiding skeletons for a smoother transition
      const timer = setTimeout(() => {
        setShowSkeletons(false);
      }, 300);
      setShowBootingMessage(false); // Hide booting message when loading finishes
      if (bootingMessageTimeoutRef.current) {
        clearTimeout(bootingMessageTimeoutRef.current);
      }
      return () => clearTimeout(timer);
    }

    // Cleanup timeout on unmount or if isLoading changes
    return () => {
      if (bootingMessageTimeoutRef.current) {
        clearTimeout(bootingMessageTimeoutRef.current);
      }
    };
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
  const [isAIParserOpen, setIsAIParserOpen] = useState(false);

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

  // Handle creating tasks from AI parser
  const handleAITasksGenerated = (tasks) => {
    if (!tasks || tasks.length === 0) return;

    // Process tasks one by one
    tasks.forEach((task, index) => {
      // Add a small delay between task creations for better UX
      setTimeout(() => {
        // Generate a temporary ID for the new task
        const tempId = `temp-${Date.now()}-${index}`;

        // Create a temporary task for optimistic UI update
        const tempTask = {
          id: tempId,
          title: task.title,
          description: task.description,
          isDone: false,
          position: 0,
          isTemp: true,
        };

        // Optimistically update the UI
        setLocalTasks((prevTasks) => [tempTask, ...prevTasks]);
        setNewTaskId(tempId);

        // Track this operation as pending
        setPendingOperations((prev) => ({
          ...prev,
          [tempId]: { type: "create", status: "pending" },
        }));

        // Use the request queue to handle the API call
        requestQueue.enqueue(
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
              console.error("Error creating task:", error);
            },
          }
        );
      }, index * 300); // Stagger task creation by 300ms
    });
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
        {/* Offline indicator removed to make interaction seamless */}

        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--text-color)" }}
            >
              My Tasks
            </h1>

            <button
              onClick={() => setIsAIParserOpen(true)}
              className={`btn flex items-center ${
                isOffline
                  ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
                  : "btn-primary"
              }`}
              disabled={isOffline}
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Parse with AI
            </button>
          </div>

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

        {/* AI Task Parser Modal */}
        <AITaskParser
          isOpen={isAIParserOpen}
          onClose={() => setIsAIParserOpen(false)}
          onTasksGenerated={handleAITasksGenerated}
          isOffline={isOffline}
        />

        {/* Flyout notification for pending operations */}
        {Object.keys(pendingOperations).length > 0 && !hideSyncNotification && (
          <div
            className="fixed bottom-4 right-4 p-3 rounded-md shadow-lg border flex items-center z-50 animate-fade-in-up"
            style={{
              backgroundColor: "var(--card-color)",
              borderColor: "var(--primary-color)",
              borderWidth: "1px",
            }}
          >
            <svg
              className="animate-spin h-5 w-5 mr-2"
              style={{ color: "var(--primary-color)" }}
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
            <span
              className="text-sm mr-2"
              style={{ color: "var(--text-color)" }}
            >
              Syncing changes... ({Object.keys(pendingOperations).length}{" "}
              pending)
            </span>
            <button
              onClick={() => setHideSyncNotification(true)}
              className="ml-2 transition-colors"
              style={{ color: "var(--primary-color)" }}
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
          <>
            <SkeletonLoader type="task" count={5} />
            {showBootingMessage && (
              <p
                className="text-center text-sm mt-4"
                style={{ color: "var(--text-color-secondary)" }}
              >
                Booting the server, this might take a moment...
              </p>
            )}
          </>
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
            <div
              className="fixed bottom-4 left-4 p-3 border rounded-md shadow-lg z-50 animate-fade-in-up max-w-xs"
              style={{
                backgroundColor: "var(--card-color)",
                borderColor: "var(--error-color)",
                borderWidth: "1px",
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm" style={{ color: "var(--error-color)" }}>
                  Some changes couldn't be saved. Please try again.
                </p>
                <button
                  onClick={() => setHideErrorNotification(true)}
                  className="ml-2 transition-colors"
                  style={{ color: "var(--error-color)" }}
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
                className="px-3 py-1 text-sm rounded transition-colors"
                style={{
                  backgroundColor: "var(--error-color)",
                  color: "white",
                }}
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
