#!/bin/bash
echo "🛑 Stopping AXON services..."
if kill 60705 2>/dev/null; then
    echo "✅ File Scanner stopped (PID: 60705)"
else
    echo "⚠️  File Scanner may have already stopped"
fi

if kill 60706 2>/dev/null; then
    echo "✅ URL Scanner stopped (PID: 60706)"
else
    echo "⚠️  URL Scanner may have already stopped"
fi

# Clean up any remaining processes
pkill -f "uvicorn main:app.*8001"
pkill -f "uvicorn main:app.*8002"

echo "🧹 Services stopped"
