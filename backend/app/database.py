import logging
from collections.abc import AsyncGenerator

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models import Base

logger = logging.getLogger(__name__)

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    future=True,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables and seed default data."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed tracks and default user if they don't exist
    await _seed_defaults()


async def _seed_defaults() -> None:
    """Seed tracks, a default user, and fallback challenges for MVP."""
    from app.models.track import Track
    from app.models.user import User

    async with async_session_maker() as session:
        # Check if tracks exist
        result = await session.execute(select(Track).limit(1))
        if result.scalar_one_or_none() is not None:
            return  # Already seeded

        logger.info("Seeding default tracks and user...")

        # Seed tracks
        tracks = [
            Track(
                name="Python Advanced",
                slug="python-advanced",
                description="Master advanced Python: decorators, metaclasses, async, internals",
                icon="🐍",
                color_hex="#22C55E",
            ),
            Track(
                name="Java Deep Dive",
                slug="java-deep-dive",
                description="Enterprise Java: concurrency, JVM internals, design patterns",
                icon="☕",
                color_hex="#F97316",
            ),
            Track(
                name="Automation & Testing",
                slug="automation-testing",
                description="Test automation: Selenium, Appium, CI/CD, frameworks",
                icon="🤖",
                color_hex="#A855F7",
            ),
            Track(
                name="DSA & Problem Solving",
                slug="dsa-problem-solving",
                description="Data structures & algorithms: trees, graphs, DP, optimization",
                icon="🧮",
                color_hex="#06B6D4",
            ),
        ]
        session.add_all(tracks)

        # Seed default user (for MVP with no auth flow)
        default_user = User(
            username="sensei",
            email="sensei@codesensei.dev",
            hashed_password="not-used-in-mvp",
        )
        session.add(default_user)

        await session.commit()

        # Now seed fallback challenges
        await _seed_challenges(session)
        logger.info("Seeded 4 tracks, default user, and fallback challenges.")


async def _seed_challenges(session: AsyncSession) -> None:
    """Seed 2-3 fallback challenges per track (used when AI is unavailable)."""
    import json
    from app.models.challenge import Challenge
    from app.models.track import Track

    result = await session.execute(select(Track))
    tracks = {t.slug: t.id for t in result.scalars().all()}

    seed_challenges = [
        # --- Python Advanced ---
        Challenge(
            track_id=tracks["python-advanced"],
            type="code",
            difficulty=3,
            title="Build a Retry Decorator with Exponential Backoff",
            description=(
                "Create a Python decorator `@retry(max_attempts=3, backoff_factor=2)` that:\n\n"
                "1. Retries the decorated function up to `max_attempts` times on any exception\n"
                "2. Waits `backoff_factor ** attempt` seconds between retries\n"
                "3. Raises the last exception if all attempts fail\n"
                "4. Logs each retry attempt\n\n"
                "```python\n@retry(max_attempts=3, backoff_factor=2)\ndef fetch_data(url):\n    # may raise ConnectionError\n    ...\n```"
            ),
            hints=json.dumps([
                "Use a nested function structure: outer takes params, middle is the decorator, inner is the wrapper",
                "Use time.sleep() for the backoff delay and functools.wraps to preserve the function metadata",
                "Catch exceptions in a loop, sleep on failure, and re-raise after the final attempt",
            ]),
            solution=(
                "import functools\nimport time\nimport logging\n\n"
                "def retry(max_attempts=3, backoff_factor=2):\n"
                "    def decorator(func):\n"
                "        @functools.wraps(func)\n"
                "        def wrapper(*args, **kwargs):\n"
                "            for attempt in range(1, max_attempts + 1):\n"
                "                try:\n"
                "                    return func(*args, **kwargs)\n"
                "                except Exception as e:\n"
                "                    if attempt == max_attempts:\n"
                "                        raise\n"
                "                    wait = backoff_factor ** attempt\n"
                "                    logging.warning(f'Attempt {attempt} failed: {e}. Retrying in {wait}s...')\n"
                "                    time.sleep(wait)\n"
                "        return wrapper\n"
                "    return decorator"
            ),
            test_cases=json.dumps([
                {"input": "Decorate a function that fails twice then succeeds", "expected": "Returns result on 3rd attempt"},
                {"input": "Decorate a function that always fails with max_attempts=2", "expected": "Raises exception after 2 attempts"},
            ]),
            topics=json.dumps(["decorators", "error handling", "functools"]),
        ),
        Challenge(
            track_id=tracks["python-advanced"],
            type="quiz",
            difficulty=2,
            title="What Does the GIL Actually Protect?",
            description=(
                "In CPython, the Global Interpreter Lock (GIL) is a mutex that protects access to Python objects. "
                "Which of the following statements about the GIL is **correct**?\n\n"
                "A) The GIL prevents all race conditions in Python programs\n"
                "B) The GIL ensures only one thread executes Python bytecode at a time\n"
                "C) The GIL is released during all I/O operations and C extension calls\n"
                "D) Removing the GIL would make single-threaded programs faster"
            ),
            hints=json.dumps([
                "Think about what 'bytecode' means — the GIL is about the interpreter, not your application logic",
                "The GIL protects interpreter internals (refcounts), not your data structures",
                "The correct answer is B — the GIL serializes bytecode execution across threads",
            ]),
            solution="B) The GIL ensures only one thread executes Python bytecode at a time. It does NOT prevent application-level race conditions (you still need locks for shared data), it IS released during I/O (which is why asyncio works), and removing it would slightly slow single-threaded code due to finer-grained locking.",
            test_cases=json.dumps([{"input": "B", "expected": "Correct"}]),
            topics=json.dumps(["GIL", "concurrency", "CPython internals"]),
        ),
        Challenge(
            track_id=tracks["python-advanced"],
            type="bughunt",
            difficulty=3,
            title="Find the Memory Leak in This Context Manager",
            description=(
                "The following context manager is supposed to manage a database connection pool, "
                "but it has a subtle memory leak. Find and fix the bug.\n\n"
                "```python\nclass ConnectionPool:\n    _instances = []\n\n"
                "    def __init__(self, max_size=10):\n"
                "        self.max_size = max_size\n"
                "        self.connections = []\n"
                "        ConnectionPool._instances.append(self)\n\n"
                "    def __enter__(self):\n"
                "        conn = self._create_connection()\n"
                "        self.connections.append(conn)\n"
                "        return conn\n\n"
                "    def __exit__(self, exc_type, exc_val, exc_tb):\n"
                "        if self.connections:\n"
                "            conn = self.connections.pop()\n"
                "            conn.close()\n"
                "        return False\n\n"
                "    def _create_connection(self):\n"
                "        return DatabaseConnection()\n```"
            ),
            hints=json.dumps([
                "Look at the class-level attribute _instances — when does it get cleaned up?",
                "Every time a ConnectionPool is created, it's appended to a class-level list that never shrinks",
                "The fix: use weakref.WeakList or remove from _instances in __del__/close, or don't store self at class level",
            ]),
            solution="The bug is `ConnectionPool._instances.append(self)` in __init__. This class-level list holds strong references to every pool instance ever created, preventing garbage collection. Fix: either remove the _instances list, use `weakref.ref`, or add a `close()` method that removes self from _instances.",
            test_cases=json.dumps([{"input": "Create and destroy 1000 pools", "expected": "_instances should not grow unbounded"}]),
            topics=json.dumps(["memory management", "context managers", "design patterns"]),
        ),

        # --- Java Deep Dive ---
        Challenge(
            track_id=tracks["java-deep-dive"],
            type="code",
            difficulty=3,
            title="Implement a Thread-Safe LRU Cache",
            description=(
                "Implement a thread-safe LRU (Least Recently Used) cache in Java with the following requirements:\n\n"
                "1. Fixed capacity set at construction\n"
                "2. `get(key)` returns the value and marks it as recently used\n"
                "3. `put(key, value)` inserts/updates and evicts the least recently used entry if full\n"
                "4. All operations must be O(1)\n"
                "5. Must be thread-safe for concurrent access\n\n"
                "```java\npublic class LRUCache<K, V> {\n    public LRUCache(int capacity) { ... }\n"
                "    public V get(K key) { ... }\n    public void put(K key, V value) { ... }\n}\n```"
            ),
            hints=json.dumps([
                "Use a combination of HashMap and doubly-linked list — HashMap for O(1) lookup, linked list for O(1) eviction order",
                "Java's LinkedHashMap with accessOrder=true already maintains LRU order — you can extend it and override removeEldestEntry",
                "For thread safety, wrap the LinkedHashMap with Collections.synchronizedMap or use ReentrantReadWriteLock for better read concurrency",
            ]),
            solution=(
                "import java.util.*;\nimport java.util.concurrent.locks.*;\n\n"
                "public class LRUCache<K, V> {\n"
                "    private final int capacity;\n"
                "    private final LinkedHashMap<K, V> map;\n"
                "    private final ReadWriteLock lock = new ReentrantReadWriteLock();\n\n"
                "    public LRUCache(int capacity) {\n"
                "        this.capacity = capacity;\n"
                "        this.map = new LinkedHashMap<>(capacity, 0.75f, true) {\n"
                "            @Override\n"
                "            protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {\n"
                "                return size() > LRUCache.this.capacity;\n"
                "            }\n"
                "        };\n"
                "    }\n\n"
                "    public V get(K key) {\n"
                "        lock.readLock().lock();\n"
                "        try { return map.get(key); }\n"
                "        finally { lock.readLock().unlock(); }\n"
                "    }\n\n"
                "    public void put(K key, V value) {\n"
                "        lock.writeLock().lock();\n"
                "        try { map.put(key, value); }\n"
                "        finally { lock.writeLock().unlock(); }\n"
                "    }\n"
                "}"
            ),
            test_cases=json.dumps([
                {"input": "Cache capacity 2: put(1,1), put(2,2), get(1), put(3,3)", "expected": "get(2) returns null (evicted), get(1) returns 1"},
                {"input": "Concurrent puts from 10 threads", "expected": "No ConcurrentModificationException, size <= capacity"},
            ]),
            topics=json.dumps(["collections internals", "concurrency", "design patterns"]),
        ),
        Challenge(
            track_id=tracks["java-deep-dive"],
            type="quiz",
            difficulty=2,
            title="Java Memory Model: Volatile vs Synchronized",
            description=(
                "Consider this Java code:\n\n"
                "```java\npublic class Counter {\n    private volatile int count = 0;\n\n"
                "    public void increment() {\n        count++;\n    }\n}\n```\n\n"
                "Is this thread-safe? Select the correct answer:\n\n"
                "A) Yes — volatile guarantees atomic read-write operations\n"
                "B) No — volatile ensures visibility but count++ is not atomic (it's read-modify-write)\n"
                "C) Yes — the JVM optimizes volatile increments to be atomic\n"
                "D) No — volatile only works with boolean and reference types"
            ),
            hints=json.dumps([
                "Think about what count++ actually does at the bytecode level",
                "count++ is three operations: read count, add 1, write count. Volatile only guarantees each individual read/write is visible",
                "The answer is B. Use AtomicInteger or synchronized for thread-safe increment",
            ]),
            solution="B) volatile ensures visibility (changes are immediately visible to other threads) but does NOT make compound operations atomic. count++ is read-modify-write: a thread could read the value, get preempted, and another thread reads the same value. Use AtomicInteger.incrementAndGet() or synchronized.",
            test_cases=json.dumps([{"input": "B", "expected": "Correct"}]),
            topics=json.dumps(["concurrency", "memory model", "JVM internals"]),
        ),

        # --- Automation & Testing ---
        Challenge(
            track_id=tracks["automation-testing"],
            type="code",
            difficulty=2,
            title="Build a Page Object Model for a Login Page",
            description=(
                "Create a Page Object Model (POM) for a login page using Selenium WebDriver (Python).\n\n"
                "The login page has:\n- Username input field (id='username')\n- Password input field (id='password')\n"
                "- Login button (id='login-btn')\n- Error message div (class='error-message')\n\n"
                "Implement:\n1. `LoginPage` class with locators as class attributes\n"
                "2. `login(username, password)` method\n3. `get_error_message()` method\n"
                "4. Explicit waits for elements\n5. A test function that verifies invalid login shows error"
            ),
            hints=json.dumps([
                "Use By locators as class-level tuples: USERNAME_INPUT = (By.ID, 'username')",
                "Use WebDriverWait with expected_conditions for reliable element interaction",
                "Return self from methods to enable method chaining: page.login('user', 'pass').get_error_message()",
            ]),
            solution=(
                "from selenium.webdriver.common.by import By\n"
                "from selenium.webdriver.support.ui import WebDriverWait\n"
                "from selenium.webdriver.support import expected_conditions as EC\n\n"
                "class LoginPage:\n"
                "    USERNAME_INPUT = (By.ID, 'username')\n"
                "    PASSWORD_INPUT = (By.ID, 'password')\n"
                "    LOGIN_BUTTON = (By.ID, 'login-btn')\n"
                "    ERROR_MESSAGE = (By.CLASS_NAME, 'error-message')\n\n"
                "    def __init__(self, driver):\n"
                "        self.driver = driver\n"
                "        self.wait = WebDriverWait(driver, 10)\n\n"
                "    def login(self, username, password):\n"
                "        self.wait.until(EC.visibility_of_element_located(self.USERNAME_INPUT)).send_keys(username)\n"
                "        self.driver.find_element(*self.PASSWORD_INPUT).send_keys(password)\n"
                "        self.driver.find_element(*self.LOGIN_BUTTON).click()\n"
                "        return self\n\n"
                "    def get_error_message(self):\n"
                "        return self.wait.until(EC.visibility_of_element_located(self.ERROR_MESSAGE)).text"
            ),
            test_cases=json.dumps([
                {"input": "login('invalid', 'wrong')", "expected": "Error message is displayed"},
                {"input": "login('valid_user', 'valid_pass')", "expected": "Redirects to dashboard"},
            ]),
            topics=json.dumps(["page object model", "Selenium architecture", "framework design"]),
        ),
        Challenge(
            track_id=tracks["automation-testing"],
            type="quiz",
            difficulty=2,
            title="Implicit Wait vs Explicit Wait vs Fluent Wait",
            description=(
                "In Selenium WebDriver, when should you use each type of wait?\n\n"
                "Which statement is correct?\n\n"
                "A) Implicit waits are always better because they apply to all elements globally\n"
                "B) Explicit waits should be preferred — they target specific conditions and elements, avoiding hidden timeouts\n"
                "C) Fluent waits are just explicit waits with a different name\n"
                "D) You should combine implicit and explicit waits for maximum reliability"
            ),
            hints=json.dumps([
                "Mixing implicit and explicit waits can cause unpredictable timeout behavior",
                "Explicit waits let you wait for specific conditions (clickable, visible, text present) rather than just 'element exists'",
                "The answer is B — explicit waits are the recommended approach in modern Selenium",
            ]),
            solution="B) Explicit waits (WebDriverWait + ExpectedConditions) should be preferred. Implicit waits apply globally and can mask issues. Mixing both leads to unpredictable timeouts. Fluent waits ARE a type of explicit wait with configurable polling interval and ignored exceptions.",
            test_cases=json.dumps([{"input": "B", "expected": "Correct"}]),
            topics=json.dumps(["Selenium architecture", "framework design"]),
        ),

        # --- DSA & Problem Solving ---
        Challenge(
            track_id=tracks["dsa-problem-solving"],
            type="code",
            difficulty=3,
            title="Find the Kth Largest Element in an Array",
            description=(
                "Given an unsorted array of integers `nums` and an integer `k`, return the kth largest element.\n\n"
                "Note: It is the kth largest element in sorted order, not the kth distinct element.\n\n"
                "**Constraints:**\n- 1 <= k <= len(nums) <= 10^4\n- -10^4 <= nums[i] <= 10^4\n\n"
                "**Follow-up:** Can you solve it in O(n) average time?\n\n"
                "```python\ndef findKthLargest(nums: list[int], k: int) -> int:\n    pass\n```"
            ),
            hints=json.dumps([
                "The simplest approach is to sort and return nums[-k], but that's O(n log n)",
                "Use a min-heap of size k — iterate through all elements, keep only the k largest. The top of the heap is your answer",
                "For O(n) average: use Quickselect (partition-based selection). Partition around a random pivot, recurse only into the half containing the kth element",
            ]),
            solution=(
                "import heapq\n\ndef findKthLargest(nums: list[int], k: int) -> int:\n"
                "    # Min-heap approach: O(n log k)\n"
                "    return heapq.nlargest(k, nums)[-1]\n\n"
                "# Quickselect approach: O(n) average\n"
                "def findKthLargest_quickselect(nums: list[int], k: int) -> int:\n"
                "    import random\n"
                "    target = len(nums) - k\n\n"
                "    def quickselect(lo, hi):\n"
                "        pivot_idx = random.randint(lo, hi)\n"
                "        nums[pivot_idx], nums[hi] = nums[hi], nums[pivot_idx]\n"
                "        pivot = nums[hi]\n"
                "        store = lo\n"
                "        for i in range(lo, hi):\n"
                "            if nums[i] < pivot:\n"
                "                nums[store], nums[i] = nums[i], nums[store]\n"
                "                store += 1\n"
                "        nums[store], nums[hi] = nums[hi], nums[store]\n"
                "        if store == target:\n"
                "            return nums[store]\n"
                "        elif store < target:\n"
                "            return quickselect(store + 1, hi)\n"
                "        else:\n"
                "            return quickselect(lo, store - 1)\n\n"
                "    return quickselect(0, len(nums) - 1)"
            ),
            test_cases=json.dumps([
                {"input": "findKthLargest([3,2,1,5,6,4], 2)", "expected": "5"},
                {"input": "findKthLargest([3,2,3,1,2,4,5,5,6], 4)", "expected": "4"},
                {"input": "findKthLargest([1], 1)", "expected": "1"},
            ]),
            topics=json.dumps(["heaps", "sorting", "arrays"]),
        ),
        Challenge(
            track_id=tracks["dsa-problem-solving"],
            type="code",
            difficulty=2,
            title="Valid Parentheses",
            description=(
                "Given a string `s` containing only the characters `(`, `)`, `{`, `}`, `[`, and `]`, "
                "determine if the input string is valid.\n\n"
                "A string is valid if:\n1. Open brackets are closed by the same type of brackets\n"
                "2. Open brackets are closed in the correct order\n3. Every close bracket has a corresponding open bracket\n\n"
                "```python\ndef isValid(s: str) -> bool:\n    pass\n```"
            ),
            hints=json.dumps([
                "Use a stack: push opening brackets, pop when you see a closing bracket",
                "Create a mapping of closing to opening brackets: ')' -> '(', '}' -> '{', ']' -> '['",
                "When you see a closing bracket, check if the stack top matches the expected opening bracket. If stack is empty or doesn't match, return False",
            ]),
            solution=(
                "def isValid(s: str) -> bool:\n"
                "    stack = []\n"
                "    mapping = {')': '(', '}': '{', ']': '['}\n\n"
                "    for char in s:\n"
                "        if char in mapping:\n"
                "            if not stack or stack[-1] != mapping[char]:\n"
                "                return False\n"
                "            stack.pop()\n"
                "        else:\n"
                "            stack.append(char)\n\n"
                "    return len(stack) == 0"
            ),
            test_cases=json.dumps([
                {"input": "isValid('()')", "expected": "True"},
                {"input": "isValid('()[]{}')", "expected": "True"},
                {"input": "isValid('(]')", "expected": "False"},
                {"input": "isValid('([)]')", "expected": "False"},
            ]),
            topics=json.dumps(["stacks", "strings"]),
        ),
        Challenge(
            track_id=tracks["dsa-problem-solving"],
            type="bughunt",
            difficulty=3,
            title="Fix the Binary Search Implementation",
            description=(
                "The following binary search has a subtle bug that causes it to fail on certain inputs. "
                "Find and fix the bug.\n\n"
                "```python\ndef binary_search(arr, target):\n"
                "    left, right = 0, len(arr)\n\n"
                "    while left <= right:\n"
                "        mid = (left + right) // 2\n"
                "        if arr[mid] == target:\n"
                "            return mid\n"
                "        elif arr[mid] < target:\n"
                "            left = mid + 1\n"
                "        else:\n"
                "            right = mid - 1\n\n"
                "    return -1\n```\n\n"
                "What input causes this to crash? Fix the bug."
            ),
            hints=json.dumps([
                "Think about what happens when `right = len(arr)` and `left <= right` — what index does mid compute?",
                "When left=0 and right=len(arr), mid could equal len(arr) when the array is empty or at the boundary",
                "The fix: initialize right = len(arr) - 1 to stay within bounds, or use right = len(arr) with left < right",
            ]),
            solution="The bug is `right = len(arr)` combined with `left <= right`. When mid = len(arr), accessing arr[mid] causes IndexError. Fix: use `right = len(arr) - 1` to ensure mid is always a valid index within the array bounds.",
            test_cases=json.dumps([
                {"input": "binary_search([1, 2, 3], 4)", "expected": "-1 (currently raises IndexError)"},
                {"input": "binary_search([], 1)", "expected": "-1 (currently raises IndexError)"},
            ]),
            topics=json.dumps(["binary search", "arrays"]),
        ),
    ]

    session.add_all(seed_challenges)
    await session.commit()
