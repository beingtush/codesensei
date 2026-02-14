"""Challenge generation prompt templates."""

from typing import Final

# Topic lists for each track
PYTHON_TOPICS: Final[list[str]] = [
    "generators",
    "decorators",
    "metaclasses",
    "async/await",
    "context managers",
    "descriptors",
    "type hints",
    "collections module",
    "itertools",
    "functools",
    "design patterns",
    "error handling",
    "GIL",
    "memory management",
]

JAVA_TOPICS: Final[list[str]] = [
    "collections internals",
    "concurrency (threads, executors, locks)",
    "JVM internals",
    "streams API",
    "generics",
    "design patterns",
    "exception handling",
    "serialization",
    "reflection",
    "memory model",
    "garbage collection",
]

AUTOMATION_TOPICS: Final[list[str]] = [
    "Selenium architecture",
    "Appium setup & capabilities",
    "BDD with Behave/Cucumber",
    "page object model",
    "framework design",
    "CI/CD integration",
    "parallel execution",
    "reporting",
    "API testing",
    "mobile testing strategies",
]

DSA_TOPICS: Final[list[str]] = [
    "arrays",
    "strings",
    "linked lists",
    "stacks",
    "queues",
    "trees",
    "graphs",
    "hash maps",
    "heaps",
    "sorting",
    "binary search",
    "sliding window",
    "two pointers",
    "BFS/DFS",
    "dynamic programming",
    "backtracking",
    "greedy",
]

TRACK_TOPICS: Final[dict[str, list[str]]] = {
    "python-advanced": PYTHON_TOPICS,
    "java-deep-dive": JAVA_TOPICS,
    "automation-testing": AUTOMATION_TOPICS,
    "dsa-problem-solving": DSA_TOPICS,
}

TRACK_DISPLAY_NAMES: Final[dict[str, str]] = {
    "python-advanced": "Python Advanced",
    "java-deep-dive": "Java Deep Dive",
    "automation-testing": "Automation & Testing",
    "dsa-problem-solving": "DSA & Problem Solving",
}

# Challenge types
CHALLENGE_TYPES: Final[list[str]] = [
    "code",
    "quiz",
    "bughunt",
    "design",
    "speedround",
]


def get_track_topics(track_slug: str) -> list[str]:
    """Get the topic list for a track."""
    return TRACK_TOPICS.get(track_slug, DSA_TOPICS)


CHALLENGE_GENERATION_PROMPT = """You are CodeSensei, an expert programming instructor creating a daily challenge.

Generate a {challenge_type} challenge for the "{track_name}" track.
Difficulty: {difficulty}/5
Topic focus: {specific_topic}

User context (use this to personalize):
- Recent weak areas: {weak_topics}
- Current level: {user_level}
- Challenges completed: {total_completed}

Requirements:
- Challenge must be completable in {estimated_minutes} minutes
- Include a clear problem statement
- Provide 3 progressive hints (easy → medium → revealing)
- Include the ideal solution with explanation
- For code challenges: include 2-3 test cases
- Rate the challenge: difficulty (1-5), topics covered

IMPORTANT: You MUST return ONLY valid JSON. No explanations, no markdown, no text outside the JSON object.

Example JSON response format:
```json
{{
  "title": "Implement a decorator that caches function results",
  "description": "Create a Python decorator that caches the results of a function... (full problem description)",
  "hints": [
    "Think about using a dictionary to store cached results",
    "The functools.lru_cache decorator does something similar",
    "Use a dictionary with (args, kwargs) as keys"
  ],
  "solution": "def cache_decorator(func):\\n    cache = {}\\n    def wrapper(*args, **kwargs):\\n        key = (args, tuple(sorted(kwargs.items())))\\n        if key not in cache:\\n            cache[key] = func(*args, **kwargs)\\n        return cache[key]\\n    return wrapper",
  "test_cases": [
    {{"input": "add(2, 3)", "expected": "5"}},
    {{"input": "add(10, 5)", "expected": "15"}}
  ],
  "topics_covered": ["decorators", "caching", "functions"],
  "difficulty": 3,
  "estimated_minutes": 10
}}
```

Now generate the challenge:"""
