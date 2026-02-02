# Manual Setup Instructions

Use this guide to run the project manually.

## 1. Prerequisites
Ensure you have the following installed:
- **Python 3.8+**
- **Node.js 16+** & **npm**
- **MongoDB** (Must be running locally on port 27017, or update `backend/.env`)

## 2. Backend Setup
The backend is built with FastAPI.

1.  **Navigate to backend:**
    ```bash
    cd backend
    ```

2.  **Create/Activate Virtual Environment (Optional but recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Linux/Mac
    # venv\Scripts\activate   # On Windows
    ```

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Server:**
    ```bash
    uvicorn server:app --reload
    ```
    The API will be available at `http://localhost:8000`.

## 3. Frontend Setup
The frontend is a React application.

1.  **Navigate to frontend:**
    ```bash
    cd frontend
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```
    *(Note: This might take a few minutes)*

3.  **Run the App:**
    ```bash
    npm start
    ```
    The app will open at `http://localhost:3000`.

## 4. Configuration
I have already created the necessary environment files for you:
- **Backend**: `backend/.env` (Configured for local MongoDB)
- **Frontend**: `frontend/.env` (Configured to talk to localhost:8000)

## 5. Troubleshooting
- **MongoDB Connection**: If the backend fails to start, ensure `mongod` is running.
- **Ports**: Ensure ports 8000 (API) and 3000 (UI) are free.
