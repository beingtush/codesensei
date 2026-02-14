# 🧠 CodeSensei — AI Learning Companion
### *Duolingo for Tech Skills*

---

## 🎯 Vision

CodeSensei is your personal AI-powered tech learning companion that delivers daily bite-sized challenges, tracks your streaks, adapts to your skill level, and keeps you accountable — all across the topics that matter most to your career growth.

---

## 📦 Core Features (MVP — 2 Weeks)

### 1. Learning Tracks
| Track | Focus Areas |
|-------|------------|
| 🐍 **Python Advanced** | Generators, decorators, metaclasses, async/await, type hints, design patterns |
| ☕ **Java Deep Dive** | Collections internals, concurrency, JVM tuning, streams, generics, design patterns |
| 🤖 **Automation & Testing** | Selenium/Appium architecture, BDD best practices, framework design, CI/CD patterns |
| 🧩 **DSA & Problem Solving** | Arrays, trees, graphs, DP, sliding window, backtracking — with code in Python/Java |

### 2. Daily Challenge Engine (AI-Powered)
- **Adaptive difficulty**: Beginner → Intermediate → Advanced (auto-adjusts based on performance)
- **Challenge types**:
  - 🧩 **Code Challenge** — Write a function/class to solve a problem
  - 🤔 **Conceptual Quiz** — MCQ or short answer on core concepts
  - 🐛 **Bug Hunt** — Find and fix the bug in a code snippet
  - 🏗️ **Design Question** — Architecture/design pattern scenario
  - ⚡ **Speed Round** — Quick-fire 60-second questions
- **Daily quota**: 3-5 challenges per day (configurable)
- **Hints system**: 3 progressive hints per challenge (costs streak XP)

### 3. Streak & Gamification
- 🔥 **Daily streaks** with fire counter
- ⚡ **XP system** — Earn XP per challenge, bonus for streaks
- 🏆 **Levels** — Level up across each track independently
- 📊 **Weekly report** — AI-generated summary of what you learned, strengths, weak areas

### 4. Progress Tracking
- Per-track skill radar chart
- Challenge history with revisit option
- Weak area detection — AI identifies topics you struggle with and serves more of those
- Time spent learning per day/week

### 5. Spaced Repetition
- Challenges you got wrong come back at intelligent intervals
- "Review mode" for past challenges

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  ┌──────────────┐    ┌───────────────────────┐  │
│  │   Next.js     │    │   CLI (Python/Rich)   │  │
│  │   Web App     │    │   Quick Challenges    │  │
│  │   Dashboard   │    │   Progress Check      │  │
│  └──────┬───────┘    └──────────┬────────────┘  │
└─────────┼───────────────────────┼────────────────┘
          │         REST API      │
          ▼                       ▼
┌─────────────────────────────────────────────────┐
│              BACKEND (FastAPI)                    │
│                                                   │
│  ┌─────────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Challenge   │  │  User     │  │  Streak    │  │
│  │  Generator   │  │  Progress │  │  Engine    │  │
│  │  Service     │  │  Service  │  │            │  │
│  └──────┬──────┘  └────┬─────┘  └─────┬──────┘  │
│         │              │               │          │
│         ▼              ▼               ▼          │
│  ┌─────────────┐  ┌──────────────────────────┐   │
│  │  Claude API  │  │   SQLite → PostgreSQL    │   │
│  │  (Sonnet 4)  │  │   (user data, progress)  │   │
│  └─────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 14 + Tailwind CSS + Framer Motion | Modern, fast, great DX, beautiful animations |
| **Backend** | Python FastAPI | You know Python inside out, fast async API |
| **Database** | SQLite (MVP) → PostgreSQL (scale) | Zero setup for MVP, easy migration later |
| **AI Engine** | Claude Sonnet 4 API | Best balance of quality + speed + cost for challenge generation |
| **CLI** | Python + Rich + Typer | Beautiful terminal UI, you already know the ecosystem |
| **Auth** | Simple JWT (MVP) | Keep it light, just for you initially |
| **Deployment** | Vercel (frontend) + Railway/Render (backend) | Free tier friendly, zero DevOps headache |

---

## 📁 Project Structure

```
codesensei/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry
│   │   ├── config.py               # Settings & env vars
│   │   ├── models/
│   │   │   ├── user.py             # User model
│   │   │   ├── challenge.py        # Challenge model
│   │   │   ├── progress.py         # Progress & streaks
│   │   │   └── track.py            # Learning tracks
│   │   ├── services/
│   │   │   ├── ai_engine.py        # Claude API integration
│   │   │   ├── challenge_gen.py    # Challenge generation logic
│   │   │   ├── difficulty.py       # Adaptive difficulty engine
│   │   │   ├── streak.py           # Streak calculation
│   │   │   └── spaced_rep.py       # Spaced repetition scheduler
│   │   ├── routes/
│   │   │   ├── challenges.py       # Challenge CRUD & submission
│   │   │   ├── progress.py         # Stats & analytics
│   │   │   ├── tracks.py           # Learning track management
│   │   │   └── auth.py             # Auth endpoints
│   │   └── prompts/
│   │       ├── challenge_prompts.py # AI prompt templates per type
│   │       └── review_prompts.py    # Weekly review prompts
│   ├── requirements.txt
│   └── alembic/                     # DB migrations
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                 # Dashboard home
│   │   ├── challenge/page.tsx       # Daily challenge view
│   │   ├── tracks/page.tsx          # Track selection & progress
│   │   ├── history/page.tsx         # Past challenges
│   │   └── stats/page.tsx           # Analytics & reports
│   ├── components/
│   │   ├── ChallengeCard.tsx        # Challenge display
│   │   ├── CodeEditor.tsx           # Monaco editor integration
│   │   ├── StreakCounter.tsx         # Fire streak display
│   │   ├── SkillRadar.tsx           # Radar chart component
│   │   ├── XPBar.tsx                # XP progress bar
│   │   └── DailyProgress.tsx        # Daily completion ring
│   ├── package.json
│   └── tailwind.config.js
│
├── cli/
│   ├── codesensei_cli/
│   │   ├── __init__.py
│   │   ├── main.py                  # Typer CLI entry
│   │   ├── challenge.py             # Fetch & solve challenges
│   │   ├── stats.py                 # Quick stats view
│   │   └── config.py                # CLI config & API URL
│   └── setup.py                     # pip installable
│
└── README.md
```

---

## 📅 2-Week Build Plan

### Week 1 — Foundation & Core Loop

| Day | Task | Deliverable |
|-----|------|-------------|
| **Day 1** | Project setup, DB schema, FastAPI scaffold | Backend running with models |
| **Day 2** | Claude API integration + challenge generation prompts | AI generating quality challenges |
| **Day 3** | Challenge submission & evaluation endpoint (AI judges answers) | Complete challenge flow |
| **Day 4** | Streak engine + XP system + adaptive difficulty | Core gamification working |
| **Day 5** | CLI tool — fetch challenge, submit answer, view streak | CLI MVP done |
| **Day 6** | Next.js setup + Dashboard UI + challenge view | Web frontend skeleton |
| **Day 7** | Buffer / catch up / refine AI prompts | Solid Week 1 deliverable |

### Week 2 — Polish & Delight

| Day | Task | Deliverable |
|-----|------|-------------|
| **Day 8** | Code editor integration (Monaco) + syntax highlighting | Proper coding experience |
| **Day 9** | Progress tracking UI — radar chart, history, stats | Beautiful analytics |
| **Day 10** | Spaced repetition engine + review mode | Smart learning loop |
| **Day 11** | Weekly AI report generation | Automated progress insights |
| **Day 12** | Animations, streak celebrations, XP popups | Dopamine hits ✨ |
| **Day 13** | Deploy — Vercel + Railway, connect everything | Live & accessible |
| **Day 14** | Testing, bug fixes, final polish | MVP SHIPPED 🚀 |

---

## 🧠 AI Prompt Strategy (Key to Quality)

The challenge generation prompts are the heart of CodeSensei. Here's the approach:

### Challenge Generation Prompt Template
```
You are CodeSensei, an expert programming instructor.

Generate a {challenge_type} challenge for the "{track}" track.
Difficulty: {difficulty_level}/5
Topic focus: {specific_topic}

User context:
- Recent weak areas: {weak_topics}
- Current level: {user_level}
- Challenges completed: {total_completed}

Requirements:
- Challenge must be completable in 5-15 minutes
- Include a clear problem statement
- Provide 3 progressive hints (easy → medium → revealing)
- Include the ideal solution with explanation
- Include 2-3 test cases for code challenges
- Rate the challenge: difficulty (1-5), topics covered

Respond in JSON format: { ... }
```

### Answer Evaluation Prompt
```
You are CodeSensei, evaluating a student's answer.

Challenge: {challenge}
Student's answer: {user_answer}
Expected solution: {ideal_solution}

Evaluate:
1. Correctness (0-100%)
2. Code quality & style
3. Edge cases handled?
4. Specific feedback (what was good, what to improve)
5. XP to award (based on correctness + quality)

Be encouraging but honest. If wrong, explain WHY gently.
```

---

## 🎨 Design Direction

**Aesthetic**: Dark mode primary, neon accent colors per track
- 🐍 Python → Green (#10B981)
- ☕ Java → Orange (#F59E0B)
- 🤖 Automation → Cyan (#06B6D4)
- 🧩 DSA → Purple (#8B5CF6)

**Vibe**: Clean, focused, gamified but not childish. Think "developer tool meets Duolingo."

---

## 💰 Cost Estimate (Monthly)

| Service | Cost |
|---------|------|
| Claude Sonnet 4 API (~100 challenges/month) | ~$2-5 |
| Vercel (free tier) | $0 |
| Railway (free tier / hobby) | $0-5 |
| **Total** | **~$2-10/month** |

---

## 🚀 Future Enhancements (Post-MVP)

- 🤝 Multiplayer mode — challenge friends
- 📱 Mobile app (React Native)
- 🏆 Global leaderboard
- 📚 Custom track creation
- 🎙️ Voice-based challenges
- 🔗 GitHub integration — analyze your code and suggest learning areas
- 📋 Interview prep mode — timed mock interviews
- 🧩 LeetCode/HackerRank problem sync

---

## CLI Preview

```bash
$ codesensei daily
🧠 CodeSensei — Good morning, Tushar!
🔥 Current streak: 12 days
⚡ XP: 2,450 (Level 8)

Today's challenges:
  1. 🐍 [Python] Advanced decorator patterns (⭐⭐⭐)
  2. ☕ [Java] ConcurrentHashMap internals (⭐⭐⭐⭐)
  3. 🧩 [DSA] Sliding window maximum (⭐⭐⭐)

Start challenge? [1/2/3/skip]:

$ codesensei stats
📊 This Week:
  Challenges completed: 18/21
  Accuracy: 76%
  Strongest: Python (Level 9)
  Needs work: Java Concurrency
  XP earned: 890
```

---

*Built with ❤️ by Tushar — because the best way to learn is to build.*
