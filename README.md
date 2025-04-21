# Tasky

A simple yet effective task management application built with the Wasp full-stack framework.

## Features

*   **User Authentication:** Secure sign-up and login functionality.
*   **Task Management:** Create, read, update, and delete tasks.
*   **Task Status:** Mark tasks as complete or incomplete.
*   **Drag & Drop Reordering:** Easily reorder tasks using drag and drop.
*   **Responsive Design:** Built with Tailwind CSS for a seamless experience on all devices.
*   **Optimistic UI Updates:** Provides a smooth user experience by updating the UI immediately for most actions.

## Tech Stack

*   **Framework:** [Wasp](https://wasp-lang.dev/) (React, Node.js)
*   **Database:** PostgreSQL (via Prisma ORM)
*   **Styling:** Tailwind CSS
*   **Frontend Tooling:** Vite
*   **UI Components:** Headless UI, Heroicons
*   **Drag & Drop:** dnd-kit

## Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   [Wasp CLI](https://wasp-lang.dev/docs/quick-start#install-wasp): `npm install -g wasp`
*   A running PostgreSQL database instance.

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
    Create a `.env.server` file in the root of the project and add your database connection URL:
    ```env
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```
    Replace `USER`, `PASSWORD`, `HOST`, `PORT`, and `DATABASE` with your actual database credentials.

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

The project includes a `deploy_client.sh` script as an example for building the client bundle and preparing it for deployment, specifically targeting [Railway](https://railway.app/).

*   The script builds the Wasp project (`wasp build`).
*   It then navigates into the web-app build directory, installs dependencies, and builds the React frontend (`npm run build`).
*   It prepares a Dockerfile using `pierrezemb/gostatic` to serve the static build output.
*   It assumes the `REACT_APP_API_URL` environment variable is set during the client build process.
*   Finally, it uses the Railway CLI (`railway up`) to deploy.

**Note:** For a full production deployment, you would also need to deploy the Wasp backend server and configure the `REACT_APP_API_URL` accordingly to point to your deployed backend. Refer to the [Wasp deployment documentation](https://wasp-lang.dev/docs/deploying) for more comprehensive guides.
