from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.user import Base


class Track(Base):
    __tablename__ = "tracks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    icon: Mapped[str] = mapped_column(String(20), nullable=False)
    color_hex: Mapped[str] = mapped_column(String(7), nullable=False)
