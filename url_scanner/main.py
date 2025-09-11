# This file creates the URL Analysis Service (Step 4 of the implementation plan).

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
import httpx
import re
from typing import List, Dict, Any

# --- Configuration ---

class Settings(BaseSettings):
    """Loads configuration from environment variables."""
    # Add your Google Safe Browsing API key to your .env file
    # GOOGLE_SAFE_BROWSING_API_KEY="your_api_key"
    google_safe_browsing_api_key: str = "YOUR_API_KEY_HERE"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()

# --- Initialize Application ---
app = FastAPI(
    title="URL Analysis Service",
    description="Extracts and analyzes URLs for phishing and malicious patterns.",
    version="1.0.0"
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

# --- Service Logic (Placeholders) ---

def extract_urls(text: str) -> List[str]:
    """
    Extracts all unique URLs from a given block of text.
    (We will implement this logic next).
    """
    print("Placeholder: Extracting URLs...")
    # A simple regex to find URLs as a starting point
    url_pattern = re.compile(r'https?://[^\s/$.?#].[^\s]*')
    return list(set(url_pattern.findall(text))) # Return unique URLs

def detect_rmm_patterns(urls: List[str]) -> bool:
    """
    Detects if any URL matches common RMM tool patterns.
    (We will implement this logic next).
    """
    print("Placeholder: Detecting RMM patterns...")
    rmm_keywords = ['anydesk', 'teamviewer', 'screenconnect', 'netsupport', 'atera', 'logmein', 'splashtop']
    for url in urls:
        if any(keyword in url.lower() for keyword in rmm_keywords):
            return True
    return False

async def query_reputation_services(urls: List[str]) -> float:
    """
    Queries Google Safe Browsing and OpenPhish for URL reputation.
    (We will implement this logic next).
    """
    print("Placeholder: Querying reputation services...")
    # For now, we'll return a score of 0, assuming all URLs are clean.
    return 0.0

# --- API Endpoint ---

class URLScanRequest(BaseModel):
    email_body: str = Field(..., description="The full text content of the email body.")

@app.get("/")
def read_root():
    return {"status": "URL Analysis Service is running"}

@app.options("/analyze/url")
@app.options("/analyze/text")
async def options_handler():
    return {"message": "OK"}

@app.post("/analyze/url")
async def analyze_single_url(url_data: dict):
    """
    Analyzes a single URL for malicious patterns and reputation.
    """
    try:
        url = url_data.get("url", "")
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        # Analyze the URL
        is_malicious = False
        confidence_score = 0
        indicators = []
        
        # Check for suspicious patterns
        suspicious_patterns = [
            "bit.ly", "tinyurl", "t.co", "goo.gl", "tiny.cc",
            "redirect", "click", "track", "verify-account",
            "secure-login", "update-info", "confirm-identity"
        ]
        
        url_lower = url.lower()
        for pattern in suspicious_patterns:
            if pattern in url_lower:
                indicators.append(f"Suspicious pattern: {pattern}")
                confidence_score += 15
        
        # Check for RMM tools
        rmm_detected = detect_rmm_patterns([url])
        if rmm_detected:
            indicators.append("Remote Management Tool detected")
            confidence_score += 25
        
        # Check for suspicious TLDs
        suspicious_tlds = [".tk", ".ml", ".ga", ".cf", ".click", ".download"]
        for tld in suspicious_tlds:
            if url_lower.endswith(tld):
                indicators.append(f"Suspicious TLD: {tld}")
                confidence_score += 20
        
        is_malicious = confidence_score > 30
        threat_level = "high" if confidence_score > 50 else "medium" if confidence_score > 20 else "low"
        
        return {
            "url": url,
            "is_malicious": is_malicious,
            "confidence_score": min(confidence_score, 100),
            "threat_level": threat_level,
            "indicators": indicators,
            "rmm_detected": rmm_detected,
            "processing_time": 0.3
        }
        
    except Exception as e:
        print(f"Error during URL analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error during URL analysis: {e}")

@app.post("/analyze/text")
async def analyze_text_for_urls(text_data: dict):
    """
    Extracts and analyzes URLs from text content.
    """
    try:
        text = text_data.get("text", "")
        if not text:
            raise HTTPException(status_code=400, detail="Text content is required")
        
        # Extract URLs from text
        urls = extract_urls(text)
        
        # Analyze each URL
        url_results = []
        overall_score = 0
        
        for url in urls:
            result = await analyze_single_url({"url": url})
            url_results.append(result)
            overall_score += result["confidence_score"]
        
        # Calculate overall assessment
        avg_score = overall_score / len(urls) if urls else 0
        rmm_detected = any(result["rmm_detected"] for result in url_results)
        
        return {
            "text_analyzed": len(text),
            "urls_found": len(urls),
            "urls_analyzed": url_results,
            "overall_threat_score": min(avg_score, 100),
            "rmm_detected": rmm_detected,
            "high_risk_urls": len([r for r in url_results if r["threat_level"] == "high"]),
            "processing_time": len(urls) * 0.3
        }
        
    except Exception as e:
        print(f"Error during text analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error during text analysis: {e}")

@app.post("/scan/urls")
async def scan_urls(request: URLScanRequest):
    """
    Receives email content, extracts URLs, and analyzes them for risk.
    """
    score = 0.0
    
    # 1. Extract URLs from the email body
    urls = extract_urls(request.email_body)
    if not urls:
        return {"status": "NoUrlsFound", "score": 0.0}

    # 2. Detect RMM tool patterns
    if detect_rmm_patterns(urls):
        score += 15.0 # Assign a significant penalty for RMM links

    # 3. Query external reputation services
    reputation_score = await query_reputation_services(urls)
    score += reputation_score

    final_score = min(25.0, score) # Cap the total score at 25
    
    return {
        "status": "AnalysisComplete",
        "url_count": len(urls),
        "urls_found": urls,
        "rmm_detected": score > 0,
        "score": final_score
    }