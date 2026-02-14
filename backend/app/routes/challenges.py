"""Challenge routes for the API."""

import json
from datetime import date, datetime, timedelta
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_maker
from app.models import Challenge, Track, UserChallenge, UserProgress, Streak
from app.schemas.challenge import (
    ChallengeResponse,
    ChallengeSubmission,
    ChallengeHistoryItem,
    ChallengeHistoryResponse,
    DailyChallengesResponse,
    EvaluationResponse,
    HintResponse,
)
from app.services.challenge_gen import challenge_generator
from app.services.evaluator import calculate_xp, challenge_evaluator

router = APIRouter(prefix="/api/v1/challenges", tags=["challenges"])

# Default user ID for MVP (no auth)
DEFAULT_USER_ID = 1


async def get_user_streak() -> int:
    """Get current user's streak."""
    async with async_session_maker() as session:
        result = await session.execute(
            select(Streak).where(Streak.user_id == DEFAULT_USER_ID)
        )
        streak = result.scalar_one_or_none()
        return streak.current_streak if streak else 0


async def update_streak() -> int:
    """Update streak after challenge completion."""
    async with async_session_maker() as session:
        today = date.today()

        result = await session.execute(
            select(Streak).where(Streak.user_id == DEFAULT_USER_ID)
        )
        streak = result.scalar_one_or_none()

        if not streak:
            # Create new streak
            streak = Streak(
                user_id=DEFAULT_USER_ID,
                current_streak=1,
                longest_streak=1,
                last_activity_date=today,
            )
            session.add(streak)
        else:
            if streak.last_activity_date:
                if streak.last_activity_date == today:
                    pass  # Already active today
                elif streak.last_activity_date == today - timedelta(days=1):
                    # Continue streak
                    streak.current_streak += 1
                    streak.last_activity_date = today
                    if streak.current_streak > streak.longest_streak:
                        streak.longest_streak = streak.current_streak
                else:
                    # Streak broken
                    streak.current_streak = 1
                    streak.last_activity_date = today
            else:
                streak.current_streak = 1
                streak.last_activity_date = today

        await session.commit()
        return streak.current_streak


async def update_progress(track_id: int, xp_earned: int, is_correct: bool) -> dict[str, int]:
    """Update user progress for a track."""
    async with async_session_maker() as session:
        result = await session.execute(
            select(UserProgress).where(
                UserProgress.user_id == DEFAULT_USER_ID,
                UserProgress.track_id == track_id,
            )
        )
        progress = result.scalar_one_or_none()

        if not progress:
            progress = UserProgress(
                user_id=DEFAULT_USER_ID,
                track_id=track_id,
                level=1,
                xp=xp_earned,
                challenges_completed=1,
                challenges_correct=1 if is_correct else 0,
            )
            session.add(progress)
            new_level = 1
        else:
            progress.xp += xp_earned
            progress.challenges_completed += 1
            if is_correct:
                progress.challenges_correct += 1

            # Check for level up (100 XP per level)
            new_level = (progress.xp // 100) + 1
            if new_level > progress.level:
                progress.level = new_level

        await session.commit()
        return {"level": progress.level, "xp": progress.xp}


def parse_json_field(json_str: str) -> Any:
    """Parse JSON string field."""
    if isinstance(json_str, list):
        return json_str
    try:
        return json.loads(json_str) if json_str else []
    except (json.JSONDecodeError, TypeError):
        return []


@router.get("/daily", response_model=DailyChallengesResponse)
async def get_daily_challenges(count: int = Query(default=3, ge=1, le=5)):
    """
    Get today's daily challenges.
    Mixes challenges across all tracks.
    """
    async with async_session_maker() as session:
        # Get all tracks
        result = await session.execute(select(Track))
        tracks = result.scalars().all()

        if not tracks:
            raise HTTPException(status_code=404, detail="No tracks found")

        # For now, generate new challenges on the fly
        # Later, could cache daily challenges in DB
        challenges = []

        # Distribute challenges across tracks
        challenges_per_track = max(1, count // len(tracks))
        remaining = count

        for track in tracks:
            if remaining <= 0:
                break

            num = min(challenges_per_track, remaining)
            remaining -= num

            for _ in range(num):
                try:
                    generated = await challenge_generator.generate(
                        track_slug=track.slug,
                    )

                    # Create challenge in DB
                    challenge = Challenge(
                        track_id=track.id,
                        type=generated["type"],
                        difficulty=generated["difficulty"],
                        title=generated["title"],
                        description=generated["description"],
                        hints=generated["hints"],
                        solution=generated["solution"],
                        test_cases=generated["test_cases"],
                        topics_covered=generated["topics_covered"],
                    )
                    session.add(challenge)
                    await session.commit()
                    await session.refresh(challenge)

                    challenges.append(challenge)
                except Exception as e:
                    # Skip if generation fails
                    print(f"Failed to generate challenge: {e}")
                    continue

        return DailyChallengesResponse(
            challenges=[_challenge_to_response(c) for c in challenges],
            total_count=len(challenges),
        )


def _challenge_to_response(challenge: Challenge) -> ChallengeResponse:
    """Convert Challenge model to response schema."""
    return ChallengeResponse(
        id=challenge.id,
        track_id=challenge.track_id,
        type=challenge.type,
        difficulty=challenge.difficulty,
        title=challenge.title,
        description=challenge.description,
        hints=parse_json_field(challenge.hints),
        test_cases=parse_json_field(challenge.test_cases),
        topics_covered=parse_json_field(challenge.topics_covered),
        estimated_minutes=challenge.difficulty * 5 + 5,
    )


@router.get("/{challenge_id}", response_model=ChallengeResponse)
async def get_challenge(challenge_id: int):
    """Get a specific challenge by ID."""
    async with async_session_maker() as session:
        result = await session.execute(
            select(Challenge).where(Challenge.id == challenge_id)
        )
        challenge = result.scalar_one_or_none()

        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")

        return _challenge_to_response(challenge)


@router.post("/{challenge_id}/submit", response_model=EvaluationResponse)
async def submit_answer(
    challenge_id: int,
    submission: ChallengeSubmission,
):
    """Submit an answer to a challenge and get evaluation."""
    async with async_session_maker() as session:
        # Get challenge
        result = await session.execute(
            select(Challenge).where(Challenge.id == challenge_id)
        )
        challenge = result.scalar_one_or_none()

        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")

        # Get current streak
        current_streak = await get_user_streak()

        # Evaluate answer
        try:
            evaluation = await challenge_evaluator.evaluate(
                challenge_title=challenge.title,
                challenge_description=challenge.description,
                ideal_solution=challenge.solution,
                user_answer=submission.user_answer,
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

        # Calculate XP
        xp_earned = calculate_xp(
            difficulty=challenge.difficulty,
            correctness_pct=evaluation["correctness_pct"],
            hints_used=submission.hints_used,
            current_streak=current_streak,
        )

        is_correct = evaluation["correctness_pct"] >= 70

        # Record completion
        user_challenge = UserChallenge(
            user_id=DEFAULT_USER_ID,
            challenge_id=challenge_id,
            user_answer=submission.user_answer,
            is_correct=is_correct,
            xp_earned=xp_earned,
            hints_used=submission.hints_used,
            time_taken_seconds=submission.time_taken_seconds,
        )
        session.add(user_challenge)

        # Update streak
        new_streak = await update_streak()

        # Update progress
        progress_info = await update_progress(challenge.track_id, xp_earned, is_correct)

        await session.commit()

        return EvaluationResponse(
            challenge_id=challenge_id,
            is_correct=is_correct,
            correctness_pct=evaluation["correctness_pct"],
            feedback=evaluation["feedback"],
            strengths=evaluation["strengths"],
            improvements=evaluation["improvements"],
            xp_earned=xp_earned,
            new_streak=new_streak,
            new_level=progress_info["level"],
        )


@router.post("/{challenge_id}/hint", response_model=HintResponse)
async def get_hint(
    challenge_id: int,
    current_hint: int = Query(default=0, ge=0, le=2),
):
    """Get the next hint for a challenge."""
    async with async_session_maker() as session:
        result = await session.execute(
            select(Challenge).where(Challenge.id == challenge_id)
        )
        challenge = result.scalar_one_or_none()

        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")

        hints = parse_json_field(challenge.hints)

        if not hints or len(hints) == 0:
            raise HTTPException(status_code=404, detail="No hints available")

        next_hint_num = current_hint + 1

        if next_hint_num > 3:
            raise HTTPException(status_code=400, detail="No more hints available")

        return HintResponse(
            challenge_id=challenge_id,
            hint_number=next_hint_num,
            hint=hints[next_hint_num - 1],
            hints_remaining=3 - next_hint_num,
        )


@router.get("/history", response_model=ChallengeHistoryResponse)
async def get_history(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
):
    """Get challenge completion history."""
    async with async_session_maker() as session:
        offset = (page - 1) * page_size

        # Get total count
        count_result = await session.execute(
            select(func.count()).select_from(UserChallenge)
        )
        total_count = count_result.scalar()

        # Get history with challenge and track info
        result = await session.execute(
            select(UserChallenge, Challenge, Track)
            .join(Challenge, UserChallenge.challenge_id == Challenge.id)
            .join(Track, Challenge.track_id == Track.id)
            .order_by(desc(UserChallenge.completed_at))
            .offset(offset)
            .limit(page_size)
        )

        rows = result.all()

        history_items = [
            ChallengeHistoryItem(
                id=uc.id,
                challenge_id=uc.challenge_id,
                challenge_title=ch.title,
                challenge_type=ch.type,
                track_name=tr.name,
                track_icon=tr.icon,
                is_correct=bool(uc.is_correct),
                xp_earned=uc.xp_earned,
                completed_at=uc.completed_at.isoformat(),
            )
            for uc, ch, tr in rows
        ]

        return ChallengeHistoryResponse(
            challenges=history_items,
            total_count=total_count,
            page=page,
            page_size=page_size,
        )
