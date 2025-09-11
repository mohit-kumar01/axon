from pydantic_settings import BaseSettings
from typing import Dict

class ScoringSettings(BaseSettings):
    """
    Defines all configuration for the application.
    Values are loaded from environment variables or a .env file.
    """
    
    # --- Microservice URLs ---
    # These are the base URLs for the other services this API will call.
    MALWARE_SERVICE_URL: str = "http://localhost:8001/scan/attachments"
    URL_SERVICE_URL: str     = "http://localhost:8002/scan/urls"
    SENDER_SERVICE_URL: str  = "http://localhost:8003/check/sender-auth"
    DOMAIN_SERVICE_URL: str  = "http://localhost:8004/check/domain-reputation"

    # --- Scoring Logic Parameters ---
    weights: Dict[str, float] = {
        "malware": 0.30,
        "url": 0.25,
        "sender": 0.25,
        "domain": 0.20
    }
    deduction_caps: Dict[str, float] = {
        "malware": 25.0,
        "url": 25.0,
        "sender": 25.0,
        "domain": 20.0
    }

    class Config:
        # This allows you to override the settings above by creating a .env file
        # in your root project directory (A-XON/).
        env_file = ".env"

# Create a single, importable instance of the settings
settings = ScoringSettings()

