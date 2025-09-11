#!/bin/bash

# AXON Integration Test Script
# Tests the frontend-backend integration

echo "🧪 Testing AXON Security Platform Integration..."
echo

# Check if services are running
echo "1. Checking service availability..."

# Test File Scanner
echo -n "   File Scanner (8001): "
if curl -s http://localhost:8001/ > /dev/null 2>&1; then
    echo "✅ Running"
    FILE_SCANNER_STATUS=$(curl -s http://localhost:8001/ | jq -r '.status' 2>/dev/null || echo "Unknown")
    echo "      Status: $FILE_SCANNER_STATUS"
else
    echo "❌ Not responding"
    echo "      Please start the file scanner service"
fi

# Test URL Scanner  
echo -n "   URL Scanner (8002): "
if curl -s http://localhost:8002/ > /dev/null 2>&1; then
    echo "✅ Running"
    URL_SCANNER_STATUS=$(curl -s http://localhost:8002/ | jq -r '.status' 2>/dev/null || echo "Unknown")
    echo "      Status: $URL_SCANNER_STATUS"
else
    echo "❌ Not responding"
    echo "      Please start the URL scanner service"
fi

echo

# Test email scanning endpoint
echo "2. Testing Email Scanning API..."
EMAIL_TEST='{"sender_email":"test@suspicious-domain.com","subject":"Urgent: Verify your account","body":"Click here to verify: http://bit.ly/verify-now"}'

echo -n "   Email scan endpoint: "
RESPONSE=$(curl -s -X POST http://localhost:8001/scan/email \
  -H "Content-Type: application/json" \
  -d "$EMAIL_TEST" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ Working"
    CONFIDENCE=$(echo "$RESPONSE" | jq -r '.confidence_score' 2>/dev/null || echo "N/A")
    IS_PHISHING=$(echo "$RESPONSE" | jq -r '.is_phishing' 2>/dev/null || echo "N/A")
    echo "      Confidence Score: $CONFIDENCE%"
    echo "      Phishing Detected: $IS_PHISHING"
else
    echo "❌ Failed"
fi

echo

# Test URL analysis endpoint
echo "3. Testing URL Analysis API..."
URL_TEST='{"url":"http://bit.ly/suspicious-link"}'

echo -n "   URL analysis endpoint: "
RESPONSE=$(curl -s -X POST http://localhost:8002/analyze/url \
  -H "Content-Type: application/json" \
  -d "$URL_TEST" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ Working"
    CONFIDENCE=$(echo "$RESPONSE" | jq -r '.confidence_score' 2>/dev/null || echo "N/A")
    IS_MALICIOUS=$(echo "$RESPONSE" | jq -r '.is_malicious' 2>/dev/null || echo "N/A")
    echo "      Confidence Score: $CONFIDENCE%"
    echo "      Malicious: $IS_MALICIOUS"
else
    echo "❌ Failed"
fi

echo

# Test text analysis endpoint
echo "4. Testing Text Analysis API..."
TEXT_TEST='{"text":"Visit our secure site at https://secure-login.verify-account.tk and download the file from http://bit.ly/important-update"}'

echo -n "   Text analysis endpoint: "
RESPONSE=$(curl -s -X POST http://localhost:8002/analyze/text \
  -H "Content-Type: application/json" \
  -d "$TEXT_TEST" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ Working"
    URLS_FOUND=$(echo "$RESPONSE" | jq -r '.urls_found' 2>/dev/null || echo "N/A")
    THREAT_SCORE=$(echo "$RESPONSE" | jq -r '.overall_threat_score' 2>/dev/null || echo "N/A")
    echo "      URLs Found: $URLS_FOUND"
    echo "      Threat Score: $THREAT_SCORE%"
else
    echo "❌ Failed"
fi

echo

# Frontend connectivity test
echo "5. Testing Frontend..."
if [ -f "frontend/index.html" ]; then
    echo "   ✅ Frontend files present"
    echo "   📁 Open frontend/index.html in your browser to test the UI"
    
    # Check if required JS files exist
    JS_FILES=("frontend/js/app.js" "frontend/js/file-scanner.js" "frontend/js/email-scanner.js" "frontend/js/threat-intel.js")
    for file in "${JS_FILES[@]}"; do
        if [ -f "$file" ]; then
            echo "   ✅ $(basename "$file") found"
        else
            echo "   ❌ $(basename "$file") missing"
        fi
    done
else
    echo "   ❌ Frontend files not found"
fi

echo
echo "🏁 Integration test completed!"
echo
echo "Next steps:"
echo "1. Start services with: ./start.sh"
echo "2. Open frontend/index.html in your browser"
echo "3. Test file uploads, email scanning, and URL analysis"
echo
echo "For development:"
echo "- Check logs: docker-compose logs -f"
echo "- Stop services: docker-compose down"
echo "- View API docs: http://localhost:8001/docs (File Scanner)"
echo "                 http://localhost:8002/docs (URL Scanner)"
