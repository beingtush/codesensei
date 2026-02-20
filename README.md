# CodeSensei — AI Learning Companion

Duolingo-style AI-powered learning app for tech skills. Generates adaptive daily challenges across Python, Java, Automation & Testing, and DSA tracks.

## Features

- **4 Learning Tracks**: Python Advanced, Java Deep Dive, Automation & Testing, DSA & Problem Solving
- **5 Challenge Types**: Code challenges, quizzes, bug hunts, design questions, speed rounds
- **Adaptive Difficulty**: Challenges adjust based on your performance history
- **Gamification**: Streaks, XP, levels, and progress tracking
- **AI-Powered**: Uses Ollama (local LLM) for challenge generation and answer evaluation
- **Dashboard**: Next.js frontend with animated cards, streak counter, XP progress bars
- **CLI**: Terminal-based interface with Rich styling for solving challenges

## Tech Stack

- **Backend**: FastAPI + SQLite (SQLAlchemy 2.0 async) + Pydantic v2
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion
- **CLI**: Python + Typer + Rich + httpx
- **AI**: Ollama with qwen2.5-coder:14b (local, no API keys needed)

## Quick Start

### 1. Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.ai) installed

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Copy environment config
cp .env.example .env
```

### 3. Start Ollama

```bash
ollama serve
ollama pull qwen2.5-coder:14b
```

### 4. Run the Backend

```bash
cd backend
python -m uvicorn app.main:app --reload
```

The API runs at http://localhost:8000. On first start, it automatically:
- Creates all database tables
- Seeds 4 learning tracks
- Seeds a default user
- Seeds 10 fallback challenges (used when Ollama is unavailable)

### 5. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard runs at http://localhost:3000.

### 6. Install the CLI

```bash
cd cli
pip install -e .
codesensei daily       # View today's challenges
codesensei solve 1     # Solve challenge #1
codesensei stats       # View your progress
```

## API Endpoints

### Auth
| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/register` | Register a new user |
| `POST /api/v1/auth/login` | Login and get token |

### Challenges
| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/challenges/daily` | Get today's challenges (cached per day) |
| `GET /api/v1/challenges/{id}` | Get a specific challenge |
| `POST /api/v1/challenges/{id}/submit` | Submit answer and get AI evaluation |
| `POST /api/v1/challenges/{id}/hint` | Get next hint (up to 3) |
| `GET /api/v1/challenges/history` | Challenge completion history |

### Progress
| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/progress/overview` | Overall stats, XP, levels |
| `GET /api/v1/progress/streak` | Current streak info |
| `GET /api/v1/progress/track/{slug}` | Per-track stats with weak topics |
| `GET /api/v1/progress/weekly` | Last 7 days activity |

### Tracks
| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/tracks` | All tracks with user progress |
| `GET /api/v1/tracks/{slug}/challenges` | Browse challenges by track |

### Debug
| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/debug/test-prompt` | Test challenge generation |
| `GET /api/v1/debug/health` | Check Ollama status |

## Project Structure

```
codesensei/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + CORS + router registration
│   │   ├── config.py            # Pydantic settings (.env loading)
│   │   ├── database.py          # SQLAlchemy async setup + seeding
│   │   ├── models/              # User, Track, Challenge, Progress, Streak
│   │   ├── schemas/             # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── ai_engine.py     # Ollama async HTTP client
│   │   │   ├── challenge_gen.py # Challenge generation + validation
│   │   │   ├── evaluator.py     # Answer evaluation + XP calculation
│   │   │   ├── difficulty.py    # Adaptive difficulty engine
│   │   │   ├── streak.py        # Streak tracking + motivational messages
│   │   │   └── xp_engine.py     # Leveling system (10 levels)
│   │   ├── prompts/             # AI prompt templates
│   │   └── routes/              # API route handlers
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/                 # Next.js pages + layout
│       ├── components/          # StreakCounter, ChallengeCard, XPBar, etc.
│       └── lib/                 # API client, constants, types
├── cli/
│   └── codesensei_cli/          # Typer CLI with Rich display
├── CLAUDE.md
└── README.md
```

## How It Works

1. **Daily challenges**: Request `/api/v1/challenges/daily` — returns 3 challenges distributed across tracks. Generated via Ollama on first request of the day, cached for subsequent requests. Falls back to seed challenges if AI is unavailable.

2. **Solve & evaluate**: Submit your answer to `/api/v1/challenges/{id}/submit`. The AI evaluates correctness (0-100%), gives specific feedback, identifies strengths and areas for improvement.

3. **XP & levels**: XP is calculated based on difficulty, correctness, hints used, and streak bonus. 10 levels from 0 to 4500+ XP.

4. **Adaptive difficulty**: After 10+ challenges, the system analyzes your recent performance and adjusts difficulty. >80% correct = harder, <40% correct = easier.

5. **Streaks**: Complete at least one challenge per day to maintain your streak. Motivational messages at milestones (3, 7, 14, 30 days). Streak bonus: +10% XP after 7 days.

## License

MIT
