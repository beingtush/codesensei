"""Progress routes — streaks, XP, levels, and track stats."""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.challenge import Challenge
from app.models.progress import Streak, UserChallenge, UserProgress
from app.models.track import Track
from app.services.difficulty import adaptive_difficulty
from app.services.streak import get_streak
from app.services.xp_engine import get_level, get_xp_for_next_level

router = APIRouter(prefix="/api/v1/progress", tags=["progress"])


@router.get("/overview")
async def progress_overview(
    user_id: int = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db),
):
    """
    Overall stats: total XP, level per track, streak info.
    """
    # Get all track progress for this user
    result = await db.execute(
        select(UserProgress, Track.name, Track.slug, Track.icon)
        .join(Track, UserProgress.track_id == Track.id)
        .where(UserProgress.user_id == user_id)
    )
    rows = result.all()

    tracks = []
    total_xp = 0
    total_completed = 0
    total_correct = 0

    for progress, track_name, track_slug, track_icon in rows:
        level_info = get_xp_for_next_level(progress.xp)
        tracks.append({
            "track": track_slug,
            "name": track_name,
            "icon": track_icon,
            "level": progress.level,
            "xp": progress.xp,
            "level_progress": level_info,
            "challenges_completed": progress.challenges_completed,
            "challenges_correct": progress.challenges_correct,
            "accuracy": (
                round(progress.challenges_correct / progress.challenges_completed * 100, 1)
                if progress.challenges_completed > 0
                else 0.0
            ),
        })
        total_xp += progress.xp
        total_completed += progress.challenges_completed
        total_correct += progress.challenges_correct

    # Get streak info
    streak_info = await get_streak(db, user_id)

    return {
        "user_id": user_id,
        "total_xp": total_xp,
        "overall_level": get_level(total_xp),
        "total_challenges_completed": total_completed,
        "total_challenges_correct": total_correct,
        "overall_accuracy": (
            round(total_correct / total_completed * 100, 1)
            if total_completed > 0
            else 0.0
        ),
        "streak": streak_info,
        "tracks": tracks,
    }


@router.get("/streak")
async def progress_streak(
    user_id: int = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db),
):
    """Current streak details."""
    streak_info = await get_streak(db, user_id)
    return {"user_id": user_id, **streak_info}


@router.get("/track/{slug}")
async def progress_track(
    slug: str,
    user_id: int = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db),
):
    """
    Detailed track stats: level, accuracy, challenges done,
    weak topics, and recommended next difficulty.
    """
    # Validate track exists
    track_result = await db.execute(
        select(Track).where(Track.slug == slug)
    )
    track = track_result.scalar_one_or_none()
    if track is None:
        raise HTTPException(status_code=404, detail=f"Track '{slug}' not found")

    # Get user progress for this track
    progress_result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.track_id == track.id,
        )
    )
    progress = progress_result.scalar_one_or_none()

    if progress is None:
        # No progress yet — return defaults
        return {
            "track": slug,
            "name": track.name,
            "icon": track.icon,
            "level": 1,
            "xp": 0,
            "level_progress": get_xp_for_next_level(0),
            "challenges_completed": 0,
            "challenges_correct": 0,
            "accuracy": 0.0,
            "weak_topics": [],
            "recommended_difficulty": 1,
        }

    level_info = get_xp_for_next_level(progress.xp)
    accuracy = (
        round(progress.challenges_correct / progress.challenges_completed * 100, 1)
        if progress.challenges_completed > 0
        else 0.0
    )

    # Find weak topics: topics from incorrect challenges
    weak_topics = await _get_weak_topics(db, user_id, track.id)

    # Get recommended next difficulty
    recommended_difficulty = await adaptive_difficulty.get_next_difficulty(
        db, user_id, track.id
    )

    return {
        "track": slug,
        "name": track.name,
        "icon": track.icon,
        "level": progress.level,
        "xp": progress.xp,
        "level_progress": level_info,
        "challenges_completed": progress.challenges_completed,
        "challenges_correct": progress.challenges_correct,
        "accuracy": accuracy,
        "weak_topics": weak_topics,
        "recommended_difficulty": recommended_difficulty,
    }


@router.get("/weekly")
async def progress_weekly(
    user_id: int = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db),
):
    """Last 7 days of activity data."""
    today = date.today()
    week_ago = today - timedelta(days=6)

    # Query daily activity for the last 7 days
    stmt = (
        select(
            func.date(UserChallenge.completed_at).label("day"),
            func.count(UserChallenge.id).label("challenges_done"),
            func.sum(UserChallenge.xp_earned).label("xp_earned"),
            func.sum(UserChallenge.is_correct).label("correct"),
        )
        .where(
            UserChallenge.user_id == user_id,
            func.date(UserChallenge.completed_at) >= week_ago,
        )
        .group_by(func.date(UserChallenge.completed_at))
    )
    result = await db.execute(stmt)
    rows = result.all()

    # Build a day-by-day map
    activity_map: dict[str, dict] = {}
    for row in rows:
        day_str = str(row.day)
        activity_map[day_str] = {
            "date": day_str,
            "challenges_done": row.challenges_done,
            "xp_earned": row.xp_earned or 0,
            "correct": row.correct or 0,
        }

    # Fill in missing days with zeros
    days = []
    for i in range(7):
        d = week_ago + timedelta(days=i)
        day_str = d.isoformat()
        if day_str in activity_map:
            days.append(activity_map[day_str])
        else:
            days.append({
                "date": day_str,
                "challenges_done": 0,
                "xp_earned": 0,
                "correct": 0,
            })

    # Totals for the week
    total_challenges = sum(d["challenges_done"] for d in days)
    total_xp = sum(d["xp_earned"] for d in days)
    active_days = sum(1 for d in days if d["challenges_done"] > 0)

    return {
        "user_id": user_id,
        "period": {"from": week_ago.isoformat(), "to": today.isoformat()},
        "days": days,
        "summary": {
            "total_challenges": total_challenges,
            "total_xp": total_xp,
            "active_days": active_days,
        },
    }


async def _get_weak_topics(
    db: AsyncSession, user_id: int, track_id: int, limit: int = 5
) -> list[str]:
    """
    Identify topics the user struggles with.

    Looks at incorrect challenge submissions, extracts topics from those
    challenges, and returns the most frequently missed ones.
    """
    import json

    # Get topics from challenges the user got wrong in this track
    stmt = (
        select(Challenge.topics)
        .join(UserChallenge, UserChallenge.challenge_id == Challenge.id)
        .where(
            UserChallenge.user_id == user_id,
            Challenge.track_id == track_id,
            UserChallenge.is_correct == 0,
        )
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    if not rows:
        return []

    # Count topic frequency in wrong answers
    topic_counts: dict[str, int] = {}
    for topics_json in rows:
        try:
            topics = json.loads(topics_json)
            for topic in topics:
                topic_counts[topic] = topic_counts.get(topic, 0) + 1
        except (json.JSONDecodeError, TypeError):
            continue

    # Sort by frequency and return top N
    sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)
    return [topic for topic, _ in sorted_topics[:limit]]
