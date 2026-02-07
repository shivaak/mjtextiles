#!/bin/bash

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo ""
    echo "Java is not installed."
    echo "Please install Java 21:"
    echo "  macOS:  brew install openjdk@21"
    echo "  Linux:  sudo apt install openjdk-21-jdk"
    echo ""
    exit 1
fi

# Check if already running on port 8080
if lsof -i :8080 -sTCP:LISTEN &> /dev/null; then
    echo ""
    echo "Application is already running."
    echo "Open your browser and go to http://localhost:8080"
    echo ""
    exit 0
fi

# Start the application
echo "Starting application..."
nohup java -jar retailpos.jar > /dev/null 2>&1 &
APP_PID=$!
echo $APP_PID > .app.pid

sleep 4

# Try to open browser
if command -v open &> /dev/null; then
    open http://localhost:8080
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8080
fi

echo ""
echo "============================================"
echo "  Application is running (PID: $APP_PID)"
echo "  Open http://localhost:8080 in your browser"
echo "============================================"
echo ""
echo "To stop: ./stop.sh"
