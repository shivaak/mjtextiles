#!/bin/bash

if [ -f .app.pid ]; then
    PID=$(cat .app.pid)
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID"
        echo "Application stopped (PID: $PID)."
    else
        echo "Application was not running (stale PID file)."
    fi
    rm -f .app.pid
else
    # Try to find and kill by port
    PID=$(lsof -t -i :8080 -sTCP:LISTEN 2>/dev/null)
    if [ -n "$PID" ]; then
        kill "$PID"
        echo "Application stopped (PID: $PID)."
    else
        echo "Application is not running."
    fi
fi
