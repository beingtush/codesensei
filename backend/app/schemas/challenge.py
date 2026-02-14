"""Pydantic schemas for challenges."""

from pydantic import BaseModel, Field


class ChallengeTestCaseSchema(BaseModel):
    """Test case schema."""
    input: str
    expected: str


class ChallengeResponse(BaseModel):
    """Challenge response schema."""
    id: int
    track_id: int
    type: str
    difficulty: int
    title: str
    description: str
    hints: list[str]
    test_cases: list[ChallengeTestCaseSchema]
    topics_covered: list[str]
    estimated_minutes: int

    class Config:
        from_attributes = True


class ChallengeSubmission(BaseModel):
    """Challenge submission schema."""
    user_answer: str = Field(..., min_length=1)
    hints_used: int = Field(default=0, ge=0, le=3)
    time_taken_seconds: int = Field(default=0, ge=0)


class EvaluationResult(BaseModel):
    """Evaluation result from AI."""
    correctness_pct: int = Field(ge=0, le=100)
    feedback: str
    strengths: list[str]
    improvements: list[str]
    xp_awarded: int = Field(ge=0)


class EvaluationResponse(BaseModel):
    """Full evaluation response."""
    challenge_id: int
    is_correct: bool
    correctness_pct: int
    feedback: str
    strengths: list[str]
    improvements: list[str]
    xp_earned: int
    new_streak: int | None = None
    new_level: int | None = None


class HintResponse(BaseModel):
    """Hint response schema."""
    challenge_id: int
    hint_number: int = Field(ge=1, le=3)
    hint: str
    hints_remaining: int


class DailyChallengesResponse(BaseModel):
    """Daily challenges response."""
    challenges: list[ChallengeResponse]
    total_count: int


class ChallengeHistoryItem(BaseModel):
    """Challenge history item."""
    id: int
    challenge_id: int
    challenge_title: str
    challenge_type: str
    track_name: str
    track_icon: str
    is_correct: bool
    xp_earned: int
    completed_at: str


class ChallengeHistoryResponse(BaseModel):
    """Challenge history response."""
    challenges: list[ChallengeHistoryItem]
    total_count: int
    page: int
    page_size: int
