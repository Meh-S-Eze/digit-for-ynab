#!/bin/bash

# Migration Script for YNAB AI Chat
# This script will create a new repository in a sibling directory and migrate the code.

set -e # Exit on error

CURRENT_DIR=$(pwd)
PARENT_DIR=$(dirname "$CURRENT_DIR")
REPO_NAME="ynab-ai-chat"
TARGET_DIR="$PARENT_DIR/$REPO_NAME"

echo "🚀 Starting Migration..."
echo "Source: $CURRENT_DIR"
echo "Target: $TARGET_DIR"

# 1. Check if target exists
if [ -d "$TARGET_DIR" ]; then
    echo "❌ Error: Target directory '$TARGET_DIR' already exists."
    echo "Please remove it or rename it before running this script."
    exit 1
fi

# 2. Create Directory Structure
echo "📂 Creating directory structure..."
mkdir -p "$TARGET_DIR/frontend"
mkdir -p "$TARGET_DIR/backend"
mkdir -p "$TARGET_DIR/mcp-server"

# 3. Copy Frontend (Client)
echo "📦 Copying Frontend..."
cp -R "chat-app/client/" "$TARGET_DIR/frontend/"

# 4. Copy Backend (Server)
echo "📦 Copying Backend..."
cp -R "chat-app/server/" "$TARGET_DIR/backend/"

# 5. Copy MCP Server (Original Root)
echo "📦 Copying MCP Server Implementation..."
# We use rsync to copy everything from current dir to mcp-server, excluding the chat-app itself and git/node_modules
rsync -av --progress . "$TARGET_DIR/mcp-server/" \
    --exclude "chat-app" \
    --exclude ".git" \
    --exclude "node_modules" \
    --exclude "dist" \
    --exclude ".DS_Store" \
    --exclude "migrate_to_new_repo.sh"

# 6. Patch Backend Configuration
echo "🔧 Patching Backend Configuration..."
CLIENT_MANAGER="$TARGET_DIR/backend/clientManager.js"

# Update the path to the MCP server dist
# Old: ../../dist/index.js
# New: ../mcp-server/dist/index.js
sed -i '' "s|\.\./\.\./dist/index\.js|\.\./mcp-server/dist/index\.js|g" "$CLIENT_MANAGER"

# 7. Create Helper Scripts in New Repo
echo "📝 Creating helper scripts in new repo..."

# Install All Script
cat > "$TARGET_DIR/install_all.sh" << 'EOF'
#!/bin/bash
echo "📦 Installing Dependencies..."

echo "1/3 Installing MCP Server dependencies..."
cd mcp-server && npm install && npm run build && cd ..

echo "2/3 Installing Backend dependencies..."
cd backend && npm install && cd ..

echo "3/3 Installing Frontend dependencies..."
cd frontend && npm install && cd ..

echo "✅ All dependencies installed!"
EOF
chmod +x "$TARGET_DIR/install_all.sh"

# Start Script
cat > "$TARGET_DIR/start_dev.sh" << 'EOF'
#!/bin/bash
echo "🚀 Starting Development Environment..."

# Trap to kill all subprocesses on exit
trap 'kill 0' EXIT

echo "Starting Backend (Port 3001)..."
cd backend && npm run dev &

echo "Starting Frontend (Port 5173)..."
cd frontend && npm run dev &

wait
EOF
chmod +x "$TARGET_DIR/start_dev.sh"

# 8. Initialize Git
echo "Git Initializing new repository..."
cd "$TARGET_DIR"
git init
echo "# YNAB AI Chat" > README.md
echo "node_modules" >> .gitignore
echo ".env" >> .gitignore
echo "dist" >> .gitignore
echo ".DS_Store" >> .gitignore

echo ""
echo "✅ MIGRATION COMPLETE!"
echo "==============================================="
echo "The new project is located at: $TARGET_DIR"
echo ""
echo "To get started:"
echo "  cd $TARGET_DIR"
echo "  ./install_all.sh"
echo "  ./start_dev.sh"
echo "==============================================="
