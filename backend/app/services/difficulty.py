"""Adaptive difficulty engine — adjusts challenge difficulty based on performance."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.progress import UserChallenge, UserProgress
from app.models.challenge import Challenge


class AdaptiveDifficulty:
    """
    Determines the next challenge difficulty based on recent performance.

    Rules:
    - Looks at the last 10 challenges in the given track
    - If accuracy > 80% for 5+ consecutive challenges -> increase difficulty
    - If accuracy < 40% for 3+ consecutive challenges -> decrease difficulty
    - Otherwise -> maintain current difficulty (based on user level)
    - Clamps result to 1-5 range
    """

    LOOKBACK_COUNT = 10
    INCREASE_THRESHOLD = 0.80
    INCREASE_MIN_STREAK = 5
    DECREASE_THRESHOLD = 0.40
    DECREASE_MIN_STREAK = 3

    async def get_next_difficulty(
        self,
        db: AsyncSession,
        user_id: int,
        track_id: int,
    ) -> int:
        """
        Calculate the recommended difficulty for the next challenge.

        Returns a difficulty level from 1 to 5.
        """
        # Get user's current level in this track
        result = await db.execute(
            select(UserProgress).where(
                UserProgress.user_id == user_id,
                UserProgress.track_id == track_id,
            )
        )
        progress = result.scalar_one_or_none()

        if progress is None:
            # New user on this track — start at difficulty 1
            return 1

        base_difficulty = min(progress.level, 5)

        # Fetch last N challenge results for this track
        recent_challenges = await self._get_recent_results(
            db, user_id, track_id
        )

        if len(recent_challenges) < self.DECREASE_MIN_STREAK:
            # Not enough data — use level-based difficulty
            return base_difficulty

        # Check for consistent high performance -> increase
        if self._should_increase(recent_challenges):
            return min(5, base_difficulty + 1)

        # Check for consistent low performance -> decrease
        if self._should_decrease(recent_challenges):
            return max(1, base_difficulty - 1)

        return base_difficulty

    async def _get_recent_results(
        self,
        db: AsyncSession,
        user_id: int,
        track_id: int,
    ) -> list[dict]:
        """Fetch the last N challenge results for a user in a track."""
        stmt = (
            select(
                UserChallenge.is_correct,
                Challenge.difficulty,
            )
            .join(Challenge, UserChallenge.challenge_id == Challenge.id)
            .where(
                UserChallenge.user_id == user_id,
                Challenge.track_id == track_id,
            )
            .order_by(UserChallenge.completed_at.desc())
            .limit(self.LOOKBACK_COUNT)
        )
        result = await db.execute(stmt)
        rows = result.all()
        return [{"is_correct": bool(r[0]), "difficulty": r[1]} for r in rows]

    def _should_increase(self, recent: list[dict]) -> bool:
        """Check if the user has been acing challenges consistently."""
        if len(recent) < self.INCREASE_MIN_STREAK:
            return False
        # Check the most recent N challenges
        last_n = recent[: self.INCREASE_MIN_STREAK]
        correct_count = sum(1 for r in last_n if r["is_correct"])
        accuracy = correct_count / len(last_n)
        return accuracy > self.INCREASE_THRESHOLD

    def _should_decrease(self, recent: list[dict]) -> bool:
        """Check if the user has been struggling consistently."""
        if len(recent) < self.DECREASE_MIN_STREAK:
            return False
        last_n = recent[: self.DECREASE_MIN_STREAK]
        correct_count = sum(1 for r in last_n if r["is_correct"])
        accuracy = correct_count / len(last_n)
        return accuracy < self.DECREASE_THRESHOLD


# Singleton instance
adaptive_difficulty = AdaptiveDifficulty()
