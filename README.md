# Tasky

A simple yet effective task management application built with the Wasp full-stack framework.

## Features

- **User Authentication:** Secure sign-up and login functionality with automatic redirection for logged-in users.
- **Task Management:** Create, read, update, and delete tasks with smooth animations.
- **Task Status:** Mark tasks as complete or incomplete with animated checkmarks and strikethrough text.
- **Drag & Drop Reordering:** Easily reorder tasks using drag and drop with smooth animations.
- **Dark Mode:** Toggle between light and dark themes with user preference saved in the browser.
- **Responsive Design:** Built with Tailwind CSS for a seamless experience on all devices.
- **Optimistic UI Updates:** Provides a smooth user experience by updating the UI immediately for most actions.
- **Animated Interactions:** Smooth animations for task creation, completion, deletion, and reordering.
- **Non-disruptive Notifications:** Flyout notifications for syncing status that don't shift the layout.
- **Input Validation:** Length limits for task titles and descriptions.

## Key Features

- **AI-Powered Task Creation:** Add or update tasks by simply copying a message from a colleague. The AI will automatically parse the message and create a properly formatted task with title, description, and other relevant details. This feature saves time by eliminating manual task creation from communication threads and ensures important details aren't missed.
- **Enhanced SEO Optimization:** Improved metadata and static asset serving for better search engine visibility and performance.

## Tech Stack

- **Framework:** [Wasp](https://wasp-lang.dev/) (React, Node.js)
- **Database:** PostgreSQL (via Prisma ORM)
- **Styling:** Tailwind CSS
- **Frontend Tooling:** Vite
- **UI Components:** Headless UI, Heroicons
- **Drag & Drop:** dnd-kit

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Wasp CLI](https://wasp-lang.dev/docs/quick-start#install-wasp): `npm install -g wasp`
- A running PostgreSQL database instance.

## Setup and Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Creative-Geek/Tasky
    cd Tasky
    ```

2.  **Install dependencies:**
    Wasp handles installing both client and server dependencies.

    ```bash
    wasp deps
    ```

3.  **Set up environment variables:**
    Create a `.env.server` file in the root of the project and add your database connection URL and OpenAI API key:

    ```env
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
    OPENAI_API_KEY="your-openai-api-key"
    ```

    Replace `USER`, `PASSWORD`, `HOST`, `PORT`, and `DATABASE` with your actual database credentials, and `your-openai-api-key` with your OpenAI API key. The OpenAI API key is required for the AI Task Parser feature.

4.  **Run database migrations:**
    This command applies the necessary database schema changes defined in `schema.prisma`.
    ```bash
    wasp db migrate dev
    ```
    You might be prompted to give the migration a name.

## Running the Application

1.  **Start the development server:**

    ```bash
    wasp start
    ```

    This command starts both the backend server and the frontend development server.

2.  **Access the application:**
    Open your web browser and navigate to `http://localhost:3000` (or the port specified by Wasp if different).

## Deployment

The project includes an `update_project.sh` script for building and deploying both the backend and frontend:

- The script builds the Wasp project (`wasp build`).
- For the backend, it copies the built files to a separate backend repository, commits, and pushes the changes.
- For the frontend, it navigates into the web-app build directory, installs dependencies, and builds the React frontend with the provided backend URL.
- It then deploys the frontend to Cloudflare Pages using Wrangler CLI.

**Note:** The deployment script expects:

1. A separate git repository for the backend at the location specified in the script
2. A Cloudflare Pages project already set up with the name specified in the script
3. The backend URL to be provided as an argument or set as the `TASKY_BACKEND_URL` environment variable

For more information on Wasp deployments, refer to the [Wasp deployment documentation](https://wasp-lang.dev/docs/deploying).
