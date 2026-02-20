"""Challenge generation prompt templates."""

from typing import Final

# Topic lists for each track
PYTHON_TOPICS: Final[list[str]] = [
    "generators and yield",
    "decorators (class-based and parameterized)",
    "metaclasses and __init_subclass__",
    "async/await and asyncio patterns",
    "context managers (__enter__/__exit__ and contextlib)",
    "descriptors and properties",
    "type hints and Protocol classes",
    "collections module (defaultdict, Counter, deque, OrderedDict)",
    "itertools (groupby, chain, product, combinations)",
    "functools (lru_cache, partial, reduce, wraps)",
    "design patterns in Python (singleton, factory, observer)",
    "exception handling (custom exceptions, exception chaining)",
    "GIL and threading vs multiprocessing",
    "memory management (gc, weakref, __slots__)",
]

JAVA_TOPICS: Final[list[str]] = [
    "collections internals (HashMap, ConcurrentHashMap, TreeMap)",
    "concurrency (threads, executors, locks, CompletableFuture)",
    "JVM internals (class loading, bytecode, JIT compilation)",
    "streams API and functional interfaces",
    "generics (type erasure, bounded wildcards, PECS)",
    "design patterns (builder, strategy, observer, factory)",
    "exception handling (checked vs unchecked, try-with-resources)",
    "serialization (Serializable, transient, custom serialization)",
    "reflection and annotations",
    "Java memory model (happens-before, volatile, atomics)",
    "garbage collection (G1, ZGC, tuning flags)",
]

AUTOMATION_TOPICS: Final[list[str]] = [
    "Selenium architecture and WebDriver protocol",
    "Appium setup and desired capabilities",
    "BDD with Behave/Cucumber (feature files, step definitions)",
    "page object model (design and anti-patterns)",
    "test framework design (base classes, utilities, config)",
    "CI/CD integration (Jenkins, GitHub Actions, pipeline config)",
    "parallel execution (pytest-xdist, Selenium Grid, cloud providers)",
    "test reporting (Allure, ExtentReports, custom reporters)",
    "API testing (requests, schema validation, contract testing)",
    "mobile testing strategies (native, hybrid, web)",
]

DSA_TOPICS: Final[list[str]] = [
    "arrays and prefix sums",
    "strings (pattern matching, KMP, Rabin-Karp)",
    "linked lists (reverse, merge, cycle detection)",
    "stacks (monotonic stack, expression evaluation)",
    "queues and deques (BFS, sliding window maximum)",
    "trees (BST, AVL, traversals, LCA)",
    "graphs (BFS, DFS, topological sort, shortest path)",
    "hash maps (collision handling, two-sum patterns)",
    "heaps (priority queues, top-k problems, median)",
    "sorting (quicksort, mergesort, counting sort, comparators)",
    "binary search (on answer, rotated array, first/last occurrence)",
    "sliding window (fixed and variable size)",
    "two pointers (sorted arrays, partitioning, fast-slow)",
    "BFS/DFS (connected components, islands, shortest path)",
    "dynamic programming (1D, 2D, knapsack, LCS, LIS)",
    "backtracking (permutations, combinations, N-queens)",
    "greedy (interval scheduling, Huffman, activity selection)",
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


CHALLENGE_GENERATION_PROMPT = """You are CodeSensei, an expert programming instructor creating a daily challenge for the "{track_name}" track.

Generate a **{challenge_type}** challenge.
Difficulty: {difficulty}/5 (1=beginner, 3=intermediate, 5=expert)
Topic focus: {specific_topic}

User context:
- Recent weak areas: {weak_topics}
- Current level: {user_level}
- Challenges completed so far: {total_completed}

CHALLENGE TYPE GUIDELINES:
- **code**: Write a function/class. Include a clear problem statement with constraints, input/output format, and examples. Test cases must have concrete inputs and expected outputs that can be verified.
- **quiz**: Ask a conceptual multiple-choice question with 4 options (A-D). Only ONE answer is correct. Make wrong options plausible but clearly wrong when you understand the concept. No ambiguous wording.
- **bughunt**: Present broken code with 1-2 subtle bugs. The code should look reasonable at first glance. Bugs should be the kind a real developer might introduce (off-by-one, wrong operator, missing edge case, concurrency issue).
- **design**: Ask the user to design a system/component/API. Provide clear constraints and requirements. The solution should discuss tradeoffs.
- **speedround**: Create a set of 3-5 quick problems on the topic, each solvable in 1-2 minutes. Focus on pattern recognition.

REQUIREMENTS:
- Completable in ~{estimated_minutes} minutes
- Clear, unambiguous problem statement
- 3 progressive hints: hint 1 = gentle nudge, hint 2 = key insight, hint 3 = nearly reveals the approach
- Complete ideal solution with brief explanation
- For code challenges: 2-3 test cases with concrete input/output values
- For quiz challenges: include the correct answer letter in the solution

IMPORTANT: Return ONLY valid JSON. No markdown fences, no explanations outside JSON.

Return this exact JSON structure:
{{
  "title": "Short descriptive title (under 80 chars)",
  "description": "Full problem statement with examples and constraints",
  "hints": ["Hint 1 (gentle)", "Hint 2 (key insight)", "Hint 3 (nearly reveals)"],
  "solution": "Complete solution with explanation",
  "test_cases": [{{"input": "concrete input", "expected": "concrete output"}}],
  "topics_covered": ["topic1", "topic2"],
  "difficulty": {difficulty},
  "estimated_minutes": {estimated_minutes}
}}"""
