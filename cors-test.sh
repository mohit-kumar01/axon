#!/bin/bash

# CORS Diagnostic Script
echo "🔍 CORS Diagnostic Test for AXON Security Platform"
echo "=================================================="
echo

# Test 1: Check if services are running
echo "1. Testing Service Availability:"
echo "   File Scanner (8001):"
if curl -s http://localhost:8001/ > /dev/null 2>&1; then
    echo "   ✅ File Scanner is running"
else
    echo "   ❌ File Scanner is not running"
    echo "   Please start with: ./start.sh or docker-compose up -d"
    exit 1
fi

echo "   URL Scanner (8002):"
if curl -s http://localhost:8002/ > /dev/null 2>&1; then
    echo "   ✅ URL Scanner is running"
else
    echo "   ❌ URL Scanner is not running"
    echo "   Please start with: ./start.sh or docker-compose up -d"
    exit 1
fi

echo

# Test 2: Check CORS headers with OPTIONS request
echo "2. Testing CORS Headers:"
echo "   File Scanner OPTIONS request:"
CORS_HEADERS=$(curl -s -I -X OPTIONS http://localhost:8001/scan/email \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" 2>/dev/null)

if echo "$CORS_HEADERS" | grep -i "access-control-allow-origin" > /dev/null; then
    echo "   ✅ CORS headers present"
    echo "   Headers:"
    echo "$CORS_HEADERS" | grep -i "access-control" | sed 's/^/      /'
else
    echo "   ❌ CORS headers missing or incorrect"
    echo "   Response headers:"
    echo "$CORS_HEADERS" | sed 's/^/      /'
fi

echo
echo "   URL Scanner OPTIONS request:"
CORS_HEADERS=$(curl -s -I -X OPTIONS http://localhost:8002/analyze/url \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" 2>/dev/null)

if echo "$CORS_HEADERS" | grep -i "access-control-allow-origin" > /dev/null; then
    echo "   ✅ CORS headers present"
    echo "   Headers:"
    echo "$CORS_HEADERS" | grep -i "access-control" | sed 's/^/      /'
else
    echo "   ❌ CORS headers missing or incorrect"
    echo "   Response headers:"
    echo "$CORS_HEADERS" | sed 's/^/      /'
fi

echo

# Test 3: Test actual API calls with CORS headers
echo "3. Testing API Calls with CORS:"
echo "   Email scan test:"
EMAIL_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST http://localhost:8001/scan/email \
    -H "Origin: http://localhost:3000" \
    -H "Content-Type: application/json" \
    -d '{"sender_email":"test@example.com","subject":"Test","body":"Test email"}' 2>/dev/null)

HTTP_STATUS=$(echo $EMAIL_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
RESPONSE_BODY=$(echo $EMAIL_RESPONSE | sed -e 's/HTTPSTATUS:.*//g')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ Email scan API working (HTTP $HTTP_STATUS)"
else
    echo "   ❌ Email scan API failed (HTTP $HTTP_STATUS)"
    echo "   Response: $RESPONSE_BODY"
fi

echo "   URL analysis test:"
URL_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST http://localhost:8002/analyze/url \
    -H "Origin: http://localhost:3000" \
    -H "Content-Type: application/json" \
    -d '{"url":"http://example.com"}' 2>/dev/null)

HTTP_STATUS=$(echo $URL_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
RESPONSE_BODY=$(echo $URL_RESPONSE | sed -e 's/HTTPSTATUS:.*//g')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ URL analysis API working (HTTP $HTTP_STATUS)"
else
    echo "   ❌ URL analysis API failed (HTTP $HTTP_STATUS)"
    echo "   Response: $RESPONSE_BODY"
fi

echo

# Test 4: Browser Console Test
echo "4. Browser Console Test:"
echo "   Copy and paste this into your browser's developer console:"
echo "   (Make sure you have the frontend page open first)"
echo

cat << 'EOF'
// Test File Scanner
fetch('http://localhost:8001/scan/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        sender_email: 'test@example.com',
        subject: 'Test',
        body: 'Test email'
    })
})
.then(response => response.json())
.then(data => console.log('File Scanner Success:', data))
.catch(error => console.error('File Scanner CORS Error:', error));

// Test URL Scanner
fetch('http://localhost:8002/analyze/url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'http://example.com' })
})
.then(response => response.json())
.then(data => console.log('URL Scanner Success:', data))
.catch(error => console.error('URL Scanner CORS Error:', error));
EOF

echo
echo "============================================"
echo "🔧 Troubleshooting Tips:"
echo "1. Make sure services are running: ./start.sh"
echo "2. Check browser developer console for detailed CORS errors"
echo "3. Try accessing the frontend via a local server instead of file://"
echo "4. For development, you can disable CORS in Chrome with:"
echo "   chrome --disable-web-security --user-data-dir=/tmp/chrome"
echo "5. Make sure Docker containers are healthy: docker-compose ps"
echo "============================================"
