# scoring_engine/scoring.py

from pydantic import BaseModel, Field
from typing import Dict, Any
from .config import ScoringSettings # Import the settings model

class SubScores(BaseModel):
    """Data model for the inputs required by the scoring engine."""
    malware_score: float = Field(..., ge=0)
    url_score: float = Field(..., ge=0)
    sender_score: float = Field(..., ge=0)
    domain_score: float = Field(..., ge=0)

def calculate_trustability(scores: SubScores, settings: ScoringSettings) -> Dict[str, Any]:
    """
    Calculates the final trustability score using a dynamic settings object.
    This function is now pure and easily testable.
    """
    # Apply deduction caps from the settings object
    capped_m = min(scores.malware_score, settings.deduction_caps["malware"])
    capped_u = min(scores.url_score, settings.deduction_caps["url"])
    capped_s = min(scores.sender_score, settings.deduction_caps["sender"])
    capped_d = min(scores.domain_score, settings.deduction_caps["domain"])

    # Calculate the total weighted risk deduction using weights from settings
    total_deduction = (
        settings.weights["malware"] * capped_m +
        settings.weights["url"] * capped_u +
        settings.weights["sender"] * capped_s +
        settings.weights["domain"] * capped_d
    )

    trustability = 100.0 - total_deduction

    return {
        "trust_score": max(0, trustability),
        "total_risk_deduction": total_deduction,
        "explainable_reasoning": {
            "malware_deduction": settings.weights["malware"] * capped_m,
            "url_deduction": settings.weights["url"] * capped_u,
            "sender_deduction": settings.weights["sender"] * capped_s,
            "domain_deduction": settings.weights["domain"] * capped_d,
        }
    }