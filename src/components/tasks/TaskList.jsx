import React from "react";
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
}) => {
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
        <h2 className="text-xl font-semibold text-gray-700">Task List</h2>
        <div className="flex items-center text-sm text-gray-500">
          <ArrowsUpDownIcon className="h-5 w-5 mr-1" />
          <span>Drag to reorder</span>
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
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  handleToggleTask={handleToggleTask}
                  startEditing={startEditing}
                  handleDeleteTask={handleDeleteTask}
                  editingTask={editingTask}
                  setEditingTask={setEditingTask}
                  saveEdit={saveEdit}
                  activeId={activeId}
                  isNewTask={newTaskId === task.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </>
  );
};

export default TaskList;
