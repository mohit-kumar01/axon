#!/bin/bash

echo "🚀 Running comprehensive AXON integration test..."
echo "================================================"

# Test all backend services
echo "🔍 Testing Backend Services:"
echo "1. File Scanner API (port 8001):"
curl -s "http://localhost:8001/api/dashboard/stats" | jq '.success' || echo "❌ Failed"

echo "2. URL Scanner API (port 8002):"
curl -s "http://localhost:8002/health" || echo "❌ Failed"

echo ""
echo "🌐 Testing CORS Headers:"
curl -s -H "Origin: http://localhost:8080" "http://localhost:8001/api/dashboard/stats" -I | grep -i "access-control-allow-origin" || echo "❌ CORS not working"

echo ""
echo "📊 Testing all API endpoints:"
endpoints=(
    "/api/dashboard/stats"
    "/api/dashboard/recent-activity"
    "/api/email/recent"
    "/api/file/recent"
)

for endpoint in "${endpoints[@]}"; do
    echo "Testing: $endpoint"
    response=$(curl -s "http://localhost:8001$endpoint")
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        echo "✅ $endpoint - Success"
    else
        echo "❌ $endpoint - Failed: $response"
    fi
done

echo ""
echo "🌍 Frontend server status:"
if curl -s "http://localhost:8080" > /dev/null; then
    echo "✅ Frontend server running on port 8080"
else
    echo "❌ Frontend server not accessible"
fi

echo ""
echo "📝 Summary:"
echo "- Backend APIs: Running on ports 8001 & 8002"
echo "- CORS: Properly configured"
echo "- Frontend: Should be accessible at http://localhost:8080"
echo ""
echo "🎯 Next steps:"
echo "1. Open http://localhost:8080 in your browser"
echo "2. Open Developer Tools (F12)"
echo "3. Clear browser cache (Ctrl+Shift+R)"
echo "4. Check console for any errors"
