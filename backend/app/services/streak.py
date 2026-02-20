"""Streak tracking service."""

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.progress import Streak


MOTIVATIONAL_MESSAGES = {
    0: "Start your journey today! Every expert was once a beginner.",
    1: "Day 1 — the hardest step is done. Keep it going!",
    2: "2 days strong! Consistency beats intensity.",
    3: "3-day streak! You're building a habit now.",
    5: "5 days! You're on fire. Don't break the chain!",
    7: "A full week! You're officially committed.",
    14: "2 weeks straight! This is becoming second nature.",
    21: "21 days — they say it takes this long to form a habit. You did it!",
    30: "30-day streak! You're a CodeSensei regular.",
    50: "50 days! Your dedication is inspiring.",
    100: "100-DAY STREAK! Legendary status unlocked.",
}


def _get_motivational_message(streak_count: int) -> str:
    """Return a motivational message based on streak length."""
    # Find the highest threshold that the streak meets
    best_msg = MOTIVATIONAL_MESSAGES[0]
    for threshold, msg in sorted(MOTIVATIONAL_MESSAGES.items()):
        if streak_count >= threshold:
            best_msg = msg
    return best_msg


async def update_streak(db: AsyncSession, user_id: int) -> Streak:
    """
    Update user's streak after a challenge submission.

    Rules:
    - last_activity_date is yesterday -> increment current_streak
    - last_activity_date is today -> no change (already active today)
    - last_activity_date is older -> reset streak to 1
    """
    result = await db.execute(
        select(Streak).where(Streak.user_id == user_id)
    )
    streak = result.scalar_one_or_none()

    today = date.today()

    if streak is None:
        streak = Streak(
            user_id=user_id,
            current_streak=1,
            longest_streak=1,
            last_activity_date=today,
        )
        db.add(streak)
        await db.commit()
        await db.refresh(streak)
        return streak

    if streak.last_activity_date == today:
        # Already active today — no change
        return streak

    if streak.last_activity_date == today - timedelta(days=1):
        # Yesterday — increment
        streak.current_streak += 1
    else:
        # Older than yesterday — reset
        streak.current_streak = 1

    # Update longest if current exceeds it
    if streak.current_streak > streak.longest_streak:
        streak.longest_streak = streak.current_streak

    streak.last_activity_date = today
    await db.commit()
    await db.refresh(streak)
    return streak


async def get_streak(db: AsyncSession, user_id: int) -> dict:
    """
    Return current streak info with a motivational message.

    Returns dict with: current_streak, longest_streak, last_activity_date,
    is_active_today, motivational_message.
    """
    result = await db.execute(
        select(Streak).where(Streak.user_id == user_id)
    )
    streak = result.scalar_one_or_none()

    today = date.today()

    if streak is None:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "last_activity_date": None,
            "is_active_today": False,
            "motivational_message": _get_motivational_message(0),
        }

    is_active_today = streak.last_activity_date == today
    # If last activity was more than 1 day ago (and not today), streak is broken
    effective_streak = streak.current_streak
    if not is_active_today and streak.last_activity_date is not None:
        if streak.last_activity_date < today - timedelta(days=1):
            effective_streak = 0

    return {
        "current_streak": effective_streak,
        "longest_streak": streak.longest_streak,
        "last_activity_date": streak.last_activity_date.isoformat() if streak.last_activity_date else None,
        "is_active_today": is_active_today,
        "motivational_message": _get_motivational_message(effective_streak),
    }
