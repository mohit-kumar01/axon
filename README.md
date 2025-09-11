# AXON - Advanced Security Platform

AXON is a comprehensive cybersecurity platform featuring email scanning, file analysis, URL threat detection, and threat intelligence capabilities.

## Features

- 📧 **Email Scanner**: Detects phishing attempts and suspicious email content
- 📄 **File Scanner**: Scans attachments using YARA rules and VirusTotal integration
- 🔗 **URL Analysis**: Analyzes URLs for malicious patterns and RMM tool detection
- 🔍 **Threat Intelligence**: IOC lookup and threat analysis dashboard
- 📊 **Dashboard**: Real-time security metrics and threat visualization

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Modern web browser

### Starting the Platform

1. **Start Backend Services**:
   ```bash
   ./start.sh
   ```
   This will start:
   - File Scanner (port 8001)
   - URL Scanner (port 8002)

2. **Open Frontend**:
   Open `frontend/index.html` in your web browser

### API Endpoints

#### File Scanner (http://localhost:8001)
- `GET /` - Service status
- `POST /scan/attachment` - Scan file attachments
- `POST /scan/email` - Scan email content

#### URL Scanner (http://localhost:8002)
- `GET /` - Service status
- `POST /analyze/url` - Analyze single URL
- `POST /analyze/text` - Extract and analyze URLs from text

### Manual Development Setup

If you prefer to run services individually:

```bash
# File Scanner
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001

# URL Scanner  
cd url_scanner
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8002
```

## Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
GOOGLE_SAFE_BROWSING_API_KEY=your_google_api_key_here
```

### YARA Rules
Custom YARA rules can be added to `backend/rules.yar` for enhanced malware detection.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  File Scanner   │    │  URL Scanner    │
│   (HTML/JS)     │◄──►│   (FastAPI)     │    │   (FastAPI)     │
│                 │    │   Port 8001     │    │   Port 8002     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │  VirusTotal     │    │ Google Safe     │
         │              │  Integration    │    │ Browsing API    │
         │              └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Threat Intel    │
│ Dashboard       │
└─────────────────┘
```

## Usage Examples

### File Scanning
1. Navigate to the File Scanner tab
2. Upload files by dragging and dropping or clicking browse
3. Click "Scan Files" to analyze
4. View detailed results including threat level and recommendations

### Email Analysis
1. Go to the Email Scanner tab
2. Enter sender email, subject, and body content
3. Click "Scan Email" for phishing detection
4. Review suspicious indicators and recommendations

### URL Analysis
1. Visit the Threat Intelligence tab
2. Enter a URL or paste text content with URLs
3. Get detailed analysis including malicious patterns and RMM tool detection

## Security Features

- **YARA Integration**: First-pass malware detection using custom rules
- **VirusTotal API**: Cloud-based threat intelligence
- **Phishing Detection**: Email content analysis for suspicious patterns
- **URL Reputation**: Real-time URL threat assessment
- **RMM Detection**: Identifies remote management tool abuse
- **Threat Intelligence**: IOC lookup and threat database integration

## Development

### Frontend Integration
The frontend uses Fetch API to communicate with backend services:

```javascript
// File scanning
const formData = new FormData();
formData.append('file', file);
const response = await fetch('http://localhost:8001/scan/attachment', {
    method: 'POST',
    body: formData
});

// URL analysis
const response = await fetch('http://localhost:8002/analyze/url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com' })
});
```

### Adding New Features
1. Create new endpoints in the appropriate FastAPI service
2. Update frontend JavaScript modules
3. Add corresponding UI components in HTML
4. Update CSS for styling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.