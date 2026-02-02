#!/bin/bash

# Function to kill background processes on exit
cleanup() {
    echo -e "\n🛑 Stopping processes..."
    # Kill all background jobs started by this shell
    jobs -p | xargs -r kill
    exit
}

trap cleanup SIGINT

# Default variables
START_BACKEND=false
START_FRONTEND=false
INSTALL_DEPS=false

# Simple argument parsing
if [[ $# -eq 0 ]]; then
    # Default behavior: start both if no flags provided
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

# --- 1. BACKEND ---
if [ "$START_BACKEND" = true ]; then
    echo "📂 Preparing Backend..."
    cd backend
    [ ! -d "venv" ] && python3 -m venv venv
    source venv/bin/activate

    if [ "$INSTALL_DEPS" = true ]; then
        echo "📦 Installing Backend dependencies..."
        pip install --upgrade pip
        pip install fastapi uvicorn motor pydantic python-dotenv stripe razorpay-python
    fi

    echo "🚀 Starting Backend on port 8000..."
    uvicorn server:app --reload --port 8000 &
    cd ..
fi

# --- 2. FRONTEND ---
if [ "$START_FRONTEND" = true ]; then
    echo "📂 Preparing Frontend..."
    cd frontend

    if [ "$INSTALL_DEPS" = true ]; then
        echo "📦 Installing Frontend dependencies..."
        npm install --legacy-peer-deps
    fi

    echo "🌐 Launching Frontend at http://localhost:3000..."
    npm start &
    cd ..
fi

# Keep script running if any background process started
wait