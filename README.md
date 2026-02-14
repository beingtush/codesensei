# CodeSensei — AI Learning Companion

Duolingo-style AI-powered learning app for tech skills. Generates adaptive daily challenges across Python, Java, Automation & Testing, and DSA tracks.

## Features

- **4 Learning Tracks**: Python Advanced, Java Deep Dive, Automation & Testing, DSA & Problem Solving
- **5 Challenge Types**: Code challenges, quizzes, bug hunts, design questions, speed rounds
- **Adaptive Difficulty**: Challenges adjust based on your performance
- **Gamification**: Streaks, XP, levels, and progress tracking
- **AI-Powered**: Uses Ollama (local LLM) for challenge generation and answer evaluation

## Tech Stack

- **Backend**: FastAPI + SQLite (SQLAlchemy ORM)
- **AI**: Ollama (qwen2.5-coder:14b)
- **CLI**: Python + Rich + Typer

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up Ollama

```bash
# Install Ollama from https://ollama.ai
ollama serve
ollama pull qwen2.5-coder:14b
```

### 3. Configure Environment

```bash
cp backend/.env.example backend/.env
# Edit .env with your settings
```

### 4. Run the Server

```bash
cd backend
python -m uvicorn app.main:app --reload
```

The API runs at http://localhost:8000

### 5. Test Challenge Generation

```bash
# Using the debug endpoint
curl -X POST http://localhost:8000/api/v1/debug/test-prompt \
  -H "Content-Type: application/json" \
  -d '{"track": "python-advanced"}'

# Or using the test script
python test_challenges.py
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Welcome message |
| `GET /health` | Health check |
| `POST /api/v1/debug/test-prompt` | Generate a test challenge |
| `GET /api/v1/debug/health` | Check Ollama status |

## Project Structure

```
codesensei/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── config.py         # Settings
│   │   ├── database.py       # DB connection
│   │   ├── models/           # SQLAlchemy models
│   │   ├── services/         # AI & challenge services
│   │   ├── prompts/          # AI prompt templates
│   │   └── routes/           # API routes
│   ├── requirements.txt
│   └── test_challenges.py
├── CLAUDE.md
└── README.md
```

## License

MIT
