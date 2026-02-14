"""Pydantic schemas for tracks."""

from pydantic import BaseModel


class TrackResponse(BaseModel):
    """Track response schema."""
    id: int
    name: str
    slug: str
    description: str
    icon: str
    color_hex: str

    class Config:
        from_attributes = True


class UserTrackProgress(BaseModel):
    """User progress in a track."""
    level: int = 1
    xp: int = 0
    challenges_completed: int = 0
    challenges_correct: int = 0
    accuracy: float = 0.0


class TrackWithProgress(TrackResponse):
    """Track with user's progress."""
    progress: UserTrackProgress | None = None


class TrackChallengesResponse(BaseModel):
    """Challenges for a specific track."""
    track: TrackResponse
    challenges: list[dict]
    total_count: int
