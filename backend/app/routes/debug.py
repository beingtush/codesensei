"""Debug routes for testing and iteration."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.ai_engine import OllamaConnectionError, OllamaJSONError, ollama_client
from app.services.challenge_gen import challenge_generator

router = APIRouter(prefix="/api/v1/debug", tags=["debug"])


class TestPromptRequest(BaseModel):
    """Request for test prompt generation."""
    track: str
    challenge_type: str | None = None
    difficulty: int | None = None
    specific_topic: str | None = None


@router.post("/test-prompt")
async def test_prompt(request: TestPromptRequest):
    """
    Generate a single challenge and return the raw AI response + parsed result.
    Useful for iterating on prompt quality without touching other code.
    """
    # First check if Ollama is running
    if not await ollama_client.health_check():
        raise HTTPException(
            status_code=503,
            detail="Ollama is not running. Please start Ollama with: ollama serve"
        )

    try:
        challenge = await challenge_generator.generate(
            track_slug=request.track,
            challenge_type=request.challenge_type,
            difficulty=request.difficulty,
            specific_topic=request.specific_topic,
            user_level=1,
            total_completed=0,
        )
        return {
            "success": True,
            "track": request.track,
            "challenge": challenge,
        }
    except OllamaConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to Ollama. Is it running at http://localhost:11434?"
        )
    except OllamaJSONError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ollama returned invalid JSON: {str(e)}"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get("/health")
async def debug_health():
    """Check if Ollama is running."""
    is_healthy = await ollama_client.health_check()
    return {
        "ollama_running": is_healthy,
        "model": ollama_client.model,
    }
