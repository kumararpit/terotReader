#!/bin/bash

# Function to kill background processes on exit
cleanup() {
    echo -e "\n🛑 Stopping services (FastAPI & React)..."
    # Kill all background jobs started by this shell
    jobs -p | xargs -r kill 2>/dev/null
    exit
}

trap cleanup SIGINT

# Default variables
START_BACKEND=false
START_FRONTEND=false
INSTALL_DEPS=false

# Simple argument parsing
if [[ $# -eq 0 ]]; then
    START_BACKEND=true
    START_FRONTEND=true
else
    for arg in "$@"; do
        case $arg in
            --backend|-b) START_BACKEND=true ;;
            --frontend|-f) START_FRONTEND=true ;;
            --install|-i) INSTALL_DEPS=true ;;
        esac
    done
fi

# --- 1. BACKEND (FastAPI) ---
if [ "$START_BACKEND" = true ]; then
    echo "🐍 Preparing Backend..."
    cd backend || exit
    
    # Create venv if missing
    if [ ! -d "venv" ]; then
        echo "🛠️ Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate the environment
    source venv/bin/activate
    echo "✅ Virtual environment activated: $(which python)"

    if [ "$INSTALL_DEPS" = true ]; then
        echo "📦 Installing Backend dependencies from requirements.txt..."
        pip install --upgrade pip
        pip install -r requirements.txt
    fi

    echo "🚀 Starting Backend on port 8000..."
    uvicorn server:app --reload --port 8000 &
    BACKEND_PID=$!
    cd ..
fi

# --- 2. FRONTEND (React) ---
if [ "$START_FRONTEND" = true ]; then
    echo "⚛️ Preparing Frontend..."
    cd frontend || exit

    if [ "$INSTALL_DEPS" = true ]; then
        echo "📦 Installing Frontend dependencies..."
        npm install --legacy-peer-deps
    fi

    echo "🌐 Launching Frontend at http://localhost:3000..."
    npm start &
    FRONTEND_PID=$!
    cd ..
fi

echo "🟢 All systems go! Press Ctrl+C to stop both servers."

# Keep script running and wait for background processes
wait