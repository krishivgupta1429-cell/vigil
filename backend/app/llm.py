"""LLM access. Provider: Gemini. M0 only has a stub, no API is called yet."""

from app import config


def generate(prompt: str, system: str | None = None) -> str:
    """Return generated text for `prompt`.

    Without GEMINI_API_KEY this returns a fixed template message so every
    feature that depends on the LLM still works in the demo.
    """
    if not config.GEMINI_API_KEY:
        return (
            "[AI unavailable: no GEMINI_API_KEY set] "
            "This is guidance, not legal advice. If you are in immediate danger, call 112."
        )
    # TODO(M6/M7): call Gemini here.
    return (
        "[AI not wired up yet] "
        "This is guidance, not legal advice. If you are in immediate danger, call 112."
    )
