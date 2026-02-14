"""Seed script to populate initial tracks."""

import asyncio
import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_maker, init_db
from app.models import Track


TRACKS = [
    {
        "name": "Python Advanced",
        "slug": "python-advanced",
        "description": "Master advanced Python concepts: generators, decorators, metaclasses, async/await, type hints, and design patterns.",
        "icon": "🐍",
        "color_hex": "#10B981",
    },
    {
        "name": "Java Deep Dive",
        "slug": "java-deep-dive",
        "description": "Explore Java internals: collections, concurrency, JVM tuning, streams, generics, and design patterns.",
        "icon": "☕",
        "color_hex": "#F59E0B",
    },
    {
        "name": "Automation & Testing",
        "slug": "automation-testing",
        "description": "Learn automation testing with Selenium/Appium, BDD best practices, framework design, and CI/CD patterns.",
        "icon": "🤖",
        "color_hex": "#06B6D4",
    },
    {
        "name": "DSA & Problem Solving",
        "slug": "dsa-problem-solving",
        "description": "Build problem-solving skills with arrays, trees, graphs, dynamic programming, sliding window, and backtracking.",
        "icon": "🧩",
        "color_hex": "#8B5CF6",
    },
]


async def seed_tracks():
    await init_db()
    async with async_session_maker() as session:
        # Check if tracks already exist
        result = await session.execute(select(Track))
        existing = result.scalars().all()
        if existing:
            print(f"Tracks already exist ({len(existing)}), skipping seed.")
            return

        # Create tracks
        for track_data in TRACKS:
            track = Track(**track_data)
            session.add(track)

        await session.commit()
        print(f"Seeded {len(TRACKS)} tracks successfully!")


if __name__ == "__main__":
    asyncio.run(seed_tracks())
