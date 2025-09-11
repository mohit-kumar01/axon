#!/bin/bash

# Manual startup script for development without Docker
# This runs the services directly with Python

echo "🚀 Starting AXON Security Platform (Manual Mode)"
echo "================================================="

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Check if required ports are available
if check_port 8001; then
    echo "⚠️  Port 8001 is already in use. Please stop the existing service."
    lsof -Pi :8001 -sTCP:LISTEN
fi

if check_port 8002; then
    echo "⚠️  Port 8002 is already in use. Please stop the existing service."
    lsof -Pi :8002 -sTCP:LISTEN
fi

# Install dependencies if requirements.txt exists
echo "📦 Checking dependencies..."

if [ -f "backend/requirements.txt" ]; then
    echo "Installing File Scanner dependencies..."
    cd backend
    pip3 install -r requirements.txt --user > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ File Scanner dependencies installed"
    else
        echo "⚠️  Some File Scanner dependencies may not have installed correctly"
    fi
    cd ..
fi

if [ -f "url_scanner/requirements.txt" ]; then
    echo "Installing URL Scanner dependencies..."
    cd url_scanner
    pip3 install -r requirements.txt --user > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ URL Scanner dependencies installed"
    else
        echo "⚠️  Some URL Scanner dependencies may not have installed correctly"
    fi
    cd ..
fi

echo
echo "🚀 Starting services..."

# Start File Scanner in background
echo "Starting File Scanner on port 8001..."
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 > ../file_scanner.log 2>&1 &
FILE_SCANNER_PID=$!
cd ..
echo "File Scanner PID: $FILE_SCANNER_PID"

# Start URL Scanner in background
echo "Starting URL Scanner on port 8002..."
cd url_scanner
python3 -m uvicorn main:app --host 0.0.0.0 --port 8002 > ../url_scanner.log 2>&1 &
URL_SCANNER_PID=$!
cd ..
echo "URL Scanner PID: $URL_SCANNER_PID"

# Wait a moment for services to start
echo "⏳ Waiting for services to start..."
sleep 5

# Check if services are responding
echo
echo "🔍 Checking service health..."

if curl -s http://localhost:8001/ > /dev/null 2>&1; then
    echo "✅ File Scanner is responding (http://localhost:8001)"
else
    echo "❌ File Scanner is not responding"
    echo "Check logs: tail -f file_scanner.log"
fi

if curl -s http://localhost:8002/ > /dev/null 2>&1; then
    echo "✅ URL Scanner is responding (http://localhost:8002)"
else
    echo "❌ URL Scanner is not responding"
    echo "Check logs: tail -f url_scanner.log"
fi

echo
echo "📊 Service Status:"
echo "  📄 File Scanner:    http://localhost:8001 (PID: $FILE_SCANNER_PID)"
echo "  🔗 URL Scanner:     http://localhost:8002 (PID: $URL_SCANNER_PID)"
echo "  📝 Logs:           file_scanner.log, url_scanner.log"
echo
echo "🌐 Frontend Options:"
echo "  1. Local server:    python3 serve-frontend.py"
echo "  2. Direct file:     Open frontend/index.html in browser"
echo
echo "🛑 To stop services:"
echo "  kill $FILE_SCANNER_PID $URL_SCANNER_PID"
echo "  Or run: ./stop-services.sh"
echo

# Create stop script
cat > stop-services.sh << EOF
#!/bin/bash
echo "🛑 Stopping AXON services..."
if kill $FILE_SCANNER_PID 2>/dev/null; then
    echo "✅ File Scanner stopped (PID: $FILE_SCANNER_PID)"
else
    echo "⚠️  File Scanner may have already stopped"
fi

if kill $URL_SCANNER_PID 2>/dev/null; then
    echo "✅ URL Scanner stopped (PID: $URL_SCANNER_PID)"
else
    echo "⚠️  URL Scanner may have already stopped"
fi

# Clean up any remaining processes
pkill -f "uvicorn main:app.*8001"
pkill -f "uvicorn main:app.*8002"

echo "🧹 Services stopped"
EOF

chmod +x stop-services.sh
echo "Created stop-services.sh to stop all services"
