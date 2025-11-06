# Expense App

A full-stack expense tracking application with a FastAPI backend and a React Native (Expo) mobile app frontend.

## Run backend

1. cd backend
2. python -m venv .venv
3. .venv\Scripts\activate
4. pip install -r requirements.txt
5. uvicorn backend.main:app --host 0.0.0.0 --port 8000

Note: The `--host 0.0.0.0` flag is needed so a phone can reach the backend server over the network.
