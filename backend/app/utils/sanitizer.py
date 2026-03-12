import re


INJECTION_PATTERNS = [
    r"ignore\s+previous\s+instructions",
    r"system\s+prompt",
    r"developer\s+message",
    r"jailbreak",
]


def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    return text


def detect_prompt_injection(text: str) -> bool:
    lower = text.lower()
    return any(re.search(pattern, lower) for pattern in INJECTION_PATTERNS)
