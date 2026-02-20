"""AI Engine service using Ollama for local LLM inference."""

import json
import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class OllamaClient:
    """Wrapper around Ollama HTTP API for challenge generation and evaluation.

    Uses httpx async client instead of the synchronous ollama library
    to avoid blocking the FastAPI event loop.
    """

    def __init__(self, model: str | None = None):
        self.model = model or settings.ollama_model
        self.base_url = settings.ollama_base_url

    async def generate_challenge(self, prompt: str) -> dict[str, Any]:
        """Generate a challenge using Ollama (async)."""
        return await self._generate_with_retry(prompt)

    async def evaluate_answer(self, prompt: str) -> dict[str, Any]:
        """Evaluate a user's answer using Ollama (async)."""
        return await self._generate_with_retry(prompt)

    async def generate_weekly_report(self, prompt: str) -> dict[str, Any]:
        """Generate a weekly progress report (async)."""
        return await self._generate_with_retry(prompt)

    async def _generate_with_retry(
        self,
        prompt: str,
        max_retries: int = 3,
    ) -> dict[str, Any]:
        """Generate a response with retry logic for JSON parsing failures."""
        last_error: Exception | None = None

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.post(
                        f"{self.base_url}/api/chat",
                        json={
                            "model": self.model,
                            "messages": [
                                {"role": "user", "content": prompt},
                            ],
                            "format": "json",
                            "stream": False,
                            "options": {
                                "temperature": 0.7,
                                "num_predict": 2048,
                            },
                        },
                    )
                    response.raise_for_status()

                content = response.json()["message"]["content"]
                return json.loads(content)

            except httpx.ConnectError as e:
                raise OllamaConnectionError(
                    f"Cannot connect to Ollama at {self.base_url}. Is it running?"
                ) from e

            except json.JSONDecodeError as e:
                last_error = e
                logger.warning(
                    f"JSON parse failure (attempt {attempt + 1}/{max_retries}): {e}"
                )
                if attempt < max_retries - 1:
                    prompt = (
                        prompt
                        + "\n\nIMPORTANT: You MUST return ONLY valid JSON. "
                        "No explanations, no markdown, no text outside the JSON object. "
                        "Start with { and end with }."
                    )

            except httpx.HTTPStatusError as e:
                last_error = e
                logger.error(f"Ollama HTTP error: {e}")
                raise OllamaConnectionError(
                    f"Ollama returned HTTP {e.response.status_code}"
                ) from e

            except Exception as e:
                last_error = e
                logger.error(f"Ollama error: {e}")
                break

        raise OllamaJSONError(
            f"Failed to parse JSON after {max_retries} attempts: {last_error}"
        )

    async def health_check(self) -> bool:
        """Check if Ollama is running and accessible."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama health check failed: {e}")
            return False


class OllamaConnectionError(Exception):
    """Raised when Ollama is not running or not accessible."""
    pass


class OllamaJSONError(Exception):
    """Raised when Ollama response cannot be parsed as JSON."""
    pass


# Singleton instance
ollama_client = OllamaClient()
