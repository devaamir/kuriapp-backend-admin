# Running the Project

This project consists of two parts: the **Admin Dashboard (Frontend)** and the **Backend API**. You need to run them in separate terminal windows.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

## 1. Running the Backend (API)

The backend runs on port **3001**.

1.  Open a terminal.
2.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
3.  Install dependencies (first time only):
    ```bash
    npm install
    ```
4.  Start the server:
    ```bash
    npm run dev
    ```
5.  You should see: `Server running on port 3001`.

## 2. Running the Admin Dashboard (Frontend)

The frontend runs on port **3000**.

1.  Open a **new** terminal window.
2.  Navigate to the project root directory (where `vite.config.ts` is located):
    ```bash
    # If you are in the backend folder, go back up
    cd ..
    ```
3.  Install dependencies (first time only):
    ```bash
    npm install
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
5.  Open your browser and visit: [http://localhost:3000](http://localhost:3000)

## Summary

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend**: [http://localhost:3001](http://localhost:3001)
