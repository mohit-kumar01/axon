#!/bin/bash

# Comprehensive CORS and Integration Test
echo "🧪 COMPREHENSIVE AXON INTEGRATION TEST"
echo "======================================"
echo

# Test all the endpoints that the frontend needs
endpoints=(
    "GET|/|File Scanner Status"
    "GET|/api/dashboard/stats|Dashboard Statistics"
    "GET|/api/dashboard/recent-activity|Recent Activity"
    "GET|/api/dashboard/threat-trends|Threat Trends"
    "GET|/api/dashboard/system-health|System Health"
    "GET|/api/dashboard/alerts|Security Alerts"
    "GET|/api/dashboard/top-threats|Top Threats"
    "GET|/api/email/recent|Recent Emails"
    "GET|/api/file/recent|Recent Files"
    "POST|/scan/email|Email Scanning"
    "POST|/analyze/url|URL Analysis"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "1. Testing Backend Services Availability:"
echo "==========================================="

# Test File Scanner (Main API)
echo -n "   File Scanner (8001): "
if curl -s http://localhost:8001/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Online${NC}"
    FILE_SCANNER_ONLINE=true
else
    echo -e "${RED}❌ Offline${NC}"
    FILE_SCANNER_ONLINE=false
fi

# Test URL Scanner
echo -n "   URL Scanner (8002): "
if curl -s http://localhost:8002/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Online${NC}"
    URL_SCANNER_ONLINE=true
else
    echo -e "${RED}❌ Offline${NC}"
    URL_SCANNER_ONLINE=false
fi

# Test Frontend Server
echo -n "   Frontend Server (8080): "
if curl -s http://localhost:8080/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Online${NC}"
    FRONTEND_ONLINE=true
else
    echo -e "${RED}❌ Offline${NC}"
    FRONTEND_ONLINE=false
fi

echo

if [ "$FILE_SCANNER_ONLINE" = false ] || [ "$URL_SCANNER_ONLINE" = false ]; then
    echo -e "${RED}❌ Backend services are not running. Please start with: ./start-manual.sh${NC}"
    exit 1
fi

if [ "$FRONTEND_ONLINE" = false ]; then
    echo -e "${YELLOW}⚠️  Frontend server is not running. Start with: python3 serve-frontend.py${NC}"
fi

echo "2. Testing API Endpoints:"
echo "========================="

success_count=0
total_count=0

for endpoint_info in "${endpoints[@]}"; do
    IFS='|' read -r method path description <<< "$endpoint_info"
    total_count=$((total_count + 1))
    
    echo -n "   $description: "
    
    if [[ "$path" == "/analyze/url" ]]; then
        # Test URL Scanner
        if [ "$method" = "POST" ]; then
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
                -X POST http://localhost:8002$path \
                -H "Content-Type: application/json" \
                -H "Origin: http://localhost:8080" \
                -d '{"url":"http://example.com"}' 2>/dev/null)
        else
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
                -H "Origin: http://localhost:8080" \
                http://localhost:8002$path 2>/dev/null)
        fi
    else
        # Test File Scanner (Main API)
        if [ "$method" = "POST" ]; then
            if [[ "$path" == "/scan/email" ]]; then
                response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
                    -X POST http://localhost:8001$path \
                    -H "Content-Type: application/json" \
                    -H "Origin: http://localhost:8080" \
                    -d '{"sender_email":"test@example.com","subject":"Test","body":"Test email"}' 2>/dev/null)
            else
                response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
                    -X POST http://localhost:8001$path \
                    -H "Origin: http://localhost:8080" 2>/dev/null)
            fi
        else
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
                -H "Origin: http://localhost:8080" \
                http://localhost:8001$path 2>/dev/null)
        fi
    fi
    
    http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    response_body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$http_status" = "200" ]; then
        echo -e "${GREEN}✅ Working (HTTP $http_status)${NC}"
        success_count=$((success_count + 1))
    else
        echo -e "${RED}❌ Failed (HTTP $http_status)${NC}"
        if [ ! -z "$response_body" ]; then
            echo "      Response: $(echo $response_body | head -c 100)..."
        fi
    fi
done

echo

echo "3. Testing CORS Headers:"
echo "========================"

cors_success=0
cors_total=3

# Test main API CORS
echo -n "   Main API CORS: "
cors_response=$(curl -s -I -X OPTIONS http://localhost:8001/api/dashboard/stats \
    -H "Origin: http://localhost:8080" \
    -H "Access-Control-Request-Method: GET" 2>/dev/null)

if echo "$cors_response" | grep -i "access-control-allow-origin" > /dev/null; then
    echo -e "${GREEN}✅ Configured${NC}"
    cors_success=$((cors_success + 1))
else
    echo -e "${RED}❌ Missing${NC}"
fi

# Test file scanner CORS
echo -n "   File Scanner CORS: "
cors_response=$(curl -s -I -X OPTIONS http://localhost:8001/scan/email \
    -H "Origin: http://localhost:8080" \
    -H "Access-Control-Request-Method: POST" 2>/dev/null)

if echo "$cors_response" | grep -i "access-control-allow-origin" > /dev/null; then
    echo -e "${GREEN}✅ Configured${NC}"
    cors_success=$((cors_success + 1))
else
    echo -e "${RED}❌ Missing${NC}"
fi

# Test URL scanner CORS
echo -n "   URL Scanner CORS: "
cors_response=$(curl -s -I -X OPTIONS http://localhost:8002/analyze/url \
    -H "Origin: http://localhost:8080" \
    -H "Access-Control-Request-Method: POST" 2>/dev/null)

if echo "$cors_response" | grep -i "access-control-allow-origin" > /dev/null; then
    echo -e "${GREEN}✅ Configured${NC}"
    cors_success=$((cors_success + 1))
else
    echo -e "${RED}❌ Missing${NC}"
fi

echo

echo "4. Frontend Integration Test:"
echo "============================="

if [ "$FRONTEND_ONLINE" = true ]; then
    echo -e "${GREEN}✅ Frontend server is running on http://localhost:8080${NC}"
    echo "   You can now test the complete integration by:"
    echo "   1. Opening http://localhost:8080 in your browser"
    echo "   2. Testing file uploads in the File Scanner tab"
    echo "   3. Testing email analysis in the Email Scanner tab"
    echo "   4. Testing URL analysis in the Threat Intelligence tab"
else
    echo -e "${YELLOW}⚠️  Frontend server not running. Start with: python3 serve-frontend.py${NC}"
fi

echo

echo "📊 SUMMARY:"
echo "==========="
echo "   API Endpoints: $success_count/$total_count working"
echo "   CORS Headers: $cors_success/$cors_total configured"

if [ $success_count -eq $total_count ] && [ $cors_success -eq $cors_total ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! CORS errors are fixed!${NC}"
    echo
    echo "🚀 Your AXON Security Platform is ready to use:"
    echo "   Frontend: http://localhost:8080"
    echo "   File Scanner API: http://localhost:8001"
    echo "   URL Scanner API: http://localhost:8002"
else
    echo -e "${RED}❌ Some tests failed. Check the output above for details.${NC}"
fi

echo
echo "🎯 Browser Test (paste into console):"
echo "====================================="
cat << 'EOF'
// Test dashboard loading
fetch('http://localhost:8001/api/dashboard/stats')
.then(response => response.json())
.then(data => console.log('✅ Dashboard API:', data))
.catch(error => console.error('❌ Dashboard API:', error));

// Test email scanning
fetch('http://localhost:8001/scan/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        sender_email: 'test@example.com',
        subject: 'Test Email',
        body: 'This is a test email with a link: http://example.com'
    })
})
.then(response => response.json())
.then(data => console.log('✅ Email Scan:', data))
.catch(error => console.error('❌ Email Scan:', error));

// Test URL analysis
fetch('http://localhost:8002/analyze/url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'http://suspicious-site.example' })
})
.then(response => response.json())
.then(data => console.log('✅ URL Analysis:', data))
.catch(error => console.error('❌ URL Analysis:', error));
EOF
