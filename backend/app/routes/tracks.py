"""Track routes for the API."""

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_maker
from app.models import Challenge, Track, UserProgress
from app.schemas.track import TrackResponse, TrackWithProgress, UserTrackProgress

router = APIRouter(prefix="/api/v1/tracks", tags=["tracks"])

# Default user ID for MVP (no auth)
DEFAULT_USER_ID = 1


@router.get("", response_model=list[TrackWithProgress])
async def get_tracks():
    """Get all tracks with user's progress in each."""
    async with async_session_maker() as session:
        # Get all tracks
        result = await session.execute(select(Track))
        tracks = result.scalars().all()

        # Get user progress for all tracks
        progress_result = await session.execute(
            select(UserProgress).where(UserProgress.user_id == DEFAULT_USER_ID)
        )
        progress_list = progress_result.scalars().all()

        # Build progress dict
        progress_dict = {p.track_id: p for p in progress_list}

        # Combine
        result_tracks = []
        for track in tracks:
            progress = progress_dict.get(track.id)

            track_response = TrackWithProgress(
                id=track.id,
                name=track.name,
                slug=track.slug,
                description=track.description,
                icon=track.icon,
                color_hex=track.color_hex,
                progress=(
                    UserTrackProgress(
                        level=progress.level,
                        xp=progress.xp,
                        challenges_completed=progress.challenges_completed,
                        challenges_correct=progress.challenges_correct,
                        accuracy=(
                            (progress.challenges_correct / progress.challenges_completed * 100)
                            if progress.challenges_completed > 0
                            else 0.0
                        ),
                    )
                    if progress
                    else None
                ),
            )
            result_tracks.append(track_response)

        return result_tracks


@router.get("/{slug}/challenges")
async def get_track_challenges(
    slug: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
):
    """Get challenges for a specific track."""
    async with async_session_maker() as session:
        # Get track
        result = await session.execute(select(Track).where(Track.slug == slug))
        track = result.scalar_one_or_none()

        if not track:
            raise HTTPException(status_code=404, detail="Track not found")

        # Get challenges for track
        offset = (page - 1) * page_size
        challenges_result = await session.execute(
            select(Challenge)
            .where(Challenge.track_id == track.id)
            .order_by(Challenge.difficulty)
            .offset(offset)
            .limit(page_size)
        )
        challenges = challenges_result.scalars().all()

        # Get total count
        count_result = await session.execute(
            select(Challenge).where(Challenge.track_id == track.id)
        )
        total_count = len(count_result.scalars().all())

        return {
            "track": TrackResponse.model_validate(track),
            "challenges": [
                {
                    "id": c.id,
                    "type": c.type,
                    "difficulty": c.difficulty,
                    "title": c.title,
                    "description": c.description[:100] + "...",
                }
                for c in challenges
            ],
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
        }
