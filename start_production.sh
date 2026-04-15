#!/bin/bash

# Navigate to backend
cd "$(dirname "$0")/dropout-back-main"

# Start the backend server with Gunicorn (production mode)
# This will also serve the frontend build from the 'build' folder
echo "Starting production server on http://localhost:8000"
echo "Frontend is being served from dropout-front-main/build"

# Ensure dependencies are installed
pip3 install -r requirements.txt
pip3 install gunicorn

# Run gunicorn
python3 -m gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000 --timeout 120
