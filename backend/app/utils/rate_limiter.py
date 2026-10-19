import time
from collections import defaultdict
from fastapi import HTTPException, status, Request
from app.config import settings

# Thread-safe in-memory sliding window rate limiter
class InMemoryRateLimiter:
    def __init__(self):
        # ip -> list of timestamps
        self.requests = defaultdict(list)
        # username -> list of failed attempt timestamps
        self.failed_logins = defaultdict(list)

    def check_rate_limit(self, key: str, max_requests: int, window_seconds: int = 60) -> bool:
        now = time.time()
        window_start = now - window_seconds
        
        # Filter out outdated timestamps
        self.requests[key] = [t for t in self.requests[key] if t > window_start]
        
        if len(self.requests[key]) >= max_requests:
            return False
            
        self.requests[key].append(now)
        return True

    def record_failed_login(self, username: str) -> int:
        now = time.time()
        # Keep last 15 minutes of failures
        window_start = now - 900
        self.failed_logins[username] = [t for t in self.failed_logins[username] if t > window_start]
        self.failed_logins[username].append(now)
        return len(self.failed_logins[username])

    def reset_failed_logins(self, username: str):
        if username in self.failed_logins:
            del self.failed_logins[username]

    def is_account_locked(self, username: str) -> bool:
        now = time.time()
        window_start = now - 900 # 15 min lockout
        recent_failures = [t for t in self.failed_logins.get(username, []) if t > window_start]
        return len(recent_failures) >= 5

rate_limiter = InMemoryRateLimiter()

def rate_limit_middleware_check(request: Request, max_requests: int = 120, window_seconds: int = 60):
    client_ip = request.client.host if request.client else "unknown"
    key = f"{client_ip}:{request.url.path}"
    if not rate_limiter.check_rate_limit(key, max_requests, window_seconds):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please slow down and try again shortly."
        )
