import httpx
import asyncio
from typing import Dict, Any

# Import the settings object to get the microservice URLs
from .config import settings

# --- Production-Ready Microservice Communication ---
# This version makes real asynchronous HTTP requests to other services.
# It includes timeouts, error handling, and assumes a consistent API response.

# Define the expected JSON response structure from the microservices
class MicroserviceResponse(httpx.Response):
    score: float

async def call_service(client: httpx.AsyncClient, service_name: str, url: str, gmail_api_id: str) -> float:
    """
    A reusable function to call a microservice, handle errors, and return a score.
    """
    default_risk_score = settings.deduction_caps.get(service_name, 25.0)
    
    try:
        # Make a POST request with the email ID in the JSON body
        response = await client.post(
            url,
            json={"gmail_api_id": gmail_api_id},
            timeout=5.0  # Set a 5-second timeout for the request
        )

        # Raise an exception for bad status codes (4xx or 5xx)
        response.raise_for_status()

        # Parse the JSON and extract the score
        data = response.json()
        score = data.get("score")

        if score is None:
            print(f"ERROR: '{service_name}' service response did not contain a 'score' key.")
            return default_risk_score

        print(f"SUCCESS: Got score {score} from '{service_name}' service.")
        return float(score)

    except httpx.RequestError as e:
        # Handles network errors like timeouts, connection refused, etc.
        print(f"ERROR: Could not connect to '{service_name}' service at {e.request.url}.")
        return default_risk_score
    except KeyError:
        print(f"ERROR: Malformed response from '{service_name}' service.")
        return default_risk_score
    except Exception as e:
        print(f"ERROR: An unexpected error occurred when calling '{service_name}': {e}")
        return default_risk_score

async def get_malware_score(gmail_api_id: str) -> float:
    """Calls the real File Scan Microservice."""
    async with httpx.AsyncClient() as client:
        return await call_service(client, "malware", settings.MALWARE_SERVICE_URL, gmail_api_id)

async def get_url_score(gmail_api_id: str) -> float:
    """Calls the real URL Analysis Service."""
    async with httpx.AsyncClient() as client:
        return await call_service(client, "url", settings.URL_SERVICE_URL, gmail_api_id)

async def get_sender_score(gmail_api_id: str) -> float:
    """Calls the real Sender Authentication Service."""
    async with httpx.AsyncClient() as client:
        return await call_service(client, "sender", settings.SENDER_SERVICE_URL, gmail_api_id)

async def get_domain_score(gmail_api_id: str) -> float:
    """Calls the real Domain Reputation Service."""
    async with httpx.AsyncClient() as client:
        return await call_service(client, "domain", settings.DOMAIN_SERVICE_URL, gmail_api_id)

