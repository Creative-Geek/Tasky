#!/bin/bash

# update_project.sh
# Usage: ./update_project.sh [BACKEND_URL]
# If BACKEND_URL is not provided, it will try to use the TASKY_BACKEND_URL environment variable.

set -e  # Exit script if a command fails (except in explicitly caught situations)

# ========= CONFIG (adjust these as needed) ==========
MAIN_DIR="$HOME/Documents/Tasky" # Updated project name
BACKEND_REPO_DIR="$HOME/Documents/Tasky-Backend" # Updated backend folder name
SCRIPT_DIR="$MAIN_DIR/scripts"
FRONTEND_BUILD_REL=".wasp/build/web-app"
FRONTEND_BUILD_PATH="$MAIN_DIR/$FRONTEND_BUILD_REL"
FRONTEND_PROJECT_NAME="Tasky" # Hardcoded frontend project name
# ===================================================

# ----------- Usage and input checks -----------
# Check if URL argument is provided
if [ $# -eq 1 ]; then
  BACKEND_URL="$1"
# Check if environment variable is set and no argument is provided
elif [ -z "$1" ] && [ -n "$TASKY_BACKEND_URL" ]; then
  BACKEND_URL="$TASKY_BACKEND_URL"
  echo "Using TASKY_BACKEND_URL environment variable."
# If neither is provided, show usage and exit
else
  echo "Usage: $0 [BACKEND_URL]"
  echo "Alternatively, set the TASKY_BACKEND_URL environment variable."
  exit 1
fi

echo "Backend URL: $BACKEND_URL"
echo "Frontend Wrangler project: $FRONTEND_PROJECT_NAME"

# ----------- BUILD PROJECT -----------
cd "$MAIN_DIR" || { echo "Failed to cd to $MAIN_DIR"; exit 1; }
echo "==== Running wasp build ===="
if ! wasp build; then
  echo "wasp build failed!"
  exit 1
fi

# ----------- DEPLOY BACKEND -----------
echo "==== Updating backend repo ===="
cd "$BACKEND_REPO_DIR" || { echo "Failed to cd to $BACKEND_REPO_DIR"; exit 1; }
if ! git pull; then
  echo "git pull failed! Resolve conflicts or network issues."
  exit 1
fi
# Remove all tracked files (preserve .git and optionally .gitignore)
git rm -rf . > /dev/null 2>&1 || true

# Copy built backend files
cp -r "$MAIN_DIR/.wasp/build/"* .

git add .
if ! git diff --cached --quiet; then  # Only commit if there are changes
  if ! git commit -m "Automated backend deploy $(date +%Y-%m-%d_%H-%M)"; then
    echo "git commit failed!"
    exit 1
  fi
  if ! git push; then
    echo "git push failed! Check your ssh keys, remote status or conflicts."
    exit 1
  fi
  echo "Backend updated and pushed."
else
  echo "No backend changes to commit."
fi

# ----------- FRONTEND BUILD -----------
echo "==== Building frontend ===="
cd "$FRONTEND_BUILD_PATH" || { echo "Can't cd to frontend build path"; exit 1; }
if ! npm install; then
  echo "npm install failed for frontend."
  exit 1
fi
if ! REACT_APP_API_URL="$BACKEND_URL" npm run build; then
  echo "Frontend build failed."
  exit 1
fi

# ----------- FRONTEND DEPLOY WITH WRANGLER -----------
echo "==== Deploying frontend with wrangler ===="

# Removed wrangler login check

# Check if project exists
if ! npx wrangler pages project list | grep -q "$FRONTEND_PROJECT_NAME"; then
  echo "Wrangler project '$FRONTEND_PROJECT_NAME' does not exist."
  echo "Go to https://dash.cloudflare.com/ -> Pages, and create the project named '$FRONTEND_PROJECT_NAME', then retry."
  exit 1
fi

if ! npx wrangler pages deploy ./build --project-name="$FRONTEND_PROJECT_NAME" --commit-dirty=true --branch=main; then
  echo "Frontend deploy failed! Check wrangler and project config."
  exit 1
fi

echo "==== DONE! All deployments succeeded. ===="
