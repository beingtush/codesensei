"""CLI configuration — API URL and token storage."""

import json
from pathlib import Path

CONFIG_DIR = Path.home() / ".codesensei"
CONFIG_FILE = CONFIG_DIR / "config.json"

DEFAULT_API_URL = "http://localhost:8000"


def _ensure_config_dir() -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)


def load_config() -> dict:
    """Load saved configuration."""
    if CONFIG_FILE.exists():
        return json.loads(CONFIG_FILE.read_text())
    return {}


def save_config(data: dict) -> None:
    """Save configuration to disk."""
    _ensure_config_dir()
    existing = load_config()
    existing.update(data)
    CONFIG_FILE.write_text(json.dumps(existing, indent=2))


def get_api_url() -> str:
    """Get the backend API base URL."""
    return load_config().get("api_url", DEFAULT_API_URL)


def get_token() -> str | None:
    """Get stored auth token."""
    return load_config().get("token")


def get_user_id() -> int | None:
    """Get stored user ID."""
    return load_config().get("user_id")


def get_username() -> str | None:
    """Get stored username."""
    return load_config().get("username")


def save_auth(token: str, user_id: int, username: str) -> None:
    """Save authentication data."""
    save_config({"token": token, "user_id": user_id, "username": username})


def clear_auth() -> None:
    """Remove stored authentication."""
    config = load_config()
    config.pop("token", None)
    config.pop("user_id", None)
    config.pop("username", None)
    _ensure_config_dir()
    CONFIG_FILE.write_text(json.dumps(config, indent=2))


def is_logged_in() -> bool:
    """Check if user is authenticated."""
    return get_token() is not None and get_user_id() is not None
