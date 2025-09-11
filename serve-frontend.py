#!/usr/bin/env python3

import http.server
import socketserver
import os
import sys

# Simple HTTP server to serve the frontend files
# This helps avoid CORS issues that occur when opening index.html directly

PORT = 8080
DIRECTORY = "frontend"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add CORS headers to all responses
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

if __name__ == "__main__":
    # Change to the project root directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    if not os.path.exists(DIRECTORY):
        print(f"Error: {DIRECTORY} directory not found!")
        print("Please run this script from the project root directory.")
        sys.exit(1)
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"🌐 AXON Frontend Server")
            print(f"📁 Serving {DIRECTORY}/ directory")
            print(f"🔗 Open: http://localhost:{PORT}")
            print(f"🛑 Press Ctrl+C to stop")
            print()
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except OSError as e:
        if e.errno == 98:  # Address already in use
            print(f"❌ Port {PORT} is already in use!")
            print("Try using a different port or stop the existing service.")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)
