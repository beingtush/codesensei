"""Test script to generate one challenge per track."""

import asyncio

from app.services.ai_engine import OllamaConnectionError, ollama_client
from app.services.challenge_gen import challenge_generator


async def main():
    print("=" * 60)
    print("CodeSensei Challenge Generator Test")
    print("=" * 60)

    # Check Ollama health
    print("\nChecking Ollama connection...")
    if not await ollama_client.health_check():
        print("ERROR: Ollama is not running!")
        print("Please start Ollama with: ollama serve")
        print("And pull the model: ollama pull qwen2.5-coder:14b")
        return

    print(f"Ollama is running with model: {ollama_client.model}")

    # Test tracks
    tracks = [
        "python-advanced",
        "java-deep-dive",
        "automation-testing",
        "dsa-problem-solving",
    ]

    for track in tracks:
        print(f"\n{'='*60}")
        print(f"Generating challenge for: {track}")
        print("=" * 60)

        try:
            challenge = await challenge_generator.generate(
                track_slug=track,
                user_level=1,
                total_completed=0,
            )

            print(f"\nTitle: {challenge['title']}")
            print(f"Type: {challenge['type']}")
            print(f"Difficulty: {challenge['difficulty']}/5")
            print(f"Est. time: {challenge['estimated_minutes']} min")
            print(f"\nDescription: {challenge['description'][:200]}...")
            print(f"\nHints: {challenge['hints'][:100]}...")
            print(f"\nTopics: {challenge['topics_covered']}")

        except Exception as e:
            print(f"ERROR: {e}")

    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
