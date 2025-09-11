# CORS Error Fix Guide for AXON Security Platform

## Quick Fix Solutions

### 🚀 Option 1: Use Local HTTP Server (Recommended)
The most common CORS issue occurs when opening `index.html` directly as a `file://` URL. Use our built-in server:

```bash
# Start backend services
./start.sh

# In a new terminal, start frontend server
python3 serve-frontend.py

# Open http://localhost:3000 in your browser
```

### 🔧 Option 2: Chrome with Disabled Security (Development Only)
For development testing, you can disable CORS in Chrome:

```bash
# Close all Chrome instances first, then run:
google-chrome --disable-web-security --user-data-dir=/tmp/chrome_dev_session

# Or for Chrome on different systems:
# Windows: chrome.exe --disable-web-security --user-data-dir=c:\temp\chrome
# macOS: open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_session" --disable-web-security
```

### 🛠️ Option 3: Use Firefox with Relaxed CORS
Firefox can be configured to be less strict about CORS:

1. Type `about:config` in Firefox address bar
2. Search for `security.fileuri.strict_origin_policy`
3. Set it to `false`
4. Restart Firefox

## Troubleshooting Steps

### 1. Check Service Status
```bash
./cors-test.sh
```

### 2. Verify Backend is Running
```bash
curl http://localhost:8001/
curl http://localhost:8002/
```

### 3. Test CORS Headers
```bash
curl -I -X OPTIONS http://localhost:8001/scan/email \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"
```

### 4. Check Docker Containers
```bash
docker-compose ps
docker-compose logs file_scanner
docker-compose logs url_scanner
```

## Common CORS Error Messages

### "Access to fetch at 'http://localhost:8001' from origin 'null' has been blocked"
**Solution**: You're opening index.html directly. Use the local server instead.

### "Access to fetch at 'http://localhost:8001' from origin 'file://' has been blocked"
**Solution**: Same as above - use `python3 serve-frontend.py`

### "CORS policy: No 'Access-Control-Allow-Origin' header is present"
**Solution**: Backend service may not be running or CORS middleware not configured.

1. Check if services are running: `docker-compose ps`
2. Restart services: `docker-compose restart`
3. Check logs: `docker-compose logs`

### "CORS policy: The request client is not a secure context"
**Solution**: Use HTTPS or localhost instead of IP addresses.

## Backend CORS Configuration

Our services are configured with these CORS settings:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

## Production CORS Settings

For production, replace `allow_origins=["*"]` with specific domains:

```python
allow_origins=[
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    "http://localhost:3000",  # For development
]
```

## Alternative Solutions

### Use a Reverse Proxy
Set up nginx or Apache to proxy frontend and backend on the same domain:

```nginx
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /path/to/frontend;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/file/ {
        proxy_pass http://localhost:8001/;
    }
    
    location /api/url/ {
        proxy_pass http://localhost:8002/;
    }
}
```

### Use VS Code Live Server Extension
1. Install "Live Server" extension in VS Code
2. Right-click on `frontend/index.html`
3. Select "Open with Live Server"

## Testing CORS Fix

After implementing a solution, test with:

```javascript
// Paste in browser console
fetch('http://localhost:8001/', {method: 'GET'})
  .then(response => response.json())
  .then(data => console.log('✅ CORS working:', data))
  .catch(error => console.error('❌ CORS failed:', error));
```

## Still Having Issues?

1. **Check browser console**: Look for detailed error messages
2. **Test with curl**: Verify the API works outside the browser
3. **Check firewall**: Ensure ports 8001, 8002, 3000 are accessible
4. **Try different browser**: Test in Firefox, Safari, or Edge
5. **Clear browser cache**: Hard refresh with Ctrl+F5

## Contact & Support

If CORS issues persist:
1. Run `./cors-test.sh` and share the output
2. Share browser console error messages
3. Verify services are healthy: `docker-compose ps`
