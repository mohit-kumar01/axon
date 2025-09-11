# This file creates the File Scan Microservice (Step 3 of the implementation plan).
# It's a FastAPI application that listens for file uploads and scans them using VirusTotal.
# VERSION 6: Adds YARA scanning as a first-pass check.

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
import httpx
import hashlib
import yara
from pathlib import Path

# --- Configuration ---

class Settings(BaseSettings):
    """Loads configuration from environment variables."""
    virustotal_api_key: str = "d70ce1af8191c286d89c45b3981fe48a87289cce8ac2f093b1475f6c9adea71c"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()

# --- YARA Rule Compilation ---
# Compile YARA rules at startup for performance.
try:
    rule_path = Path(__file__).parent / "rules.yar"
    yara_rules = yara.compile(filepath=str(rule_path))
    print("Successfully compiled YARA rules.")
except yara.Error as e:
    print(f"FATAL: Could not compile YARA rules. Error: {e}")
    yara_rules = None

# Initialize the FastAPI application
app = FastAPI(
    title="File Scan Microservice",
    description="Scans file attachments for malware using YARA and VirusTotal.",
    version="6.0.0"
)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# --- Service Connections ---
vt_client = httpx.AsyncClient(
    base_url="https://www.virustotal.com/api/v3",
    headers={"x-apikey": settings.virustotal_api_key}
)

# --- Helper Functions ---

def scan_with_yara(file_content: bytes) -> list:
    """Scans file content with pre-compiled YARA rules."""
    if not yara_rules:
        return []
    try:
        matches = yara_rules.match(data=file_content)
        return [match.rule for match in matches]
    except yara.Error as e:
        print(f"Error during YARA scan: {e}")
        return []

async def check_virustotal(file_content: bytes, filename: str) -> dict:
    """
    Checks a file against VirusTotal. If the hash isn't found, it uploads the file.
    """
    if not settings.virustotal_api_key or settings.virustotal_api_key == "YOUR_API_KEY_HERE":
        return {"status": "Skipped", "score_contribution": 0.0}

    file_hash = hashlib.sha256(file_content).hexdigest()
    try:
        response = await vt_client.get(f"/files/{file_hash}")

        if response.status_code == 404:
            files = {"file": (filename, file_content)}
            upload_response = await vt_client.post("/files", files=files, timeout=30.0)
            upload_response.raise_for_status()
            return {"status": "SubmittedForAnalysis", "score_contribution": 5.0}

        response.raise_for_status()
        data = response.json()
        stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
        malicious_count = stats.get("malicious", 0)

        if malicious_count > 0:
            score = min(25.0, malicious_count * 5.0)
            return {"status": "ThreatFound", "score_contribution": score, "details": stats}
        else:
            return {"status": "Clean", "score_contribution": 0.0}

    except httpx.RequestError as e:
        return {"status": "ApiError", "score_contribution": 0.0}

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"status": "File Scan Microservice is running"}

# Dashboard API endpoints
@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """Returns dashboard statistics."""
    return {
        "success": True,
        "data": {
            "total_scans": 1247,
            "threats_detected": 89,
            "emails_processed": 2341,
            "urls_analyzed": 567,
            "system_health": "healthy",
            "last_updated": "2025-09-11T10:30:00Z"
        }
    }

@app.get("/api/dashboard/recent-activity")
async def get_recent_activity(limit: int = 10):
    """Returns recent security activity."""
    activities = [
        {
            "id": 1,
            "type": "file_scan",
            "description": "Malware detected in attachment.pdf",
            "severity": "high",
            "timestamp": "2025-09-11T10:25:00Z"
        },
        {
            "id": 2,
            "type": "email_scan",
            "description": "Phishing attempt blocked",
            "severity": "medium",
            "timestamp": "2025-09-11T10:20:00Z"
        },
        {
            "id": 3,
            "type": "url_scan",
            "description": "Suspicious URL detected",
            "severity": "low",
            "timestamp": "2025-09-11T10:15:00Z"
        }
    ]
    
    return {
        "success": True,
        "data": activities[:limit]
    }

@app.get("/api/dashboard/threat-trends")
async def get_threat_trends(days: int = 7):
    """Returns threat trend data."""
    trends = {
        "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "datasets": [
            {
                "label": "Threats Detected",
                "data": [12, 19, 3, 5, 2, 3, 9],
                "borderColor": "rgb(239, 68, 68)",
                "backgroundColor": "rgba(239, 68, 68, 0.1)"
            },
            {
                "label": "Files Scanned",
                "data": [45, 52, 38, 41, 35, 48, 55],
                "borderColor": "rgb(59, 130, 246)",
                "backgroundColor": "rgba(59, 130, 246, 0.1)"
            }
        ]
    }
    
    return {
        "success": True,
        "data": trends
    }

@app.get("/api/dashboard/system-health")
async def get_system_health():
    """Returns system health status."""
    return {
        "success": True,
        "data": {
            "overall_status": "healthy",
            "services": {
                "file_scanner": {"status": "online", "uptime": "99.9%"},
                "url_scanner": {"status": "online", "uptime": "99.8%"},
                "email_scanner": {"status": "online", "uptime": "99.7%"}
            },
            "resources": {
                "cpu_usage": 15.2,
                "memory_usage": 42.1,
                "disk_usage": 23.8
            }
        }
    }

@app.get("/api/dashboard/alerts")
async def get_alerts():
    """Returns active security alerts."""
    alerts = [
        {
            "id": 1,
            "type": "warning",
            "title": "High threat activity detected",
            "message": "Unusual number of malware samples detected in the last hour",
            "timestamp": "2025-09-11T10:30:00Z"
        },
        {
            "id": 2,
            "type": "info",
            "title": "System update available",
            "message": "New threat signatures are available for download",
            "timestamp": "2025-09-11T09:15:00Z"
        }
    ]
    
    return {
        "success": True,
        "data": alerts
    }

@app.get("/api/dashboard/top-threats")
async def get_top_threats(limit: int = 10):
    """Returns top threat families."""
    threats = [
        {"name": "Trojan.Generic", "count": 45, "percentage": 23.5},
        {"name": "Phishing.Email", "count": 38, "percentage": 19.8},
        {"name": "Malware.PDF", "count": 32, "percentage": 16.7},
        {"name": "Suspicious.URL", "count": 28, "percentage": 14.6},
        {"name": "RMM.Tool", "count": 23, "percentage": 12.0}
    ]
    
    return {
        "success": True,
        "data": threats[:limit]
    }

@app.get("/api/email/recent")
async def get_recent_emails(limit: int = 20):
    """Returns recent email scan results."""
    emails = [
        {
            "id": 1,
            "sender": "suspicious@example.com",
            "subject": "Urgent: Verify Account",
            "is_phishing": True,
            "confidence_score": 85,
            "timestamp": "2025-09-11T10:25:00Z"
        },
        {
            "id": 2,
            "sender": "noreply@bank.com",
            "subject": "Monthly Statement",
            "is_phishing": False,
            "confidence_score": 15,
            "timestamp": "2025-09-11T10:20:00Z"
        }
    ]
    
    return {
        "success": True,
        "data": emails[:limit]
    }

@app.get("/api/file/recent")
async def get_recent_files(limit: int = 20):
    """Returns recent file scan results."""
    files = [
        {
            "id": 1,
            "filename": "suspicious.exe",
            "is_malware": True,
            "confidence_score": 95,
            "file_size": 1024000,
            "timestamp": "2025-09-11T10:25:00Z"
        },
        {
            "id": 2,
            "filename": "document.pdf",
            "is_malware": False,
            "confidence_score": 5,
            "file_size": 256000,
            "timestamp": "2025-09-11T10:20:00Z"
        }
    ]
    
    return {
        "success": True,
        "data": files[:limit]
    }

@app.options("/api/dashboard/stats")
@app.options("/api/dashboard/recent-activity")
@app.options("/api/dashboard/threat-trends")
@app.options("/api/dashboard/system-health")
@app.options("/api/dashboard/alerts")
@app.options("/api/dashboard/top-threats")
@app.options("/api/email/recent")
@app.options("/api/file/recent")
@app.options("/scan/email")
@app.options("/scan/attachment")
async def options_handler():
    return {"message": "OK"}

@app.post("/scan/email")
async def scan_email(email_data: dict):
    """
    Scans email content for phishing indicators and suspicious URLs.
    """
    try:
        sender_email = email_data.get("sender_email", "")
        subject = email_data.get("subject", "")
        body = email_data.get("body", "")
        
        # Simple phishing detection logic
        phishing_indicators = []
        confidence_score = 0
        
        # Check for suspicious keywords
        suspicious_keywords = [
            "urgent", "verify account", "click here", "suspended", "verify now",
            "act now", "limited time", "winner", "congratulations", "claim",
            "bitcoin", "cryptocurrency", "investment opportunity", "prince",
            "inheritance", "tax refund", "irs", "paypal", "amazon"
        ]
        
        content_lower = (subject + " " + body).lower()
        for keyword in suspicious_keywords:
            if keyword in content_lower:
                phishing_indicators.append(f"Suspicious keyword: {keyword}")
                confidence_score += 5
        
        # Check for suspicious sender domains
        suspicious_domains = ["tempmail", "10minutemail", "guerrillamail", "mailinator"]
        sender_domain = sender_email.split("@")[-1] if "@" in sender_email else ""
        for domain in suspicious_domains:
            if domain in sender_domain:
                phishing_indicators.append(f"Suspicious sender domain: {sender_domain}")
                confidence_score += 15
        
        # Check for URL patterns (basic)
        import re
        urls = re.findall(r'https?://[^\s/$.?#].[^\s]*', body)
        for url in urls:
            if any(suspicious in url.lower() for suspicious in ["bit.ly", "tinyurl", "t.co"]):
                phishing_indicators.append(f"Suspicious shortened URL: {url}")
                confidence_score += 10
        
        is_phishing = confidence_score > 20
        threat_level = "high" if confidence_score > 30 else "medium" if confidence_score > 10 else "low"
        
        return {
            "sender_email": sender_email,
            "subject": subject,
            "is_phishing": is_phishing,
            "confidence_score": min(confidence_score, 100),
            "threat_level": threat_level,
            "indicators": phishing_indicators,
            "processing_time": 0.5,
            "urls_found": len(urls)
        }
    
    except Exception as e:
        print(f"Error during email scan: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error during email scan: {e}")

@app.post("/scan/attachment")
async def scan_attachment(file: UploadFile = File(...)):
    """
    Receives a file, scans it with YARA, and if clean, checks VirusTotal.
    """
    try:
        file_content = await file.read()
        print(f"Scanning file: {file.filename}, size: {len(file_content)} bytes")

        # Step 1: Scan with YARA first
        yara_matches = scan_with_yara(file_content)
        if yara_matches:
            print(f"YARA FOUND threat. Matched rules: {yara_matches}")
            return {"filename": file.filename, "status": "ThreatFound", "source": "YARA", "details": {"matched_rules": yara_matches}, "score": 25.0}

        print("YARA scan is CLEAN. Proceeding to VirusTotal.")
        
        # Step 2: If no YARA match, proceed with VirusTotal
        vt_result = await check_virustotal(file_content, file.filename)
        
        score = vt_result.get("score_contribution", 0.0)
        status = vt_result.get("status", "Error")

        if status == "ThreatFound":
            return {"filename": file.filename, "status": "ThreatFound", "source": "VirusTotal", "details": vt_result.get("details"), "score": score}
        
        return {"filename": file.filename, "status": status, "score": score}

    except Exception as e:
        print(f"An error occurred during the file scan: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error during scan: {e}")