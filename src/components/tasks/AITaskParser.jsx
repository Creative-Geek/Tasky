import React, { useState, useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useAction, parseTaskWithAI } from "wasp/client/operations";
import LoadingSpinner from "../common/LoadingSpinner";
import ErrorAlert from "../common/ErrorAlert";
import {
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from "../../constants/validation";

const AITaskParser = ({
  isOpen,
  onClose,
  onTasksGenerated,
  isOffline = false,
}) => {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [editedTasks, setEditedTasks] = useState([]);
  const modalRef = useRef(null);
  const textareaRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [animateTaskSection, setAnimateTaskSection] = useState(false);

  // Get the parseTaskWithAI action
  const {
    data: parsedData,
    isLoading,
    error: parseError,
  } = useAction(parseTaskWithAI);

  // Initialize edited tasks when generated tasks change
  useEffect(() => {
    if (generatedTasks.length > 0) {
      setEditedTasks(generatedTasks.map((task) => ({ ...task })));
      setAnimateTaskSection(true); // Trigger animation when tasks are generated
      const timer = setTimeout(() => setAnimateTaskSection(false), 500); // Duration of pulse-once
      return () => clearTimeout(timer);
    } else {
      setEditedTasks([]); // Clear edited tasks if no generated tasks
    }
  }, [generatedTasks]);

  // Focus the textarea when the modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen && !isClosing) {
      // Ensure reset only happens after closing animation
      setInputText("");
      setError(null);
      setGeneratedTasks([]);
      setEditedTasks([]);
      setIsProcessing(false);
      setAnimateTaskSection(false);
    }
  }, [isOpen, isClosing]);

  const handleActualClose = () => {
    setIsClosing(false);
    onClose(); // Call the original onClose prop
  };

  const triggerClose = () => {
    setIsClosing(true);
    setTimeout(handleActualClose, 300); // Match animation duration
  };

  // Handle click outside to close the modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        triggerClose();
      }
    };

    if (isOpen && !isClosing) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, isClosing]);

  // Handle escape key to close the modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        triggerClose();
      }
    };

    if (isOpen && !isClosing) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose, isClosing]);

  // Handle parse button click
  const handleParse = async () => {
    if (!inputText.trim()) {
      setError("Please enter some text to parse");
      return;
    }

    setError(null);
    setIsProcessing(true);
    setGeneratedTasks([]);
    setAnimateTaskSection(false); // Reset animation state before new parse

    try {
      const result = await parseTaskWithAI({ text: inputText });
      if (result && result.tasks) {
        setGeneratedTasks(result.tasks);
      } else {
        setError("Failed to extract tasks from the text");
      }
    } catch (err) {
      setError(err.message || "Failed to parse tasks");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle task title change
  const handleTaskTitleChange = (index, value) => {
    const updatedTasks = [...editedTasks];
    updatedTasks[index].title = value;
    setEditedTasks(updatedTasks);
  };

  // Handle task description change
  const handleTaskDescriptionChange = (index, value) => {
    const updatedTasks = [...editedTasks];
    updatedTasks[index].description = value;
    setEditedTasks(updatedTasks);
  };

  // Handle save button click
  const handleSave = () => {
    // Filter out tasks with empty titles
    const validTasks = editedTasks.filter((task) => task.title.trim() !== "");

    if (validTasks.length === 0) {
      setError("At least one task must have a title");
      return;
    }

    onTasksGenerated(validTasks);
    triggerClose();
  };

  if (!isOpen && !isClosing) return null;

  const modalAnimationClass = isClosing
    ? "animate-fade-out-down"
    : "animate-fade-in-up";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${modalAnimationClass}`}
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto card p-5"
        style={{
          backgroundColor: "var(--card-color)",
          color: "var(--text-color)",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Parse Tasks with AI</h2>
          <button
            onClick={triggerClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Input section */}
        <div className="mb-4">
          <label className="block mb-2 font-medium">Paste message text:</label>
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste a message from a colleague that contains task information..."
            className="w-full min-h-[120px] transition-colors preserve-line-breaks px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2"
            style={{
              backgroundColor: "var(--card-color)",
              color: "var(--text-color)",
              borderColor: "var(--border-color)",
            }}
            disabled={isProcessing || isOffline}
          />
        </div>

        {/* Parse button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleParse}
            className={`btn ${
              isOffline || isProcessing
                ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
                : "btn-primary"
            }`}
            disabled={isProcessing || isOffline || !inputText.trim()}
          >
            {isProcessing ? (
              <div className="flex items-center">
                <LoadingSpinner size="small" className="mr-2" />
                <span>Processing...</span>
              </div>
            ) : (
              "Parse with AI"
            )}
          </button>
        </div>

        {/* Error message */}
        {error && <ErrorAlert message={error} />}

        {/* Generated tasks preview */}
        {editedTasks.length > 0 && (
          <div
            className={`mt-4 ${animateTaskSection ? "animate-pulse-once" : ""}`}
          >
            <h3 className="text-lg font-medium mb-3">Generated Tasks</h3>
            <div className="space-y-4">
              {editedTasks.map((task, index) => (
                <div key={index} className="card p-4 border">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium">
                        Task Title:
                      </label>
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) =>
                          handleTaskTitleChange(index, e.target.value)
                        }
                        maxLength={MAX_TITLE_LENGTH}
                        className="w-full transition-colors duration-300 ease-in-out px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: "var(--card-color)",
                          color: "var(--text-color)",
                          borderColor: "var(--border-color)",
                        }}
                      />
                      <div className="flex justify-end text-xs text-gray-500">
                        {task.title.length}/{MAX_TITLE_LENGTH} characters
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium">
                        Task Description:
                      </label>
                      <textarea
                        value={task.description}
                        onChange={(e) =>
                          handleTaskDescriptionChange(index, e.target.value)
                        }
                        maxLength={MAX_DESCRIPTION_LENGTH}
                        className="w-full min-h-[80px] transition-colors preserve-line-breaks px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: "var(--card-color)",
                          color: "var(--text-color)",
                          borderColor: "var(--border-color)",
                        }}
                      />
                      <div className="flex justify-end text-xs text-gray-500">
                        {task.description.length}/{MAX_DESCRIPTION_LENGTH}{" "}
                        characters
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {editedTasks.length > 0 && (
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={triggerClose}
              className="btn"
              style={{
                backgroundColor: "var(--card-color)",
                color: "var(--text-color)",
                borderColor: "var(--border-color)",
                borderWidth: "1px",
              }}
            >
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              Create Tasks
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITaskParser;
