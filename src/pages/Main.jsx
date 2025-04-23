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
import { arrayMove } from "@dnd-kit/sortable";

// Import components
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorAlert from "../components/common/ErrorAlert";
import TaskForm from "../components/tasks/TaskForm";
import TaskList from "../components/tasks/TaskList";

const MainPage = () => {
  const { data: queryTasks = [], isLoading, error } = useQuery(getTasks);

  // Local state for tasks that can be updated immediately during drag
  const [localTasks, setLocalTasks] = useState([]);
  // Track the currently dragged task ID
  const [activeId, setActiveId] = useState(null);

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

  if (isLoading) {
    return (
      <div className="h-64">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  if (error) {
    return <ErrorAlert message={error.message || "Something went wrong"} />;
  }

  const handleCreateTask = () => {
    if (newTaskTitle.trim() === "" || isCreatingTask) return; // Prevent multiple clicks
    setIsCreatingTask(true); // Set loading state to true
    createTaskFn({ title: newTaskTitle, description: newTaskDescription })
      .then((newTask) => {
        // Add the new task to the top of the list
        setLocalTasks([newTask, ...localTasks]);
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

        <TaskForm
          newTaskTitle={newTaskTitle}
          setNewTaskTitle={setNewTaskTitle}
          newTaskDescription={newTaskDescription}
          setNewTaskDescription={setNewTaskDescription}
          handleCreateTask={handleCreateTask}
          isCreatingTask={isCreatingTask}
        />
      </div>

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
      />
    </div>
  );
};

export default MainPage;
