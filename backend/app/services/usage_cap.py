"""
Limits on the Translate button, so a public demo link can't run up a Google Cloud bill.

Three layers, checked in this order:
  1. Cache      the same phrase translated twice is answered from memory (free, doesn't count)
  2. Visitor    each visitor (IP address) gets VISITOR_REQUESTS translations per VISITOR_WINDOW_SECONDS
  3. Daily cap  all visitors together get settings.translate_daily_char_cap characters per day (UTC)

Everything lives in memory, so it resets when the server restarts. That's fine for one small
server; with several servers you'd move the counters to the database or Redis.
Google's own free tier is 500,000 characters a month, so the default 16,000 a day stays under it.
"""
import threading
import time
from collections import OrderedDict, deque
from datetime import datetime, timezone

from app.config import settings

VISITOR_REQUESTS = 30
VISITOR_WINDOW_SECONDS = 10 * 60
CACHE_SIZE = 2000


class LimitReached(Exception):
    """Raised with a message that's safe to show to the person using the app."""


_lock = threading.Lock()  # FastAPI runs plain `def` endpoints on several threads at once
_cache: "OrderedDict[tuple, str]" = OrderedDict()
_visits: dict[str, deque] = {}
_day = ""
_chars_today = 0


def cached(key: tuple) -> str | None:
    with _lock:
        if key in _cache:
            _cache.move_to_end(key)
            return _cache[key]
    return None


def remember(key: tuple, translation: str) -> None:
    with _lock:
        _cache[key] = translation
        _cache.move_to_end(key)
        while len(_cache) > CACHE_SIZE:
            _cache.popitem(last=False)


def reserve(visitor: str, chars: int, now: float | None = None) -> None:
    """Count one translation of `chars` characters for `visitor`, or raise LimitReached."""
    global _day, _chars_today
    now = time.time() if now is None else now
    today = datetime.fromtimestamp(now, tz=timezone.utc).strftime("%Y-%m-%d")

    with _lock:
        if today != _day:  # a new day: start the daily count again
            _day, _chars_today = today, 0

        visits = _visits.setdefault(visitor, deque())
        while visits and now - visits[0] > VISITOR_WINDOW_SECONDS:
            visits.popleft()
        if len(visits) >= VISITOR_REQUESTS:
            wait = int(VISITOR_WINDOW_SECONDS - (now - visits[0])) // 60 + 1
            raise LimitReached(f"That's a lot of translations! Try again in {wait} minute{'s' if wait != 1 else ''}.")

        if _chars_today + chars > settings.translate_daily_char_cap:
            raise LimitReached("The daily translation limit has been reached. Try again tomorrow.")

        visits.append(now)
        _chars_today += chars

        # Forget visitors who have gone quiet, so the table doesn't grow forever.
        if len(_visits) > 5000:
            for ip in [ip for ip, v in _visits.items() if not v or now - v[-1] > VISITOR_WINDOW_SECONDS]:
                del _visits[ip]


def reset() -> None:
    """Clear everything (used by tests)."""
    global _day, _chars_today
    with _lock:
        _cache.clear()
        _visits.clear()
        _day, _chars_today = "", 0
