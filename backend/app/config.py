from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    database_url: str = "sqlite+aiosqlite:///./codesensei.db"

    # Ollama (local LLM)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5-coder:14b"

    # Simple API key for personal use (MVP)
    api_key: str = "dev-api-key-change-in-production"

    # App settings
    app_name: str = "CodeSensei"
    debug: bool = True


settings = Settings()
