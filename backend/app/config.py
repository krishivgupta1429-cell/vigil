"""Settings loaded from backend/.env. Missing keys never crash the app."""

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent

# Silently does nothing if the file does not exist.
load_dotenv(BACKEND_DIR / ".env")

# LLM provider: Gemini (see app/llm.py). Empty string means "not configured".
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# Telegram stands in for SMS in the demo.
TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")

# Public base URL used when building tracking links (M1+).
PUBLIC_BASE_URL: str = os.getenv("PUBLIC_BASE_URL", "http://localhost:3000")

# Browsers normally reach the API through the Next.js /api rewrite, so CORS only
# matters for direct calls (curl, Swagger UI, other tools).
CORS_ORIGINS: list[str] = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]

DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BACKEND_DIR / 'vigil.db'}")
