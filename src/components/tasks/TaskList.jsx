import React, { useState, useRef } from "react";
import { ArrowsUpDownIcon } from "@heroicons/react/24/outline";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import TaskItem from "./TaskItem";
import EmptyTaskList from "./EmptyTaskList";

const TaskList = ({
  tasks,
  handleToggleTask,
  startEditing,
  handleDeleteTask,
  editingTask,
  setEditingTask,
  saveEdit,
  handleDragEnd,
  activeId,
  setActiveId,
  newTaskId,
  pendingOperations = {},
  isOffline = false,
}) => {
  // Track which task is being deleted to animate tasks below it
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [deletingTaskHeight, setDeletingTaskHeight] = useState(0);
  const taskRefs = useRef({});

  // Custom delete handler that tracks the deleting task
  const handleTaskDelete = (id) => {
    // Get the height of the task being deleted
    if (taskRefs.current[id]) {
      const height = taskRefs.current[id].offsetHeight;
      setDeletingTaskHeight(height);
    }

    setDeletingTaskId(id);

    // Reset after animation completes
    setTimeout(() => {
      setDeletingTaskId(null);
      setDeletingTaskHeight(0);
    }, 600);

    handleDeleteTask(id);
  };

  // Function to set a ref for a task
  const setTaskRef = (id, node) => {
    if (node) {
      taskRefs.current[id] = node;
    }
  };
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

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-xl font-semibold"
          style={{ color: "var(--text-color)" }}
        >
          Task List
        </h2>
        <div
          className="flex items-center text-sm"
          style={{ color: "var(--text-color)", opacity: 0.7 }}
        >
          <ArrowsUpDownIcon className="h-5 w-5 mr-1" />
          <span>Drag to reorder</span>
          {isOffline && (
            <span
              className="ml-2 px-2 py-0.5 text-xs rounded-full"
              style={{
                backgroundColor: "var(--primary-color)",
                color: "var(--card-color)",
                opacity: 0.8,
              }}
            >
              Offline
            </span>
          )}
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyTaskList />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(event) => {
            // Set the active ID when dragging starts
            setActiveId(event.active.id);
          }}
          onDragEnd={(event) => {
            // Clear the active ID when dragging ends
            setActiveId(null);
            // Call the original handler
            handleDragEnd(event);
          }}
          onDragCancel={() => {
            // Clear the active ID if dragging is cancelled
            setActiveId(null);
          }}
        >
          <SortableContext
            items={tasks.map((task) => task.id.toString())}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 transition-all">
              {tasks.map((task, index) => {
                // Find the index of the deleting task
                const deletingIndex = deletingTaskId
                  ? tasks.findIndex((t) => t.id === deletingTaskId)
                  : -1;
                // Determine if this task is below the one being deleted
                const isBelowDeletingTask =
                  deletingIndex !== -1 && index > deletingIndex;

                return (
                  <div
                    key={task.id}
                    ref={(node) => setTaskRef(task.id, node)}
                    className={isBelowDeletingTask ? "task-move-up" : ""}
                    style={
                      isBelowDeletingTask
                        ? {
                            "--move-up-distance": `calc(-${deletingTaskHeight}px - 0.75rem)`,
                          }
                        : {}
                    }
                  >
                    <TaskItem
                      task={task}
                      handleToggleTask={handleToggleTask}
                      startEditing={startEditing}
                      handleDeleteTask={handleTaskDelete}
                      editingTask={editingTask}
                      setEditingTask={setEditingTask}
                      saveEdit={saveEdit}
                      activeId={activeId}
                      isNewTask={newTaskId === task.id}
                      pendingOperation={pendingOperations[task.id]}
                      isOffline={isOffline}
                    />
                  </div>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </>
  );
};

export default TaskList;
