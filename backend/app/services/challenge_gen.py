"""Challenge generation service using Ollama."""

import json
import logging
import random
from typing import Any

from pydantic import BaseModel, Field, ValidationError

from app.prompts.challenge_prompts import (
    CHALLENGE_GENERATION_PROMPT,
    CHALLENGE_TYPES,
    TRACK_DISPLAY_NAMES,
    get_track_topics,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ai_engine import (
    OllamaClient,
    OllamaConnectionError,
    OllamaJSONError,
    ollama_client,
)
from app.services.difficulty import adaptive_difficulty

logger = logging.getLogger(__name__)


class ChallengeTestCase(BaseModel):
    """Test case for a code challenge."""
    input: str
    expected: str


class GeneratedChallenge(BaseModel):
    """Schema for AI-generated challenge response."""
    title: str
    description: str
    hints: list[str] = Field(min_length=3, max_length=3)
    solution: str
    test_cases: list[ChallengeTestCase]
    topics_covered: list[str]
    difficulty: int = Field(ge=1, le=5)
    estimated_minutes: int = Field(ge=5, le=30)


class ChallengeGenerator:
    """Service for generating AI-powered challenges."""

    def __init__(self, client: OllamaClient | None = None):
        self.client = client or ollama_client

    async def generate(
        self,
        track_slug: str,
        challenge_type: str | None = None,
        difficulty: int | None = None,
        specific_topic: str | None = None,
        weak_topics: list[str] | None = None,
        user_level: int = 1,
        total_completed: int = 0,
    ) -> dict[str, Any]:
        """
        Generate a challenge for the given track.

        Args:
            track_slug: The track identifier (e.g., "python-advanced")
            challenge_type: Type of challenge (code, quiz, bughunt, design, speedround)
            difficulty: Difficulty level 1-5
            specific_topic: Specific topic to focus on
            weak_topics: List of topics the user struggles with
            user_level: User's current level in the track
            total_completed: Total challenges completed

        Returns:
            Generated challenge data

        Raises:
            OllamaConnectionError: If Ollama is not running
            ValueError: If track is invalid
        """
        # Validate track
        if track_slug not in TRACK_DISPLAY_NAMES:
            raise ValueError(f"Invalid track: {track_slug}")

        # Select random topic if not specified
        if not specific_topic:
            track_topics = get_track_topics(track_slug)
            specific_topic = random.choice(track_topics)

        # Select random challenge type if not specified
        if not challenge_type:
            challenge_type = random.choice(CHALLENGE_TYPES)

        # Select random difficulty if not specified (weighted toward user's level)
        if not difficulty:
            difficulty = self._select_difficulty(user_level)

        # Format weak topics string
        weak_topics_str = ", ".join(weak_topics) if weak_topics else "None yet"

        # Estimate time based on difficulty
        estimated_minutes = 5 + (difficulty * 2)

        # Build prompt
        prompt = CHALLENGE_GENERATION_PROMPT.format(
            challenge_type=challenge_type,
            track_name=TRACK_DISPLAY_NAMES[track_slug],
            difficulty=difficulty,
            specific_topic=specific_topic,
            weak_topics=weak_topics_str,
            user_level=user_level,
            total_completed=total_completed,
            estimated_minutes=estimated_minutes,
        )

        # Generate challenge
        try:
            response = await self.client.generate_challenge(prompt)
        except OllamaConnectionError:
            raise
        except OllamaJSONError as e:
            logger.error(f"Failed to generate challenge: {e}")
            raise ValueError(f"Challenge generation failed: {e}")

        # Validate response
        try:
            challenge = GeneratedChallenge(**response)
        except ValidationError as e:
            logger.warning(f"Challenge validation failed, retrying: {e}")
            # Retry with stricter prompt
            retry_prompt = prompt + "\n\nVALIDATION ERROR: Your response did not match the expected format. Please ensure you return valid JSON matching the example exactly."
            try:
                response = await self.client.generate_challenge(retry_prompt)
                challenge = GeneratedChallenge(**response)
            except ValidationError as e2:
                raise ValueError(f"Challenge validation failed after retry: {e2}")

        # Convert to dict for storage
        return {
            "title": challenge.title,
            "description": challenge.description,
            "hints": json.dumps(challenge.hints),
            "solution": challenge.solution,
            "test_cases": json.dumps([tc.model_dump() for tc in challenge.test_cases]),
            "topics_covered": json.dumps(challenge.topics_covered),
            "type": challenge_type,
            "difficulty": challenge.difficulty,
            "estimated_minutes": challenge.estimated_minutes,
        }

    async def generate_adaptive(
        self,
        db: AsyncSession,
        user_id: int,
        track_id: int,
        track_slug: str,
        challenge_type: str | None = None,
        specific_topic: str | None = None,
        weak_topics: list[str] | None = None,
        user_level: int = 1,
        total_completed: int = 0,
    ) -> dict[str, Any]:
        """
        Generate a challenge with adaptive difficulty.

        Uses the AdaptiveDifficulty engine to determine the appropriate
        difficulty level based on the user's recent performance.
        """
        difficulty = await adaptive_difficulty.get_next_difficulty(
            db, user_id, track_id
        )
        return await self.generate(
            track_slug=track_slug,
            challenge_type=challenge_type,
            difficulty=difficulty,
            specific_topic=specific_topic,
            weak_topics=weak_topics,
            user_level=user_level,
            total_completed=total_completed,
        )

    def _select_difficulty(self, user_level: int) -> int:
        """Select difficulty weighted toward user's level."""
        # Allow some variance around user's level
        min_difficulty = max(1, user_level - 1)
        max_difficulty = min(5, user_level + 1)
        return random.randint(min_difficulty, max_difficulty)


# Singleton instance
challenge_generator = ChallengeGenerator()
