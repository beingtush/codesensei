"""AI Engine service using Ollama for local LLM inference."""

import json
import logging
from typing import Any

import httpx
import ollama

from app.config import settings

logger = logging.getLogger(__name__)


class OllamaClient:
    """Wrapper around Ollama API for challenge generation and evaluation."""

    def __init__(self, model: str | None = None):
        self.model = model or settings.ollama_model
        self.base_url = settings.ollama_base_url
        self._client = ollama

    async def generate_challenge(
        self,
        prompt: str,
    ) -> dict[str, Any]:
        """
        Generate a challenge using Ollama.

        Args:
            prompt: The full prompt to send to the model

        Returns:
            Parsed JSON response from the model

        Raises:
            OllamaConnectionError: If Ollama is not running
            OllamaJSONError: If response cannot be parsed as valid JSON
        """
        response = await self._generate_with_retry(prompt)
        return response

    async def evaluate_answer(
        self,
        prompt: str,
    ) -> dict[str, Any]:
        """
        Evaluate a user's answer using Ollama.

        Args:
            prompt: The evaluation prompt with challenge and answer details

        Returns:
            Parsed JSON response with evaluation results
        """
        response = await self._generate_with_retry(prompt)
        return response

    async def generate_weekly_report(
        self,
        prompt: str,
    ) -> dict[str, Any]:
        """
        Generate a weekly progress report.

        Args:
            prompt: The report generation prompt

        Returns:
            Parsed JSON response with report data
        """
        response = await self._generate_with_retry(prompt)
        return response

    async def _generate_with_retry(
        self,
        prompt: str,
        max_retries: int = 3,
    ) -> dict[str, Any]:
        """
        Generate a response with retry logic for JSON parsing failures.

        Args:
            prompt: The prompt to send
            max_retries: Maximum number of retries on JSON parse failure

        Returns:
            Parsed JSON response

        Raises:
            OllamaConnectionError: If Ollama is not running
            OllamaJSONError: If all retries fail
        """
        last_error: Exception | None = None

        for attempt in range(max_retries):
            try:
                response = self._client.chat(
                    model=self.model,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt,
                        }
                    ],
                    format="json",
                    options={
                        "temperature": 0.7,
                        "num_predict": 2048,
                    },
                )

                content = response["message"]["content"]
                return json.loads(content)

            except json.JSONDecodeError as e:
                last_error = e
                logger.warning(
                    f"JSON parse failure (attempt {attempt + 1}/{max_retries}): {e}"
                )
                # Add stricter JSON formatting instruction on retry
                if attempt < max_retries - 1:
                    prompt = (
                        prompt
                        + "\n\nIMPORTANT: You MUST return ONLY valid JSON. "
                        "No explanations, no markdown, no text outside the JSON object. "
                        "Start with { and end with }."
                    )

            except Exception as e:
                last_error = e
                logger.error(f"Ollama error: {e}")
                break

        raise OllamaJSONError(
            f"Failed to parse JSON after {max_retries} attempts: {last_error}"
        )

    async def health_check(self) -> bool:
        """
        Check if Ollama is running and accessible.

        Returns:
            True if Ollama is healthy, False otherwise
        """
        try:
            async with httpx.AsyncClient() as client:
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
