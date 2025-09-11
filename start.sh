#!/bin/bash

# AXON Security Platform - Development Startup Script
# This script starts all backend services for development

echo "Starting AXON Security Platform..."

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Error: docker-compose is not available. Please install Docker Compose."
    exit 1
fi

echo "Starting backend services with Docker Compose..."

# Use docker-compose or docker compose depending on what's available
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ AXON Security Platform is starting up!"
    echo ""
    echo "Services available:"
    echo "  📄 File Scanner:    http://localhost:8001"
    echo "  🔗 URL Scanner:     http://localhost:8002"
    echo ""
    echo "🌐 Frontend Options:"
    echo "  1. Local server:    python3 serve-frontend.py (Recommended)"
    echo "  2. Direct file:     Open frontend/index.html in browser"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop services: docker-compose down"
    echo ""
    echo "Checking service health..."
    sleep 5
    
    # Check if services are responding
    echo "Testing File Scanner..."
    if curl -s http://localhost:8001/ > /dev/null; then
        echo "✅ File Scanner is responding"
    else
        echo "⚠️  File Scanner may still be starting up"
    fi
    
    echo "Testing URL Scanner..."
    if curl -s http://localhost:8002/ > /dev/null; then
        echo "✅ URL Scanner is responding"
    else
        echo "⚠️  URL Scanner may still be starting up"
    fi
    
else
    echo "❌ Failed to start services. Check the logs with: docker-compose logs"
    exit 1
fi
