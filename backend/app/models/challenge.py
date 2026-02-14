from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.user import Base


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    track_id: Mapped[int] = mapped_column(Integer, ForeignKey("tracks.id"), nullable=False)

    # Challenge type: code, quiz, bughunt, design, speedround
    type: Mapped[str] = mapped_column(String(20), nullable=False)

    # Difficulty 1-5
    difficulty: Mapped[int] = mapped_column(Integer, nullable=False)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # JSON fields
    hints: Mapped[str] = mapped_column(Text, nullable=False)  # JSON array of hints
    solution: Mapped[str] = mapped_column(Text, nullable=False)
    test_cases: Mapped[str] = mapped_column(Text, nullable=False)  # JSON array
    topics: Mapped[str] = mapped_column(Text, nullable=False)  # JSON array

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
