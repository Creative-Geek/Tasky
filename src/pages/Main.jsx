import React, { useState, useEffect } from "react";
import {
  useQuery,
  useAction,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
} from "wasp/client/operations";
import {
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  PencilIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Constants for input validation
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

// Sortable task item component
const SortableTaskItem = ({
  task,
  handleToggleTask,
  startEditing,
  handleDeleteTask,
  editingTask,
  setEditingTask,
  saveEdit,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id.toString(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: "transform 0ms", // Direct cursor following with no delay
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card p-4 transition-all ${
        task.isDone ? "bg-gray-50 border-gray-200" : ""
      }`}
    >
      {editingTask && editingTask.id === task.id ? (
        // Edit mode
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
      ) : (
        // View mode
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
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
              <div>
                <h3
                  className={`text-lg font-medium ${
                    task.isDone ? "text-gray-500 line-through" : "text-gray-800"
                  }`}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <p
                    className={`mt-1 text-sm ${
                      task.isDone ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {task.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-1">
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

const MainPage = () => {
  const { data: queryTasks = [], isLoading, error } = useQuery(getTasks);

  // Local state for tasks that can be updated immediately during drag
  const [localTasks, setLocalTasks] = useState([]);

  // Sync local tasks with query results when they change
  useEffect(() => {
    if (queryTasks.length > 0) {
      setLocalTasks(queryTasks);
    }
  }, [queryTasks]);

  const createTaskFn = useAction(createTask);
  const updateTaskFn = useAction(updateTask);
  const deleteTaskFn = useAction(deleteTask);
  const reorderTasksFn = useAction(reorderTasks);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Set up dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Minimal activation constraint for better response
      activationConstraint: {
        distance: 3, // Very small distance required to start dragging
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );

  if (error)
    return (
      <div
        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">
          {error.message || "Something went wrong"}
        </span>
      </div>
    );

  const handleCreateTask = () => {
    if (newTaskTitle.trim() === "" || isCreatingTask) return; // Prevent multiple clicks
    setIsCreatingTask(true); // Set loading state to true
    createTaskFn({ title: newTaskTitle, description: newTaskDescription })
      .then((newTask) => {
        // Add the new task to local state
        setLocalTasks([...localTasks, newTask]);
        setNewTaskTitle("");
        setNewTaskDescription("");
      })
      .finally(() => {
        setIsCreatingTask(false); // Set loading state back to false
      });
  };

  const handleToggleTask = (task) => {
    const updatedTask = { ...task, isDone: !task.isDone };
    // Optimistically update the UI
    setLocalTasks(localTasks.map((t) => (t.id === task.id ? updatedTask : t)));
    // Send update to server
    updateTaskFn({ id: task.id, isDone: !task.isDone });
  };

  const handleDeleteTask = (id) => {
    // Optimistically update the UI
    setLocalTasks(localTasks.filter((task) => task.id !== id));
    // Send delete to server
    deleteTaskFn({ id });
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
      const updatedTask = {
        ...localTasks.find((t) => t.id === editingTask.id),
        title: editingTask.title,
        description: editingTask.description,
      };

      // Optimistically update the UI
      setLocalTasks(
        localTasks.map((task) =>
          task.id === editingTask.id ? updatedTask : task
        )
      );

      // Send update to server
      updateTaskFn({
        id: editingTask.id,
        title: editingTask.title,
        description: editingTask.description,
      });

      setEditingTask(null);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Map the tasks to their IDs
      const activeIndex = localTasks.findIndex(
        (task) => task.id.toString() === active.id
      );
      const overIndex = localTasks.findIndex(
        (task) => task.id.toString() === over.id
      );

      // Create the new task order
      const newTasksOrder = arrayMove(localTasks, activeIndex, overIndex);

      // Immediately update the UI with the new order
      setLocalTasks(newTasksOrder);

      // Update the server with the new order
      reorderTasksFn({
        taskIds: newTasksOrder.map((task) => task.id),
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Tasks</h1>

        <div className="card p-4">
          <h2 className="text-lg font-medium text-gray-700 mb-3">
            Add New Task
          </h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <input
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
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-700">Task List</h2>
        <div className="flex items-center text-sm text-gray-500">
          <ArrowsUpDownIcon className="h-5 w-5 mr-1" />
          <span>Drag to reorder</span>
        </div>
      </div>

      {localTasks.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500">
            No tasks yet. Add your first task above!
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localTasks.map((task) => task.id.toString())}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {localTasks.map((task) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  handleToggleTask={handleToggleTask}
                  startEditing={startEditing}
                  handleDeleteTask={handleDeleteTask}
                  editingTask={editingTask}
                  setEditingTask={setEditingTask}
                  saveEdit={saveEdit}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default MainPage;
