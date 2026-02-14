"""Answer evaluation service using Ollama."""

import json
import logging
from typing import Any

from pydantic import BaseModel, Field, ValidationError

from app.prompts.evaluation_prompts import ANSWER_EVALUATION_PROMPT
from app.services.ai_engine import (
    OllamaClient,
    OllamaConnectionError,
    OllamaJSONError,
    ollama_client,
)

logger = logging.getLogger(__name__)

# Base XP by difficulty
DIFFICULTY_XP = {
    1: 10,
    2: 20,
    3: 35,
    4: 50,
    5: 75,
}


class EvaluationResult(BaseModel):
    """Schema for AI evaluation response."""
    correctness_pct: int = Field(ge=0, le=100)
    feedback: str
    strengths: list[str]
    improvements: list[str]
    xp_awarded: int = Field(ge=0)


class ChallengeEvaluator:
    """Service for evaluating user answers using Ollama."""

    def __init__(self, client: OllamaClient | None = None):
        self.client = client or ollama_client

    async def evaluate(
        self,
        challenge_title: str,
        challenge_description: str,
        ideal_solution: str,
        user_answer: str,
    ) -> dict[str, Any]:
        """
        Evaluate a user's answer to a challenge.

        Args:
            challenge_title: Title of the challenge
            challenge_description: Description of the challenge
            ideal_solution: The ideal solution
            user_answer: User's submitted answer

        Returns:
            Evaluation result with correctness, feedback, XP

        Raises:
            OllamaConnectionError: If Ollama is not running
        """
        # Build prompt
        prompt = ANSWER_EVALUATION_PROMPT.format(
            challenge_title=challenge_title,
            challenge_description=challenge_description,
            ideal_solution=ideal_solution,
            user_answer=user_answer,
        )

        try:
            response = await self.client.evaluate_answer(prompt)
        except OllamaConnectionError:
            raise
        except OllamaJSONError as e:
            logger.error(f"Failed to evaluate answer: {e}")
            raise ValueError(f"Answer evaluation failed: {e}")

        # Validate response
        try:
            result = EvaluationResult(**response)
        except ValidationError as e:
            logger.warning(f"Evaluation validation failed, retrying: {e}")
            retry_prompt = prompt + "\n\nVALIDATION ERROR: Your response did not match the expected format. Please ensure you return valid JSON matching the example exactly."
            try:
                response = await self.client.evaluate_answer(retry_prompt)
                result = EvaluationResult(**response)
            except ValidationError as e2:
                raise ValueError(f"Evaluation validation failed after retry: {e2}")

        return result.model_dump()


def calculate_xp(
    difficulty: int,
    correctness_pct: int,
    hints_used: int,
    current_streak: int,
) -> int:
    """
    Calculate XP for a challenge completion.

    Args:
        difficulty: Challenge difficulty (1-5)
        correctness_pct: Percentage correct (0-100)
        hints_used: Number of hints used (0-3)
        current_streak: Current streak days

    Returns:
        Final XP awarded
    """
    if correctness_pct == 0:
        return 0

    # Base XP by difficulty
    base_xp = DIFFICULTY_XP.get(difficulty, 10)

    # Apply correctness percentage
    xp = int(base_xp * (correctness_pct / 100))

    # Hint penalty: 10% per hint used
    hint_penalty = 0.9 ** hints_used
    xp = int(xp * hint_penalty)

    # Streak bonus: +10% if streak > 7
    if current_streak > 7:
        xp = int(xp * 1.10)

    return max(xp, 1)  # Minimum 1 XP if any correctness


# Singleton instance
challenge_evaluator = ChallengeEvaluator()
