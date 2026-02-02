#!/bin/bash

# Kill previous attempts
kill $(jobs -p) 2>/dev/null

echo "🔧 Patching Project for Python 3.14 and Node 22..."

# --- 1. BACKEND PATCH ---
cd backend
source venv/bin/activate

# Clean the requirements file of the ghost package
sed -i '/emergentintegrations/d' requirements.txt

# Manually install the missing modules that were skipped
echo "🐍 Installing missing Python SDKs..."
pip install paypalrestsdk razorpay --upgrade

# Double check uvicorn
pip install uvicorn fastapi motor pydantic-settings

# --- 2. FRONTEND PATCH ---
cd ../frontend
echo "⚛️ Fixing Node/Ajv Dependency conflict..."

# Manually install the specific missing ajv module and its keywords
# This is usually what fixes the 'Cannot find module ajv/dist/compile/codegen'
npm install ajv ajv-keywords --save-dev --legacy-peer-deps

# --- 3. RUN ---
echo "🚀 Launching with patches..."
cd ../backend
source venv/bin/activate
uvicorn server:app --reload --port 8000 &
BACKEND_PID=$!

cd ../frontend
npm start