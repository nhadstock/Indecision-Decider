#!/bin/bash
# to run chmod +x start_dev.sh
# Trap Ctrl+C so it cleanly kills both servers when you exit
trap 'kill %1; kill %2' SIGINT

echo "Starting FastAPI Backend..."
(cd backend && source venv/bin/activate && uvicorn main:app --reload) &

echo "Starting React Frontend..."
(cd frontend && npm run dev) &

# Wait for both processes to run indefinitely
wait