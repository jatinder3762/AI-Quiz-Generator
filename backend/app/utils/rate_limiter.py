from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone


class InMemoryRateLimiter:
    def __init__(self, max_requests: int, window_minutes: int) -> None:
        self.max_requests = max_requests
        self.window = timedelta(minutes=window_minutes)
        self.events: dict[str, deque[datetime]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = datetime.now(timezone.utc)
        window_start = now - self.window
        queue = self.events[key]

        while queue and queue[0] < window_start:
            queue.popleft()

        if len(queue) >= self.max_requests:
            return False

        queue.append(now)
        return True
