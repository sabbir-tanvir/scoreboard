# Scoreboard Starter

This workspace contains two apps:

- `frontend` → React + Vite + TypeScript + TailwindCSS + Zustand + Socket.IO client
- `backend` → Express + TypeScript + Socket.IO server

## Setup

1. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Install backend dependencies:
   ```bash
   cd ../backend
   npm install
   ```
3. Start the backend:
   ```bash
   npm run dev
   ```
4. Start the frontend in a second terminal:
   ```bash
   npm run dev
   ```

## Default ports

- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173`

## Environment files

- `backend/.env.example` contains `PORT` and `MONGODB_URI`
- `frontend/.env.example` contains `VITE_SOCKET_URL`
