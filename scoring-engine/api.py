from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any
import asyncio

# Import dependencies from other modules
from .config import settings, ScoringSettings
from .scoring import calculate_trustability, SubScores
from . import services

# Initialize the FastAPI app
app = FastAPI(
    title="Inbox Guardian Scoring API",
    description="API for dynamically calculating email trustability scores."
)

# A mock database/cache for demonstration purposes
VERDICT_CACHE = {}

@app.get("/")
def read_root():
    return {"message": "Welcome to the Inbox Guardian Scoring API!"}

# --- API Endpoints ---

class GmailScanRequest(BaseModel):
    gmail_api_id: str = Field(..., description="The ID of the email from the Gmail API.")
    email_hash: str = Field(..., description="A unique hash of the email content for caching.")

async def run_full_analysis(gmail_api_id: str) -> SubScores:
    """
    Orchestrator function to run all microservice analyses in parallel.
    This replaces the static mock data.
    """
    # Use asyncio.gather to run all service calls concurrently for performance
    results = await asyncio.gather(
        services.get_malware_score(gmail_api_id),
        services.get_url_score(gmail_api_id),
        services.get_sender_score(gmail_api_id),
        services.get_domain_score(gmail_api_id)
    )
    
    # Unpack results and create the SubScores object
    return SubScores(
        malware_score=results[0],
        url_score=results[1],
        sender_score=results[2],
        domain_score=results[3]
    )

@app.post("/scan/gmail-real-time", summary="Real-time Gmail Trustability Scan")
async def scan_gmail_real_time(
    request: GmailScanRequest,
    # Use Depends to inject the settings from config.py
    config: ScoringSettings = Depends(lambda: settings)
) -> Dict[str, Any]:
    """
    Endpoint for real-time Gmail analysis with dynamic scoring.
    """
    if request.email_hash in VERDICT_CACHE:
        return VERDICT_CACHE[request.email_hash]

    # 1. Get dynamic scores by calling the orchestrator function
    sub_scores = await run_full_analysis(request.gmail_api_id)

    # 2. Calculate trustability using the dynamic scores and injected config
    result = calculate_trustability(sub_scores, config)

    # 3. Cache the result before returning
    VERDICT_CACHE[request.email_hash] = result
    
    return result

@app.get("/verdicts/search", summary="Retrieve Cached Verdicts")
async def get_verdict(email_hash: str) -> Dict[str, Any]:
    if email_hash in VERDICT_CACHE:
        return VERDICT_CACHE[email_hash]
    raise HTTPException(status_code=404, detail="Verdict not found in cache.")

# To run: uvicorn scoring_engine.api:app --reload