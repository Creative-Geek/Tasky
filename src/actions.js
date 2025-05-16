import { HttpError } from "wasp/server";

// Constants for input validation
const MAX_TITLE_LENGTH = 78;
const MAX_DESCRIPTION_LENGTH = 600;

export const createTask = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { title, description } = args;

  // Validate title and description lengths
  if (!title || title.trim() === "") {
    throw new HttpError(400, "Task title is required");
  }

  if (title.length > MAX_TITLE_LENGTH) {
    throw new HttpError(
      400,
      `Task title cannot exceed ${MAX_TITLE_LENGTH} characters`
    );
  }

  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    throw new HttpError(
      400,
      `Task description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`
    );
  }

  // Shift all existing tasks down by 1 to make room for the new task at position 0
  await context.entities.Task.updateMany({
    where: { userId: context.user.id },
    data: {
      position: { increment: 1 },
    },
  });

  // Create the new task at position 0 (top of the list)
  const newTask = await context.entities.Task.create({
    data: {
      title,
      description,
      isDone: false,
      position: 0,
      user: { connect: { id: context.user.id } },
    },
  });

  return newTask;
};

export const updateTask = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const task = await context.entities.Task.findUnique({
    where: { id: args.id },
  });
  if (!task || task.userId !== context.user.id) {
    throw new HttpError(403);
  }

  // Validate title and description if they are being updated
  if (args.title !== undefined) {
    if (!args.title || args.title.trim() === "") {
      throw new HttpError(400, "Task title is required");
    }

    if (args.title.length > MAX_TITLE_LENGTH) {
      throw new HttpError(
        400,
        `Task title cannot exceed ${MAX_TITLE_LENGTH} characters`
      );
    }
  }

  if (
    args.description !== undefined &&
    args.description &&
    args.description.length > MAX_DESCRIPTION_LENGTH
  ) {
    throw new HttpError(
      400,
      `Task description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`
    );
  }

  return context.entities.Task.update({
    where: { id: args.id },
    data: {
      title: args.title,
      description: args.description,
      isDone: args.isDone,
    },
  });
};

export const deleteTask = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const task = await context.entities.Task.findUnique({
    where: { id: args.id },
  });
  if (!task || task.userId !== context.user.id) {
    throw new HttpError(403);
  }

  await context.entities.Task.delete({
    where: { id: args.id },
  });

  return { id: args.id };
};

export const reorderTasks = async ({ taskIds }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  // Fetch tasks of the authenticated user and ensure all tasks belong to them
  const tasks = await context.entities.Task.findMany({
    where: {
      id: { in: taskIds },
      userId: context.user.id,
    },
  });

  if (tasks.length !== taskIds.length) {
    throw new HttpError(403, "Some tasks do not belong to the user.");
  }

  // Update each task's position
  await Promise.all(
    taskIds.map((taskId, index) =>
      context.entities.Task.update({
        where: { id: taskId },
        data: { position: index },
      })
    )
  );

  // Return a success response
  return { success: true, message: "Tasks reordered successfully" };
};

export const parseTaskWithAI = async ({ text }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  // Validate input
  if (!text || text.trim() === "") {
    throw new HttpError(400, "Text input is required");
  }

  try {
    // Get the OpenAI API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    // Get the OpenAI compatible API URL from environment variables or default to the official OpenAI API
    const OpenAI_Compatible_API =
      process.env.BASE_API_URL || "https://api.openai.com/v1";
    const usedmodel = process.env.MODEL || "gpt-3.5-turbo";

    // Prepare the API request to OpenAI
    const response = await fetch(`${OpenAI_Compatible_API}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: usedmodel,
        messages: [
          {
            role: "system",
            content: `You are a task extraction assistant. Extract actionable tasks from the provided text.
            Format your response as a JSON array of task objects with 'title' and 'description' fields.
            Keep titles concise (under ${MAX_TITLE_LENGTH} characters) and descriptions detailed but under ${MAX_DESCRIPTION_LENGTH} characters.
            If multiple tasks are detected, create separate task objects for each.
            Example: [{"title": "Schedule team meeting", "description": "Set up a 30-minute team sync for next Tuesday at 2pm to discuss the quarterly roadmap."}]`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `OpenAI API error: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI service");
    }

    // Parse the JSON response from the AI
    let tasks;
    try {
      tasks = JSON.parse(aiResponse);

      // Validate the parsed tasks
      if (!Array.isArray(tasks)) {
        throw new Error("AI response is not in the expected format");
      }

      // Validate and trim each task
      tasks = tasks.map((task) => ({
        title: (task.title || "").substring(0, MAX_TITLE_LENGTH),
        description: task.description
          ? task.description.substring(0, MAX_DESCRIPTION_LENGTH)
          : "",
      }));

      // Filter out tasks with empty titles
      tasks = tasks.filter((task) => task.title.trim() !== "");

      if (tasks.length === 0) {
        throw new Error("No valid tasks could be extracted");
      }
    } catch (parseError) {
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    return { tasks };
  } catch (error) {
    console.error("AI task parsing error:", error);
    throw new HttpError(500, `Failed to parse tasks: ${error.message}`);
  }
};
