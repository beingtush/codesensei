# CodeSensei — AI Learning Companion

## Project Overview
CodeSensei is a Duolingo-style AI-powered learning app for tech skills.
It generates adaptive daily challenges across Python, Java, DSA, and Automation tracks.

## Tech Stack
- Backend: Python FastAPI + SQLite (SQLAlchemy ORM) + Alembic migrations
- Frontend: Next.js 14 (App Router) + Tailwind CSS + Framer Motion
- CLI: Python + Typer + Rich
- AI: Anthropic Claude Sonnet 4 API
- Auth: Simple JWT

## Conventions
- Python: Use type hints everywhere, async endpoints, Pydantic models for request/response
- Frontend: TypeScript strict mode, functional components, Tailwind only (no CSS modules)
- API: RESTful, prefix all routes with /api/v1/
- DB: SQLAlchemy 2.0 style with async sessions
- Environment variables in .env file, loaded via pydantic-settings
- All AI prompts stored in backend/app/prompts/ as constants

## Project Structure
codesensei/
├── backend/          # FastAPI backend
├── frontend/         # Next.js 14 app
├── cli/              # Python CLI tool
├── CLAUDE.md         # This file
└── README.md