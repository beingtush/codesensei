"""XP and leveling engine — per-track progression."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.progress import UserProgress

# Level thresholds: (min_xp, level)
# Level 1: 0-99, Level 2: 100-299, Level 3: 300-599, Level 4: 600-999,
# Level 5: 1000-1499, Level 6: 1500-2099, Level 7: 2100-2799,
# Level 8: 2800-3599, Level 9: 3600-4499, Level 10: 4500+
LEVEL_THRESHOLDS: list[tuple[int, int]] = [
    (0, 1),
    (100, 2),
    (300, 3),
    (600, 4),
    (1000, 5),
    (1500, 6),
    (2100, 7),
    (2800, 8),
    (3600, 9),
    (4500, 10),
]

# Base XP for each difficulty tier
BASE_XP_BY_DIFFICULTY: dict[int, int] = {
    1: 10,
    2: 25,
    3: 50,
    4: 80,
    5: 120,
}


def get_level(total_xp: int) -> int:
    """Determine level from total XP."""
    level = 1
    for threshold, lvl in LEVEL_THRESHOLDS:
        if total_xp >= threshold:
            level = lvl
    return level


def get_xp_for_next_level(total_xp: int) -> dict:
    """Return current level, XP progress within level, and XP needed for next."""
    current_level = get_level(total_xp)

    # Find current level's threshold and next level's threshold
    current_threshold = 0
    next_threshold = None
    for i, (threshold, lvl) in enumerate(LEVEL_THRESHOLDS):
        if lvl == current_level:
            current_threshold = threshold
            if i + 1 < len(LEVEL_THRESHOLDS):
                next_threshold = LEVEL_THRESHOLDS[i + 1][0]
            break

    if next_threshold is None:
        # Max level reached
        return {
            "level": current_level,
            "current_xp": total_xp,
            "xp_in_level": total_xp - current_threshold,
            "xp_for_next_level": None,
            "xp_remaining": 0,
            "is_max_level": True,
        }

    return {
        "level": current_level,
        "current_xp": total_xp,
        "xp_in_level": total_xp - current_threshold,
        "xp_for_next_level": next_threshold - current_threshold,
        "xp_remaining": next_threshold - total_xp,
        "is_max_level": False,
    }


def calculate_xp(
    difficulty: int,
    correctness_pct: float,
    hints_used: int,
    current_streak: int,
) -> int:
    """
    Calculate XP earned for a challenge submission.

    Formula:
    - base_xp from difficulty tier
    - multiplied by correctness (0.0 - 1.0)
    - hint penalty: -10% per hint used (min 50% of earned XP)
    - streak bonus: +5% per streak day (capped at +50%)

    Returns integer XP (minimum 1 if correctness > 0).
    """
    base = BASE_XP_BY_DIFFICULTY.get(difficulty, 25)

    # Correctness multiplier (0.0 to 1.0)
    correctness_factor = max(0.0, min(1.0, correctness_pct / 100.0))
    xp = base * correctness_factor

    # Hint penalty: -10% per hint, floor at 50% of earned XP
    if hints_used > 0:
        hint_penalty = 1.0 - (hints_used * 0.10)
        hint_penalty = max(0.50, hint_penalty)
        xp *= hint_penalty

    # Streak bonus: +5% per day, capped at +50%
    if current_streak > 1:
        streak_bonus = 1.0 + min((current_streak - 1) * 0.05, 0.50)
        xp *= streak_bonus

    # At least 1 XP if they got anything right
    if correctness_factor > 0:
        return max(1, int(xp))
    return 0


async def award_xp(
    db: AsyncSession,
    user_id: int,
    track_id: int,
    xp_earned: int,
    is_correct: bool,
) -> UserProgress:
    """
    Award XP to a user for a specific track and update their level.

    Creates a UserProgress record if it doesn't exist yet.
    """
    result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.track_id == track_id,
        )
    )
    progress = result.scalar_one_or_none()

    if progress is None:
        progress = UserProgress(
            user_id=user_id,
            track_id=track_id,
            level=1,
            xp=0,
            challenges_completed=0,
            challenges_correct=0,
        )
        db.add(progress)

    progress.xp += xp_earned
    progress.challenges_completed += 1
    if is_correct:
        progress.challenges_correct += 1

    # Recalculate level
    progress.level = get_level(progress.xp)

    await db.commit()
    await db.refresh(progress)
    return progress
