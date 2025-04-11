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
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";

// A workaround for React.StrictMode in React 18 with react-beautiful-dnd
// This fixes issues with drag and drop not working
const useDndSafeRender = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  return enabled;
};

const MainPage = () => {
  const isDndEnabled = useDndSafeRender();
  const { data: tasks = [], isLoading, error } = useQuery(getTasks);
  const createTaskFn = useAction(createTask);
  const updateTaskFn = useAction(updateTask);
  const deleteTaskFn = useAction(deleteTask);
  const reorderTasksFn = useAction(reorderTasks);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [editingTask, setEditingTask] = useState(null);

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
    if (newTaskTitle.trim() === "") return;
    createTaskFn({ title: newTaskTitle, description: newTaskDescription });
    setNewTaskTitle("");
    setNewTaskDescription("");
  };

  const handleToggleTask = (task) => {
    updateTaskFn({ id: task.id, isDone: !task.isDone });
  };

  const handleDeleteTask = (id) => {
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
      updateTaskFn({
        id: editingTask.id,
        title: editingTask.title,
        description: editingTask.description,
      });
      setEditingTask(null);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    // Create a new array from the current tasks
    const items = Array.from(tasks);
    // Remove the dragged item from its position
    const [reorderedItem] = items.splice(result.source.index, 1);
    // Insert the dragged item at the new position
    items.splice(result.destination.index, 0, reorderedItem);

    // Extract the IDs in the new order
    const reorderedTaskIds = items.map((task) => task.id);

    // Call the server action to update positions
    reorderTasksFn({ taskIds: reorderedTaskIds });
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
            <input
              type="text"
              placeholder="Task title"
              className="input w-full"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <textarea
              placeholder="Task description (optional)"
              className="input w-full min-h-[80px]"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
            />
            <button
              onClick={handleCreateTask}
              className="btn btn-primary flex items-center justify-center"
              disabled={!newTaskTitle.trim()}
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              Add Task
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

      {tasks.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500">
            No tasks yet. Add your first task above!
          </p>
        </div>
      ) : (
        isDndEnabled && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tasks">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {tasks.map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={`task-${task.id}`}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`card p-4 transition-all ${
                            task.isDone ? "bg-gray-50 border-gray-200" : ""
                          }`}
                        >
                          {editingTask && editingTask.id === task.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                className="input w-full"
                                value={editingTask.title}
                                onChange={(e) =>
                                  setEditingTask({
                                    ...editingTask,
                                    title: e.target.value,
                                  })
                                }
                              />
                              <textarea
                                className="input w-full min-h-[60px]"
                                value={editingTask.description}
                                onChange={(e) =>
                                  setEditingTask({
                                    ...editingTask,
                                    description: e.target.value,
                                  })
                                }
                              />
                              <div className="flex justify-end mt-2 space-x-2">
                                <button
                                  onClick={() => setEditingTask(null)}
                                  className="btn bg-gray-200 hover:bg-gray-300 text-gray-700"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={saveEdit}
                                  className="btn btn-primary"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
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
                                        task.isDone
                                          ? "text-gray-500 line-through"
                                          : "text-gray-800"
                                      }`}
                                    >
                                      {task.title}
                                    </h3>
                                    {task.description && (
                                      <p
                                        className={`mt-1 text-sm ${
                                          task.isDone
                                            ? "text-gray-400"
                                            : "text-gray-600"
                                        }`}
                                      >
                                        {task.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex space-x-1">
                                  <div
                                    {...provided.dragHandleProps}
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
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )
      )}
    </div>
  );
};

export default MainPage;
